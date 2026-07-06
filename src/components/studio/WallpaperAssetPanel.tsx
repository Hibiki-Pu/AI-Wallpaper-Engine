import { useRef, type ChangeEvent } from 'react'
import type { WallpaperSpec } from '../../types/WallpaperSpec'
import { useI18n } from '../../i18n'

interface WallpaperAssetPanelProps {
  spec: WallpaperSpec | null
  fileName: string
  dimensions: { width: number; height: number } | null
  onReplaceImage: (file: File) => void
  onDeleteImage: () => void
  onResetPosition: () => void
}

export function WallpaperAssetPanel({
  spec,
  fileName,
  dimensions,
  onReplaceImage,
  onDeleteImage,
  onResetPosition,
}: WallpaperAssetPanelProps) {
  const { t } = useI18n()
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const reuploadInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (file) {
      onReplaceImage(file)
    }

    event.currentTarget.value = ''
  }

  return (
    <section className="wallpaper-asset-panel">
      <div>
        <p className="panel-kicker">{t('assets')}</p>
        <h2>{t('currentWallpaper')}</h2>
      </div>

      {spec ? (
        <article className="wallpaper-asset-card">
          <img src={spec.imageUrl} alt="" />
          <div className="wallpaper-asset-meta">
            <strong>{fileName || t('wallpaperImage')}</strong>
            <span>
              {dimensions
                ? `${dimensions.width} x ${dimensions.height}`
                : t('dimensionsLoading')}
            </span>
          </div>

          <div className="wallpaper-asset-actions">
            <button type="button" onClick={() => replaceInputRef.current?.click()}>
              {t('replaceImage')}
            </button>
            <button type="button" onClick={() => reuploadInputRef.current?.click()}>
              {t('reupload')}
            </button>
            <button type="button" className="ghost-button" onClick={onResetPosition}>
              {t('resetPosition')}
            </button>
            <button type="button" className="danger-button" onClick={onDeleteImage}>
              {t('deleteImage')}
            </button>
          </div>
        </article>
      ) : (
        <div className="wallpaper-asset-empty">
          {t('assetEmpty')}
        </div>
      )}

      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="upload-input"
        onChange={handleFileChange}
      />
      <input
        ref={reuploadInputRef}
        type="file"
        accept="image/*"
        className="upload-input"
        onChange={handleFileChange}
      />
    </section>
  )
}
