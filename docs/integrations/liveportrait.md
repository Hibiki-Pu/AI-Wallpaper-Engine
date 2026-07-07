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

Sprint 20 can connect one real runtime path:

1. Choose local CLI, local service or Docker.
2. Add runtime config UI or config file.
3. Implement real runtime health checks.
4. Send `LivePortraitInput`.
5. Normalize runtime output into `MotionLayer`.
6. Add preview asset handling.

## Risks

- GPU / CUDA availability differs across machines.
- FFmpeg may be missing or have path issues.
- Pretrained weights can be large and license-sensitive.
- Windows setup needs careful path and process handling.
- Commercial usage requires license review.
