import type {
  AnimationProviderName,
  AnimationProviderManifest,
  AnimationRequest,
  AnimationResult,
} from '../../types/AnimationProvider'

export interface AnimationProvider<TRequest = AnimationRequest> {
  id: AnimationProviderName
  name: AnimationProviderName
  displayName?: string
  manifest?: AnimationProviderManifest
  generate(request: TRequest): Promise<AnimationResult>
}
