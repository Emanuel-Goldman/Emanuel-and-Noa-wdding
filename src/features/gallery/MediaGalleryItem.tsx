import type { MediaDocument } from './types'

export function MediaGalleryItem({ item }: { item: MediaDocument }) {
  const caption = item.uploaderName ? `מאת ${item.uploaderName}` : 'מאת אורח/ת'

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
    <div className="gallery-item">
      <img src={item.downloadURL} alt={caption} loading="lazy" />
      {item.uploaderName && (
        <span className="gallery-item__caption" aria-hidden="true">
          {caption}
        </span>
      )}
    </div>
  )
}
