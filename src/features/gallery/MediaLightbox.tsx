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

  // A click landing on the dialog element itself is a click on the backdrop:
  // the image and controls are children and stop it from reaching here.
  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      dialogRef.current?.close()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-label={`תצוגה מוגדלת ${caption}`}
      onClose={onClose}
      onClick={handleBackdropClick}
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
        <img className="lightbox__image" src={item.downloadURL} alt={caption} />
        <p className="lightbox__caption">{caption}</p>
      </div>
    </dialog>
  )
}
