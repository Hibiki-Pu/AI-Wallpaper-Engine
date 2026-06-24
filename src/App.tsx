import { WallpaperPreviewPage } from './pages/WallpaperPreviewPage'
import { WallpaperStudioPage } from './pages/WallpaperStudioPage'
import { I18nProvider } from './i18n'
import './App.css'

function App() {
  const page =
    window.location.pathname === '/preview' ? (
      <WallpaperPreviewPage />
    ) : (
      <WallpaperStudioPage />
    )

  return <I18nProvider>{page}</I18nProvider>
}

export default App
