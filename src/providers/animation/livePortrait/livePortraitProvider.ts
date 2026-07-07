import type { AnimationProvider } from '../baseAnimationProvider'

export const livePortraitProvider: AnimationProvider = {
  name: 'live_portrait',
  async generate() {
    // TODO: Future integration point for a backend LivePortrait service.
    // The frontend should send a source image and an idle motion preset.
    // The backend can return either an animated asset URL or a portable motion spec.
    return {
      provider: 'live_portrait',
      status: 'failed',
      outputType: 'none',
      errorMessage:
        'LivePortrait provider is reserved for a future backend integration.',
    }
  },
}
