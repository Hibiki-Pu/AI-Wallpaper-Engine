import type { AnimationProvider } from './baseAnimationProvider'
import { mockAnimationProvider } from './mockAnimationProvider'
import { livePortraitProvider } from './livePortrait/livePortraitProvider'
import type { AnimationProviderName } from '../../types/AnimationProvider'

export function getAnimationProvider(
  providerName: AnimationProviderName,
): AnimationProvider {
  switch (providerName) {
    case 'live_portrait':
      return livePortraitProvider
    case 'depth_anything':
    case 'sam':
    case 'custom':
    case 'mock':
    default:
      return mockAnimationProvider
  }
}
