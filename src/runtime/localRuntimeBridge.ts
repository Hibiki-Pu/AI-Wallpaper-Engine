import {
  completeRuntimeJob,
  failRuntimeJob,
  getRuntimeJob,
  updateRuntimeJobStatus,
} from './runtimeJobManager'
import type { RuntimeJob } from '../types/RuntimeJob'

export interface RuntimeHealthStatus {
  available: boolean
  providerId: string
  mode: 'mock' | 'localCli' | 'localService' | 'docker' | 'disabled'
  message: string
  missingRequirements?: string[]
}

const sleep = (ms: number) =>
  new Promise((resolve) => globalThis.setTimeout(resolve, ms))

export function checkRuntimeHealth(providerId: string): RuntimeHealthStatus {
  if (providerId === 'mock') {
    return {
      available: true,
      providerId,
      mode: 'mock',
      message: 'Mock local runtime available',
    }
  }

  return {
    available: false,
    providerId,
    mode: 'disabled',
    message: 'Runtime not configured',
    missingRequirements: ['runtime configuration'],
  }
}

export async function submitRuntimeJob(job: RuntimeJob): Promise<RuntimeJob> {
  updateRuntimeJobStatus(job.id, 'queued')
  await sleep(80)

  const queuedJob = getRuntimeJob(job.id)

  if (!queuedJob || queuedJob.status === 'cancelled') {
    return queuedJob ?? job
  }

  updateRuntimeJobStatus(job.id, 'running')
  await sleep(140)

  const runningJob = getRuntimeJob(job.id)

  if (!runningJob || runningJob.status === 'cancelled') {
    return runningJob ?? job
  }

  return (
    completeRuntimeJob(job.id, {
      outputType: 'metadata',
      payload: {
        providerId: job.input.providerId,
        providerKind: job.input.providerKind,
        runtimeMode: job.input.runtimeMode,
      },
      metadata: {
        simulated: true,
        completedBy: 'localRuntimeBridge',
      },
    }) ?? job
  )
}

export function pollRuntimeJob(jobId: string): RuntimeJob | null {
  return getRuntimeJob(jobId)
}

export function cancelRuntimeJob(jobId: string): RuntimeJob | null {
  const job = getRuntimeJob(jobId)

  if (!job) {
    return null
  }

  if (job.status === 'completed' || job.status === 'failed') {
    return failRuntimeJob(jobId, {
      code: 'JOB_ALREADY_FINISHED',
      message: 'Cannot cancel a finished runtime job.',
      recoverable: false,
    })
  }

  return updateRuntimeJobStatus(jobId, 'cancelled')
}
