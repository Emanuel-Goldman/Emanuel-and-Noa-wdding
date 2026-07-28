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
        Choose photos or videos
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
