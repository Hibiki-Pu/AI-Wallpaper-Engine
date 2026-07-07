import type { MotionLayer } from '../../../types/MotionLayer'
import type {
  LivePortraitHealthStatus,
  LivePortraitInput,
  LivePortraitOutput,
  LivePortraitRuntimeConfig,
} from './livePortraitTypes'

export const DEFAULT_LIVEPORTRAIT_RUNTIME_CONFIG: LivePortraitRuntimeConfig = {
  mode: 'disabled',
  enabled: false,
}

export function checkLivePortraitRuntime(
  config: LivePortraitRuntimeConfig = DEFAULT_LIVEPORTRAIT_RUNTIME_CONFIG,
): LivePortraitHealthStatus {
  if (!config.enabled || config.mode === 'disabled') {
    return {
      available: false,
      mode: 'disabled',
      message: 'Runtime not configured',
      runtimePath: config.runtimePath,
      missingRequirements: ['runtime mode', 'runtime path or service url'],
    }
  }

  return {
    available: false,
    mode: config.mode,
    message:
      'Runtime bridge is configured but execution is disabled in the frontend adapter.',
    runtimePath: config.runtimePath,
    missingRequirements: ['backend runtime bridge'],
  }
}

export function validateLivePortraitInput(input: LivePortraitInput): string[] {
  const errors: string[] = []

  if (!input.sourceAssetId) {
    errors.push('sourceAssetId is required')
  }

  if (!input.sourceImagePath && !input.sourceImageUrl) {
    errors.push('sourceImagePath or sourceImageUrl is required')
  }

  if (input.strength < 0 || input.strength > 1) {
    errors.push('strength must be between 0 and 1')
  }

  if (input.duration <= 0) {
    errors.push('duration must be greater than 0')
  }

  if (
    input.preset === 'custom_driving_video' &&
    !input.drivingVideoPath &&
    !input.drivingVideoUrl
  ) {
    errors.push('custom_driving_video requires a driving video')
  }

  return errors
}

export function buildLivePortraitCommand(
  input: LivePortraitInput,
  config: LivePortraitRuntimeConfig = DEFAULT_LIVEPORTRAIT_RUNTIME_CONFIG,
): string[] {
  const executable =
    config.mode === 'docker'
      ? 'docker'
      : config.runtimePath || 'liveportrait'

  const args = [
    executable,
    '--source',
    input.sourceImagePath ?? input.sourceImageUrl ?? '',
    '--preset',
    input.preset,
    '--strength',
    String(input.strength),
    '--duration',
    String(input.duration),
  ]

  if (input.loop) {
    args.push('--loop')
  }

  if (input.drivingVideoPath || input.drivingVideoUrl) {
    args.push('--driving', input.drivingVideoPath ?? input.drivingVideoUrl ?? '')
  }

  if (input.motionTemplateId) {
    args.push('--motion-template', input.motionTemplateId)
  }

  return args
}

export function normalizeLivePortraitOutput(
  rawOutput: Partial<LivePortraitOutput> | null | undefined,
  input: LivePortraitInput,
): LivePortraitOutput {
  const motionLayer: MotionLayer = rawOutput?.motionLayer ?? {
    id: `liveportrait-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `LivePortrait ${input.preset.replaceAll('_', ' ')}`,
    targetType: 'portrait',
    motionType: input.preset,
    provider: 'liveportrait',
    visible: true,
    strength: input.strength,
    loop: input.loop,
    duration: input.duration,
    params: {
      providerId: 'liveportrait',
      preset: input.preset,
      strength: input.strength,
      duration: input.duration,
      loop: input.loop,
      sourceAssetId: input.sourceAssetId,
      drivingVideoPath: input.drivingVideoPath,
      drivingVideoUrl: input.drivingVideoUrl,
      motionTemplateId: input.motionTemplateId,
    },
  }

  return {
    motionLayer,
    previewVideoUrl: rawOutput?.previewVideoUrl,
    metadata: {
      providerId: 'liveportrait',
      preset: input.preset,
      ...rawOutput?.metadata,
    },
  }
}
