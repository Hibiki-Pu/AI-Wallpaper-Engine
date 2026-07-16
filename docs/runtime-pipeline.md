# Local Runtime Job Pipeline

Sprint 19 introduces a generic Runtime Job Pipeline for local AI runtimes.

It does not run real LivePortrait, Depth Anything or SAM2 models yet. The current implementation uses in-memory jobs and a simulated local runtime bridge.

## Runtime Job Lifecycle

```text
idle -> queued -> running -> completed
                  |          |
                  |          -> failed
                  -> cancelled
```

Statuses:

- `idle`: job has been created but not submitted.
- `queued`: job is waiting for a runtime.
- `running`: runtime is processing the job.
- `completed`: runtime returned output.
- `failed`: runtime or validation failed.
- `cancelled`: user or system cancelled the job.

## Provider vs Runtime

Providers understand product-level animation intent.

Examples:

- LivePortrait provider: portrait motion
- Depth Anything provider: depth map generation
- SAM2 provider: segmentation masks

Runtime bridges understand execution.

Examples:

- Local CLI
- Local service
- Docker
- Mock runtime

The provider creates a `RuntimeJob`, submits it to the runtime bridge, then normalizes the result back into editor data such as `MotionLayer`.

## LivePortrait Reuse

LivePortrait now creates a RuntimeJob during `generate()`.

If the runtime is unavailable:

- The job is marked failed.
- The provider still returns a fallback MotionLayer.
- MotionLayer params include `runtimeJobId`, `runtimeStatus`, `runtimeMode` and `fallback`.

If a mock local runtime is configured later:

- The job can move through queued/running/completed.
- The provider can normalize runtime output into a real MotionLayer or preview video.

## Depth Anything / SAM2 Reuse

Future providers can reuse the same job pipeline:

- Depth Anything can submit an image and receive depth metadata or depth assets.
- SAM2 can submit an image/object prompt and receive masks or object layers.
- Both can keep heavy Python/model logic outside the React editor.

## Why No Real Model Yet?

This sprint intentionally avoids real model execution:

- No GitHub repo clone
- No Python install
- No PyTorch
- No CUDA / GPU calls
- No model weights

The goal is to stabilize the interface before connecting heavy local runtimes.

## Sprint 20 Roadmap

- Runtime configuration UI
- Runtime health panel
- Command preview
- Local service request protocol
- Preview asset pipeline
- Runtime logs and retry actions
- First real runtime adapter behind an explicit opt-in

## Sprint 20 Update

The LivePortrait Local Runtime MVP adds:

- `RuntimeConfig`
- localStorage-backed runtime config store
- LivePortrait runtime settings UI
- Browser-safe health checks
- Missing requirement reporting
- Structured command preview

The browser still does not execute local files. Local paths may return `unable_to_check` until a trusted desktop bridge, local service or Docker bridge is connected.

## Sprint 21 Roadmap

Sprint 21 adds a local Runtime Host MVP.

The Runtime Host is a Node.js HTTP service that runs at:

```text
http://127.0.0.1:8787
```

It exposes:

- `GET /api/runtime/health`
- `POST /api/runtime/jobs`
- `GET /api/runtime/jobs/:jobId`
- `POST /api/runtime/jobs/:jobId/cancel`

The host currently runs mock jobs only:

```text
queued -> running -> completed
```

It does not execute Python, FFmpeg or LivePortrait.

## Runtime Host Security Boundary

- The host binds to `127.0.0.1` by default.
- CORS allows only local Vite origins.
- `RUNTIME_HOST_TOKEN` can require `x-runtime-token`.
- Provider whitelist currently allows `liveportrait`.
- Request bodies cannot contain `rawCommand`, `shellCommand` or `executeCommand`.
- `commandPreview` is metadata only.
- The host exposes no arbitrary file-read API.

## Why Browser Cannot Execute Python / FFmpeg

The browser editor must not execute local programs directly. It has no safe file-system or process boundary for Python, FFmpeg, CUDA or model weights.

The Runtime Host exists as a controlled local boundary where future explicit opt-in execution can happen.

## Sprint 22 Roadmap

- LivePortrait CLI dry run
- Real output import
- Preview video asset pipeline
- Runtime logs
- Retry and cancel UX
- FFmpeg detection
- Pretrained weight detection

## Sprint 22 Update: CLI Dry Run

Sprint 22 adds a dry-run mode to the Runtime Host.

`POST /api/runtime/jobs` now accepts:

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

Dry run jobs still move through:

```text
queued -> running -> completed
```

The completed job includes:

- `dryRun: true`
- `commandPlan`
- `outputPlan`
- metadata explaining that no external model was executed

The frontend uses this to create a MotionLayer with `params.commandPlan`, `params.outputPlan` and `params.dryRun`.

## Command Plan

The command plan is generated by the Runtime Host from validated provider input and runtime config.

It is not accepted as executable user input.

Example:

```json
{
  "providerId": "liveportrait",
  "mode": "dryRun",
  "command": "python",
  "args": [
    "inference.py",
    "--source",
    "<safe-source-path>",
    "--driving",
    "<safe-driving-path-or-template>",
    "--output",
    "<safe-output-path>"
  ],
  "cwd": "<runtime-path>",
  "dryRun": true
}
```

## Output Plan

The Runtime Host owns output filename planning.

The browser does not provide arbitrary output filenames.

```json
{
  "outputDir": "...",
  "outputFilename": "liveportrait_<jobId>.mp4",
  "runtimeOutputPath": "...",
  "previewVideoUrl": null,
  "assetImportStatus": "planned"
}
```

## Output Import Contract

Sprint 22 also adds `RuntimeOutputImport` types for future asset import.

Current statuses:

- `planned`
- `importing`
- `imported`
- `failed`
- `skipped`

Sprint 23 can use this contract to import real preview videos after explicit runtime execution is enabled.

## Sprint 23 Update: Real Run Feature Flag

Sprint 23 adds `realRun` mode behind an explicit feature flag.

Real execution is disabled by default.

Enable it only for a prepared local runtime:

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

Use a different port if needed:

```bash
RUNTIME_HOST_PORT=8788 npm run runtime:host
```

Health now returns:

```json
{
  "ok": true,
  "allowedProviders": ["liveportrait"],
  "realExecutionEnabled": false,
  "port": 8787
}
```

Supported job modes:

- `mock`
- `dryRun`
- `realRun`

`realRun` rules:

- It must pass provider whitelist checks.
- It must pass runtime config validation.
- It is rejected unless `RUNTIME_ENABLE_REAL_EXECUTION=true`.
- It executes only the Runtime Host generated `commandPlan`.
- It never executes frontend supplied `rawCommand`, `shellCommand`, `executeCommand` or `commandPreview`.
- It uses `child_process.spawn` with `shell: false`.
- stdout/stderr are captured with size limits.
- timeout defaults to 10 minutes.

Failure examples:

- Python not found
- `inference.py` not found
- FFmpeg missing
- pretrained weights missing
- CUDA / torch error
- timeout

## Sprint 24 Roadmap

- Import generated preview videos into the Asset System
- Runtime output browser
- MotionLayer preview asset binding
- Runtime logs and retry UI

## Sprint 24 Runtime Output Video Import

Sprint 24 adds a safe output import contract for Runtime Host generated video assets.

The Runtime Host now exposes output metadata by `jobId`:

```text
GET /api/runtime/outputs/:jobId
```

It can also stream the generated MP4 when the file exists and is inside the planned `outputDir`:

```text
GET /api/runtime/outputs/:jobId/video
```

Security rules:

- No arbitrary file-read API.
- No `path` query parameter.
- No `filename` query parameter.
- The output path must come from `job.output.outputPlan.runtimeOutputPath`.
- The output path must stay inside `outputPlan.outputDir`.
- Only `.mp4` runtime output videos are served.
- `dryRun` returns `planned` and does not expose a video file.

Import status mapping:

- `planned`: dry run created an output plan.
- `missing`: real run completed but the expected MP4 does not exist.
- `imported`: real run completed and the MP4 is available through Runtime Host.
- `failed`: runtime job or output validation failed.
- `skipped`: mock mode or non-runtime output.

The MP4 remains an intermediate LivePortrait asset. It is not the final wallpaper export format.

## Sprint 25 Roadmap

- First real LivePortrait end-to-end run.
- Runtime output video import into the full Asset System.
- Runtime logs, retry and cancel UX.
- Generated preview asset management.

## Sprint 25 Runtime Readiness Audit

Sprint 25 adds two foundation pieces:

1. A read-only LivePortrait environment audit script.
2. A minimal Runtime Host test harness using `node:test`.

Run the audit:

```bash
node scripts/check-liveportrait-environment.js
```

Generated reports:

```text
reports/liveportrait-environment-report.json
reports/liveportrait-environment-report.md
```

The audit checks OS, Node, npm, Git, Python, FFmpeg, NVIDIA GPU, PyTorch/CUDA, disk availability and Runtime Host health. It does not install anything and does not execute LivePortrait.

Run runtime tests:

```bash
npm run test:runtime
```

The tests cover Runtime Host security, LivePortrait dry-run adapter behavior, runtime output access behavior and command executor safety.

Sprint 26 Roadmap: guided LivePortrait installation and first end-to-end runtime run behind explicit user confirmation.
