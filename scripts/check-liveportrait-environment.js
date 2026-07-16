import { execFile } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const REPORT_DIR = path.resolve('reports')
const JSON_REPORT = path.join(REPORT_DIR, 'liveportrait-environment-report.json')
const MD_REPORT = path.join(REPORT_DIR, 'liveportrait-environment-report.md')
const DEFAULT_RUNTIME_HOST = process.env.RUNTIME_HOST_URL ?? 'http://127.0.0.1:8787'
const DEFAULT_RUNTIME_PATHS = [
  'D:/ai-runtimes/LivePortrait',
  'D:/ai-wallpaper-runtime-outputs/liveportrait',
  'D:/ai-wallpaper-runtime-temp/liveportrait',
]

const now = () => new Date().toISOString()

async function runCommand(command, args = [], options = {}) {
  try {
    const result = await execFileAsync(command, args, {
      timeout: options.timeoutMs ?? 4000,
      windowsHide: true,
      maxBuffer: 1024 * 512,
    })

    return {
      command: [command, ...args].join(' '),
      available: true,
      exitCode: 0,
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
      resolvedCommand: command,
    }
  } catch (error) {
    return {
      command: [command, ...args].join(' '),
      available: false,
      exitCode: typeof error.code === 'number' ? error.code : null,
      stdout: typeof error.stdout === 'string' ? error.stdout.trim() : '',
      stderr: typeof error.stderr === 'string' ? error.stderr.trim() : error.message,
      resolvedCommand: command,
    }
  }
}

const firstLine = (value) => value.split(/\r?\n/).find(Boolean) ?? ''

async function checkNpm() {
  return runCommand('npm', ['--version'])
}

async function checkPythonCommands() {
  const candidates = [
    ['python', ['--version']],
    ['py', ['--version']],
    ['python3', ['--version']],
  ]
  const results = []

  for (const [command, args] of candidates) {
    results.push(await runCommand(command, args))
  }

  return results.map((result) => ({
    ...result,
    version: firstLine(result.stdout || result.stderr),
  }))
}

async function checkTorch(pythonCommands) {
  const python = pythonCommands.find((candidate) => candidate.available)

  if (!python) {
    return {
      available: false,
      status: 'missing_python',
      message: 'PyTorch check skipped because no Python command is available.',
    }
  }

  const result = await runCommand(python.resolvedCommand, [
    '-c',
    'import torch; print(torch.__version__); print(torch.cuda.is_available())',
  ], { timeoutMs: 6000 })

  const lines = result.stdout.split(/\r?\n/).filter(Boolean)

  return {
    ...result,
    torchVersion: lines[0] ?? null,
    cudaAvailable: lines[1] === 'True',
    status: result.available ? 'available' : 'missing',
  }
}

async function checkFfmpeg() {
  const result = await runCommand('ffmpeg', ['-version'])

  return {
    ...result,
    version: firstLine(result.stdout || result.stderr),
  }
}

function parseNvidiaSmi(output) {
  const gpuLine = output
    .split(/\r?\n/)
    .find((line) => /NVIDIA|GeForce|RTX|GTX|Quadro|Tesla/i.test(line))
  const cudaMatch = output.match(/CUDA Version:\s*([\d.]+)/i)
  const driverMatch = output.match(/Driver Version:\s*([\d.]+)/i)
  const memoryMatch = output.match(/(\d+)MiB\s*\/\s*(\d+)MiB/)

  return {
    gpuName: gpuLine?.replace(/[|]/g, ' ').trim() ?? null,
    driverVersion: driverMatch?.[1] ?? null,
    cudaVersion: cudaMatch?.[1] ?? null,
    vramTotalMiB: memoryMatch?.[2] ? Number(memoryMatch[2]) : null,
  }
}

async function checkNvidiaGpu() {
  const result = await runCommand('nvidia-smi')

  return {
    ...result,
    ...parseNvidiaSmi(result.stdout),
  }
}

async function checkRuntimeHost() {
  try {
    const response = await fetch(`${DEFAULT_RUNTIME_HOST.replace(/\/+$/, '')}/api/runtime/health`)
    const data = await response.json()

    return {
      url: DEFAULT_RUNTIME_HOST,
      reachable: response.ok && data.ok === true,
      occupied: !response.ok,
      data,
    }
  } catch (error) {
    return {
      url: DEFAULT_RUNTIME_HOST,
      reachable: false,
      occupied: false,
      error: error instanceof Error ? error.message : 'Runtime Host unreachable.',
    }
  }
}

async function checkDiskSpace() {
  const result = {
    status: 'unable_to_check',
    message: 'Portable disk space checks are not implemented in this read-only audit.',
  }

  if (process.platform === 'win32') {
    const drive = process.cwd().slice(0, 2)
    const wmic = await runCommand('wmic', ['logicaldisk', 'where', `DeviceID='${drive}'`, 'get', 'FreeSpace,Size', '/value'])

    if (wmic.available && wmic.stdout) {
      const free = Number(wmic.stdout.match(/FreeSpace=(\d+)/)?.[1] ?? 0)
      const size = Number(wmic.stdout.match(/Size=(\d+)/)?.[1] ?? 0)

      return {
        status: free > 0 ? 'available' : 'unable_to_check',
        drive,
        freeBytes: free || null,
        sizeBytes: size || null,
      }
    }
  }

  return result
}

function computeReadiness({ python, ffmpeg, gpu, torch }) {
  const hasPython = python.some((candidate) => candidate.available)
  const hasFfmpeg = ffmpeg.available
  const hasTorch = torch.status === 'available'
  const hasCuda = Boolean(torch.cudaAvailable || gpu.cudaVersion)

  if (hasPython && hasFfmpeg && hasTorch && hasCuda) {
    return 'ready'
  }

  if (hasPython && hasFfmpeg && hasTorch) {
    return 'cpu_only'
  }

  if (hasPython || hasFfmpeg || hasTorch || gpu.available) {
    return 'partially_ready'
  }

  if (!hasPython && !hasFfmpeg) {
    return 'not_ready'
  }

  return 'unable_to_determine'
}

function createMarkdown(report) {
  const lines = [
    '# LivePortrait Runtime Environment Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Overall readiness: **${report.overallReadiness}**`,
    '',
    '## OS',
    '',
    `- Platform: ${report.os.platform}`,
    `- Arch: ${report.os.arch}`,
    `- Release: ${report.os.release}`,
    '',
    '## Node.js',
    '',
    `- Node: ${report.node.version}`,
    `- npm: ${report.node.npm.version || report.node.npm.stderr || 'unavailable'}`,
    '',
    '## Git',
    '',
    `- ${report.git.version || report.git.stderr || 'unavailable'}`,
    '',
    '## Python',
    '',
    ...report.python.map((item) => `- ${item.command}: ${item.available ? item.version : 'unavailable'}`),
    '',
    '## FFmpeg',
    '',
    `- ${report.ffmpeg.available ? report.ffmpeg.version : 'unavailable'}`,
    '',
    '## NVIDIA GPU',
    '',
    `- Available: ${report.gpu.available}`,
    `- GPU: ${report.gpu.gpuName ?? 'unknown'}`,
    `- Driver: ${report.gpu.driverVersion ?? 'unknown'}`,
    `- CUDA: ${report.gpu.cudaVersion ?? 'unknown'}`,
    `- VRAM: ${report.gpu.vramTotalMiB ?? 'unknown'} MiB`,
    '',
    '## PyTorch',
    '',
    `- Status: ${report.torch.status}`,
    `- Version: ${report.torch.torchVersion ?? 'unknown'}`,
    `- CUDA available: ${report.torch.cudaAvailable ?? false}`,
    '',
    '## Disk Space',
    '',
    `- Status: ${report.disk.status}`,
    report.disk.freeBytes ? `- Free: ${report.disk.freeBytes} bytes` : '- Free: unable to check',
    '',
    '## Runtime Host',
    '',
    `- URL: ${report.runtimeHost.url}`,
    `- Reachable: ${report.runtimeHost.reachable}`,
    `- Port: ${report.runtimeHost.data?.port ?? 'unknown'}`,
    `- Real execution enabled: ${report.runtimeHost.data?.realExecutionEnabled ?? false}`,
    '',
    '## Recommended Runtime Paths',
    '',
    ...report.recommendedPaths.map((item) => `- ${item}`),
    '',
    '> This audit is read-only. It does not install Python, PyTorch, CUDA, FFmpeg, LivePortrait, or model weights.',
    '',
  ]

  return `${lines.join('\n')}\n`
}

async function main() {
  await fs.mkdir(REPORT_DIR, { recursive: true })

  const npm = await checkNpm()
  const git = await runCommand('git', ['--version'])
  const python = await checkPythonCommands()
  const ffmpeg = await checkFfmpeg()
  const gpu = await checkNvidiaGpu()
  const torch = await checkTorch(python)
  const disk = await checkDiskSpace()
  const runtimeHost = await checkRuntimeHost()
  const report = {
    generatedAt: now(),
    os: {
      platform: process.platform,
      arch: process.arch,
      release: os.release(),
      version: os.version?.() ?? null,
    },
    node: {
      version: process.version,
      npm: {
        ...npm,
        version: firstLine(npm.stdout || npm.stderr),
      },
    },
    git: {
      ...git,
      version: firstLine(git.stdout || git.stderr),
    },
    python,
    ffmpeg,
    gpu,
    torch,
    disk,
    runtimeHost,
    recommendedPaths: DEFAULT_RUNTIME_PATHS,
  }

  report.overallReadiness = computeReadiness(report)

  await fs.writeFile(JSON_REPORT, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  await fs.writeFile(MD_REPORT, createMarkdown(report), 'utf8')

  const summary = createWriteStream(null, { fd: process.stdout.fd })
  summary.write(`LivePortrait readiness: ${report.overallReadiness}\n`)
  summary.write(`Report JSON: ${JSON_REPORT}\n`)
  summary.write(`Report Markdown: ${MD_REPORT}\n`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})