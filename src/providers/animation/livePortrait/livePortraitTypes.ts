import type { MotionLayer } from '../../../types/MotionLayer'

export type LivePortraitRuntimeMode =
  | 'localCli'
  | 'localService'
  | 'docker'
  | 'disabled'

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

export interface LivePortraitRuntimeConfig {
  mode: LivePortraitRuntimeMode
  runtimePath?: string
  serviceUrl?: string
  dockerImage?: string
  enabled?: boolean
}

export interface LivePortraitHealthStatus {
  available: boolean
  mode: LivePortraitRuntimeMode
  message: string
  version?: string
  runtimePath?: string
  missingRequirements?: string[]
}
