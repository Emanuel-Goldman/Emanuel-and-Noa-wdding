import { useEffect, useRef, type MouseEvent } from 'react'
import { describeUploader } from './mediaCaption'
import type { MediaDocument } from './types'

type Props = {
  item: MediaDocument
  onClose: () => void
}

export function MediaLightbox({ item, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const caption = describeUploader(item)

  // showModal() is what grants the focus trap, Escape handling and inert
  // background; a dialog rendered without it stays a plain inline element.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    return () => dialog.close()
  }, [])

  // Dismiss on anything that is not the photo or the close button. Comparing
  // target to currentTarget is not enough: the frame element covers the whole
  // dialog box, so it swallows every click that is not strictly on the backdrop.
  const handleDismissClick = (event: MouseEvent<HTMLDialogElement>) => {
    const target = event.target as HTMLElement
    if (target.closest('.lightbox__image, .lightbox__close')) return
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-label={`תצוגה מוגדלת ${caption}`}
      onClose={onClose}
      onClick={handleDismissClick}
    >
      <div className="lightbox__frame">
        <button
          type="button"
          className="lightbox__close"
          onClick={() => dialogRef.current?.close()}
          aria-label="סגירת התצוגה המוגדלת"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
        {/* displayURL (a JPEG rendition) first: the original is frequently
            HEIC from an iPhone, which most non-Safari browsers cannot
            render in an <img> tag at all. thumbnailURL is a smaller but
            still-decodable fallback for items uploaded before this JPEG
            rendition existed. */}
        <img
          className="lightbox__image"
          src={item.displayURL ?? item.thumbnailURL ?? item.downloadURL}
          alt={caption}
        />
        <p className="lightbox__caption">{caption}</p>
      </div>
    </dialog>
  )
}
