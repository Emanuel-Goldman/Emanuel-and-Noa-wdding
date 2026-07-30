import { useState } from 'react'
import { MAX_PHOTO_ITEMS, MAX_VIDEO_ITEMS } from './constants'
import { MediaGalleryItem } from './MediaGalleryItem'
import { MediaLightbox } from './MediaLightbox'
import { useGalleryMedia } from './useGalleryMedia'
import { useMediaDeletion } from './useMediaDeletion'
import type { MediaDocument } from './types'

export function MediaGallery({ isAdmin }: { isAdmin: boolean }) {
  const state = useGalleryMedia()
  const [previewItem, setPreviewItem] = useState<MediaDocument | null>(null)
  const { deletingId, error: deletionError, remove } = useMediaDeletion()
  const counts =
    state.status === 'ready'
      ? state.items.reduce(
          (total, item) => {
            if (item.contentType.startsWith('video/')) {
              total.videos += 1
            } else if (item.contentType.startsWith('image/')) {
              total.photos += 1
            }
            return total
          },
          { photos: 0, videos: 0 },
        )
      : null

  return (
    <section className="gallery" aria-labelledby="gallery-heading">
      <div className="section-heading">
        <h2 id="gallery-heading">גלריית החתונה</h2>
        <span className="live-badge">
          <span className="live-badge__dot" aria-hidden="true" />
          לייב
        </span>
      </div>

      {counts && (
        <div className="media-counts" aria-live="polite" aria-label="מספר הפריטים בגלריה">
          <p className="media-count">
            <span className="media-count__label">תמונות</span>
            <span className="media-count__value" dir="ltr">
              <strong>{counts.photos.toLocaleString('he-IL')}</strong>
              <span> / {MAX_PHOTO_ITEMS.toLocaleString('he-IL')}</span>
            </span>
          </p>
          <p className="media-count">
            <span className="media-count__label">סרטונים</span>
            <span className="media-count__value" dir="ltr">
              <strong>{counts.videos.toLocaleString('he-IL')}</strong>
              <span> / {MAX_VIDEO_ITEMS.toLocaleString('he-IL')}</span>
            </span>
          </p>
        </div>
      )}

      {isAdmin && (
        <p className="admin-notice">מצב ניהול פעיל — הקישו על סמל הפח כדי למחוק פריט.</p>
      )}
      {deletionError && (
        <p className="admin-notice admin-notice--error" role="alert">
          {deletionError}
        </p>
      )}

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
            <MediaGalleryItem
              key={item.id}
              item={item}
              onSelect={setPreviewItem}
              isAdmin={isAdmin}
              isDeleting={deletingId === item.id}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      {previewItem && <MediaLightbox item={previewItem} onClose={() => setPreviewItem(null)} />}
    </section>
  )
}
