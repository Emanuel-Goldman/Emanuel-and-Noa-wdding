import { ErrorBoundary } from './ErrorBoundary'
import { AdminToggle } from './features/admin/AdminToggle'
import { useAdminMode } from './features/admin/useAdminMode'
import { MediaGallery } from './features/gallery/MediaGallery'
import { MediaUploader } from './features/gallery/MediaUploader'

export default function App() {
  const { isAdmin, unlock, lock } = useAdminMode()

  return (
    <ErrorBoundary>
      <AdminToggle isAdmin={isAdmin} onUnlock={unlock} onLock={lock} />
      <header className="hero">
        <div className="hero__frame">
          <svg
            className="hero__heart"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 20.2s-7.1-4.4-9.6-8.6C.6 8.4 1.4 4.9 4.6 3.4c2.5-1.2 5.2-.3 6.7 1.9l.7 1 .7-1c1.5-2.2 4.2-3.1 6.7-1.9 3.2 1.5 4 5 2.2 8.2-2.5 4.2-9.6 8.6-9.6 8.6Z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
          <p className="hero__kicker">האלבום המשותף שלנו</p>
          <h1 className="hero__title" dir="ltr" lang="en">
            EMANUEL<span className="hero__amp">&amp;</span>NOA
          </h1>
          <p className="hero__subtitle">שתפו את התמונות והסרטונים שלכם מהחגיגה!</p>
        </div>
      </header>
      <main className="page">
        <MediaUploader />
        <MediaGallery isAdmin={isAdmin} />
      </main>
    </ErrorBoundary>
  )
}
