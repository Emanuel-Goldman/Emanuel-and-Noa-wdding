import { useRef, useState } from 'react'
import { UploadProgressItem } from './UploadProgressItem'
import { readStoredUploaderName, storeUploaderName, useMediaUpload } from './useMediaUpload'

export function MediaUploader() {
  const { items, addFiles } = useMediaUpload()
  const [uploaderName, setUploaderName] = useState(readStoredUploaderName)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleNameChange = (value: string) => {
    setUploaderName(value)
    storeUploaderName(value)
  }

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    addFiles(fileList, uploaderName.trim() || null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <section className="uploader" aria-labelledby="uploader-heading">
      <h2 id="uploader-heading">Share your photos &amp; videos</h2>

      <label htmlFor="uploader-name">Your name (optional)</label>
      <input
        id="uploader-name"
        type="text"
        value={uploaderName}
        onChange={(event) => handleNameChange(event.target.value)}
        placeholder="e.g. Aunt Rachel"
        maxLength={80}
      />

      <label htmlFor="media-input" className="upload-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="14" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        Choose photos or videos
      </label>
      <label htmlFor="media-input" className="upload-fab" aria-label="Add photos or videos">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </label>
      <input
        id="media-input"
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(event) => handleFilesSelected(event.target.files)}
        className="visually-hidden"
      />

      {items.length > 0 && (
        <ul className="upload-list" aria-label="Upload progress">
          {items.map((item) => (
            <UploadProgressItem key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  )
}
