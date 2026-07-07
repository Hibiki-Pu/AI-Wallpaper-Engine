import type {
  RuntimeJob,
  RuntimeJobError,
  RuntimeJobInput,
  RuntimeJobOutput,
  RuntimeJobStatus,
} from '../types/RuntimeJob'

const runtimeJobs = new Map<string, RuntimeJob>()

const createRuntimeJobId = () =>
  `runtime-job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const now = () => new Date().toISOString()

export function createRuntimeJob(input: RuntimeJobInput): RuntimeJob {
  const timestamp = now()
  const job: RuntimeJob = {
    id: createRuntimeJobId(),
    status: 'idle',
    input,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  runtimeJobs.set(job.id, job)
  return job
}

export function updateRuntimeJobStatus(
  jobId: string,
  status: RuntimeJobStatus,
): RuntimeJob | null {
  const job = runtimeJobs.get(jobId)

  if (!job) {
    return null
  }

  const timestamp = now()
  const nextJob: RuntimeJob = {
    ...job,
    status,
    updatedAt: timestamp,
    startedAt: status === 'running' ? job.startedAt ?? timestamp : job.startedAt,
    completedAt:
      status === 'completed' || status === 'failed' || status === 'cancelled'
        ? timestamp
        : job.completedAt,
  }

  runtimeJobs.set(jobId, nextJob)
  return nextJob
}

export function completeRuntimeJob(
  jobId: string,
  output: RuntimeJobOutput,
): RuntimeJob | null {
  const job = updateRuntimeJobStatus(jobId, 'completed')

  if (!job) {
    return null
  }

  const nextJob: RuntimeJob = {
    ...job,
    output,
    updatedAt: now(),
  }

  runtimeJobs.set(jobId, nextJob)
  return nextJob
}

export function failRuntimeJob(
  jobId: string,
  error: RuntimeJobError,
): RuntimeJob | null {
  const job = updateRuntimeJobStatus(jobId, 'failed')

  if (!job) {
    return null
  }

  const nextJob: RuntimeJob = {
    ...job,
    error,
    updatedAt: now(),
  }

  runtimeJobs.set(jobId, nextJob)
  return nextJob
}

export function getRuntimeJob(jobId: string): RuntimeJob | null {
  return runtimeJobs.get(jobId) ?? null
}

export function listRuntimeJobs(): RuntimeJob[] {
  return [...runtimeJobs.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
}
