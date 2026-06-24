# WallpaperSpec

`WallpaperSpec` is the portable project description for AI Wallpaper Engine. It stores the source image reference, camera behavior, and visual effects needed to render a wallpaper preview or pass the project to a future local runtime.

## Fields

```ts
interface WallpaperSpec {
  imageUrl: string;
  camera: {
    type: "static" | "ken_burns";
    zoom: number;
    speed: number;
  };
  effects: Array<{
    type: "glow_particles" | "petals";
    enabled: boolean;
    count: number;
    speed: number;
    opacity: number;
  }>;
}
```

## imageUrl

`imageUrl` points to the wallpaper image. In the web preview this is currently a browser object URL created from the uploaded image. Future desktop or package runtimes can replace it with a local asset path.

## camera

`camera.type` controls background motion.

- `static`: renders the image without camera animation.
- `ken_burns`: applies a slow zoom and pan for a subtle living wallpaper effect.

`camera.zoom` is the target zoom scale for the camera animation. Values close to `1`, such as `1.04` or `1.08`, keep the movement gentle.

`camera.speed` controls how quickly the camera motion plays. Higher values are faster.

## effects

Each item in `effects` describes one renderable overlay effect.

`type` selects the effect renderer:

- `glow_particles`: soft glowing particles over the image.
- `petals`: drifting petal-like particles.

`enabled` toggles the effect on or off.

`count` controls how many effect elements are rendered.

`speed` controls effect motion speed. Higher values move faster.

`opacity` controls the full effect layer opacity. Use lower values to avoid covering the wallpaper subject.

## Example JSON

```json
{
  "imageUrl": "blob:http://localhost:5173/example-image",
  "camera": {
    "type": "ken_burns",
    "zoom": 1.06,
    "speed": 2
  },
  "effects": [
    {
      "type": "glow_particles",
      "enabled": true,
      "count": 32,
      "speed": 2,
      "opacity": 0.38
    },
    {
      "type": "petals",
      "enabled": false,
      "count": 14,
      "speed": 2,
      "opacity": 0.28
    }
  ]
}
```
