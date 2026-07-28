import { ErrorBoundary } from './ErrorBoundary'
import { MediaGallery } from './features/gallery/MediaGallery'
import { MediaUploader } from './features/gallery/MediaUploader'

export default function App() {
  return (
    <ErrorBoundary>
      <main className="page">
        <header className="page-header">
          <h1>Emanuel &amp; Noa&rsquo;s Wedding</h1>
          <p>Share your photos and videos from the celebration!</p>
        </header>
        <MediaUploader />
        <MediaGallery />
      </main>
    </ErrorBoundary>
  )
}
