import type { MediaDocument } from './types'

export function MediaGalleryItem({ item }: { item: MediaDocument }) {
  const caption = item.uploaderName ? `Shared by ${item.uploaderName}` : 'Shared by a guest'

  if (item.contentType.startsWith('video/')) {
    return (
      <div className="gallery-item">
        <video controls playsInline preload="metadata" aria-label={caption}>
          <source src={item.downloadURL} type={item.contentType} />
        </video>
      </div>
    )
  }

  return (
    <div className="gallery-item">
      <img src={item.downloadURL} alt={caption} loading="lazy" />
    </div>
  )
}
