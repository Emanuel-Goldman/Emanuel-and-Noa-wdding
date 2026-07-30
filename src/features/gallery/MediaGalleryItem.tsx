import { describeUploader } from './mediaCaption'
import type { MediaDocument } from './types'

type Props = {
  item: MediaDocument
  onSelect: (item: MediaDocument) => void
}

export function MediaGalleryItem({ item, onSelect }: Props) {
  const caption = describeUploader(item)

  // Videos keep their inline native controls: wrapping them in a button would
  // swallow taps meant for play/scrub.
  if (item.contentType.startsWith('video/')) {
    return (
      <div className="gallery-item">
        <video controls playsInline preload="metadata" aria-label={caption}>
          <source src={item.downloadURL} type={item.contentType} />
        </video>
        {item.uploaderName && (
          <span className="gallery-item__caption" aria-hidden="true">
            {caption}
          </span>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      className="gallery-item gallery-item--interactive"
      onClick={() => onSelect(item)}
      aria-label={`הגדלת התמונה ${caption}`}
    >
      <img src={item.downloadURL} alt="" loading="lazy" />
      {item.uploaderName && (
        <span className="gallery-item__caption" aria-hidden="true">
          {caption}
        </span>
      )}
    </button>
  )
}
