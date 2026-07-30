import { FirebaseError } from 'firebase/app'
import {
  addDoc,
  collection,
  deleteDoc,
  doc as documentRef,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
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
import { createImageThumbnail } from './imageThumbnail'
import { MAX_GALLERY_ITEMS, MEDIA_COLLECTION, STORAGE_FOLDER, THUMBNAIL_STORAGE_FOLDER } from './constants'
import type { MediaCounts, MediaDocument } from './types'

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

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
    contentType: data.contentType,
    uploaderName: typeof data.uploaderName === 'string' ? data.uploaderName : null,
    sizeBytes: typeof data.sizeBytes === 'number' ? data.sizeBytes : null,
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
 * Uploads the original file untouched (full quality, kept forever), plus a
 * small downscaled JPEG thumbnail alongside it when the file is an image.
 * The gallery grid renders the thumbnail; only the lightbox and downloads
 * use the original. Thumbnail generation failures never block the original
 * upload — the grid falls back to the original for that item.
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
    const thumbnailBlob = await createImageThumbnail(file)
    if (cancelled) {
      throw new Error('ההעלאה בוטלה.')
    }

    const thumbnailPath = thumbnailBlob ? `${THUMBNAIL_STORAGE_FOLDER}/${uuid}-${safeName}.jpg` : null

    const uploadTask = uploadBytesResumable(ref(storage, storagePath), file, {
      contentType: file.type,
    })
    const thumbnailTask =
      thumbnailBlob && thumbnailPath
        ? uploadBytesResumable(ref(storage, thumbnailPath), thumbnailBlob, {
            contentType: 'image/jpeg',
          })
        : null

    activeTasks = thumbnailTask ? [uploadTask, thumbnailTask] : [uploadTask]
    trackCombinedProgress(activeTasks, onProgress)

    try {
      await Promise.all(activeTasks.map(waitForTask))
    } catch (error) {
      throw error instanceof Error ? error : new Error('ההעלאה נכשלה.')
    }

    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
    const thumbnailURL = thumbnailTask ? await getDownloadURL(thumbnailTask.snapshot.ref) : null

    // uploaderName is omitted entirely (not written as null) so it satisfies
    // the Firestore rule's `data.uploaderName is string` check when present.
    const mediaData: DocumentData = {
      storagePath,
      downloadURL,
      contentType: file.type,
      sizeBytes: file.size,
      createdAt: serverTimestamp(),
      ...(thumbnailPath && thumbnailURL ? { thumbnailPath, thumbnailURL } : {}),
      ...(uploaderName ? { uploaderName } : {}),
    }
    await addDoc(collection(db, MEDIA_COLLECTION), mediaData)
  })()

  return { cancel, done }
}
