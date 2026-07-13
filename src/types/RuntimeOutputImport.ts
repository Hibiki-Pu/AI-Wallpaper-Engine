export type RuntimeOutputImportStatus =
  | 'planned'
  | 'checking'
  | 'importing'
  | 'imported'
  | 'missing'
  | 'failed'
  | 'skipped'

export interface RuntimeOutputImportPlan {
  jobId: string
  providerId: string
  expectedAssetType: 'video'
  runtimeOutputPath?: string
  outputPlan?: Record<string, unknown>
  assetImportStatus: RuntimeOutputImportStatus
  previewVideoUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface RuntimeOutputAsset {
  assetId: string
  type: 'video'
  source: 'runtime-output'
  providerId: string
  runtimeJobId: string
  name: string
  url: string
  localPath?: string
  mimeType: string
  duration?: number
  width?: number
  height?: number
  metadata: Record<string, unknown>
}

export interface RuntimeOutputImportResult {
  status: RuntimeOutputImportStatus
  plan: RuntimeOutputImportPlan
  asset?: RuntimeOutputAsset
  error?: string
}

export interface RuntimeOutputMetadataResponse {
  ok: boolean
  jobId: string
  providerId: string
  status: 'planned' | 'available' | 'missing' | 'failed'
  outputPlan?: Record<string, unknown> | null
  asset?: {
    type: 'video'
    mimeType: 'video/mp4'
    filename: string
    url: string
  } | null
  error?: string
}