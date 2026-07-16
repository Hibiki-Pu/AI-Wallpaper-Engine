import test from 'node:test'
import assert from 'node:assert/strict'
import { validateRuntimeJobRequest } from '../../runtime-host/runtimeHostSecurity.js'

test('allows liveportrait provider', () => {
  const result = validateRuntimeJobRequest({
    providerId: 'liveportrait',
    providerKind: 'portrait-motion',
    mode: 'dryRun',
    runtimeConfig: {
      runtimePath: 'D:/ai-runtimes/LivePortrait',
      pythonCommand: 'python',
      entryFile: 'inference.py',
      outputDir: 'D:/ai-wallpaper-runtime-outputs/liveportrait',
    },
    input: {},
  })

  assert.equal(result.ok, true)
})

test('rejects unknown provider', () => {
  const result = validateRuntimeJobRequest({ providerId: 'unknown' })

  assert.equal(result.ok, false)
})

test('rejects raw command fields recursively', () => {
  for (const key of ['rawCommand', 'shellCommand', 'executeCommand']) {
    const result = validateRuntimeJobRequest({
      providerId: 'liveportrait',
      input: { nested: { [key]: 'danger' } },
    })

    assert.equal(result.ok, false)
  }
})

test('rejects dangerous shell characters in runtimeConfig', () => {
  const result = validateRuntimeJobRequest({
    providerId: 'liveportrait',
    runtimeConfig: {
      runtimePath: 'D:/ai-runtimes/LivePortrait && whoami',
    },
  })

  assert.equal(result.ok, false)
})

test('accepts normal Windows paths', () => {
  const result = validateRuntimeJobRequest({
    providerId: 'liveportrait',
    runtimeConfig: {
      runtimePath: 'D:/ai-runtimes/LivePortrait',
      pythonCommand: 'python',
      entryFile: 'inference.py',
      outputDir: 'D:/ai-wallpaper-runtime-outputs/liveportrait',
    },
  })

  assert.equal(result.ok, true)
})

test('rejects directory traversal in runtimeConfig', () => {
  const result = validateRuntimeJobRequest({
    providerId: 'liveportrait',
    runtimeConfig: {
      outputDir: '../secrets',
    },
  })

  assert.equal(result.ok, false)
})

test('rejects frontend-defined output filenames and runtime output paths', () => {
  for (const key of ['outputFilename', 'runtimeOutputPath']) {
    const result = validateRuntimeJobRequest({
      providerId: 'liveportrait',
      input: { [key]: 'custom.mp4' },
    })

    assert.equal(result.ok, false)
  }
})