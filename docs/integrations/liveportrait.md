# LivePortrait Integration Adapter

LivePortrait is planned as a portrait-motion provider inside AI Wallpaper Engine.

It is not part of the core editor runtime. The main project remains focused on:

- Editor
- Motion Layer
- Style Pack
- Provider Framework
- Renderer
- Export

## Positioning

LivePortrait should only provide portrait motion capabilities such as:

- Subtle breathing
- Blink
- Slight head turn
- Talking head
- Custom driving video motion

It should not replace the wallpaper renderer, effect layer system or style case system.

## Why Not Import the GitHub Repository Directly?

The frontend should not clone or embed the LivePortrait repository because LivePortrait may require:

- Python runtime
- PyTorch
- CUDA / GPU support
- FFmpeg
- Pretrained model weights
- Platform-specific native dependencies

Putting these inside the React/Vite app would make the editor heavy, fragile and unsafe to distribute.

## Recommended Runtime Options

### Local CLI

The editor sends a structured request to a local command runner.

### Local Service

A local backend exposes an HTTP API. The frontend calls that service and receives a motion asset or motion spec.

### Docker Runtime

LivePortrait runs in a container with its own Python, CUDA and model dependencies.

## Input Protocol

```ts
interface LivePortraitInput {
  sourceAssetId: string
  sourceImagePath?: string
  sourceImageUrl?: string
  preset: LivePortraitMotionPreset
  strength: number
  duration: number
  loop: boolean
  drivingVideoPath?: string
  drivingVideoUrl?: string
  motionTemplateId?: string
}
```

## Output Protocol

```ts
interface LivePortraitOutput {
  motionLayer: MotionLayer
  previewVideoUrl?: string
  metadata: Record<string, unknown>
}
```

## Sprint 18 Scope

Sprint 18 adds only the integration adapter:

- LivePortrait provider manifest
- LivePortrait input/output/runtime types
- Runtime bridge functions
- Runtime health mock
- Fallback MotionLayer output
- MotionPanel provider status UI

It does not execute LivePortrait.

## Sprint 19 Runtime Pipeline

Sprint 19 adds the Local Runtime Job Pipeline:

1. LivePortrait creates a `RuntimeJob`.
2. The local runtime bridge can simulate queued/running/completed jobs.
3. Runtime unavailable cases still return fallback `MotionLayer` data.
4. MotionLayer params record `runtimeJobId`, `runtimeStatus`, `runtimeMode` and `fallback`.

## Sprint 20 Runtime Plan

Sprint 20 adds the LivePortrait Local Runtime MVP:

1. Choose disabled, mock, local CLI, local service or Docker mode.
2. Configure runtime path, Python command, entry file and output directory.
3. Run a browser-safe health check.
4. Show missing requirements or unable-to-check results.
5. Build a structured command preview.
6. Keep fallback MotionLayer behavior when runtime is unavailable.

The app still does not execute LivePortrait directly.

## External Runtime Configuration

The editor stores runtime configuration locally:

- Runtime Mode
- Runtime Path
- Python Command
- Entry File
- Output Dir
- Enabled flag

Browser builds cannot directly verify arbitrary local paths, so local CLI and Docker modes can return `unable_to_check` until a trusted desktop bridge or local service is added.

## Command Preview

Sprint 20 builds a command preview only:

```json
{
  "command": "python",
  "args": [
    "inference.py",
    "--source",
    "...",
    "--output",
    "..."
  ],
  "cwd": "D:\\LivePortrait"
}
```

The preview helps users understand what will be executed later, but no process is started in Sprint 20.

## Sprint 21 Runtime Plan

Sprint 21 adds the Local Runtime Host MVP:

1. Runtime Host runs at `http://127.0.0.1:8787`.
2. Browser submits structured RuntimeJob requests.
3. Runtime Host validates provider whitelist and security fields.
4. Runtime Host returns mock queued/running/completed jobs.
5. LivePortrait provider can use `localService` mode and fallback if host is unavailable.

The Runtime Host does not execute LivePortrait in Sprint 21.

## Runtime Host API

- `GET /api/runtime/health`
- `POST /api/runtime/jobs`
- `GET /api/runtime/jobs/:jobId`
- `POST /api/runtime/jobs/:jobId/cancel`

## Why Mock Execution Only?

Real LivePortrait execution requires Python, PyTorch, FFmpeg, CUDA and pretrained weights. These are intentionally kept outside the React app.

Sprint 21 validates the job boundary before real execution is introduced.

## Sprint 22 Runtime Plan

Sprint 22 adds CLI dry run and output import contracts:

1. Runtime Host accepts `mode: "dryRun"` jobs.
2. Runtime Host validates LivePortrait input and runtime config.
3. Runtime Host generates a `commandPlan`.
4. Runtime Host generates an `outputPlan`.
5. LivePortrait provider stores `dryRun`, `commandPlan` and `outputPlan` in MotionLayer params.

No external model, Python process, FFmpeg command or pretrained weight is executed in Sprint 22.

## Dry Run Job Example

```json
{
  "providerId": "liveportrait",
  "providerKind": "portrait-motion",
  "mode": "dryRun",
  "runtimeConfig": {
    "mode": "localCli",
    "runtimePath": "D:/ai-runtimes/LivePortrait",
    "pythonCommand": "python",
    "entryFile": "inference.py",
    "outputDir": "D:/ai-wallpaper-runtime-outputs/liveportrait"
  },
  "input": {
    "sourceAssetId": "current-wallpaper",
    "sourceImagePath": "D:/images/source.png",
    "preset": "blink",
    "strength": 0.5,
    "duration": 5,
    "loop": true
  }
}
```

## Sprint 23 Runtime Plan

Sprint 23 adds the first real runtime execution path behind a feature flag:

1. `realRun` is disabled by default.
2. Users must start Runtime Host with `RUNTIME_ENABLE_REAL_EXECUTION=true`.
3. Runtime Host generates the commandPlan itself.
4. Runtime Host executes with `child_process.spawn` and `shell: false`.
5. Runtime Host returns `executionResult`, `commandPlan` and `outputPlan`.
6. LivePortrait provider stores these fields in MotionLayer params.

Start with real execution:

```bash
RUNTIME_ENABLE_REAL_EXECUTION=true npm run runtime:host
```

Windows CMD:

```bat
set RUNTIME_ENABLE_REAL_EXECUTION=true && npm run runtime:host
```

PowerShell:

```powershell
$env:RUNTIME_ENABLE_REAL_EXECUTION="true"; npm run runtime:host
```

If `8787` is busy:

```bash
RUNTIME_HOST_PORT=8788 npm run runtime:host
```

## Real Run Output

`realRun` completed or failed jobs include:

- `realRun: true`
- `dryRun: false`
- `commandPlan`
- `outputPlan`
- `executionResult`

`executionResult` includes:

- `ok`
- `exitCode`
- `stdout`
- `stderr`
- `startedAt`
- `completedAt`
- `durationMs`
- `timedOut`

## Safety Boundary

The frontend still cannot send arbitrary commands.

Runtime Host rejects:

- `rawCommand`
- `shellCommand`
- `executeCommand`

`commandPreview` remains display metadata only.

The executable command must be generated by Runtime Host from validated LivePortrait input and runtime config.

## Sprint 24 Runtime Plan

Sprint 24 can import generated preview videos into the Asset System and connect them to MotionLayer preview UI.

## Risks

- GPU / CUDA availability differs across machines.
- FFmpeg may be missing or have path issues.
- Pretrained weights can be large and license-sensitive.
- Windows setup needs careful path and process handling.
- Commercial usage requires license review.
