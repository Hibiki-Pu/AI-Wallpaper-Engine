import path from 'node:path'

export const DEFAULT_DEPTH_ANYTHING_RUNTIME_PATH =
  process.env.DEPTH_ANYTHING_RUNTIME_PATH ??
  'D:/ai-runtimes/Depth-Anything-V2'
export const DEFAULT_DEPTH_ANYTHING_PYTHON =
  process.env.DEPTH_ANYTHING_PYTHON ??
  'D:/ai-runtimes/LivePortrait/.venv/Scripts/python.exe'
export const DEFAULT_DEPTH_ANYTHING_OUTPUT_DIR =
  process.env.DEPTH_ANYTHING_OUTPUT_DIR ??
  'D:/ai-wallpaper-runtime-outputs/depth-anything'

export function createDepthAnythingPlan(inputPath, jobId, options = {}) {
  const runtimePath = options.runtimePath ?? DEFAULT_DEPTH_ANYTHING_RUNTIME_PATH
  const pythonCommand = options.pythonCommand ?? DEFAULT_DEPTH_ANYTHING_PYTHON
  const outputDir = path.join(
    options.outputDir ?? DEFAULT_DEPTH_ANYTHING_OUTPUT_DIR,
    jobId,
  )
  const outputFilename = `${path.parse(inputPath).name}.png`

  return {
    jobId,
    commandPlan: {
      command: pythonCommand,
      args: [
        'run.py',
        '--encoder',
        'vits',
        '--img-path',
        inputPath,
        '--outdir',
        outputDir,
        '--pred-only',
        '--grayscale',
      ],
      cwd: runtimePath,
    },
    outputDir,
    outputFilename,
    outputPath: path.join(outputDir, outputFilename),
    runtimePath,
    checkpointPath: path.join(
      runtimePath,
      'checkpoints',
      'depth_anything_v2_vits.pth',
    ),
  }
}
