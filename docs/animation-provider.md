# Animation Provider Framework

AI Wallpaper Engine uses an Animation Provider framework to prepare for future visual animation models such as LivePortrait, Depth Anything and SAM.

This sprint only adds the frontend architecture. It does not run real AI models, Python, PyTorch or GPU code.

## Why Providers?

LivePortrait, Depth Anything and SAM have different runtimes, inputs and outputs. Hard-coding one model into the editor would make the product difficult to extend.

The provider layer gives the editor one stable interface:

```ts
generate(request: AnimationRequest): Promise<AnimationResult>
```

Future providers can return:

- A portable `MotionSpec`
- A preview asset URL
- An error message when a backend service is unavailable

## Current Mock Provider

The `mockAnimationProvider` returns a simulated motion result:

```json
{
  "provider": "mock",
  "status": "completed",
  "outputType": "motion_spec",
  "motionSpec": {
    "targetType": "portrait",
    "motionType": "idle_breathing",
    "strength": 0.3,
    "loop": true,
    "duration": 6
  }
}
```

It is useful for testing editor workflow without connecting real models.

## Future LivePortrait Integration

`src/providers/animation/livePortrait/livePortraitProvider.ts` is reserved for a future backend integration.

Expected flow:

1. Send source image to backend.
2. Send idle motion preset or motion settings.
3. Backend runs LivePortrait.
4. Backend returns an animated asset or a portable `MotionSpec`.

The frontend should not execute LivePortrait directly.

## MotionLayer vs WallpaperLayer

`WallpaperLayer` controls rendered visual effects such as snow, rain, fog and glow particles.

`MotionLayer` stores semantic motion data for future model-driven animation:

- Portrait blinking
- Idle breathing
- Gentle head motion
- Hair sway
- Cloud drift
- Water ripple
- Leaf sway

In Sprint 17, MotionLayer is stored only in the Motion Panel UI. It is not rendered by `WallpaperRenderer` yet.

## Safety

Animation Providers are data and service adapters. They do not execute third-party JavaScript from user content.

Style Packs remain JSON-only data packages.
