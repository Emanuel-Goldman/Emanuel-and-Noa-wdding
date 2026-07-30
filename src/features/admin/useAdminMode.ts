import { useCallback, useState } from 'react'
import { ADMIN_SESSION_KEY } from './constants'

// sessionStorage, not localStorage: the panel should not still be unlocked on a
// phone that gets handed around later in the evening.
function readStoredAdminMode(): boolean {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true'
}

export function useAdminMode() {
  const [isAdmin, setIsAdmin] = useState(readStoredAdminMode)

  const unlock = useCallback(() => {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true')
    setIsAdmin(true)
  }, [])

  const lock = useCallback(() => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
    setIsAdmin(false)
  }, [])

  return { isAdmin, unlock, lock }
}
