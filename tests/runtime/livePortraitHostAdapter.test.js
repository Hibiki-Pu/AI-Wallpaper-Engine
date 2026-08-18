import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildLivePortraitDryRunCommand,
  createLivePortraitOutputPlan,
  validateLivePortraitJobInput,
} from '../../runtime-host/providers/liveportrait/livePortraitHostAdapter.js'

const validInput = {
  sourceAssetId: 'current-wallpaper',
  sourceImagePath: 'D:/images/source.png',
  drivingVideoPath: 'D:/videos/driving.mp4',
  preset: 'blink',
  strength: 0.5,
  duration: 5,
  loop: true,
}

const runtimeConfig = {
  runtimePath: 'D:/ai-runtimes/LivePortrait',
  pythonCommand: 'python',
  entryFile: 'inference.py',
  outputDir: 'D:/ai-wallpaper-runtime-outputs/liveportrait',
}

test('valid dryRun input passes', () => {
  const result = validateLivePortraitJobInput(validInput, runtimeConfig)

  assert.equal(result.ok, true)
})

test('missing runtimeConfig fails', () => {
  const result = validateLivePortraitJobInput(validInput, {})

  assert.equal(result.ok, false)
  assert.match(result.errors.join(' '), /runtimeConfig\.runtimePath/)
})

test('output path is isolated by host job id and matches LivePortrait naming', () => {
  const outputPlan = createLivePortraitOutputPlan(
    { ...validInput, outputFilename: 'frontend.mp4' },
    runtimeConfig,
    'host-job-123',
  )

  assert.equal(outputPlan.outputFilename, 'source--driving.mp4')
  assert.match(outputPlan.outputDir, /host-job-123$/)
  assert.match(outputPlan.runtimeOutputPath, /host-job-123[\\/]source--driving\.mp4$/)
})

test('command plan keeps command and args separated', () => {
  const commandPlan = buildLivePortraitDryRunCommand(validInput, runtimeConfig)

  assert.equal(commandPlan.command, 'python')
  assert.equal(commandPlan.args[0], 'inference.py')
  assert.ok(commandPlan.args.includes('--source'))
  assert.ok(commandPlan.args.includes('--output-dir'))
  assert.ok(commandPlan.args.includes('--driving-option'))
  assert.equal(commandPlan.cwd, runtimeConfig.runtimePath)
})
