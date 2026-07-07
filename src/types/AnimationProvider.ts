export type AnimationProviderName =
  | 'mock'
  | 'live_portrait'
  | 'depth_anything'
  | 'sam'
  | 'custom'

export type AnimationTargetType =
  | 'portrait'
  | 'landscape'
  | 'object'
  | 'background'

export interface AnimationRequest {
  imageUrl: string
  targetType: AnimationTargetType
  motionType: string
  strength: number
  loop: boolean
  duration: number
  provider: AnimationProviderName
}

export interface MotionSpec {
  id: string
  targetType: AnimationTargetType
  motionType: string
  strength: number
  loop: boolean
  duration: number
  metadata: Record<string, unknown>
}

export interface AnimationResult {
  provider: AnimationProviderName
  status: 'idle' | 'processing' | 'completed' | 'failed'
  outputType: 'motion_spec' | 'preview_asset' | 'none'
  previewUrl?: string
  motionSpec?: MotionSpec
  errorMessage?: string
}
