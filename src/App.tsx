import { WallpaperPreviewPage } from './pages/WallpaperPreviewPage'
import { WallpaperStudioPage } from './pages/WallpaperStudioPage'
import { I18nProvider } from './i18n'
import { ThemeProvider } from './theme'
import './App.css'

function App() {
  const page =
    window.location.pathname === '/preview' ? (
      <WallpaperPreviewPage />
    ) : (
      <WallpaperStudioPage />
    )

  return (
    <I18nProvider>
      <ThemeProvider>{page}</ThemeProvider>
    </I18nProvider>
  )
}

export default App
