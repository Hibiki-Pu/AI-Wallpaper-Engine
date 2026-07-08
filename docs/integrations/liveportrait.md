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

Sprint 22 can add the first real runtime execution path:

1. Explicit opt-in runtime execution.
2. Local CLI invocation through a safe desktop/backend bridge.
3. Runtime logs.
4. Preview video import.
5. Better FFmpeg and pretrained weights checks.

## Risks

- GPU / CUDA availability differs across machines.
- FFmpeg may be missing or have path issues.
- Pretrained weights can be large and license-sensitive.
- Windows setup needs careful path and process handling.
- Commercial usage requires license review.
