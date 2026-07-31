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
        <div className="hero__inner">
          <p className="hero__kicker">האלבום המשותף שלנו</p>
          <h1 className="hero__title" dir="ltr" lang="en">
            <span className="hero__name">EMANUEL</span>
            <span className="hero__amp" aria-hidden="true">
              &amp;
            </span>
            <span className="hero__name">NOA</span>
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
