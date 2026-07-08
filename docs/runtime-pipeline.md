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
