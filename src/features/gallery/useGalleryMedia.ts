import { useEffect, useState } from 'react'
import { GALLERY_PAGE_SIZE } from './constants'
import { subscribeToRecentMedia } from './mediaRepository'
import type { GalleryState } from './types'

export function useGalleryMedia(): { state: GalleryState; hasMore: boolean; loadMore: () => void } {
  const [visibleCount, setVisibleCount] = useState(GALLERY_PAGE_SIZE)
  const [state, setState] = useState<GalleryState>({ status: 'loading' })
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToRecentMedia(
      visibleCount,
      (items) => {
        setState({ status: 'ready', items })
        setHasMore(items.length >= visibleCount)
      },
      (error) => setState({ status: 'error', message: error.message }),
    )
    return unsubscribe
  }, [visibleCount])

  const loadMore = () => setVisibleCount((count) => count + GALLERY_PAGE_SIZE)

  return { state, hasMore, loadMore }
}
