import { useMemo, useState } from 'react'
import {
  downloadWallpaperSpec,
  serializeWallpaperSpec,
} from '../services/exportWallpaperSpec'
import { exportWallpaperPackage } from '../services/exportWallpaperPackage'
import type { WallpaperSpec } from '../types/WallpaperSpec'
import { useI18n } from '../i18n'

interface ExportPanelProps {
  spec: WallpaperSpec | null
}

export function ExportPanel({ spec }: ExportPanelProps) {
  const { t } = useI18n()
  const [copyStatus, setCopyStatus] = useState('')
  const [exportStatus, setExportStatus] = useState('')
  const [isExportingPackage, setIsExportingPackage] = useState(false)
  const specJson = useMemo(
    () => (spec ? serializeWallpaperSpec(spec) : ''),
    [spec],
  )
  const disabled = !spec || isExportingPackage

  const handleCopySpec = async () => {
    if (!specJson) {
      return
    }

    await navigator.clipboard.writeText(specJson)
    setCopyStatus(t('copied'))
    window.setTimeout(() => setCopyStatus(''), 1800)
  }

  const handleDownloadSpec = () => {
    if (!spec) {
      return
    }

    downloadWallpaperSpec(spec)
  }

  const handleDownloadPackage = async () => {
    if (!spec) {
      return
    }

    setIsExportingPackage(true)
    setExportStatus(t('preparingPackage'))

    try {
      await exportWallpaperPackage(spec)
      setExportStatus(t('packageDownloaded'))
      window.setTimeout(() => setExportStatus(''), 2400)
    } catch {
      setExportStatus(t('packageExportFailed'))
    } finally {
      setIsExportingPackage(false)
    }
  }

  return (
    <section className="export-panel" aria-labelledby="export-title">
      <div className="export-header">
        <div>
          <p className="panel-kicker">{t('projectPackage')}</p>
          <h2 id="export-title">WallpaperSpec JSON</h2>
        </div>

        <div className="export-actions">
          <button type="button" disabled={disabled} onClick={handleCopySpec}>
            {t('copySpecJson')}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={handleDownloadSpec}
          >
            {t('downloadSpecJson')}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={handleDownloadPackage}
          >
            {isExportingPackage
              ? t('preparingPackage')
              : t('downloadPackage')}
          </button>
        </div>
      </div>

      <pre className="spec-json" aria-live="polite">
        {specJson || t('emptySpec')}
      </pre>
      <div className="copy-status" aria-live="polite">
        {exportStatus || copyStatus}
      </div>
    </section>
  )
}
