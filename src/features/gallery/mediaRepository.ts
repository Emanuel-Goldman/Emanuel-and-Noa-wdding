import { FirebaseError } from 'firebase/app'
import {
  addDoc,
  collection,
  deleteDoc,
  doc as documentRef,
  getAggregateFromServer,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  sum,
  where,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore'
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTask,
} from 'firebase/storage'
import { db, storage } from '../../firebase/client'
import { createImageRenditions } from './imageThumbnail'
import {
  DISPLAY_STORAGE_FOLDER,
  MAX_GALLERY_ITEMS,
  MEDIA_COLLECTION,
  STORAGE_FOLDER,
  THUMBNAIL_STORAGE_FOLDER,
} from './constants'
import type { MediaCounts, MediaDocument } from './types'

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

// Every upload gets a fresh UUID-prefixed path and is never overwritten, so
// the content behind a given path never changes — safe to cache forever.
// Firebase Storage's default is `private, max-age=0` (no caching at all),
// which meant every gallery visit re-downloaded every photo from scratch.
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable'

function parseMediaDocument(id: string, data: DocumentData): MediaDocument | null {
  if (
    typeof data.storagePath !== 'string' ||
    typeof data.downloadURL !== 'string' ||
    typeof data.contentType !== 'string'
  ) {
    return null
  }

  return {
    id,
    storagePath: data.storagePath,
    downloadURL: data.downloadURL,
    thumbnailPath: typeof data.thumbnailPath === 'string' ? data.thumbnailPath : null,
    thumbnailURL: typeof data.thumbnailURL === 'string' ? data.thumbnailURL : null,
    displayPath: typeof data.displayPath === 'string' ? data.displayPath : null,
    displayURL: typeof data.displayURL === 'string' ? data.displayURL : null,
    contentType: data.contentType,
    uploaderName: typeof data.uploaderName === 'string' ? data.uploaderName : null,
    sizeBytes: typeof data.sizeBytes === 'number' ? data.sizeBytes : null,
    thumbnailSizeBytes: typeof data.thumbnailSizeBytes === 'number' ? data.thumbnailSizeBytes : null,
    displaySizeBytes: typeof data.displaySizeBytes === 'number' ? data.displaySizeBytes : null,
    createdAt: data.createdAt ?? null,
  }
}

export function subscribeToRecentMedia(
  pageSize: number,
  onChange: (items: MediaDocument[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const mediaQuery = query(
    collection(db, MEDIA_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(Math.min(pageSize, MAX_GALLERY_ITEMS)),
  )

  return onSnapshot(
    mediaQuery,
    (snapshot) => {
      const items: MediaDocument[] = []
      snapshot.forEach((doc) => {
        const parsed = parseMediaDocument(doc.id, doc.data())
        if (parsed) {
          items.push(parsed)
        } else {
          console.warn(`Skipping malformed media document: ${doc.id}`)
        }
      })
      onChange(items)
    },
    (error) => onError(error),
  )
}

function queryContentTypePrefix(prefix: 'image' | 'video') {
  return query(
    collection(db, MEDIA_COLLECTION),
    where('contentType', '>=', `${prefix}/`),
    where('contentType', '<', `${prefix}0`),
  )
}

export async function getMediaCounts(): Promise<MediaCounts> {
  const [photos, videos] = await Promise.all([
    getCountFromServer(queryContentTypePrefix('image')),
    getCountFromServer(queryContentTypePrefix('video')),
  ])

  return {
    photos: photos.data().count,
    videos: videos.data().count,
  }
}

/**
 * Total bytes actually held in the Storage bucket for every item — original
 * plus its thumbnail and display JPEG renditions — summed server-side (no
 * need to download every document to add it up). Admin-only stat, not shown
 * to guests. Still approximate for any item uploaded before the
 * thumbnailSizeBytes/displaySizeBytes fields existed: those rows contribute
 * only their original size here, even though the rendition files themselves
 * are in the bucket.
 */
export async function getMediaStorageBytes(): Promise<number> {
  const snapshot = await getAggregateFromServer(collection(db, MEDIA_COLLECTION), {
    originalBytes: sum('sizeBytes'),
    thumbnailBytes: sum('thumbnailSizeBytes'),
    displayBytes: sum('displaySizeBytes'),
  })
  const totals = snapshot.data()
  return totals.originalBytes + totals.thumbnailBytes + totals.displayBytes
}

function isObjectAlreadyGone(error: unknown): boolean {
  return error instanceof FirebaseError && error.code === 'storage/object-not-found'
}

/**
 * Removes the stored file first, then the document that points at it.
 *
 * That order keeps a partial failure recoverable: if the document delete fails
 * the tile stays on screen and a retry finds the file already gone (tolerated
 * below) and finishes the job. Deleting the document first would strand the
 * file in the bucket with nothing left in the UI to retry from.
 */
export async function deleteMediaItem(item: MediaDocument): Promise<void> {
  try {
    await deleteObject(ref(storage, item.storagePath))
  } catch (error) {
    if (!isObjectAlreadyGone(error)) {
      throw error
    }
  }

  if (item.thumbnailPath) {
    try {
      await deleteObject(ref(storage, item.thumbnailPath))
    } catch (error) {
      if (!isObjectAlreadyGone(error)) {
        throw error
      }
    }
  }

  if (item.displayPath) {
    try {
      await deleteObject(ref(storage, item.displayPath))
    } catch (error) {
      if (!isObjectAlreadyGone(error)) {
        throw error
      }
    }
  }

  await deleteDoc(documentRef(db, MEDIA_COLLECTION, item.id))
}

function trackCombinedProgress(tasks: UploadTask[], onProgress: (percent: number) => void) {
  const report = () => {
    let transferred = 0
    let total = 0
    tasks.forEach((task) => {
      transferred += task.snapshot.bytesTransferred
      total += task.snapshot.totalBytes
    })
    onProgress(total > 0 ? Math.round((transferred / total) * 100) : 0)
  }
  tasks.forEach((task) => task.on('state_changed', report))
}

function waitForTask(task: UploadTask): Promise<void> {
  return new Promise((resolve, reject) => {
    task.on('state_changed', undefined, reject, () => resolve())
  })
}

/**
 * Uploads the original file untouched (full quality, kept forever), plus two
 * downscaled JPEG renditions alongside it when the file is an image: a small
 * thumbnail for the gallery grid and a larger one for the lightbox. The
 * lightbox needs its own JPEG (not just the original) because a large share
 * of guest photos are iPhone HEIC files — undecodable in an <img> tag on
 * most non-Apple browsers — so falling back to the original there would show
 * a broken image to those guests. Rendition failures never block the
 * original upload — the grid and lightbox fall back to the next best
 * available URL for that item (see MediaLightbox).
 */
export function uploadMediaFile(
  file: File,
  uploaderName: string | null,
  onProgress: (percent: number) => void,
): { cancel: () => void; done: Promise<void> } {
  const uuid = crypto.randomUUID()
  const safeName = sanitizeFileName(file.name)
  const storagePath = `${STORAGE_FOLDER}/${uuid}-${safeName}`

  let cancelled = false
  let activeTasks: UploadTask[] = []
  const cancel = () => {
    cancelled = true
    activeTasks.forEach((task) => task.cancel())
  }

  const done = (async () => {
    const { thumbnail: thumbnailBlob, display: displayBlob } = await createImageRenditions(file)
    if (cancelled) {
      throw new Error('ההעלאה בוטלה.')
    }

    const thumbnailPath = thumbnailBlob ? `${THUMBNAIL_STORAGE_FOLDER}/${uuid}-${safeName}.jpg` : null
    const displayPath = displayBlob ? `${DISPLAY_STORAGE_FOLDER}/${uuid}-${safeName}.jpg` : null

    const uploadTask = uploadBytesResumable(ref(storage, storagePath), file, {
      contentType: file.type,
      cacheControl: IMMUTABLE_CACHE_CONTROL,
    })
    const thumbnailTask =
      thumbnailBlob && thumbnailPath
        ? uploadBytesResumable(ref(storage, thumbnailPath), thumbnailBlob, {
            contentType: 'image/jpeg',
            cacheControl: IMMUTABLE_CACHE_CONTROL,
          })
        : null
    const displayTask =
      displayBlob && displayPath
        ? uploadBytesResumable(ref(storage, displayPath), displayBlob, {
            contentType: 'image/jpeg',
            cacheControl: IMMUTABLE_CACHE_CONTROL,
          })
        : null

    activeTasks = [uploadTask, thumbnailTask, displayTask].filter(
      (task): task is UploadTask => task !== null,
    )
    trackCombinedProgress(activeTasks, onProgress)

    try {
      await Promise.all(activeTasks.map(waitForTask))
    } catch (error) {
      throw error instanceof Error ? error : new Error('ההעלאה נכשלה.')
    }

    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
    const thumbnailURL = thumbnailTask ? await getDownloadURL(thumbnailTask.snapshot.ref) : null
    const displayURL = displayTask ? await getDownloadURL(displayTask.snapshot.ref) : null

    // uploaderName is omitted entirely (not written as null) so it satisfies
    // the Firestore rule's `data.uploaderName is string` check when present.
    const mediaData: DocumentData = {
      storagePath,
      downloadURL,
      contentType: file.type,
      sizeBytes: file.size,
      createdAt: serverTimestamp(),
      ...(thumbnailPath && thumbnailURL && thumbnailBlob
        ? { thumbnailPath, thumbnailURL, thumbnailSizeBytes: thumbnailBlob.size }
        : {}),
      ...(displayPath && displayURL && displayBlob
        ? { displayPath, displayURL, displaySizeBytes: displayBlob.size }
        : {}),
      ...(uploaderName ? { uploaderName } : {}),
    }
    await addDoc(collection(db, MEDIA_COLLECTION), mediaData)
  })()

  return { cancel, done }
}
