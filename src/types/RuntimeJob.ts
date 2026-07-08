export type RuntimeJobStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type RuntimeProviderKind =
  | 'animation'
  | 'portrait-motion'
  | 'depth'
  | 'segmentation'
  | 'custom'

export interface RuntimeJobInput {
  providerId: string
  providerKind: RuntimeProviderKind
  runtimeMode: 'localCli' | 'localService' | 'docker' | 'mock' | 'disabled'
  mode?: 'mock' | 'dryRun' | 'realRun'
  payload: Record<string, unknown>
  runtimeConfig?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface RuntimeJobOutput {
  outputType: 'motionLayer' | 'previewVideo' | 'metadata' | 'none'
  payload?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface RuntimeJobError {
  code: string
  message: string
  recoverable?: boolean
  details?: Record<string, unknown>
}

export interface RuntimeJob {
  id: string
  status: RuntimeJobStatus
  input: RuntimeJobInput
  output?: RuntimeJobOutput
  error?: RuntimeJobError
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
}
