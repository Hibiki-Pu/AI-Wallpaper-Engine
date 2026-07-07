import type { AnimationProvider } from './baseAnimationProvider'
import type {
  AnimationRequest,
  AnimationResult,
  MotionSpec,
} from '../../types/AnimationProvider'

const createMotionId = () =>
  `motion-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const mockAnimationProvider: AnimationProvider = {
  id: 'mock',
  name: 'mock',
  displayName: 'Mock Provider',
  manifest: {
    id: 'mock',
    name: 'Mock Provider',
    kind: 'mock-motion',
    status: 'available',
    runtime: 'disabled',
    requiresExternalRuntime: false,
    supportedInputs: ['sourceImage'],
    supportedOutputs: ['motionLayer', 'metadata'],
  },
  async generate(request: AnimationRequest): Promise<AnimationResult> {
    const motionSpec: MotionSpec = {
      id: createMotionId(),
      targetType: request.targetType,
      motionType: request.motionType,
      strength: request.strength,
      loop: request.loop,
      duration: request.duration,
      metadata: {
        source: 'mockAnimationProvider',
        imageUrl: request.imageUrl,
        generatedAt: new Date().toISOString(),
      },
    }

    return {
      provider: 'mock',
      status: 'completed',
      outputType: 'motion_spec',
      motionSpec,
    }
  },
}
