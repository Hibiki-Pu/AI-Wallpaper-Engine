# Layer System

AI Wallpaper Engine uses a layer-based model for editing and rendering dynamic wallpapers.

## WallpaperLayer

```ts
interface WallpaperLayer {
  id: string;
  name: string;
  type:
    | "background"
    | "glow_particles"
    | "petals"
    | "snow"
    | "rain"
    | "fireflies"
    | "fog"
    | "light_rays"
    | "stars";
  visible: boolean;
  locked: boolean;
  zIndex: number;
  settings: {
    count?: number;
    speed?: number;
    opacity?: number;
  };
}
```

## Fields

`id` is a stable layer identifier used by the editor.

`name` is the display name shown in the layer panel and inspector.

`type` selects the renderer. `background` is the base image layer. Other values map to animated effect renderers.

`visible` controls whether the layer is rendered.

`locked` prevents editing, deletion, and ordering changes in the editor.

`zIndex` defines render order. Higher values render above lower values.

`settings.count` controls how many particles or visual elements the effect creates.

`settings.speed` controls animation speed.

`settings.opacity` controls the full layer opacity.

## Render Order

`WallpaperRenderer` sorts `WallpaperSpec.layers` by `zIndex` from low to high.

The background layer normally uses `zIndex: 0`. Effect layers should use higher values. When the user chooses Move Up or Move Down in the layer panel, the editor updates layer order and normalizes z-index values.

If a spec does not include `layers`, the renderer can still use the legacy `effects` array for compatibility.

## Editor Behavior

Adding an effect from the Effect Library creates a new `WallpaperLayer`.

Removing an effect deletes the latest layer of that effect type.

Selecting a layer opens it in the Inspector Panel. The inspector edits `visible`, `locked`, `count`, `speed`, and `opacity` where applicable.
