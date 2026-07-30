import { describeUploader } from './mediaCaption'
import type { MediaDocument } from './types'

type Props = {
  item: MediaDocument
  onSelect: (item: MediaDocument) => void
  isAdmin: boolean
  isDeleting: boolean
  onDelete: (item: MediaDocument) => void
}

export function MediaGalleryItem({ item, onSelect, isAdmin, isDeleting, onDelete }: Props) {
  const caption = describeUploader(item)
  const isVideo = item.contentType.startsWith('video/')

  return (
    <div className="gallery-item">
      {isVideo ? (
        // Videos keep their inline native controls: wrapping them in a button
        // would swallow taps meant for play/scrub.
        <video controls playsInline preload="metadata" aria-label={caption}>
          <source src={item.downloadURL} type={item.contentType} />
        </video>
      ) : (
        <button
          type="button"
          className="gallery-item__open"
          onClick={() => onSelect(item)}
          aria-label={`הגדלת התמונה ${caption}`}
        >
          <img src={item.downloadURL} alt="" loading="lazy" />
        </button>
      )}

      {item.uploaderName && (
        <span className="gallery-item__caption" aria-hidden="true">
          {caption}
        </span>
      )}

      {isAdmin && (
        <button
          type="button"
          className="gallery-item__delete"
          onClick={() => onDelete(item)}
          disabled={isDeleting}
          aria-label={`מחיקת הפריט ${caption}`}
        >
          {isDeleting ? (
            <span className="gallery-item__spinner" aria-hidden="true" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  )
}
