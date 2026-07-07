import type {
  AnimationProviderName,
  AnimationTargetType,
  MotionSpec,
} from './AnimationProvider'

export interface MotionLayer {
  id: string
  name: string
  targetType: AnimationTargetType
  motionType: string
  provider: AnimationProviderName
  visible: boolean
  strength: number
  loop: boolean
  duration: number
  motionSpec?: MotionSpec
}
