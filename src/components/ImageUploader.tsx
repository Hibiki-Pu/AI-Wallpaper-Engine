import type { ChangeEvent } from 'react'
import { useI18n } from '../i18n'

interface ImageUploaderProps {
  onImageSelected: (file: File) => void
}

export function ImageUploader({ onImageSelected }: ImageUploaderProps) {
  const { t } = useI18n()
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    onImageSelected(file)
  }

  return (
    <section className="uploader-panel" aria-labelledby="upload-title">
      <div>
        <p className="panel-kicker">{t('source')}</p>
        <h1 id="upload-title">{t('appName')}</h1>
        <p className="panel-copy">{t('uploadCopy')}</p>
      </div>

      <label className="upload-dropzone">
        <input
          type="file"
          accept="image/*"
          className="upload-input"
          onChange={handleFileChange}
        />
        <span className="upload-title">{t('chooseImage')}</span>
        <span className="upload-hint">{t('imageFormats')}</span>
      </label>
    </section>
  )
}
