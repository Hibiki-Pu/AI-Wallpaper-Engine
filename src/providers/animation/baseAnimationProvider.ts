import type {
  AnimationProviderName,
  AnimationRequest,
  AnimationResult,
} from '../../types/AnimationProvider'

export interface AnimationProvider {
  name: AnimationProviderName
  generate(request: AnimationRequest): Promise<AnimationResult>
}
