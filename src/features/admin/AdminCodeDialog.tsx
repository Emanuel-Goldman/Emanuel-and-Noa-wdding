import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { ADMIN_CODE } from './constants'

type Props = {
  onUnlock: () => void
  onDismiss: () => void
}

export function AdminCodeDialog({ onUnlock, onDismiss }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [code, setCode] = useState('')
  const [hasFailed, setHasFailed] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    return () => dialog.close()
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (code.trim() !== ADMIN_CODE) {
      setHasFailed(true)
      setCode('')
      return
    }
    onUnlock()
    dialogRef.current?.close()
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      dialogRef.current?.close()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="code-dialog"
      aria-labelledby="code-dialog-heading"
      onClose={onDismiss}
      onClick={handleBackdropClick}
    >
      <form className="code-dialog__form" onSubmit={handleSubmit}>
        <h2 id="code-dialog-heading">מצב ניהול</h2>

        <label htmlFor="admin-code">קוד כניסה</label>
        <input
          id="admin-code"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={code}
          onChange={(event) => {
            setCode(event.target.value)
            setHasFailed(false)
          }}
          aria-describedby={hasFailed ? 'admin-code-error' : undefined}
          aria-invalid={hasFailed}
          autoFocus
        />

        {hasFailed && (
          <p id="admin-code-error" className="code-dialog__error" role="alert">
            קוד שגוי, נסו שוב.
          </p>
        )}

        <div className="code-dialog__actions">
          <button type="button" className="button-secondary" onClick={() => dialogRef.current?.close()}>
            ביטול
          </button>
          <button type="submit" className="button-primary">
            כניסה
          </button>
        </div>
      </form>
    </dialog>
  )
}
