import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytesResumable, type UploadTaskSnapshot } from 'firebase/storage'
import { db, storage } from '../../firebase/client'
import { MAX_GALLERY_ITEMS, MEDIA_COLLECTION, STORAGE_FOLDER } from './constants'
import type { MediaDocument } from './types'

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
