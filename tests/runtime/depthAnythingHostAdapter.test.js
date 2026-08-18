import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { createDepthAnythingPlan } from '../../runtime-host/providers/depth-anything/depthAnythingHostAdapter.js'

test('creates an official Depth Anything V2 small-model command plan', () => {
  const plan = createDepthAnythingPlan('D:/inputs/source.jpg', 'depth-1', {
    runtimePath: 'D:/runtime/depth',
    pythonCommand: 'python',
    outputDir: 'D:/outputs',
  })

  assert.equal(plan.commandPlan.command, 'python')
  assert.equal(plan.commandPlan.cwd, 'D:/runtime/depth')
  assert.deepEqual(plan.commandPlan.args, [
    'run.py', '--encoder', 'vits', '--img-path', 'D:/inputs/source.jpg',
    '--outdir', path.join('D:/outputs', 'depth-1'), '--pred-only', '--grayscale',
  ])
  assert.equal(plan.outputFilename, 'source.png')
  assert.match(plan.checkpointPath, /depth_anything_v2_vits\.pth$/)
})
