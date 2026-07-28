import type { UploadItemState } from './types'

export function UploadProgressItem({ item }: { item: UploadItemState }) {
  return (
    <li className={`upload-item upload-item--${item.status}`}>
      <span className="upload-item__name">{item.fileName}</span>
      {item.status === 'uploading' && (
        <progress value={item.progress} max={100} aria-label={`Uploading ${item.fileName}`} />
      )}
      {item.status === 'success' && <span aria-hidden="true">✓</span>}
      {item.status === 'error' && <span role="alert">{item.message ?? 'Upload failed.'}</span>}
    </li>
  )
}
