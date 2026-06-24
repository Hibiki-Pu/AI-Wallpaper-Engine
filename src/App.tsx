import { WallpaperPreviewPage } from './pages/WallpaperPreviewPage'
import { WallpaperStudioPage } from './pages/WallpaperStudioPage'
import './App.css'

function App() {
  if (window.location.pathname === '/preview') {
    return <WallpaperPreviewPage />
  }

  return <WallpaperStudioPage />
}

export default App
