import { useState } from 'react'
import { MediaGalleryItem } from './MediaGalleryItem'
import { MediaLightbox } from './MediaLightbox'
import { useGalleryMedia } from './useGalleryMedia'
import type { MediaDocument } from './types'

export function MediaGallery() {
  const state = useGalleryMedia()
  const [previewItem, setPreviewItem] = useState<MediaDocument | null>(null)

  return (
    <section className="gallery" aria-labelledby="gallery-heading">
      <div className="section-heading">
        <h2 id="gallery-heading">גלריית החתונה</h2>
        <span className="live-badge">
          <span className="live-badge__dot" aria-hidden="true" />
          לייב
        </span>
      </div>

      {state.status === 'loading' && <p>טוען תמונות…</p>}
      {state.status === 'error' && <p role="alert">לא הצלחנו לטעון את הגלריה: {state.message}</p>}
      {state.status === 'ready' && state.items.length === 0 && (
        <div className="gallery-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="14" r="3.2" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <p>אין עדיין תמונות — היו הראשונים לשתף!</p>
        </div>
      )}
      {state.status === 'ready' && state.items.length > 0 && (
        <div className="gallery-grid">
          {state.items.map((item) => (
            <MediaGalleryItem key={item.id} item={item} onSelect={setPreviewItem} />
          ))}
        </div>
      )}

      {previewItem && <MediaLightbox item={previewItem} onClose={() => setPreviewItem(null)} />}
    </section>
  )
}
