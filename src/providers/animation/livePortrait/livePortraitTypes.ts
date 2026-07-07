import type { MotionLayer } from '../../../types/MotionLayer'
import type {
  RuntimeConfig,
  RuntimeHealthCheckResult,
  RuntimeMode,
} from '../../../types/RuntimeConfig'

export type LivePortraitRuntimeMode = Exclude<RuntimeMode, 'mock'>

export type LivePortraitMotionPreset =
  | 'subtle_breathing'
  | 'blink'
  | 'slight_head_turn'
  | 'talking_head'
  | 'custom_driving_video'

export interface LivePortraitInput {
  sourceAssetId: string
  sourceImagePath?: string
  sourceImageUrl?: string
  preset: LivePortraitMotionPreset
  strength: number
  duration: number
  loop: boolean
  drivingVideoPath?: string
  drivingVideoUrl?: string
  motionTemplateId?: string
}

export interface LivePortraitOutput {
  motionLayer: MotionLayer
  previewVideoUrl?: string
  metadata: Record<string, unknown>
}

export interface LivePortraitRuntimeConfig extends RuntimeConfig {
  mode: RuntimeMode
  serviceUrl?: string
  dockerImage?: string
}

export type LivePortraitHealthStatus = RuntimeHealthCheckResult

export interface LivePortraitCommandPreview {
  command: string
  args: string[]
  cwd?: string
}
