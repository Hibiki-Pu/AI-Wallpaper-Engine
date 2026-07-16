import test from 'node:test'
import assert from 'node:assert/strict'
import { executeCommandPlan } from '../../runtime-host/runtimeCommandExecutor.js'

const nodeCommand = process.execPath

test('returns structured success without shell execution', async () => {
  const result = await executeCommandPlan({
    command: nodeCommand,
    args: ['-e', 'console.log("ok")'],
  }, { timeoutMs: 2000 })

  assert.equal(result.ok, true)
  assert.equal(result.exitCode, 0)
  assert.match(result.stdout, /ok/)
})

test('requires commandPlan.command', async () => {
  const result = await executeCommandPlan({ args: [] })

  assert.equal(result.ok, false)
  assert.match(result.stderr, /commandPlan\.command/)
})

test('requires commandPlan.args array', async () => {
  const result = await executeCommandPlan({ command: nodeCommand, args: 'bad' })

  assert.equal(result.ok, false)
  assert.match(result.stderr, /args must be an array/)
})

test('timeout result is structured', async () => {
  const result = await executeCommandPlan({
    command: nodeCommand,
    args: ['-e', 'setTimeout(() => {}, 5000)'],
  }, { timeoutMs: 100 })

  assert.equal(result.ok, false)
  assert.equal(result.timedOut, true)
})

test('stdout is truncated to a bounded size', async () => {
  const result = await executeCommandPlan({
    command: nodeCommand,
    args: ['-e', 'process.stdout.write("x".repeat(150000))'],
  }, { timeoutMs: 3000 })

  assert.equal(result.ok, true)
  assert.ok(Buffer.byteLength(result.stdout, 'utf8') <= 100 * 1024)
})