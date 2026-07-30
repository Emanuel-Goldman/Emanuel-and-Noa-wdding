import type { MediaDocument } from './types'

export function describeUploader(item: MediaDocument): string {
  return item.uploaderName ? `מאת ${item.uploaderName}` : 'מאת אורח/ת'
}
