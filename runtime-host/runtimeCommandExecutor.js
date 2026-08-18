import { spawn } from 'node:child_process'

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000
const MAX_OUTPUT_BYTES = 100 * 1024

const now = () => new Date().toISOString()

const appendLimited = (current, chunk) => {
  const next = current + chunk.toString()

  if (Buffer.byteLength(next, 'utf8') <= MAX_OUTPUT_BYTES) {
    return next
  }

  return next.slice(-MAX_OUTPUT_BYTES)
}

export function executeCommandPlan(commandPlan, options = {}) {
  const startedAt = now()
  const startedMs = Date.now()
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  if (!commandPlan?.command) {
    return Promise.resolve({
      ok: false,
      exitCode: null,
      stdout: '',
      stderr: 'commandPlan.command is required.',
      startedAt,
      completedAt: now(),
      durationMs: 0,
      timedOut: false,
    })
  }

  if (!Array.isArray(commandPlan.args)) {
    return Promise.resolve({
      ok: false,
      exitCode: null,
      stdout: '',
      stderr: 'commandPlan.args must be an array.',
      startedAt,
      completedAt: now(),
      durationMs: 0,
      timedOut: false,
    })
  }

  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let timedOut = false

    const child = spawn(commandPlan.command, commandPlan.args, {
      cwd: commandPlan.cwd || undefined,
      shell: false,
      windowsHide: true,
      env: {
        ...process.env,
        PYTHONUTF8: '1',
        PYTHONIOENCODING: 'utf-8',
      },
    })

    const timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
    }, timeoutMs)

    child.stdout.on('data', (chunk) => {
      stdout = appendLimited(stdout, chunk)
    })

    child.stderr.on('data', (chunk) => {
      stderr = appendLimited(stderr, chunk)
    })

    child.on('error', (error) => {
      clearTimeout(timeout)
      resolve({
        ok: false,
        exitCode: null,
        stdout,
        stderr: appendLimited(stderr, error.message),
        startedAt,
        completedAt: now(),
        durationMs: Date.now() - startedMs,
        timedOut,
      })
    })

    child.on('close', (exitCode) => {
      clearTimeout(timeout)
      resolve({
        ok: exitCode === 0 && !timedOut,
        exitCode,
        stdout,
        stderr,
        startedAt,
        completedAt: now(),
        durationMs: Date.now() - startedMs,
        timedOut,
      })
    })
  })
}
