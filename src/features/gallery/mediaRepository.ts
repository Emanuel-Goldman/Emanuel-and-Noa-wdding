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
  type UploadTaskSnapshot,
} from 'firebase/storage'
import { db, storage } from '../../firebase/client'
import { MAX_GALLERY_ITEMS, MEDIA_COLLECTION, STORAGE_FOLDER } from './constants'
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
    contentType: data.contentType,
    uploaderName: typeof data.uploaderName === 'string' ? data.uploaderName : null,
    sizeBytes: typeof data.sizeBytes === 'number' ? data.sizeBytes : null,
    createdAt: data.createdAt ?? null,
  }
}

export function subscribeToRecentMedia(
  onChange: (items: MediaDocument[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const mediaQuery = query(
    collection(db, MEDIA_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(MAX_GALLERY_ITEMS),
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

  await deleteDoc(documentRef(db, MEDIA_COLLECTION, item.id))
}

export function uploadMediaFile(
  file: File,
  uploaderName: string | null,
  onProgress: (percent: number) => void,
): { cancel: () => void; done: Promise<void> } {
  const uuid = crypto.randomUUID()
  const storagePath = `${STORAGE_FOLDER}/${uuid}-${sanitizeFileName(file.name)}`
  const storageRef = ref(storage, storagePath)
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
  })

  const done = new Promise<void>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100))
      },
      (error) => reject(error),
      () => {
        void (async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            // uploaderName is omitted entirely (not written as null) so it satisfies
            // the Firestore rule's `data.uploaderName is string` check when present.
            const mediaData: DocumentData = {
              storagePath,
              downloadURL,
              contentType: file.type,
              sizeBytes: file.size,
              createdAt: serverTimestamp(),
              ...(uploaderName ? { uploaderName } : {}),
            }
            await addDoc(collection(db, MEDIA_COLLECTION), mediaData)
            resolve()
          } catch (error) {
            reject(error instanceof Error ? error : new Error('Failed to finalize upload'))
          }
        })()
      },
    )
  })

  return { cancel: () => uploadTask.cancel(), done }
}
