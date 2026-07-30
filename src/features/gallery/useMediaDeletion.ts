import { useCallback, useState } from 'react'
import { describeUploader } from './mediaCaption'
import { deleteMediaItem } from './mediaRepository'
import type { MediaDocument } from './types'

export function useMediaDeletion() {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const remove = useCallback(async (item: MediaDocument) => {
    const confirmed = window.confirm(
      `למחוק לצמיתות את הפריט ${describeUploader(item)}? לא ניתן לשחזר.`,
    )
    if (!confirmed) return

    setDeletingId(item.id)
    setError(null)
    try {
      await deleteMediaItem(item)
      // No local list update needed: the Firestore listener drops the item and
      // it disappears from every connected device.
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'המחיקה נכשלה.')
    } finally {
      setDeletingId(null)
    }
  }, [])

  return { deletingId, error, remove }
}
