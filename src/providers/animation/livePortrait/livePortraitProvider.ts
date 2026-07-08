import type { AnimationProvider } from '../baseAnimationProvider'
import type {
  AnimationProviderManifest,
  AnimationRequest,
  AnimationResult,
  MotionSpec,
} from '../../../types/AnimationProvider'
import {
  DEFAULT_LIVEPORTRAIT_RUNTIME_CONFIG,
  buildLivePortraitRuntimeJobInput,
  checkLivePortraitRuntime,
  normalizeLivePortraitOutput,
  validateLivePortraitInput,
} from './livePortraitRuntimeBridge'
import {
  createRuntimeJob,
  failRuntimeJob,
} from '../../../runtime/runtimeJobManager'
import {
  checkRuntimeHealth,
  submitRuntimeJob,
} from '../../../runtime/localRuntimeBridge'
import { checkRuntimeHostHealth } from '../../../runtime/runtimeHostClient'
import type {
  LivePortraitInput,
  LivePortraitMotionPreset,
  LivePortraitRuntimeConfig,
} from './livePortraitTypes'

export const livePortraitProviderManifest: AnimationProviderManifest = {
  id: 'liveportrait',
  name: 'LivePortrait',
  kind: 'portrait-motion',
  status: 'experimental',
  runtime: 'disabled',
  requiresExternalRuntime: true,
  supportedInputs: ['sourceImage', 'drivingVideo', 'motionTemplate'],
  supportedOutputs: ['motionLayer', 'previewVideo', 'metadata'],
}

const MOTION_TO_PRESET: Record<string, LivePortraitMotionPreset> = {
  idle_breathing: 'subtle_breathing',
  blink: 'blink',
  gentle_head_motion: 'slight_head_turn',
}

const toLivePortraitInput = (
  request: AnimationRequest | LivePortraitInput,
): LivePortraitInput => {
  if ('preset' in request) {
    return request
  }

  return {
    sourceAssetId: 'current-wallpaper',
    sourceImageUrl: request.imageUrl,
    preset: MOTION_TO_PRESET[request.motionType] ?? 'subtle_breathing',
    strength: request.strength,
    duration: request.duration,
    loop: request.loop,
  }
}

const toMotionSpec = (
  input: LivePortraitInput,
  metadata: Record<string, unknown>,
): MotionSpec => ({
  id: `liveportrait-motion-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`,
  targetType: 'portrait',
  motionType: input.preset,
  strength: input.strength,
  loop: input.loop,
  duration: input.duration,
  metadata,
})

export function createLivePortraitProvider(
  runtimeConfig: LivePortraitRuntimeConfig = DEFAULT_LIVEPORTRAIT_RUNTIME_CONFIG,
): AnimationProvider<AnimationRequest | LivePortraitInput> {
  return {
    id: 'liveportrait',
    name: 'liveportrait',
    displayName: 'LivePortrait',
    manifest: {
      ...livePortraitProviderManifest,
      runtime: runtimeConfig.mode,
    },
    async generate(
      request: AnimationRequest | LivePortraitInput,
    ): Promise<AnimationResult> {
      const input = toLivePortraitInput(request)
      const validationErrors = validateLivePortraitInput(input)

      if (validationErrors.length > 0) {
        return {
          provider: 'liveportrait',
          status: 'failed',
          outputType: 'none',
          errorMessage: validationErrors.join('; '),
        }
      }

      const runtimeJob = createRuntimeJob(
        buildLivePortraitRuntimeJobInput(input, runtimeConfig),
      )
      const staticHealth = checkLivePortraitRuntime(runtimeConfig)
      const executionMode =
        runtimeConfig.executionMode ?? (runtimeConfig.dryRun ? 'dryRun' : 'mock')
      const usesRuntimeHost =
        (executionMode === 'dryRun' || executionMode === 'realRun') &&
        (runtimeConfig.mode === 'localCli' ||
          runtimeConfig.mode === 'localService')
      const runtimeHealth =
        usesRuntimeHost
          ? await checkRuntimeHealth(
              'liveportrait',
              'localService',
              runtimeConfig.runtimeHostUrl,
              runtimeConfig.runtimeHostToken,
            )
          : null
      const hostHealth =
        usesRuntimeHost
          ? await checkRuntimeHostHealth(
              runtimeConfig.runtimeHostUrl,
              runtimeConfig.runtimeHostToken,
            )
          : null
      const health =
        usesRuntimeHost
          ? {
              ...staticHealth,
              ...(() => {
                const hasMissingRequirements = staticHealth.requirements.some(
                  (requirement) => requirement.status === 'missing',
                )
                const realExecutionDisabled =
                  executionMode === 'realRun' &&
                  !hostHealth?.data?.realExecutionEnabled

                return {
                  available:
                    Boolean(runtimeHealth?.available) &&
                    !hasMissingRequirements &&
                    !realExecutionDisabled,
                  status:
                    Boolean(runtimeHealth?.available) &&
                    !hasMissingRequirements &&
                    !realExecutionDisabled
                      ? 'available' as const
                      : 'unavailable' as const,
                  message:
                    hasMissingRequirements
                      ? staticHealth.message
                      : realExecutionDisabled
                        ? 'Real execution is disabled. Set RUNTIME_ENABLE_REAL_EXECUTION=true to enable it.'
                        : runtimeHealth?.message ?? staticHealth.message,
                }
              })(),
            }
          : staticHealth
      const commandPreview = buildLivePortraitRuntimeJobInput(
        input,
        runtimeConfig,
      ).payload.commandPreview
      const completedRuntimeJob = health.available
        ? await submitRuntimeJob(runtimeJob, {
            hostUrl: runtimeConfig.runtimeHostUrl,
            token: runtimeConfig.runtimeHostToken,
          })
        : failRuntimeJob(runtimeJob.id, {
            code: 'RUNTIME_UNAVAILABLE',
            message: health.message,
            recoverable: true,
          }) ?? runtimeJob
      const fallback = !health.available || completedRuntimeJob.status !== 'completed'
      const runtimeOutputMetadata = completedRuntimeJob.output?.metadata ?? {}
      const runtimeOutputPayload = completedRuntimeJob.output?.payload ?? {}
      const commandPlan =
        runtimeOutputMetadata.commandPlan ?? runtimeOutputPayload.commandPlan
      const outputPlan =
        runtimeOutputMetadata.outputPlan ?? runtimeOutputPayload.outputPlan
      const executionResult =
        runtimeOutputMetadata.executionResult ??
        runtimeOutputPayload.executionResult
      const dryRun = Boolean(
        executionMode === 'dryRun' ||
          runtimeOutputMetadata.dryRun ||
          runtimeOutputPayload.dryRun,
      )
      const realRun = Boolean(
        executionMode === 'realRun' ||
          runtimeOutputMetadata.realRun ||
          runtimeOutputPayload.realRun,
      )
      const metadata = {
        providerId: 'liveportrait',
        preset: input.preset,
        strength: input.strength,
        duration: input.duration,
        loop: input.loop,
        sourceAssetId: input.sourceAssetId,
        drivingVideoPath: input.drivingVideoPath,
        drivingVideoUrl: input.drivingVideoUrl,
        motionTemplateId: input.motionTemplateId,
        runtimeJobId: completedRuntimeJob.id,
        runtimeStatus: completedRuntimeJob.status,
        runtimeMode: health.mode,
        runtimeHostUrl: runtimeConfig.runtimeHostUrl,
        hostAvailable: Boolean(runtimeHealth?.available),
        realExecutionEnabled: Boolean(hostHealth?.data?.realExecutionEnabled),
        dryRun,
        realRun,
        commandPlan,
        outputPlan,
        executionResult,
        fallback,
        runtimeMessage: health.message,
        commandPreview,
      }
      const normalized = normalizeLivePortraitOutput(
        {
          metadata,
        },
        input,
      )
      normalized.motionLayer.params = {
        ...normalized.motionLayer.params,
        ...metadata,
      }
      const motionSpec = toMotionSpec(input, {
        ...metadata,
        runtimeJob: completedRuntimeJob,
        motionLayer: normalized.motionLayer,
      })

      return {
        provider: 'liveportrait',
        status: 'completed',
        outputType: 'motion_spec',
        previewUrl: normalized.previewVideoUrl,
        motionLayer: normalized.motionLayer,
        motionSpec,
        errorMessage: fallback ? health.message : undefined,
      }
    },
  }
}

export const livePortraitProvider = createLivePortraitProvider()
