export type RuntimeMode =
  | 'disabled'
  | 'mock'
  | 'localCli'
  | 'localService'
  | 'docker'

export interface RuntimePathConfig {
  runtimePath?: string
  pythonCommand?: string
  entryFile?: string
  outputDir?: string
}

export interface RuntimeConfig extends RuntimePathConfig {
  providerId: string
  mode: RuntimeMode
  runtimeHostUrl?: string
  runtimeHostToken?: string
  dryRun?: boolean
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface RuntimeRequirement {
  id: string
  label: string
  status: 'satisfied' | 'missing' | 'unable_to_check' | 'reserved'
  message: string
}

export interface RuntimeHealthCheckResult {
  providerId: string
  available: boolean
  mode: RuntimeMode
  status: 'available' | 'unavailable' | 'unable_to_check'
  message: string
  requirements: RuntimeRequirement[]
  runtimePath?: string
  checkedAt: string
}
