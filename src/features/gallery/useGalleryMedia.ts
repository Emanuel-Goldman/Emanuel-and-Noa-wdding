import { useEffect, useState } from 'react'
import { subscribeToRecentMedia } from './mediaRepository'
import type { GalleryState } from './types'

export function useGalleryMedia(): GalleryState {
  const [state, setState] = useState<GalleryState>({ status: 'loading' })

  useEffect(() => {
    const unsubscribe = subscribeToRecentMedia(
      (items) => setState({ status: 'ready', items }),
      (error) => setState({ status: 'error', message: error.message }),
    )
    return unsubscribe
  }, [])

  return state
}
