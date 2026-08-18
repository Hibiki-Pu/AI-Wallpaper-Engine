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
type GenerationMode = 'text' | 'image' | 'character' | 'tone'

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
  const [characterReferenceImage, setCharacterReferenceImage] = useState<string | null>(null)
  const [characterReferenceFileName, setCharacterReferenceFileName] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<SeedreamHistoryItem[]>(readSeedreamHistory)
  const [pendingResult, setPendingResult] = useState<SeedreamHistoryItem | null>(null)
  const referenceInputRef = useRef<HTMLInputElement>(null)
  const characterReferenceInputRef = useRef<HTMLInputElement>(null)

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
    if (mode !== 'character' && mode !== 'tone' && !prompt.trim()) {
      setStatus('error')
      setMessage(t('seedreamPromptRequired'))
      return
    }
    if ((mode === 'image' || mode === 'character' || mode === 'tone') && !referenceImage) {
      setStatus('error')
      setMessage(mode === 'character' ? t('characterSourceRequired') : mode === 'tone' ? t('toneBaseRequired') : t('referenceImageRequired'))
      return
    }
    if ((mode === 'character' || mode === 'tone') && !characterReferenceImage) {
      setStatus('error')
      setMessage(mode === 'tone' ? t('toneReferenceRequired') : t('targetWallpaperRequired'))
      return
    }
    setStatus('generating')
    setMessage(t('seedreamGenerating'))
    try {
      const ratioHint = mode === 'character' || mode === 'tone'
        ? ''
        : `\n\nWallpaper aspect ratio: ${selectedAspectRatio.ratio}. Compose the image to fit this ratio.`
      const characterSwapPrompt = `请以图1（目标壁纸）为唯一底图进行精准的局部人物身份替换。把图1中的人物替换成图2（人物来源图）中的角色身份，但严格保留图1人物原有的服装、表情、姿势、动作、手势、身体朝向、身体比例和画面位置；同时严格保留图1的背景、构图、镜头、透视、裁切、光影、色调、绘画风格和原始横向画幅。

只从图2提取角色的结构性身份特征：脸型、五官形状、眼型、发型轮廓、刘海结构，以及角色固有的兽耳和尾巴形状。不要直接复制图2的原始肤色、眼睛颜色、头发颜色或任何高饱和颜色；必须把这些身份特征重新绘制并融入图1原有的配色体系。

色彩和画风以图1为最高优先级。完整保留图1低饱和、近黑白、灰黑、银白、淡紫灰的单色插画效果，保留柔和雾化光、高光溢出、低对比阴影和细腻颗粒感。替换后的头发、兽耳、尾巴、皮肤和眼睛都必须进行低饱和灰阶化处理，不能出现明显的绿色、青色、金色或鲜艳肤色。画面中仅允许脸颊潮红、眼部微红和极少量暖红反光作为克制的局部强调色，强调色面积要小、透明、柔和，不能破坏整体黑白氛围。

不得继承图2的服装、首饰、头饰、姿势、动作、白色背景、构图、镜头或画风。不要新增人物，不要拼图，不要并排展示，不要生成对比图，不要改变图1中的任何非人物内容。最终只输出编辑后的图1。${prompt.trim() ? `\n\n用户补充要求（不能覆盖以上保留规则）：${prompt.trim()}` : ''}`
      const toneMatchPrompt = `请以图1为唯一内容底图，图2仅作为光影、曝光、色调和质感参考。严格保持图1的人物身份、五官、发型、兽耳、尾巴、服装、手势、腿部姿势、身体比例、背景结构、构图、镜头、裁切和所有物体位置不变；不要把图2的人物或服装替换进图1。

只把图1的整体视觉调色匹配到图2：降低整体曝光和白色色阶，压缩高光，消除皮肤、丝袜、发丝和水珠上的强烈镜面高光；恢复图2柔和、朦胧、低局部对比的近黑白灰紫插画质感。黑色区域保留灰阶细节，不压成纯黑；亮部保持浅灰、银白和淡紫灰，不出现纯白过曝。加入与图2一致的柔和漫射光、薄雾、轻微胶片颗粒和克制光晕。

降低暖黄色、红色和整体饱和度。潮红只保留为眼下和鼻尖附近很小、透明、柔和的暗红强调。水珠只产生微弱柔光，不产生玻璃般高亮反射。避免HDR、强轮廓光、油亮皮肤、塑料质感、纯黑阴影和鲜艳色彩。最终只输出经过光影与色调匹配后的图1。${prompt.trim() ? `\n\n用户补充要求（不能改变图1内容结构）：${prompt.trim()}` : ''}`
      const referenceImages =
        mode === 'character' && referenceImage && characterReferenceImage
          ? [characterReferenceImage, referenceImage]
          : mode === 'tone' && referenceImage && characterReferenceImage
            ? [referenceImage, characterReferenceImage]
          : mode === 'image'
            ? referenceImage ?? undefined
            : undefined
      const result = await generateSeedreamImage(
        mode === 'character' ? characterSwapPrompt : mode === 'tone' ? toneMatchPrompt : `${prompt.trim()}${ratioHint}`,
        { apiKey: apiKey.trim() },
        referenceImages,
        mode === 'character' || mode === 'tone' ? undefined : selectedAspectRatio.ratio,
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
        ...(characterReferenceFileName ? { characterReferenceFileName } : {}),
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

  const handleCharacterReferenceImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setStatus('error')
      setMessage(t('referenceImageTooLarge'))
      return
    }
    try {
      setCharacterReferenceImage(await imageFileToDataUrl(file))
      setCharacterReferenceFileName(file.name)
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
      <div className="generation-mode-switch generation-mode-switch-four" role="group" aria-label={t('generationMode')}>
        <button type="button" className={mode === 'text' ? 'active' : ''} onClick={() => setMode('text')}>{t('textToImage')}</button>
        <button type="button" className={mode === 'image' ? 'active' : ''} onClick={() => setMode('image')}>{t('imageToImage')}</button>
        <button type="button" className={mode === 'character' ? 'active' : ''} onClick={() => setMode('character')}>{t('characterSwap')}</button>
        <button type="button" className={mode === 'tone' ? 'active' : ''} onClick={() => setMode('tone')}>{t('toneMatch')}</button>
      </div>
      <label className="inspector-field">
        <span>{t('apiKey')}</span>
        <div className="api-key-control">
          <input type={showApiKey ? 'text' : 'password'} value={apiKey} placeholder="ark-..." onChange={(event) => setApiKey(event.target.value)} />
          <button type="button" onClick={() => setShowApiKey((visible) => !visible)}>{showApiKey ? t('hide') : t('show')}</button>
        </div>
      </label>
      <button type="button" className="secondary-action" disabled={busy} onClick={handleTest}>{status === 'testing' ? t('seedreamTesting') : t('testConnection')}</button>
      {(mode === 'image' || mode === 'character' || mode === 'tone') && (
        <div className="reference-image-control">
          <span>{mode === 'character' ? t('characterSourceImage') : mode === 'tone' ? t('toneBaseImage') : t('referenceImage')}</span>
          {referenceImage ? (
            <div className="reference-image-preview">
              <img src={referenceImage} alt={mode === 'character' ? t('characterSourceImage') : mode === 'tone' ? t('toneBaseImage') : t('referenceImage')} />
              <strong>{referenceFileName}</strong>
              <div>
                <button type="button" onClick={() => referenceInputRef.current?.click()}>{t('replaceImage')}</button>
                <button type="button" className="danger-button" onClick={() => { setReferenceImage(null); setReferenceFileName('') }}>{t('remove')}</button>
              </div>
            </div>
          ) : (
            <button type="button" className="reference-image-upload" onClick={() => referenceInputRef.current?.click()}>
              {mode === 'character' ? t('chooseCharacterSourceImage') : mode === 'tone' ? t('chooseToneBaseImage') : t('chooseReferenceImage')}
            </button>
          )}
          <input ref={referenceInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="upload-input" onChange={handleReferenceImage} />
        </div>
      )}
      {(mode === 'character' || mode === 'tone') && (
        <div className="reference-image-control">
          <span>{mode === 'tone' ? t('toneReferenceImage') : t('targetWallpaperImage')}</span>
          {characterReferenceImage ? (
            <div className="reference-image-preview">
              <img src={characterReferenceImage} alt={mode === 'tone' ? t('toneReferenceImage') : t('targetWallpaperImage')} />
              <strong>{characterReferenceFileName}</strong>
              <div>
                <button type="button" onClick={() => characterReferenceInputRef.current?.click()}>{t('replaceImage')}</button>
                <button type="button" className="danger-button" onClick={() => { setCharacterReferenceImage(null); setCharacterReferenceFileName('') }}>{t('remove')}</button>
              </div>
            </div>
          ) : (
            <button type="button" className="reference-image-upload" onClick={() => characterReferenceInputRef.current?.click()}>{mode === 'tone' ? t('chooseToneReferenceImage') : t('chooseTargetWallpaperImage')}</button>
          )}
          <input ref={characterReferenceInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="upload-input" onChange={handleCharacterReferenceImage} />
          <p className="reference-image-hint">{mode === 'tone' ? t('toneMatchHint') : t('characterSwapHint')}</p>
        </div>
      )}
      <label className="inspector-field">
        <span>{mode === 'character' || mode === 'tone' ? t('characterSwapPrompt') : t('imagePrompt')}</span>
        <textarea
          rows={6}
          value={prompt}
          placeholder={mode === 'character' ? t('characterSwapPromptPlaceholder') : mode === 'tone' ? t('toneMatchPromptPlaceholder') : t('imagePromptPlaceholder')}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </label>
      {mode !== 'character' && mode !== 'tone' && (
        <label className="inspector-field">
          <span>{t('generationRatio')}</span>
          <select value={selectedAspectRatioId} onChange={(event) => setSelectedAspectRatioId(event.target.value)}>
            {aspectRatios.map((ratio) => (
              <option key={ratio.id} value={ratio.id}>{getRatioFromPreset(ratio)}</option>
            ))}
          </select>
        </label>
      )}
      <div className="image-model-badge">
        <span>{t('imageSize')}</span>
        <strong>{mode === 'character' || mode === 'tone' ? t('followTargetWallpaperRatio') : `2K / ${selectedAspectRatio.ratio}`}</strong>
      </div>
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
