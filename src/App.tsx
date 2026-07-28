import { ErrorBoundary } from './ErrorBoundary'
import { MediaGallery } from './features/gallery/MediaGallery'
import { MediaUploader } from './features/gallery/MediaUploader'

export default function App() {
  return (
    <ErrorBoundary>
      <main className="page">
        <header className="page-header">
          <div className="page-header__divider" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21s-6.7-4.35-9.3-8.1C.8 9.9 1.4 6.6 4.2 5.1c2.3-1.2 4.9-.4 6.3 1.6l1.5 2 1.5-2c1.4-2 4-2.8 6.3-1.6 2.8 1.5 3.4 4.8 1.5 7.8C18.7 16.65 12 21 12 21z" />
            </svg>
          </div>
          <h1>Emanuel &amp; Noa&rsquo;s Wedding</h1>
          <p>Share your photos and videos from the celebration!</p>
        </header>
        <MediaUploader />
        <MediaGallery />
      </main>
    </ErrorBoundary>
  )
}
