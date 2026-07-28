import { MediaGalleryItem } from './MediaGalleryItem'
import { useGalleryMedia } from './useGalleryMedia'

export function MediaGallery() {
  const state = useGalleryMedia()

  return (
    <section className="gallery" aria-labelledby="gallery-heading">
      <h2 id="gallery-heading">Wedding gallery</h2>

      {state.status === 'loading' && <p>Loading photos…</p>}
      {state.status === 'error' && <p role="alert">Couldn&rsquo;t load the gallery: {state.message}</p>}
      {state.status === 'ready' && state.items.length === 0 && (
        <p>No photos yet — be the first to share one!</p>
      )}
      {state.status === 'ready' && state.items.length > 0 && (
        <div className="gallery-grid">
          {state.items.map((item) => (
            <MediaGalleryItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
