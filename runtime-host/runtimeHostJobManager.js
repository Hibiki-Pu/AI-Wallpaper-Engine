import {
  buildLivePortraitDryRunCommand,
  createLivePortraitOutputPlan,
  normalizeLivePortraitDryRunOutput,
  normalizeLivePortraitRealRunOutput,
  validateLivePortraitJobInput,
} from './providers/liveportrait/livePortraitHostAdapter.js'
import { executeCommandPlan } from './runtimeCommandExecutor.js'

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

export function createRuntimeHostJob(requestBody, options = {}) {
  const mode =
    requestBody.mode === 'realRun'
      ? 'realRun'
      : requestBody.mode === 'dryRun'
        ? 'dryRun'
        : 'mock'
  const validation =
    mode === 'dryRun' || mode === 'realRun'
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

  if (mode === 'realRun' && !options.realExecutionEnabled) {
    updateStatus(job, 'failed')
    job.error = {
      code: 'REAL_EXECUTION_DISABLED',
      message:
        'Real execution is disabled. Set RUNTIME_ENABLE_REAL_EXECUTION=true to enable it.',
      recoverable: true,
    }
    return job
  }

  if (!validation.ok) {
    updateStatus(job, 'failed')
    job.error = {
      code:
        mode === 'realRun'
          ? 'LIVEPORTRAIT_REAL_RUN_VALIDATION_FAILED'
          : 'LIVEPORTRAIT_DRY_RUN_VALIDATION_FAILED',
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

  setTimeout(async () => {
    const currentJob = jobs.get(job.id)

    if (!currentJob || currentJob.status === 'cancelled') {
      return
    }

    if (mode === 'dryRun' || mode === 'realRun') {
      const outputPlan = createLivePortraitOutputPlan(
        requestBody.input ?? {},
        requestBody.runtimeConfig ?? {},
        currentJob.id,
      )
      const commandPlan = buildLivePortraitDryRunCommand(
        requestBody.input ?? {},
        requestBody.runtimeConfig ?? {},
        outputPlan,
      )

      if (mode === 'dryRun') {
        updateStatus(currentJob, 'completed')
        currentJob.output = normalizeLivePortraitDryRunOutput(
          currentJob,
          commandPlan,
          outputPlan,
        )
        return
      }

      const executionResult = await executeCommandPlan(commandPlan)
      if (currentJob.status === 'cancelled') {
        return
      }

      updateStatus(currentJob, executionResult.ok ? 'completed' : 'failed')
      currentJob.output = normalizeLivePortraitRealRunOutput(
        currentJob,
        commandPlan,
        outputPlan,
        executionResult,
      )

      if (!executionResult.ok) {
        currentJob.error = {
          code: executionResult.timedOut
            ? 'LIVEPORTRAIT_REAL_RUN_TIMEOUT'
            : 'LIVEPORTRAIT_REAL_RUN_FAILED',
          message:
            executionResult.stderr ||
            `LivePortrait command exited with code ${executionResult.exitCode}.`,
          recoverable: true,
          details: {
            exitCode: executionResult.exitCode,
            timedOut: executionResult.timedOut,
          },
        }
      }
      return
    }

    updateStatus(currentJob, 'completed')
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

const getOutputPayload = (job) => job?.output?.payload ?? job?.output?.metadata ?? null

export function getRuntimeJobOutput(jobId) {
  const job = getRuntimeHostJob(jobId)

  if (!job) {
    return null
  }

  return {
    job,
    payload: getOutputPayload(job),
  }
}

export function getRuntimeJobOutputStatus(jobId) {
  const output = getRuntimeJobOutput(jobId)

  if (!output) {
    return { status: 'missing', job: null, outputPlan: null }
  }

  const outputPlan = output.payload?.outputPlan ?? null

  if (!outputPlan) {
    return {
      status: output.job.status === 'failed' ? 'failed' : 'missing',
      job: output.job,
      outputPlan: null,
    }
  }

  if (output.payload?.dryRun) {
    return { status: 'planned', job: output.job, outputPlan }
  }

  if (output.job.status === 'failed') {
    return { status: 'failed', job: output.job, outputPlan }
  }

  return { status: 'checking', job: output.job, outputPlan }
}

export function getRuntimeJobOutputVideoPath(jobId) {
  const output = getRuntimeJobOutput(jobId)
  const outputPlan = output?.payload?.outputPlan

  return typeof outputPlan?.runtimeOutputPath === 'string'
    ? outputPlan.runtimeOutputPath
    : null
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
