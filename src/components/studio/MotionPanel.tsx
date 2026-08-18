import { useMemo, useState } from 'react'
import { getAnimationProvider } from '../../providers/animation/providerFactory'
import { useEffect } from 'react'
import { createLivePortraitProvider } from '../../providers/animation/livePortrait/livePortraitProvider'
import {
  buildLivePortraitCommand,
  checkLivePortraitRuntime,
} from '../../providers/animation/livePortrait/livePortraitRuntimeBridge'
import { RuntimeSettingsPanel } from './RuntimeSettingsPanel'
import {
  getRuntimeConfig,
  resetRuntimeConfig,
  updateRuntimeConfig,
} from '../../runtime/runtimeConfigStore'
import {
  checkRuntimeHostHealth,
  uploadRuntimeAsset,
  type RuntimeHostHealth,
} from '../../runtime/runtimeHostClient'
import type {
  AnimationProviderName,
  AnimationTargetType,
} from '../../types/AnimationProvider'
import type { MotionLayer } from '../../types/MotionLayer'
import type { RuntimeJobStatus } from '../../types/RuntimeJob'
import type { RuntimeConfig } from '../../types/RuntimeConfig'
import type { LivePortraitMotionPreset } from '../../providers/animation/livePortrait/livePortraitTypes'
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
  { value: 'mock', label: 'Mock Provider: Available' },
  { value: 'liveportrait', label: 'LivePortrait: Experimental' },
  { value: 'depth_anything', label: 'depth_anything (coming soon)', disabled: true },
  { value: 'sam', label: 'sam (coming soon)', disabled: true },
]

const MOTION_TO_LIVEPORTRAIT_PRESET: Record<string, LivePortraitMotionPreset> = {
  idle_breathing: 'subtle_breathing',
  blink: 'blink',
  gentle_head_motion: 'slight_head_turn',
}

const createMotionLayerName = (motionType: string, index: number) =>
  `${motionType.replaceAll('_', ' ')} ${index + 1}`

const formatCommandPlanSummary = (commandPlan: unknown): string | null => {
  if (!commandPlan || typeof commandPlan !== 'object') {
    return null
  }

  const plan = commandPlan as {
    command?: string
    args?: string[]
    cwd?: string
  }

  return [plan.command, ...(plan.args ?? [])]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(' ')
}

const formatOutputPlanSummary = (outputPlan: unknown): string | null => {
  if (!outputPlan || typeof outputPlan !== 'object') {
    return null
  }

  const plan = outputPlan as {
    outputFilename?: string
    runtimeOutputPath?: string
  }

  return plan.runtimeOutputPath ?? plan.outputFilename ?? null
}

const formatExecutionResultSummary = (executionResult: unknown): string | null => {
  if (!executionResult || typeof executionResult !== 'object') {
    return null
  }

  const result = executionResult as {
    exitCode?: number | null
    durationMs?: number
    timedOut?: boolean
    stderr?: string
  }
  const parts = [
    `exitCode: ${result.exitCode ?? 'n/a'}`,
    result.durationMs !== undefined ? `${result.durationMs}ms` : null,
    result.timedOut ? 'timeout' : null,
    result.stderr ? `stderr: ${result.stderr.slice(0, 140)}` : null,
  ].filter((part): part is string => Boolean(part))

  return parts.join(' ・ ')
}

const formatImportStatusLabel = (
  status: unknown,
  t: ReturnType<typeof useI18n>['t'],
): string | null => {
  if (typeof status !== 'string') {
    return null
  }

  const knownStatuses = new Set([
    'planned',
    'checking',
    'importing',
    'imported',
    'missing',
    'failed',
    'skipped',
  ])

  return knownStatuses.has(status)
    ? t(status as Parameters<typeof t>[0])
    : status
}
const getRuntimeOutputAssetSummary = (asset: unknown): string | null => {
  if (!asset || typeof asset !== 'object') {
    return null
  }

  const runtimeAsset = asset as {
    name?: string
    mimeType?: string
    providerId?: string
  }

  return [runtimeAsset.name, runtimeAsset.mimeType, runtimeAsset.providerId]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(' ・ ')
}
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
  const [livePortraitRuntimeConfig, setLivePortraitRuntimeConfig] =
    useState<RuntimeConfig>(() => getRuntimeConfig('liveportrait'))
  const [strength, setStrength] = useState(0.3)
  const [duration, setDuration] = useState(6)
  const [loop, setLoop] = useState(true)
  const [layers, setLayers] = useState<MotionLayer[]>([])
  const [status, setStatus] = useState('')
  const [hostHealth, setHostHealth] = useState<RuntimeHostHealth | null>(null)
  const [hostHealthStatus, setHostHealthStatus] = useState('')
  const [jobStatus, setJobStatus] =
    useState<RuntimeJobStatus | 'fallback'>('idle')
  const [isGenerating, setIsGenerating] = useState(false)
  const [drivingVideo, setDrivingVideo] = useState<File | null>(null)
  const [drivingVideoPreview, setDrivingVideoPreview] = useState<string | null>(null)
  const [drivingOption, setDrivingOption] =
    useState<'expression-friendly' | 'pose-friendly'>('pose-friendly')
  const [drivingMultiplier, setDrivingMultiplier] = useState(1)
  const [stitching, setStitching] = useState(false)

  useEffect(() => {
    return () => {
      if (drivingVideoPreview) {
        URL.revokeObjectURL(drivingVideoPreview)
      }
    }
  }, [drivingVideoPreview])

  const handleDrivingVideoChange = (file: File | null) => {
    setDrivingVideo(file)
    setDrivingVideoPreview(file ? URL.createObjectURL(file) : null)
  }

  const canGenerate = Boolean(imageUrl) && !isGenerating
  const selectedProvider = useMemo(
    () =>
      providerName === 'liveportrait' || providerName === 'live_portrait'
        ? createLivePortraitProvider(livePortraitRuntimeConfig)
        : getAnimationProvider(providerName),
    [livePortraitRuntimeConfig, providerName],
  )
  const livePortraitHealth = useMemo(
    () => checkLivePortraitRuntime(livePortraitRuntimeConfig),
    [livePortraitRuntimeConfig],
  )
  const livePortraitInput = useMemo(
    () => ({
      sourceAssetId: 'current-wallpaper',
      sourceImageUrl: imageUrl ?? '<source-image>',
      preset:
        MOTION_TO_LIVEPORTRAIT_PRESET[motionType] ?? 'subtle_breathing',
      strength,
      duration,
      loop,
      drivingOption,
      drivingMultiplier,
      stitching,
    }),
    [drivingMultiplier, drivingOption, duration, imageUrl, loop, motionType, stitching, strength],
  )
  const commandPreview = useMemo(
    () => buildLivePortraitCommand(livePortraitInput, livePortraitRuntimeConfig),
    [livePortraitInput, livePortraitRuntimeConfig],
  )
  const providerStatus =
    providerName === 'mock'
      ? t('mockProviderAvailable')
      : providerName === 'liveportrait' || providerName === 'live_portrait'
        ? livePortraitHealth.available
          ? t('livePortraitExperimental')
          : livePortraitHealth.message
        : t('comingSoon')

  const handleRuntimeConfigChange = (patch: Partial<RuntimeConfig>) => {
    setLivePortraitRuntimeConfig(
      updateRuntimeConfig('liveportrait', patch),
    )
  }

  const handleRuntimeConfigReset = () => {
    setLivePortraitRuntimeConfig(resetRuntimeConfig('liveportrait'))
    setHostHealth(null)
    setHostHealthStatus('')
  }

  const handleCheckHost = async () => {
    setHostHealthStatus(t('checkingHost'))
    const result = await checkRuntimeHostHealth(
      livePortraitRuntimeConfig.runtimeHostUrl,
      livePortraitRuntimeConfig.runtimeHostToken,
    )

    if (result.ok && result.data) {
      setHostHealth(result.data)
      setHostHealthStatus(t('runtimeHostAvailable'))
      return
    }

    setHostHealth({
      ok: false,
      error: result.error ?? t('runtimeHostUnavailable'),
    })
    setHostHealthStatus(result.error ?? t('runtimeHostUnavailable'))
  }

  const handleGenerate = async () => {
    if (!imageUrl || isGenerating) {
      return
    }

    setIsGenerating(true)
    setJobStatus('queued')
    setStatus(t('motionGenerating'))
    const runningTimer = globalThis.setTimeout(() => {
      setJobStatus('running')
    }, 120)

    try {
      const isLivePortrait =
        providerName === 'liveportrait' || providerName === 'live_portrait'
      let result

      if (isLivePortrait) {
        if (!drivingVideo) {
          setJobStatus('failed')
          setStatus(t('drivingVideoRequired'))
          return
        }

        setStatus(t('uploadingRuntimeAssets'))
        const sourceBlob = await fetch(imageUrl).then((response) => response.blob())
        const [sourceUpload, drivingUpload] = await Promise.all([
          uploadRuntimeAsset(
            sourceBlob,
            'sourceImage',
            livePortraitRuntimeConfig.runtimeHostUrl,
            livePortraitRuntimeConfig.runtimeHostToken,
          ),
          uploadRuntimeAsset(
            drivingVideo,
            'drivingVideo',
            livePortraitRuntimeConfig.runtimeHostUrl,
            livePortraitRuntimeConfig.runtimeHostToken,
          ),
        ])

        if (!sourceUpload.data || !drivingUpload.data) {
          setJobStatus('failed')
          setStatus(
            sourceUpload.error ??
              drivingUpload.error ??
              t('runtimeAssetUploadFailed'),
          )
          return
        }

        setStatus(t('motionGenerating'))
        result = await createLivePortraitProvider(
          livePortraitRuntimeConfig,
        ).generate({
          ...livePortraitInput,
          preset: 'custom_driving_video',
          sourceImageUrl: undefined,
          sourceImagePath: sourceUpload.data.asset.path,
          drivingVideoPath: drivingUpload.data.asset.path,
        })
      } else {
        result = await selectedProvider.generate({
          imageUrl,
          targetType,
          motionType,
          strength,
          loop,
          duration,
          provider: providerName,
        })
      }

      if (result.status !== 'completed' || !result.motionSpec) {
        setJobStatus('failed')
        setStatus(result.errorMessage ?? t('motionGenerateFailed'))
        return
      }

      const nextLayer: MotionLayer =
        result.motionLayer ?? {
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

      const isFallback = Boolean(
        nextLayer.params?.fallback ?? result.motionSpec.metadata.fallback,
      )

      setLayers((currentLayers) => [nextLayer, ...currentLayers])
      setJobStatus(isFallback ? 'fallback' : 'completed')
      setStatus(result.errorMessage ?? t('motionLayerCreated'))
    } finally {
      globalThis.clearTimeout(runningTimer)
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
        <small className="motion-provider-status">{providerStatus}</small>
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

      {(providerName === 'liveportrait' || providerName === 'live_portrait') && (
        <>
          <RuntimeSettingsPanel
            config={livePortraitRuntimeConfig}
            health={livePortraitHealth}
            commandPreview={commandPreview}
            hostHealth={hostHealth}
            hostHealthStatus={hostHealthStatus}
            onChange={handleRuntimeConfigChange}
            onReset={handleRuntimeConfigReset}
            onCheckHost={handleCheckHost}
          />
          <section className="liveportrait-driving-panel">
            <h3>{t('drivingVideo')}</h3>
            <label className="reference-image-upload">
              <span>{drivingVideo?.name ?? t('chooseDrivingVideo')}</span>
              <input
                className="upload-input"
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(event) =>
                  handleDrivingVideoChange(event.target.files?.[0] ?? null)
                }
              />
            </label>
            {drivingVideoPreview && (
              <video
                className="motion-layer-video-preview"
                src={drivingVideoPreview}
                controls
                muted
                loop
              />
            )}
            <label className="inspector-field">
              <span>{t('drivingMode')}</span>
              <select
                value={drivingOption}
                onChange={(event) =>
                  setDrivingOption(
                    event.target.value as
                      | 'expression-friendly'
                      | 'pose-friendly',
                  )
                }
              >
                <option value="pose-friendly">pose-friendly</option>
                <option value="expression-friendly">expression-friendly</option>
              </select>
            </label>
            <label className="inspector-field">
              <span>{t('drivingMultiplier')}</span>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={drivingMultiplier}
                onChange={(event) =>
                  setDrivingMultiplier(Number(event.target.value))
                }
              />
              <output>{drivingMultiplier.toFixed(2)}</output>
            </label>
            <label className="inspector-toggle">
              <input
                type="checkbox"
                checked={stitching}
                onChange={(event) => setStitching(event.target.checked)}
              />
              <span>{t('stitching')}</span>
            </label>
          </section>
        </>
      )}

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
      {jobStatus !== 'idle' && (
        <p className={`motion-job-status status-${jobStatus}`}>
          {t('runtimeJobStatus')}: {t(jobStatus)}
        </p>
      )}
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
                  {layer.targetType} ・ {layer.provider}
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
                {Boolean(layer.params?.dryRun) && (
                  <div>
                    <dt>{t('dryRun')}</dt>
                    <dd>{t('planned')}</dd>
                  </div>
                )}
                {Boolean(layer.params?.realRun) && (
                  <div>
                    <dt>{t('realRun')}</dt>
                    <dd>{t('completed')}</dd>
                  </div>
                )}
                {formatCommandPlanSummary(layer.params?.commandPlan) && (
                  <div className="motion-layer-plan">
                    <dt>{t('commandPlan')}</dt>
                    <dd>{formatCommandPlanSummary(layer.params?.commandPlan)}</dd>
                  </div>
                )}
                {formatOutputPlanSummary(layer.params?.outputPlan) && (
                  <div className="motion-layer-plan">
                    <dt>{t('outputPlan')}</dt>
                    <dd>{formatOutputPlanSummary(layer.params?.outputPlan)}</dd>
                  </div>
                )}
                {formatExecutionResultSummary(layer.params?.executionResult) && (
                  <div className="motion-layer-plan">
                    <dt>{t('executionResult')}</dt>
                    <dd>
                      {formatExecutionResultSummary(
                        layer.params?.executionResult,
                      )}
                    </dd>
                  </div>
                )}
                {typeof layer.params?.importStatus === 'string' && (
                  <div>
                    <dt>{t('importStatus')}</dt>
                    <dd>{formatImportStatusLabel(layer.params.importStatus, t)}</dd>
                  </div>
                )}
                {getRuntimeOutputAssetSummary(layer.params?.runtimeOutputAsset) && (
                  <div className="motion-layer-plan">
                    <dt>{t('runtimeOutputAsset')}</dt>
                    <dd>
                      {getRuntimeOutputAssetSummary(
                        layer.params?.runtimeOutputAsset,
                      )}
                    </dd>
                  </div>
                )}
              </dl>
              {layer.preview?.videoUrl && (
                <video
                  className="motion-layer-video-preview"
                  src={layer.preview.videoUrl}
                  controls
                  muted
                  loop
                />
              )}
            </article>
          ))
        )}
      </div>
    </section>
  )
}
