import { useMemo, useState } from 'react'
import { getAnimationProvider } from '../../providers/animation/providerFactory'
import type {
  AnimationProviderName,
  AnimationTargetType,
} from '../../types/AnimationProvider'
import type { MotionLayer } from '../../types/MotionLayer'
import { useI18n } from '../../i18n'

const TARGET_OPTIONS: AnimationTargetType[] = [
  'portrait',
  'landscape',
  'object',
  'background',
]

const MOTION_OPTIONS = [
  'idle_breathing',
  'blink',
  'gentle_head_motion',
  'hair_sway',
  'cloud_drift',
  'water_ripple',
  'leaf_sway',
]

const PROVIDER_OPTIONS: Array<{
  value: AnimationProviderName
  label: string
  disabled?: boolean
}> = [
  { value: 'mock', label: 'mock' },
  { value: 'live_portrait', label: 'live_portrait (coming soon)', disabled: true },
  { value: 'depth_anything', label: 'depth_anything (coming soon)', disabled: true },
  { value: 'sam', label: 'sam (coming soon)', disabled: true },
]

const createMotionLayerName = (motionType: string, index: number) =>
  `${motionType.replaceAll('_', ' ')} ${index + 1}`

interface MotionPanelProps {
  imageUrl: string | null
}

export function MotionPanel({ imageUrl }: MotionPanelProps) {
  const { t } = useI18n()
  const [targetType, setTargetType] =
    useState<AnimationTargetType>('portrait')
  const [motionType, setMotionType] = useState('idle_breathing')
  const [providerName, setProviderName] =
    useState<AnimationProviderName>('mock')
  const [strength, setStrength] = useState(0.3)
  const [duration, setDuration] = useState(6)
  const [loop, setLoop] = useState(true)
  const [layers, setLayers] = useState<MotionLayer[]>([])
  const [status, setStatus] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const canGenerate = Boolean(imageUrl) && !isGenerating
  const selectedProvider = useMemo(
    () => getAnimationProvider(providerName),
    [providerName],
  )

  const handleGenerate = async () => {
    if (!imageUrl || isGenerating) {
      return
    }

    setIsGenerating(true)
    setStatus(t('motionGenerating'))

    try {
      const result = await selectedProvider.generate({
        imageUrl,
        targetType,
        motionType,
        strength,
        loop,
        duration,
        provider: providerName,
      })

      if (result.status !== 'completed' || !result.motionSpec) {
        setStatus(result.errorMessage ?? t('motionGenerateFailed'))
        return
      }

      const nextLayer: MotionLayer = {
        id: result.motionSpec.id,
        name: createMotionLayerName(motionType, layers.length),
        targetType,
        motionType,
        provider: result.provider,
        visible: true,
        strength,
        loop,
        duration,
        motionSpec: result.motionSpec,
      }

      setLayers((currentLayers) => [nextLayer, ...currentLayers])
      setStatus(t('motionLayerCreated'))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <section className="motion-panel" aria-label={t('motionAnimation')}>
      <div>
        <p className="panel-kicker">{t('motion')}</p>
        <h2>{t('motionAnimation')}</h2>
        <p>{t('motionFrameworkCopy')}</p>
      </div>

      <label className="inspector-field">
        <span>{t('motionTarget')}</span>
        <select
          value={targetType}
          onChange={(event) =>
            setTargetType(event.target.value as AnimationTargetType)
          }
        >
          {TARGET_OPTIONS.map((target) => (
            <option key={target} value={target}>
              {t(target)}
            </option>
          ))}
        </select>
      </label>

      <label className="inspector-field">
        <span>{t('motionType')}</span>
        <select
          value={motionType}
          onChange={(event) => setMotionType(event.target.value)}
        >
          {MOTION_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="inspector-field">
        <span>{t('motionProvider')}</span>
        <select
          value={providerName}
          onChange={(event) =>
            setProviderName(event.target.value as AnimationProviderName)
          }
        >
          {PROVIDER_OPTIONS.map((provider) => (
            <option
              key={provider.value}
              value={provider.value}
              disabled={provider.disabled}
            >
              {provider.label}
            </option>
          ))}
        </select>
      </label>

      <label className="inspector-field">
        <span>{t('strength')}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={strength}
          onChange={(event) => setStrength(Number(event.target.value))}
        />
        <output>{strength.toFixed(2)}</output>
      </label>

      <label className="inspector-field">
        <span>{t('duration')}</span>
        <select
          value={duration}
          onChange={(event) => setDuration(Number(event.target.value))}
        >
          <option value={3}>3s</option>
          <option value={6}>6s</option>
          <option value={10}>10s</option>
        </select>
      </label>

      <label className="inspector-toggle">
        <input
          type="checkbox"
          checked={loop}
          onChange={(event) => setLoop(event.target.checked)}
        />
        <span>{t('loop')}</span>
      </label>

      <button
        type="button"
        className="motion-generate-button"
        disabled={!canGenerate}
        onClick={handleGenerate}
      >
        {isGenerating ? t('motionGenerating') : t('generateMotionLayer')}
      </button>

      {!imageUrl && <p className="motion-status">{t('motionNeedsImage')}</p>}
      {status && <p className="motion-status">{status}</p>}

      <div className="motion-layer-list">
        <h3>{t('motionLayers')}</h3>
        {layers.length === 0 ? (
          <p>{t('motionLayerEmpty')}</p>
        ) : (
          layers.map((layer) => (
            <article className="motion-layer-card" key={layer.id}>
              <div>
                <strong>{layer.name}</strong>
                <span>
                  {layer.targetType} · {layer.provider}
                </span>
              </div>
              <dl>
                <div>
                  <dt>{t('strength')}</dt>
                  <dd>{layer.strength.toFixed(2)}</dd>
                </div>
                <div>
                  <dt>{t('duration')}</dt>
                  <dd>{layer.duration}s</dd>
                </div>
              </dl>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
