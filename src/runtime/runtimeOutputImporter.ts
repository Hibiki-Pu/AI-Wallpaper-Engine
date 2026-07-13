import type { RuntimeJob } from '../types/RuntimeJob'
import type {
  RuntimeOutputAsset,
  RuntimeOutputImportPlan,
  RuntimeOutputImportResult,
  RuntimeOutputImportStatus,
  RuntimeOutputMetadataResponse,
} from '../types/RuntimeOutputImport'
import {
  checkRuntimeOutputAvailability as checkHostRuntimeOutputAvailability,
  getRuntimeOutputVideoUrl,
} from './runtimeHostClient'

const now = () => new Date().toISOString()

const getOutputPlan = (job: RuntimeJob) =>
  (job.output?.payload?.outputPlan ?? job.output?.metadata?.outputPlan) as
    | Record<string, unknown>
    | undefined

const getOutputPath = (outputPlan?: Record<string, unknown>) =>
  typeof outputPlan?.runtimeOutputPath === 'string'
    ? outputPlan.runtimeOutputPath
    : undefined

export function createRuntimeOutputImportPlan(
  job: RuntimeJob,
): RuntimeOutputImportPlan {
  const timestamp = now()
  const outputPlan = getOutputPlan(job)

  return {
    jobId: job.id,
    providerId: job.input.providerId,
    expectedAssetType: 'video',
    runtimeOutputPath: getOutputPath(outputPlan),
    outputPlan,
    assetImportStatus: 'planned',
    previewVideoUrl: undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export async function checkRuntimeOutputAvailability(
  jobId: string,
  hostUrl?: string,
  token?: string,
) {
  return checkHostRuntimeOutputAvailability(jobId, hostUrl, token)
}

export function normalizeRuntimeOutputAsset(
  outputMetadata: RuntimeOutputMetadataResponse,
): RuntimeOutputAsset | undefined {
  if (outputMetadata.status !== 'available' || !outputMetadata.asset?.url) {
    return undefined
  }

  return {
    assetId: `runtime-output-${outputMetadata.jobId}`,
    type: 'video',
    source: 'runtime-output',
    providerId: outputMetadata.providerId,
    runtimeJobId: outputMetadata.jobId,
    name: 'LivePortrait Generated Motion',
    url: outputMetadata.asset.url,
    mimeType: outputMetadata.asset.mimeType,
    localPath:
      typeof outputMetadata.outputPlan?.runtimeOutputPath === 'string'
        ? outputMetadata.outputPlan.runtimeOutputPath
        : undefined,
    metadata: {
      generatedBy: outputMetadata.providerId,
      intermediateAsset: true,
      finalWallpaperFormat: false,
      outputPlan: outputMetadata.outputPlan,
    },
  }
}

const mapMetadataStatus = (
  status: RuntimeOutputMetadataResponse['status'],
): RuntimeOutputImportStatus => {
  if (status === 'available') {
    return 'imported'
  }

  return status
}

export async function importRuntimeOutputAsAsset(
  job: RuntimeJob,
  hostUrl?: string,
  token?: string,
): Promise<RuntimeOutputImportResult> {
  const plan = createRuntimeOutputImportPlan(job)
  const dryRun = Boolean(job.output?.payload?.dryRun ?? job.output?.metadata?.dryRun)
  const realRun = Boolean(job.output?.payload?.realRun ?? job.output?.metadata?.realRun)

  if (dryRun) {
    return {
      status: 'planned',
      plan: {
        ...plan,
        assetImportStatus: 'planned',
        updatedAt: now(),
      },
    }
  }

  if (!realRun) {
    return {
      status: 'skipped',
      plan: {
        ...plan,
        assetImportStatus: 'skipped',
        updatedAt: now(),
      },
    }
  }

  if (job.status === 'failed') {
    return {
      status: 'failed',
      plan: {
        ...plan,
        assetImportStatus: 'failed',
        updatedAt: now(),
      },
      error: job.error?.message ?? 'Runtime job failed.',
    }
  }

  const availability = await checkRuntimeOutputAvailability(job.id, hostUrl, token)

  if (!availability.ok || !availability.data) {
    return {
      status: 'failed',
      plan: {
        ...plan,
        assetImportStatus: 'failed',
        updatedAt: now(),
      },
      error: availability.error ?? 'Runtime output availability check failed.',
    }
  }

  const asset = normalizeRuntimeOutputAsset(availability.data)
  const status = mapMetadataStatus(availability.data.status)

  return {
    status,
    plan: {
      ...plan,
      assetImportStatus: status,
      previewVideoUrl: asset?.url ?? getRuntimeOutputVideoUrl(job.id, hostUrl),
      updatedAt: now(),
    },
    asset,
    error: status === 'missing' ? 'Runtime output video file is missing.' : undefined,
  }
}