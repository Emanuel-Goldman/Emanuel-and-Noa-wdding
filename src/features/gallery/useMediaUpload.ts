import { useCallback, useState } from 'react'
import { MAX_FILE_SIZE_BYTES, UPLOADER_NAME_STORAGE_KEY } from './constants'
import { uploadMediaFile } from './mediaRepository'
import type { UploadItemState } from './types'

function isAcceptedFile(file: File): boolean {
  return file.type.startsWith('image/') || file.type.startsWith('video/')
}

export function useMediaUpload() {
  const [items, setItems] = useState<UploadItemState[]>([])

  const updateItem = useCallback((id: string, patch: Partial<UploadItemState>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }, [])

  const addFiles = useCallback(
    (fileList: FileList, uploaderName: string | null) => {
      Array.from(fileList).forEach((file) => {
        const id = crypto.randomUUID()

        if (!isAcceptedFile(file)) {
          setItems((prev) => [
            ...prev,
            { id, fileName: file.name, status: 'error', progress: 0, message: 'מותר להעלות רק תמונות וסרטונים.' },
          ])
          return
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          setItems((prev) => [
            ...prev,
            { id, fileName: file.name, status: 'error', progress: 0, message: 'הקובץ גדול מ-300MB.' },
          ])
          return
        }

        setItems((prev) => [...prev, { id, fileName: file.name, status: 'uploading', progress: 0 }])

        const { done } = uploadMediaFile(file, uploaderName, (progress) => updateItem(id, { progress }))

        done
          .then(() => updateItem(id, { status: 'success', progress: 100 }))
          .catch((error: unknown) =>
            updateItem(id, {
              status: 'error',
              message: error instanceof Error ? error.message : 'ההעלאה נכשלה.',
            }),
          )
      })
    },
    [updateItem],
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
