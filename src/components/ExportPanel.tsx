import { useMemo, useState } from 'react'
import {
  downloadWallpaperSpec,
  serializeWallpaperSpec,
} from '../services/exportWallpaperSpec'
import type { WallpaperSpec } from '../types/WallpaperSpec'

interface ExportPanelProps {
  spec: WallpaperSpec | null
}

export function ExportPanel({ spec }: ExportPanelProps) {
  const [copyStatus, setCopyStatus] = useState('')
  const specJson = useMemo(
    () => (spec ? serializeWallpaperSpec(spec) : ''),
    [spec],
  )
  const disabled = !spec

  const handleCopySpec = async () => {
    if (!specJson) {
      return
    }

    await navigator.clipboard.writeText(specJson)
    setCopyStatus('Copied')
    window.setTimeout(() => setCopyStatus(''), 1800)
  }

  const handleDownloadSpec = () => {
    if (!spec) {
      return
    }

    downloadWallpaperSpec(spec)
  }

  return (
    <section className="export-panel" aria-labelledby="export-title">
      <div className="export-header">
        <div>
          <p className="panel-kicker">Project package</p>
          <h2 id="export-title">WallpaperSpec JSON</h2>
        </div>

        <div className="export-actions">
          <button type="button" disabled={disabled} onClick={handleCopySpec}>
            Copy Spec JSON
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={handleDownloadSpec}
          >
            Download wallpaperSpec.json
          </button>
        </div>
      </div>

      <pre className="spec-json" aria-live="polite">
        {specJson || 'Upload an image to generate a WallpaperSpec.'}
      </pre>
      <div className="copy-status" aria-live="polite">
        {copyStatus}
      </div>
    </section>
  )
}
