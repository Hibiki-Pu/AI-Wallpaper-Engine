import type { MotionLayer } from '../../../types/MotionLayer'
import type { RuntimeJobInput } from '../../../types/RuntimeJob'
import type {
  RuntimeRequirement,
} from '../../../types/RuntimeConfig'
import type {
  LivePortraitCommandPreview,
  LivePortraitHealthStatus,
  LivePortraitInput,
  LivePortraitOutput,
  LivePortraitRuntimeConfig,
} from './livePortraitTypes'

export const DEFAULT_LIVEPORTRAIT_RUNTIME_CONFIG: LivePortraitRuntimeConfig = {
  providerId: 'liveportrait',
  mode: 'disabled',
  enabled: false,
  runtimePath: '',
  pythonCommand: 'python',
  entryFile: 'inference.py',
  outputDir: '',
  runtimeHostUrl: 'http://127.0.0.1:8787',
  runtimeHostToken: '',
  executionMode: 'dryRun',
  dryRun: true,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
}

const now = () => new Date().toISOString()

const hasBrowserFileSystemAccess = () => false

const createRequirement = (
  id: string,
  label: string,
  status: RuntimeRequirement['status'],
  message: string,
): RuntimeRequirement => ({
  id,
  label,
  status,
  message,
})

export function checkLivePortraitRuntime(
  config: LivePortraitRuntimeConfig = DEFAULT_LIVEPORTRAIT_RUNTIME_CONFIG,
): LivePortraitHealthStatus {
  const requirements: RuntimeRequirement[] = []
  const enabled = Boolean(config.enabled) && config.mode !== 'disabled'
  const requiresLocalPaths =
    config.mode === 'localCli' || config.mode === 'docker'
  const requiresPython = config.mode === 'localCli' || config.mode === 'docker'
  const requiresOutput = config.mode !== 'disabled' && config.mode !== 'mock'

  requirements.push(
    createRequirement(
      'mode',
      'Runtime mode enabled',
      enabled ? 'satisfied' : 'missing',
      enabled ? `Mode: ${config.mode}` : 'Runtime mode is disabled.',
    ),
  )

  requirements.push(
    createRequirement(
      'runtimePath',
      'Runtime path configured',
      !requiresLocalPaths
        ? 'reserved'
        : config.runtimePath
          ? 'unable_to_check'
          : 'missing',
      !requiresLocalPaths
        ? 'Not required for this runtime mode.'
        : config.runtimePath
          ? 'Runtime path is configured, but browser cannot verify local paths.'
          : 'Runtime path is required for local CLI or Docker mode.',
    ),
  )

  requirements.push(
    createRequirement(
      'entryFile',
      'Entry file configured',
      !requiresPython
        ? 'reserved'
        : config.entryFile
          ? 'unable_to_check'
          : 'missing',
      !requiresPython
        ? 'Not required for this runtime mode.'
        : config.entryFile
          ? 'Entry file is configured, but browser cannot verify local files.'
          : 'Entry file is required, for example inference.py.',
    ),
  )

  requirements.push(
    createRequirement(
      'pythonCommand',
      'Python command configured',
      !requiresPython
        ? 'reserved'
        : config.pythonCommand
          ? 'satisfied'
          : 'missing',
      !requiresPython
        ? 'Not required for this runtime mode.'
        : config.pythonCommand
          ? `Python command: ${config.pythonCommand}`
          : 'Python command is required for local CLI mode.',
    ),
  )

  requirements.push(
    createRequirement(
      'outputDir',
      'Output directory configured',
      !requiresOutput
        ? 'reserved'
        : config.outputDir
          ? 'unable_to_check'
          : 'missing',
      !requiresOutput
        ? 'Not required for this runtime mode.'
        : config.outputDir
          ? 'Output directory is configured, but browser cannot verify local paths.'
          : 'Output directory is required for generated preview assets.',
    ),
  )

  requirements.push(
    createRequirement(
      'ffmpeg',
      'FFmpeg requirement',
      'reserved',
      'Reserved for Sprint 21 runtime checks.',
    ),
  )

  requirements.push(
    createRequirement(
      'pretrainedWeights',
      'Pretrained weights',
      'reserved',
      'Reserved for Sprint 21 runtime checks.',
    ),
  )

  const missingRequirements = requirements.filter(
    (requirement) => requirement.status === 'missing',
  )
  const unableToCheckRequirements = requirements.filter(
    (requirement) => requirement.status === 'unable_to_check',
  )

  if (missingRequirements.length > 0) {
    return {
      providerId: 'liveportrait',
      available: false,
      mode: config.mode,
      status: 'unavailable',
      message: 'Runtime not configured',
      runtimePath: config.runtimePath,
      checkedAt: now(),
      requirements,
    }
  }

  if (config.mode === 'localService') {
    return {
      providerId: 'liveportrait',
      available: false,
      mode: config.mode,
      status: 'unable_to_check',
      message:
        'Runtime Host health must be checked through the Runtime Host client.',
      runtimePath: config.runtimePath,
      checkedAt: now(),
      requirements,
    }
  }

  if (
    config.mode !== 'mock' &&
    !hasBrowserFileSystemAccess() &&
    unableToCheckRequirements.length > 0
  ) {
    return {
      providerId: 'liveportrait',
      available: false,
      mode: config.mode,
      status: 'unable_to_check',
      message:
        'Runtime config is present, but browser cannot verify local file paths.',
      runtimePath: config.runtimePath,
      checkedAt: now(),
      requirements,
    }
  }

  return {
    providerId: 'liveportrait',
    available: true,
    mode: config.mode,
    status: 'available',
    message: 'Runtime configuration is available.',
    runtimePath: config.runtimePath,
    checkedAt: now(),
    requirements,
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
    input.drivingMultiplier !== undefined &&
    (input.drivingMultiplier < 0.5 || input.drivingMultiplier > 2)
  ) {
    errors.push('drivingMultiplier must be between 0.5 and 2')
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
): LivePortraitCommandPreview {
  if (config.mode === 'docker') {
    const args = [
      'run',
      '--rm',
      '-v',
      `${config.runtimePath || '<runtime-path>'}:/workspace`,
      'liveportrait-runtime',
      config.pythonCommand || 'python',
      config.entryFile || 'inference.py',
    ]

    return {
      command: 'docker',
      args: appendLivePortraitArgs(args, input, config),
      cwd: config.runtimePath || undefined,
    }
  }

  const args = [config.entryFile || 'inference.py']

  return {
    command: config.pythonCommand || 'python',
    args: appendLivePortraitArgs(args, input, config),
    cwd: config.runtimePath || undefined,
  }
}

const appendLivePortraitArgs = (
  args: string[],
  input: LivePortraitInput,
  config: LivePortraitRuntimeConfig,
) => {
  const nextArgs = [
    ...args,
    '--source',
    input.sourceImagePath ?? input.sourceImageUrl ?? '<source-image>',
    '--output-dir',
    config.outputDir || '<output-dir>',
    '--driving-option',
    input.drivingOption ?? 'expression-friendly',
    '--driving-multiplier',
    String(input.drivingMultiplier ?? 1),
    input.stitching === false ? '--no-flag-stitching' : '--flag-stitching',
  ]

  if (input.drivingVideoPath || input.drivingVideoUrl) {
    nextArgs.push(
      '--driving',
      input.drivingVideoPath ?? input.drivingVideoUrl ?? '',
    )
  }

  if (input.motionTemplateId) {
    nextArgs.push('--motion-template', input.motionTemplateId)
  }

  return nextArgs
}

export function buildLivePortraitRuntimeJobInput(
  input: LivePortraitInput,
  config: LivePortraitRuntimeConfig = DEFAULT_LIVEPORTRAIT_RUNTIME_CONFIG,
): RuntimeJobInput {
  const executionMode =
    config.executionMode ?? (config.dryRun ? 'dryRun' : 'mock')
  const shouldUseRuntimeHost =
    (executionMode === 'dryRun' || executionMode === 'realRun') &&
    (config.mode === 'localCli' || config.mode === 'localService')

  return {
    providerId: 'liveportrait',
    providerKind: 'portrait-motion',
    runtimeMode:
      config.mode === 'disabled'
        ? 'disabled'
        : shouldUseRuntimeHost
          ? 'localService'
          : config.mode,
    mode: executionMode,
    payload: {
      ...input,
      commandPreview: buildLivePortraitCommand(input, config),
      runtimeHostUrl: config.runtimeHostUrl,
    },
    runtimeConfig: {
      mode: config.mode,
      runtimePath: config.runtimePath,
      pythonCommand: config.pythonCommand,
      entryFile: config.entryFile,
      outputDir: config.outputDir,
    },
    metadata: {
      sourceAssetId: input.sourceAssetId,
      preset: input.preset,
      dryRun: executionMode === 'dryRun',
      realRun: executionMode === 'realRun',
    },
  }
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
      drivingOption: input.drivingOption,
      drivingMultiplier: input.drivingMultiplier,
      stitching: input.stitching,
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
