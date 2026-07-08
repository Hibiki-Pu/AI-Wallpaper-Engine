import {
  completeRuntimeJob,
  failRuntimeJob,
  getRuntimeJob,
  updateRuntimeJobStatus,
} from './runtimeJobManager'
import type { RuntimeJob } from '../types/RuntimeJob'
import {
  checkRuntimeHostHealth,
  getRuntimeHostJob,
  submitRuntimeHostJob,
} from './runtimeHostClient'

export interface RuntimeHealthStatus {
  available: boolean
  providerId: string
  mode: 'mock' | 'localCli' | 'localService' | 'docker' | 'disabled'
  message: string
  missingRequirements?: string[]
}

const sleep = (ms: number) =>
  new Promise((resolve) => globalThis.setTimeout(resolve, ms))

export async function checkRuntimeHealth(
  providerId: string,
  mode: RuntimeHealthStatus['mode'] = providerId === 'mock' ? 'mock' : 'disabled',
  hostUrl?: string,
  token?: string,
): Promise<RuntimeHealthStatus> {
  if (providerId === 'mock') {
    return {
      available: true,
      providerId,
      mode: 'mock',
      message: 'Mock local runtime available',
    }
  }

  if (mode === 'localService') {
    const hostHealth = await checkRuntimeHostHealth(hostUrl, token)

    return {
      available: Boolean(hostHealth.ok && hostHealth.data?.ok),
      providerId,
      mode: 'localService',
      message:
        hostHealth.data?.ok
          ? 'Runtime Host available'
          : hostHealth.error ?? 'Runtime Host unavailable',
      missingRequirements:
        hostHealth.ok && hostHealth.data?.allowedProviders?.includes(providerId)
          ? undefined
          : ['runtime host'],
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

const pollHostJobUntilFinished = async (
  hostJobId: string,
  hostUrl?: string,
  token?: string,
  mode: RuntimeJob['input']['mode'] = 'mock',
) => {
  let currentJob: RuntimeJob | null = null
  const attempts = mode === 'realRun' ? 650 : 10
  const intervalMs = mode === 'realRun' ? 1000 : 250

  for (let index = 0; index < attempts; index += 1) {
    await sleep(index === 0 ? 0 : intervalMs)
    const result = await getRuntimeHostJob(hostJobId, hostUrl, token)

    if (!result.ok || !result.data?.job) {
      return null
    }

    currentJob = result.data.job

    if (
      currentJob.status === 'completed' ||
      currentJob.status === 'failed' ||
      currentJob.status === 'cancelled'
    ) {
      return currentJob
    }
  }

  return currentJob
}

export async function submitRuntimeJob(
  job: RuntimeJob,
  options?: {
    hostUrl?: string
    token?: string
  },
): Promise<RuntimeJob> {
  if (job.input.runtimeMode === 'localService') {
    const submittedJob = await submitRuntimeHostJob(
      job.input,
      options?.hostUrl,
      options?.token,
    )

    if (!submittedJob.ok || !submittedJob.data?.job) {
      return (
        failRuntimeJob(job.id, {
          code: 'RUNTIME_HOST_UNAVAILABLE',
          message: submittedJob.error ?? 'Runtime Host unavailable',
          recoverable: true,
        }) ?? job
      )
    }

    const hostJob = await pollHostJobUntilFinished(
      submittedJob.data.job.id,
      options?.hostUrl,
      options?.token,
      job.input.mode,
    )

    if (!hostJob) {
      return (
        failRuntimeJob(job.id, {
          code: 'RUNTIME_HOST_TIMEOUT',
          message: 'Runtime Host job did not complete in time.',
          recoverable: true,
        }) ?? job
      )
    }

    if (hostJob.status !== 'completed') {
      return (
        failRuntimeJob(job.id, {
          code: 'RUNTIME_HOST_JOB_FAILED',
          message: `Runtime Host job ${hostJob.status}.`,
          recoverable: true,
          details: {
            hostJob,
          },
        }) ?? job
      )
    }

    return (
      completeRuntimeJob(job.id, {
        outputType: 'metadata',
        payload: hostJob.output?.payload,
        metadata: {
          ...hostJob.output?.metadata,
          ...(hostJob.output?.payload?.commandPlan
            ? { commandPlan: hostJob.output.payload.commandPlan }
            : {}),
          ...(hostJob.output?.payload?.outputPlan
            ? { outputPlan: hostJob.output.payload.outputPlan }
            : {}),
          ...(hostJob.output?.payload?.dryRun !== undefined
            ? { dryRun: hostJob.output.payload.dryRun }
            : {}),
          runtimeHostJobId: hostJob.id,
          runtimeHostStatus: hostJob.status,
        },
      }) ?? job
    )
  }

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
