import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useI18n } from '../../i18n'
import {
  dataUrlToImageFile,
  generateSeedreamImage,
  imageFileToDataUrl,
  readSeedreamHistory,
  SEEDREAM_API_KEY_STORAGE_KEY,
  SEEDREAM_HISTORY_STORAGE_KEY,
  SEEDREAM_MODEL,
  testSeedreamConnection,
  writeSeedreamHistory,
  type SeedreamAspectRatio,
  type SeedreamHistoryItem,
} from '../../services/seedreamImageService'

interface ImageGenerationPanelProps {
  onImageGenerated: (file: File) => void
  hasCurrentWallpaper: boolean
  canvasAspectRatio: SeedreamAspectRatio
}

type Status = 'idle' | 'testing' | 'generating' | 'success' | 'error'
type GenerationMode = 'text' | 'image'

const FALLBACK_ASPECT_RATIOS: SeedreamAspectRatio[] = [
  { id: '16-9', label: '16:9', ratio: '16:9' },
  { id: '21-9', label: '21:9', ratio: '21:9' },
  { id: '9-16', label: '9:16', ratio: '9:16' },
  { id: '1-1', label: '1:1', ratio: '1:1' },
  { id: '4-3', label: '4:3', ratio: '4:3' },
  { id: '3-4', label: '3:4', ratio: '3:4' },
]

const getRatioFromPreset = (ratio: SeedreamAspectRatio) => `${ratio.label} (${ratio.ratio})`

export function ImageGenerationPanel({
  onImageGenerated,
  hasCurrentWallpaper,
  canvasAspectRatio,
}: ImageGenerationPanelProps) {
  const { t } = useI18n()
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(SEEDREAM_API_KEY_STORAGE_KEY) ?? '')
  const [showApiKey, setShowApiKey] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState<GenerationMode>('text')
  const [selectedAspectRatioId, setSelectedAspectRatioId] = useState('canvas')
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referenceFileName, setReferenceFileName] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<SeedreamHistoryItem[]>(readSeedreamHistory)
  const [pendingResult, setPendingResult] = useState<SeedreamHistoryItem | null>(null)
  const referenceInputRef = useRef<HTMLInputElement>(null)

  const aspectRatios = [
    { id: 'canvas', label: `${t('currentCanvas')} ${canvasAspectRatio.ratio}`, ratio: canvasAspectRatio.ratio },
    ...FALLBACK_ASPECT_RATIOS,
  ]
  const selectedAspectRatio =
    aspectRatios.find((ratio) => ratio.id === selectedAspectRatioId) ?? aspectRatios[0]

  useEffect(() => {
    if (apiKey.trim()) localStorage.setItem(SEEDREAM_API_KEY_STORAGE_KEY, apiKey.trim())
    else localStorage.removeItem(SEEDREAM_API_KEY_STORAGE_KEY)
  }, [apiKey])

  const saveHistoryItem = (item: SeedreamHistoryItem) => {
    setHistory((currentHistory) => {
      const nextHistory = [
        item,
        ...currentHistory.filter((historyItem) => historyItem.id !== item.id),
      ].slice(0, 12)
      writeSeedreamHistory(nextHistory)
      return nextHistory
    })
  }

  const applyHistoryItem = async (item: SeedreamHistoryItem) => {
    onImageGenerated(await dataUrlToImageFile(item.dataUrl))
    setPendingResult(null)
    setStatus('success')
    setMessage(t('seedreamLoadedFromHistory'))
  }

  const removeHistoryItem = (id: string) => {
    setHistory((currentHistory) => {
      const nextHistory = currentHistory.filter((item) => item.id !== id)
      writeSeedreamHistory(nextHistory)
      return nextHistory
    })
    setPendingResult((currentResult) => currentResult?.id === id ? null : currentResult)
  }

  const clearHistory = () => {
    localStorage.removeItem(SEEDREAM_HISTORY_STORAGE_KEY)
    setHistory([])
    setPendingResult(null)
  }

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
      const ratioHint = `\n\nWallpaper aspect ratio: ${selectedAspectRatio.ratio}. Compose the image to fit this ratio.`
      const result = await generateSeedreamImage(
        `${prompt.trim()}${ratioHint}`,
        { apiKey: apiKey.trim() },
        mode === 'image' ? referenceImage ?? undefined : undefined,
        selectedAspectRatio.ratio,
      )
      const nextHistoryItem: SeedreamHistoryItem = {
        id: `seedream-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        dataUrl: result.dataUrl,
        prompt: prompt.trim(),
        mode,
        aspectRatio: selectedAspectRatio.ratio,
        aspectRatioLabel: getRatioFromPreset(selectedAspectRatio),
        model: result.model,
        createdAt: new Date().toISOString(),
        ...(referenceFileName ? { referenceFileName } : {}),
      }
      saveHistoryItem(nextHistoryItem)
      setPendingResult(nextHistoryItem)
      if (!hasCurrentWallpaper) {
        await applyHistoryItem(nextHistoryItem)
      }
      setStatus('success')
      setMessage(hasCurrentWallpaper ? t('seedreamGeneratedNeedsConfirm') : t('seedreamGenerated'))
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
      <label className="inspector-field">
        <span>{t('generationRatio')}</span>
        <select value={selectedAspectRatioId} onChange={(event) => setSelectedAspectRatioId(event.target.value)}>
          {aspectRatios.map((ratio) => (
            <option key={ratio.id} value={ratio.id}>{getRatioFromPreset(ratio)}</option>
          ))}
        </select>
      </label>
      <div className="image-model-badge"><span>{t('imageSize')}</span><strong>2K · {selectedAspectRatio.ratio}</strong></div>
      {message && <p className={`image-generation-status status-${status}`} role="status">{message}</p>}
      {pendingResult && hasCurrentWallpaper && (
        <div className="seedream-pending-card">
          <img src={pendingResult.dataUrl} alt={t('generatedPreview')} />
          <div>
            <strong>{t('generatedImageReady')}</strong>
            <span>{pendingResult.aspectRatioLabel}</span>
          </div>
          <button type="button" onClick={() => void applyHistoryItem(pendingResult)}>{t('replaceCurrentWallpaperAction')}</button>
          <button type="button" className="secondary-action" onClick={() => setPendingResult(null)}>{t('keepInHistory')}</button>
        </div>
      )}
      <button type="button" className="image-generate-button" disabled={busy} onClick={handleGenerate}>{status === 'generating' ? t('seedreamGenerating') : t('generateImage')}</button>
      <div className="seedream-history-section">
        <div className="seedream-history-header">
          <div>
            <p className="panel-kicker">{t('generationHistory')}</p>
            <strong>{history.length ? t('recentGenerations') : t('historyEmpty')}</strong>
          </div>
          {history.length > 0 && <button type="button" onClick={clearHistory}>{t('clear')}</button>}
        </div>
        {history.length > 0 && (
          <div className="seedream-history-grid">
            {history.map((item) => (
              <article key={item.id} className="seedream-history-card">
                <img src={item.dataUrl} alt={t('generatedPreview')} />
                <div>
                  <strong>{item.prompt}</strong>
                  <span>{item.aspectRatioLabel}</span>
                </div>
                <button type="button" onClick={() => void applyHistoryItem(item)}>{t('applyToCanvas')}</button>
                <button type="button" className="danger-button" onClick={() => removeHistoryItem(item.id)}>{t('delete')}</button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
