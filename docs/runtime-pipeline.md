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

- Real CLI invocation behind explicit opt-in
- Preview video import
- Runtime logs
- Retry and cancel UX
- FFmpeg detection
- Pretrained weight detection
