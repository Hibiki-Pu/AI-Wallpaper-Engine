import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useI18n } from '../../i18n'
import {
  dataUrlToImageFile,
  generateSeedreamImage,
  imageFileToDataUrl,
  SEEDREAM_API_KEY_STORAGE_KEY,
  SEEDREAM_MODEL,
  testSeedreamConnection,
} from '../../services/seedreamImageService'

interface ImageGenerationPanelProps {
  onImageGenerated: (file: File) => void
}

type Status = 'idle' | 'testing' | 'generating' | 'success' | 'error'
type GenerationMode = 'text' | 'image'

export function ImageGenerationPanel({ onImageGenerated }: ImageGenerationPanelProps) {
  const { t } = useI18n()
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(SEEDREAM_API_KEY_STORAGE_KEY) ?? '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState<GenerationMode>('text')
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referenceFileName, setReferenceFileName] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const referenceInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (apiKey.trim()) localStorage.setItem(SEEDREAM_API_KEY_STORAGE_KEY, apiKey.trim())
    else localStorage.removeItem(SEEDREAM_API_KEY_STORAGE_KEY)
  }, [apiKey])

  const requireApiKey = () => {
    if (apiKey.trim()) return true
    setStatus('error')
    setMessage(t('seedreamApiKeyRequired'))
    return false
  }

  const handleTest = async () => {
    if (!requireApiKey()) return
    setStatus('testing')
    setMessage(t('seedreamTesting'))
    try {
      const result = await testSeedreamConnection({ apiKey: apiKey.trim() })
      setStatus('success')
      setMessage(result.message)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : t('seedreamConnectionFailed'))
    }
  }

  const handleGenerate = async () => {
    if (!requireApiKey()) return
    if (!prompt.trim()) {
      setStatus('error')
      setMessage(t('seedreamPromptRequired'))
      return
    }
    if (mode === 'image' && !referenceImage) {
      setStatus('error')
      setMessage(t('referenceImageRequired'))
      return
    }
    setStatus('generating')
    setMessage(t('seedreamGenerating'))
    try {
      const result = await generateSeedreamImage(
        prompt.trim(),
        { apiKey: apiKey.trim() },
        mode === 'image' ? referenceImage ?? undefined : undefined,
      )
      onImageGenerated(await dataUrlToImageFile(result.dataUrl))
      setStatus('success')
      setMessage(t('seedreamGenerated'))
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : t('seedreamGenerateFailed'))
    }
  }

  const busy = status === 'testing' || status === 'generating'

  const handleReferenceImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setStatus('error')
      setMessage(t('referenceImageTooLarge'))
      return
    }
    try {
      setReferenceImage(await imageFileToDataUrl(file))
      setReferenceFileName(file.name)
      setStatus('idle')
      setMessage('')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : t('referenceImageReadFailed'))
    }
  }

  return (
    <section className="image-generation-panel">
      <div>
        <p className="panel-kicker">{t('aiImageGeneration')}</p>
        <h2>Doubao Seedream 5.0 Pro</h2>
      </div>
      <div className="image-model-badge"><span>{t('model')}</span><strong>{SEEDREAM_MODEL}</strong></div>
      <div className="generation-mode-switch" role="group" aria-label={t('generationMode')}>
        <button type="button" className={mode === 'text' ? 'active' : ''} onClick={() => setMode('text')}>{t('textToImage')}</button>
        <button type="button" className={mode === 'image' ? 'active' : ''} onClick={() => setMode('image')}>{t('imageToImage')}</button>
      </div>
      <label className="inspector-field">
        <span>{t('apiKey')}</span>
        <div className="api-key-control">
          <input type={showApiKey ? 'text' : 'password'} value={apiKey} placeholder="ark-..." onChange={(event) => setApiKey(event.target.value)} />
          <button type="button" onClick={() => setShowApiKey((visible) => !visible)}>{showApiKey ? t('hide') : t('show')}</button>
        </div>
      </label>
      <button type="button" className="secondary-action" disabled={busy} onClick={handleTest}>{status === 'testing' ? t('seedreamTesting') : t('testConnection')}</button>
      {mode === 'image' && (
        <div className="reference-image-control">
          <span>{t('referenceImage')}</span>
          {referenceImage ? (
            <div className="reference-image-preview">
              <img src={referenceImage} alt={t('referenceImage')} />
              <strong>{referenceFileName}</strong>
              <div>
                <button type="button" onClick={() => referenceInputRef.current?.click()}>{t('replaceImage')}</button>
                <button type="button" className="danger-button" onClick={() => { setReferenceImage(null); setReferenceFileName('') }}>{t('remove')}</button>
              </div>
            </div>
          ) : (
            <button type="button" className="reference-image-upload" onClick={() => referenceInputRef.current?.click()}>{t('chooseReferenceImage')}</button>
          )}
          <input ref={referenceInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="upload-input" onChange={handleReferenceImage} />
        </div>
      )}
      <label className="inspector-field">
        <span>{t('imagePrompt')}</span>
        <textarea rows={6} value={prompt} placeholder={t('imagePromptPlaceholder')} onChange={(event) => setPrompt(event.target.value)} />
      </label>
      <div className="image-model-badge"><span>{t('imageSize')}</span><strong>2K</strong></div>
      {message && <p className={`image-generation-status status-${status}`} role="status">{message}</p>}
      <button type="button" className="image-generate-button" disabled={busy} onClick={handleGenerate}>{status === 'generating' ? t('seedreamGenerating') : t('generateImage')}</button>
    </section>
  )
}
