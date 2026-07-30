import type { Timestamp } from 'firebase/firestore'

export type MediaDocument = {
  id: string
  storagePath: string
  downloadURL: string
  contentType: string
  uploaderName: string | null
  sizeBytes: number | null
  createdAt: Timestamp | null
}

export type GalleryState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: MediaDocument[] }

export type MediaCounts = {
  photos: number
  videos: number
}

export type MediaKind = 'photo' | 'video'

export type UploadItemStatus = 'checking' | 'uploading' | 'success' | 'error'

export type UploadItemState = {
  id: string
  fileName: string
  status: UploadItemStatus
  progress: number
  message?: string
}
