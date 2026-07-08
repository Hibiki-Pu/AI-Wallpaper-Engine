import {
  buildLivePortraitDryRunCommand,
  createLivePortraitOutputPlan,
  normalizeLivePortraitDryRunOutput,
  validateLivePortraitJobInput,
} from './providers/liveportrait/livePortraitHostAdapter.js'

const jobs = new Map()

const now = () => new Date().toISOString()

const createJobId = () =>
  `host-job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const toRuntimeJob = (input) => {
  const timestamp = now()

  return {
    id: createJobId(),
    status: 'queued',
    input,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

const updateStatus = (job, status) => {
  const timestamp = now()
  job.status = status
  job.updatedAt = timestamp

  if (status === 'running' && !job.startedAt) {
    job.startedAt = timestamp
  }

  if (['completed', 'failed', 'cancelled'].includes(status)) {
    job.completedAt = timestamp
  }
}

export function createRuntimeHostJob(requestBody) {
  const mode = requestBody.mode === 'dryRun' ? 'dryRun' : 'mock'
  const validation =
    mode === 'dryRun'
      ? validateLivePortraitJobInput(
          requestBody.input ?? {},
          requestBody.runtimeConfig ?? {},
        )
      : { ok: true, errors: [] }
  const job = toRuntimeJob({
    providerId: requestBody.providerId,
    providerKind: requestBody.providerKind,
    runtimeMode: 'localService',
    mode,
    payload: requestBody.input ?? {},
    runtimeConfig: requestBody.runtimeConfig,
    metadata: {
      receivedBy: 'ai-wallpaper-runtime-host',
      mode,
    },
  })

  jobs.set(job.id, job)

  if (!validation.ok) {
    updateStatus(job, 'failed')
    job.error = {
      code: 'LIVEPORTRAIT_DRY_RUN_VALIDATION_FAILED',
      message: validation.errors.join(' '),
      recoverable: true,
      details: {
        errors: validation.errors,
      },
    }
    return job
  }

  setTimeout(() => {
    const currentJob = jobs.get(job.id)

    if (!currentJob || currentJob.status === 'cancelled') {
      return
    }

    updateStatus(currentJob, 'running')
  }, 300)

  setTimeout(() => {
    const currentJob = jobs.get(job.id)

    if (!currentJob || currentJob.status === 'cancelled') {
      return
    }

    updateStatus(currentJob, 'completed')
    if (mode === 'dryRun') {
      const commandPlan = buildLivePortraitDryRunCommand(
        requestBody.input ?? {},
        requestBody.runtimeConfig ?? {},
      )
      const outputPlan = createLivePortraitOutputPlan(
        requestBody.input ?? {},
        requestBody.runtimeConfig ?? {},
        currentJob.id,
      )

      currentJob.output = normalizeLivePortraitDryRunOutput(
        currentJob,
        commandPlan,
        outputPlan,
      )
      return
    }

    currentJob.output = {
      outputType: 'metadata',
      payload: {
        previewVideoUrl: null,
        previewImageUrl: null,
        generatedAssetId: null,
        metadata: {
          mock: true,
          providerId: requestBody.providerId,
          message:
            'Mock runtime host completed without executing external model.',
          commandPreview: requestBody.input?.commandPreview,
        },
      },
      metadata: {
        mock: true,
        providerId: requestBody.providerId,
        commandPreview: requestBody.input?.commandPreview,
      },
    }
  }, 1200)

  return job
}

export function getRuntimeHostJob(jobId) {
  return jobs.get(jobId) ?? null
}

export function cancelRuntimeHostJob(jobId) {
  const job = jobs.get(jobId)

  if (!job) {
    return null
  }

  if (job.status === 'completed' || job.status === 'failed') {
    return job
  }

  updateStatus(job, 'cancelled')
  return job
}
