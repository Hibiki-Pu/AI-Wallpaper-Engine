const LIVEPORTRAIT_PROVIDER_ID = 'liveportrait'

const safeFallback = (value, fallback) =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback

export function validateLivePortraitJobInput(input = {}, runtimeConfig = {}) {
  const errors = []

  if (!input.sourceAssetId) {
    errors.push('sourceAssetId is required.')
  }

  if (!input.sourceImagePath && !input.sourceImageUrl) {
    errors.push('sourceImagePath or sourceImageUrl is required.')
  }

  if (!input.preset) {
    errors.push('preset is required.')
  }

  if (typeof input.strength !== 'number' || input.strength < 0 || input.strength > 1) {
    errors.push('strength must be a number between 0 and 1.')
  }

  if (typeof input.duration !== 'number' || input.duration <= 0) {
    errors.push('duration must be greater than 0.')
  }

  if (input.preset === 'custom_driving_video' && !input.drivingVideoPath && !input.drivingVideoUrl) {
    errors.push('custom_driving_video requires a driving video.')
  }

  if (!runtimeConfig.runtimePath) {
    errors.push('runtimeConfig.runtimePath is required for dryRun.')
  }

  if (!runtimeConfig.pythonCommand) {
    errors.push('runtimeConfig.pythonCommand is required for dryRun.')
  }

  if (!runtimeConfig.entryFile) {
    errors.push('runtimeConfig.entryFile is required for dryRun.')
  }

  if (!runtimeConfig.outputDir) {
    errors.push('runtimeConfig.outputDir is required for dryRun.')
  }

  return {
    ok: errors.length === 0,
    errors,
  }
}

export function buildLivePortraitDryRunCommand(input = {}, runtimeConfig = {}) {
  const source = safeFallback(
    input.sourceImagePath ?? input.sourceImageUrl,
    '<safe-source-path>',
  )
  const driving = safeFallback(
    input.drivingVideoPath ?? input.drivingVideoUrl ?? input.motionTemplateId,
    input.preset ?? '<safe-driving-path-or-template>',
  )
  const outputPath = `${safeFallback(runtimeConfig.outputDir, '<safe-output-dir>')}/<generated-output-file>`

  return {
    providerId: LIVEPORTRAIT_PROVIDER_ID,
    mode: 'dryRun',
    command: safeFallback(runtimeConfig.pythonCommand, 'python'),
    args: [
      safeFallback(runtimeConfig.entryFile, 'inference.py'),
      '--source',
      source,
      '--driving',
      driving,
      '--output',
      outputPath,
    ],
    cwd: safeFallback(runtimeConfig.runtimePath, '<runtime-path>'),
    dryRun: true,
  }
}

export function createLivePortraitOutputPlan(input = {}, runtimeConfig = {}, jobId) {
  const outputFilename = `liveportrait_${jobId}.mp4`
  const outputDir = safeFallback(runtimeConfig.outputDir, '<runtime-output-dir>')

  return {
    outputDir,
    outputFilename,
    runtimeOutputPath: `${outputDir}/${outputFilename}`,
    previewVideoUrl: null,
    assetImportStatus: 'planned',
    sourceAssetId: input.sourceAssetId,
  }
}

export function normalizeLivePortraitDryRunOutput(job, commandPlan, outputPlan) {
  return {
    outputType: 'metadata',
    payload: {
      dryRun: true,
      previewVideoUrl: outputPlan.previewVideoUrl,
      previewImageUrl: null,
      generatedAssetId: null,
      commandPlan,
      outputPlan,
      metadata: {
        mock: false,
        dryRun: true,
        providerId: LIVEPORTRAIT_PROVIDER_ID,
        message:
          'LivePortrait dry run completed. No external model or command was executed.',
      },
    },
    metadata: {
      dryRun: true,
      providerId: LIVEPORTRAIT_PROVIDER_ID,
      runtimeHostJobId: job.id,
      commandPlan,
      outputPlan,
    },
  }
}

export function normalizeLivePortraitRealRunOutput(
  job,
  commandPlan,
  outputPlan,
  executionResult,
) {
  return {
    outputType: 'metadata',
    payload: {
      realRun: true,
      dryRun: false,
      previewVideoUrl: executionResult.ok ? outputPlan.previewVideoUrl : null,
      previewImageUrl: null,
      generatedAssetId: null,
      commandPlan,
      outputPlan,
      executionResult,
      metadata: {
        mock: false,
        realRun: true,
        dryRun: false,
        providerId: LIVEPORTRAIT_PROVIDER_ID,
        message: executionResult.ok
          ? 'LivePortrait command completed through Runtime Host.'
          : 'LivePortrait command failed through Runtime Host.',
      },
    },
    metadata: {
      realRun: true,
      dryRun: false,
      providerId: LIVEPORTRAIT_PROVIDER_ID,
      runtimeHostJobId: job.id,
      commandPlan,
      outputPlan,
      executionResult,
    },
  }
}
