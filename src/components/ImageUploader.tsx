import type { ChangeEvent } from 'react'

interface ImageUploaderProps {
  onImageSelected: (file: File) => void
}

export function ImageUploader({ onImageSelected }: ImageUploaderProps) {
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
        <p className="panel-kicker">Source</p>
        <h1 id="upload-title">AI Wallpaper Engine</h1>
        <p className="panel-copy">
          Import an image to create the first wallpaper preview.
        </p>
      </div>

      <label className="upload-dropzone">
        <input
          type="file"
          accept="image/*"
          className="upload-input"
          onChange={handleFileChange}
        />
        <span className="upload-title">Choose image</span>
        <span className="upload-hint">PNG, JPG, GIF, or WebP</span>
      </label>
    </section>
  )
}
