import { useState } from 'react'
import { AdminCodeDialog } from './AdminCodeDialog'

type Props = {
  isAdmin: boolean
  onUnlock: () => void
  onLock: () => void
}

export function AdminToggle({ isAdmin, onUnlock, onLock }: Props) {
  const [isPrompting, setIsPrompting] = useState(false)

  if (isAdmin) {
    return (
      <button type="button" className="admin-toggle admin-toggle--active" onClick={onLock}>
        יציאה ממצב ניהול
      </button>
    )
  }

  return (
    <>
      {/* Visually understated on purpose, but it still carries a real accessible
          name — an unlabelled control would be unusable with a screen reader. */}
      <button
        type="button"
        className="admin-toggle"
        onClick={() => setIsPrompting(true)}
        aria-label="מצב ניהול"
      >
        <span aria-hidden="true">•</span>
      </button>

      {isPrompting && (
        <AdminCodeDialog onUnlock={onUnlock} onDismiss={() => setIsPrompting(false)} />
      )}
    </>
  )
}
