import type { AnimationProvider } from './baseAnimationProvider'
import { mockAnimationProvider } from './mockAnimationProvider'
import { livePortraitProvider } from './livePortrait/livePortraitProvider'
import type { AnimationProviderName } from '../../types/AnimationProvider'

const PROVIDER_REGISTRY: Partial<Record<AnimationProviderName, AnimationProvider>> = {
  mock: mockAnimationProvider,
  liveportrait: livePortraitProvider as AnimationProvider,
  live_portrait: livePortraitProvider as AnimationProvider,
}

export function registerAnimationProvider(provider: AnimationProvider) {
  PROVIDER_REGISTRY[provider.id] = provider
  PROVIDER_REGISTRY[provider.name] = provider
}

export function getAnimationProvider(
  providerName: AnimationProviderName,
): AnimationProvider {
  return PROVIDER_REGISTRY[providerName] ?? mockAnimationProvider
}

export function getRegisteredAnimationProviders(): AnimationProvider[] {
  return [...new Set(Object.values(PROVIDER_REGISTRY))].filter(
    (provider): provider is AnimationProvider => Boolean(provider),
  )
}
