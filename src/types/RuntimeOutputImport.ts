export type RuntimeOutputImportStatus =
  | 'planned'
  | 'importing'
  | 'imported'
  | 'failed'
  | 'skipped'

export interface RuntimeOutputAsset {
  id: string
  providerId: string
  type: 'previewVideo' | 'previewImage' | 'motionLayer' | 'metadata'
  path?: string
  url?: string | null
  filename?: string
  metadata?: Record<string, unknown>
}

export interface RuntimeOutputImportPlan {
  providerId: string
  runtimeJobId?: string
  status: RuntimeOutputImportStatus
  assets: RuntimeOutputAsset[]
  outputDir?: string
  notes?: string[]
}
