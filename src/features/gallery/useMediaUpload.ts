import { useCallback, useRef, useState } from 'react'
import {
  MAX_FILE_SIZE_BYTES,
  MAX_PHOTO_ITEMS,
  MAX_VIDEO_ITEMS,
  UPLOADER_NAME_STORAGE_KEY,
} from './constants'
import { getMediaCounts, uploadMediaFile } from './mediaRepository'
import type { MediaCounts, MediaKind, UploadItemState } from './types'

function isAcceptedFile(file: File): boolean {
  return file.type.startsWith('image/') || file.type.startsWith('video/')
}

function getMediaKind(file: File): MediaKind {
  return file.type.startsWith('video/') ? 'video' : 'photo'
}

function getLimitMessage(kind: MediaKind): string {
  return kind === 'photo'
    ? `הגלריה הגיעה למגבלה של ${MAX_PHOTO_ITEMS.toLocaleString('he-IL')} תמונות.`
    : `הגלריה הגיעה למגבלה של ${MAX_VIDEO_ITEMS.toLocaleString('he-IL')} סרטונים.`
}

type UploadCandidate = {
  id: string
  file: File
  kind: MediaKind
}

export function useMediaUpload() {
  const [items, setItems] = useState<UploadItemState[]>([])
  const pendingCountsRef = useRef<MediaCounts>({ photos: 0, videos: 0 })
  const quotaCheckQueueRef = useRef<Promise<void>>(Promise.resolve())

  const updateItem = useCallback((id: string, patch: Partial<UploadItemState>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }, [])

  const uploadWithinLimits = useCallback(
    async (candidates: UploadCandidate[], uploaderName: string | null) => {
      let mediaCounts: MediaCounts

      try {
        mediaCounts = await getMediaCounts()
      } catch {
        candidates.forEach(({ id }) => {
          updateItem(id, {
            status: 'error',
            message: 'לא הצלחנו לבדוק אם נשאר מקום בגלריה. נסו שוב.',
          })
        })
        return
      }

      const remaining: Record<MediaKind, number> = {
        photo: Math.max(0, MAX_PHOTO_ITEMS - mediaCounts.photos - pendingCountsRef.current.photos),
        video: Math.max(0, MAX_VIDEO_ITEMS - mediaCounts.videos - pendingCountsRef.current.videos),
      }

      candidates.forEach(({ id, file, kind }) => {
        if (remaining[kind] === 0) {
          updateItem(id, { status: 'error', message: getLimitMessage(kind) })
          return
        }

        remaining[kind] -= 1
        const pendingKey = kind === 'photo' ? 'photos' : 'videos'
        pendingCountsRef.current[pendingKey] += 1
        updateItem(id, { status: 'uploading' })

        const { done } = uploadMediaFile(file, uploaderName, (progress) => updateItem(id, { progress }))

        void done
          .then(() => updateItem(id, { status: 'success', progress: 100 }))
          .catch((error: unknown) =>
            updateItem(id, {
              status: 'error',
              message: error instanceof Error ? error.message : 'ההעלאה נכשלה.',
            }),
          )
          .finally(() => {
            pendingCountsRef.current[pendingKey] = Math.max(0, pendingCountsRef.current[pendingKey] - 1)
          })
      })
    },
    [updateItem],
  )

  const addFiles = useCallback(
    (fileList: FileList, uploaderName: string | null) => {
      const candidates: UploadCandidate[] = []
      const nextItems: UploadItemState[] = []

      Array.from(fileList).forEach((file) => {
        const id = crypto.randomUUID()

        if (!isAcceptedFile(file)) {
          nextItems.push({
            id,
            fileName: file.name,
            status: 'error',
            progress: 0,
            message: 'מותר להעלות רק תמונות וסרטונים.',
          })
          return
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          nextItems.push({
            id,
            fileName: file.name,
            status: 'error',
            progress: 0,
            message: 'הקובץ גדול מ-300MB.',
          })
          return
        }

        nextItems.push({ id, fileName: file.name, status: 'checking', progress: 0 })
        candidates.push({ id, file, kind: getMediaKind(file) })
      })

      setItems((prev) => [...prev, ...nextItems])

      if (candidates.length > 0) {
        const runQuotaCheck = () => uploadWithinLimits(candidates, uploaderName)
        quotaCheckQueueRef.current = quotaCheckQueueRef.current.then(runQuotaCheck, runQuotaCheck)
      }
    },
    [uploadWithinLimits],
  )

  return { items, addFiles }
}

export function readStoredUploaderName(): string {
  return localStorage.getItem(UPLOADER_NAME_STORAGE_KEY) ?? ''
}

export function storeUploaderName(name: string): void {
  if (name) {
    localStorage.setItem(UPLOADER_NAME_STORAGE_KEY, name)
  } else {
    localStorage.removeItem(UPLOADER_NAME_STORAGE_KEY)
  }
}
