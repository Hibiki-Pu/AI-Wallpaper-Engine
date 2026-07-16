import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createRuntimeHostJob,
  getRuntimeJobOutputStatus,
  getRuntimeJobOutputVideoPath,
} from '../../runtime-host/runtimeHostJobManager.js'

const runtimeConfig = {
  runtimePath: 'D:/ai-runtimes/LivePortrait',
  pythonCommand: 'python',
  entryFile: 'inference.py',
  outputDir: 'D:/ai-wallpaper-runtime-outputs/liveportrait',
}
const input = {
  sourceAssetId: 'current-wallpaper',
  sourceImagePath: 'D:/images/source.png',
  preset: 'blink',
  strength: 0.5,
  duration: 5,
  loop: true,
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

test('dryRun output status is planned', async () => {
  const job = createRuntimeHostJob({
    providerId: 'liveportrait',
    providerKind: 'portrait-motion',
    mode: 'dryRun',
    runtimeConfig,
    input,
  })

  await wait(1400)
  const status = getRuntimeJobOutputStatus(job.id)

  assert.equal(status.status, 'planned')
})

test('job without outputPlan reports missing', () => {
  const job = createRuntimeHostJob({
    providerId: 'liveportrait',
    providerKind: 'portrait-motion',
    mode: 'mock',
    input,
  })
  const videoPath = getRuntimeJobOutputVideoPath(job.id)

  assert.equal(videoPath, null)
})

test('realRun disabled creates failed job', () => {
  const job = createRuntimeHostJob({
    providerId: 'liveportrait',
    providerKind: 'portrait-motion',
    mode: 'realRun',
    runtimeConfig,
    input,
  }, { realExecutionEnabled: false })

  assert.equal(job.status, 'failed')
  assert.equal(job.error.code, 'REAL_EXECUTION_DISABLED')
})