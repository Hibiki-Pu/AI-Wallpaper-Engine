import JSZip from 'jszip'
import type { WallpaperSpec } from '../types/WallpaperSpec'
import { serializeWallpaperSpec } from './exportWallpaperSpec'

const PACKAGE_ZIP_FILENAME = 'ai-wallpaper-package.zip'
const PACKAGE_ROOT = 'ai-wallpaper-package'
const PACKAGE_IMAGE_PATH = './assets/wallpaper-image.png'

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const fetchWallpaperImage = async (imageUrl: string): Promise<Blob> => {
  const response = await fetch(imageUrl)

  if (!response.ok) {
    throw new Error('Failed to fetch wallpaper image for package export.')
  }

  return response.blob()
}

const createPortableSpec = (spec: WallpaperSpec): WallpaperSpec => ({
  ...spec,
  imageUrl: PACKAGE_IMAGE_PATH,
})

const createPackageReadme = () => `# AI Wallpaper Engine Web Wallpaper Package

This package was exported from AI Wallpaper Engine.

## Preview

Open \`index.html\` in a browser to preview the dynamic wallpaper.

Some browsers may restrict local file access for \`wallpaperSpec.json\`. If the wallpaper does not load after opening \`index.html\` directly, serve this folder with any static file server and open the local URL.

## Lively Wallpaper

1. Extract \`ai-wallpaper-package.zip\`.
2. Open Lively Wallpaper.
3. Add a new wallpaper.
4. Select the extracted \`index.html\` file.

## Contents

- \`index.html\`: standalone web wallpaper runtime.
- \`wallpaperSpec.json\`: portable wallpaper configuration.
- \`assets/wallpaper-image.png\`: exported wallpaper image.
`

const createPackageHtml = () => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Wallpaper Engine Export</title>
    <style>
      html,
      body,
      #wallpaper {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: #111827;
      }

      #wallpaper {
        position: fixed;
        inset: 0;
        isolation: isolate;
      }

      .wallpaper-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transform: scale(1);
      }

      .wallpaper-image.camera-slow_zoom_in,
      .wallpaper-image.camera-slow_zoom_out,
      .wallpaper-image.camera-pan_left,
      .wallpaper-image.camera-pan_right,
      .wallpaper-image.camera-breathing {
        animation-duration: var(--camera-duration);
        animation-timing-function: ease-in-out;
        animation-iteration-count: infinite;
        animation-direction: alternate;
        will-change: transform;
      }

      .wallpaper-image.camera-slow_zoom_in { animation-name: camera-zoom-in; }
      .wallpaper-image.camera-slow_zoom_out { animation-name: camera-zoom-out; }
      .wallpaper-image.camera-pan_left { animation-name: camera-pan-left; }
      .wallpaper-image.camera-pan_right { animation-name: camera-pan-right; }
      .wallpaper-image.camera-breathing { animation-name: camera-breathing; }

      .effect-layer {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
        z-index: 2;
      }

      .glow-particles-layer {
        mix-blend-mode: screen;
      }

      .glow-particle {
        position: absolute;
        left: var(--particle-x);
        top: var(--particle-y);
        width: var(--particle-size);
        height: var(--particle-size);
        border-radius: 999px;
        background: rgba(216, 248, 255, 0.82);
        box-shadow:
          0 0 12px rgba(146, 229, 255, 0.7),
          0 0 26px rgba(125, 211, 252, 0.34);
        animation: glow-float var(--particle-duration) ease-in-out infinite;
        animation-delay: var(--particle-delay);
        will-change: transform, opacity;
      }

      .petals-layer {
        filter: blur(0.1px);
      }

      .petal {
        position: absolute;
        left: var(--petal-x);
        top: -12%;
        width: var(--petal-size);
        height: calc(var(--petal-size) * 1.35);
        border-radius: 80% 0 80% 0;
        background: linear-gradient(145deg, #ffd9df, #fff3f4 45%, #f7aebc);
        transform: rotate(var(--petal-rotation));
        animation: petal-fall var(--petal-duration) linear infinite;
        animation-delay: var(--petal-delay);
        will-change: transform;
      }

      .snowflake {
        position: absolute;
        left: var(--snow-x);
        top: -8%;
        width: var(--snow-size);
        height: var(--snow-size);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 0 8px rgba(226, 244, 255, 0.55);
        animation: snow-fall var(--snow-duration) linear infinite;
        animation-delay: var(--snow-delay);
        will-change: transform;
      }

      .rain-layer {
        background: linear-gradient(180deg, rgba(22, 32, 51, 0.18), transparent);
      }

      .raindrop {
        position: absolute;
        left: var(--rain-x);
        top: -16%;
        width: 1px;
        height: var(--rain-length);
        background: linear-gradient(180deg, transparent, rgba(210, 236, 255, 0.8));
        transform: rotate(12deg);
        animation: rain-fall var(--rain-duration) linear infinite;
        animation-delay: var(--rain-delay);
        will-change: transform;
      }

      .fireflies-layer,
      .light-rays-layer,
      .stars-layer {
        mix-blend-mode: screen;
      }

      .firefly {
        position: absolute;
        left: var(--firefly-x);
        top: var(--firefly-y);
        width: 5px;
        height: 5px;
        border-radius: 999px;
        background: rgba(255, 244, 154, 0.9);
        box-shadow:
          0 0 10px rgba(255, 231, 112, 0.85),
          0 0 22px rgba(234, 179, 8, 0.42);
        animation: firefly-drift var(--firefly-duration) ease-in-out infinite;
        animation-delay: var(--firefly-delay);
        will-change: transform, opacity;
      }

      .fog-bank {
        position: absolute;
        left: -30%;
        top: var(--fog-y);
        width: 70%;
        height: 24%;
        border-radius: 999px;
        background: radial-gradient(
          ellipse at center,
          rgba(235, 245, 255, 0.44),
          rgba(235, 245, 255, 0) 68%
        );
        filter: blur(18px);
        transform: scale(var(--fog-scale));
        animation: fog-drift var(--fog-duration) ease-in-out infinite;
        animation-delay: var(--fog-delay);
        will-change: transform;
      }

      .light-ray {
        position: absolute;
        top: -18%;
        left: var(--ray-x);
        width: var(--ray-width);
        height: 135%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 246, 203, 0.28),
          transparent
        );
        filter: blur(8px);
        transform: rotate(var(--ray-rotation));
        transform-origin: top center;
        animation: light-ray-pulse var(--ray-duration) ease-in-out infinite;
        animation-delay: var(--ray-delay);
        will-change: opacity, transform;
      }

      .star {
        position: absolute;
        left: var(--star-x);
        top: var(--star-y);
        width: var(--star-size);
        height: var(--star-size);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 0 8px rgba(196, 220, 255, 0.85);
        animation: star-twinkle var(--star-duration) ease-in-out infinite;
        animation-delay: var(--star-delay);
        will-change: opacity, transform;
      }

      .error {
        display: grid;
        place-items: center;
        width: 100%;
        height: 100%;
        color: #dce9f5;
        font: 18px/1.5 system-ui, sans-serif;
      }

      @keyframes camera-zoom-in {
        from { transform: scale(1); }
        to { transform: scale(var(--camera-zoom)); }
      }

      @keyframes camera-zoom-out {
        from { transform: scale(var(--camera-zoom)); }
        to { transform: scale(1); }
      }

      @keyframes camera-pan-left {
        from { transform: scale(var(--camera-zoom)) translate3d(1.2%, 0, 0); }
        to { transform: scale(var(--camera-zoom)) translate3d(-1.2%, 0, 0); }
      }

      @keyframes camera-pan-right {
        from { transform: scale(var(--camera-zoom)) translate3d(-1.2%, 0, 0); }
        to { transform: scale(var(--camera-zoom)) translate3d(1.2%, 0, 0); }
      }

      @keyframes camera-breathing {
        from { transform: scale(1) translate3d(-0.2%, -0.2%, 0); }
        to { transform: scale(var(--camera-zoom)) translate3d(0.2%, 0.2%, 0); }
      }

      @keyframes glow-float {
        0%,
        100% {
          opacity: 0.18;
          transform: translate3d(0, 0, 0) scale(0.8);
        }

        50% {
          opacity: 0.95;
          transform: translate3d(16px, -26px, 0) scale(1.15);
        }
      }

      @keyframes petal-fall {
        from {
          transform: translate3d(0, -12%, 0) rotate(var(--petal-rotation));
        }

        to {
          transform: translate3d(var(--petal-drift), 122vh, 0)
            rotate(calc(var(--petal-rotation) + 180deg));
        }
      }

      @keyframes snow-fall {
        from {
          transform: translate3d(0, -10%, 0);
        }

        to {
          transform: translate3d(var(--snow-drift), 116vh, 0);
        }
      }

      @keyframes rain-fall {
        from {
          transform: translate3d(0, -18%, 0) rotate(12deg);
        }

        to {
          transform: translate3d(-42px, 120vh, 0) rotate(12deg);
        }
      }

      @keyframes firefly-drift {
        0%,
        100% {
          opacity: 0.18;
          transform: translate3d(0, 0, 0) scale(0.8);
        }

        50% {
          opacity: 1;
          transform: translate3d(var(--firefly-drift-x), var(--firefly-drift-y), 0)
            scale(1.15);
        }
      }

      @keyframes fog-drift {
        0%,
        100% {
          transform: translate3d(0, 0, 0) scale(var(--fog-scale));
        }

        50% {
          transform: translate3d(55%, -4%, 0) scale(calc(var(--fog-scale) + 0.12));
        }
      }

      @keyframes light-ray-pulse {
        0%,
        100% {
          opacity: 0.22;
          transform: rotate(var(--ray-rotation)) translate3d(-2%, 0, 0);
        }

        50% {
          opacity: 0.7;
          transform: rotate(var(--ray-rotation)) translate3d(4%, 0, 0);
        }
      }

      @keyframes star-twinkle {
        0%,
        100% {
          opacity: 0.35;
          transform: scale(0.8);
        }

        50% {
          opacity: 1;
          transform: scale(1.25);
        }
      }
    </style>
  </head>
  <body>
    <main id="wallpaper"></main>
    <script>
      const wallpaper = document.getElementById('wallpaper');

      const setError = (message) => {
        wallpaper.innerHTML = '';
        const error = document.createElement('div');
        error.className = 'error';
        error.textContent = message;
        wallpaper.append(error);
      };

      const createGlowParticle = (id, speed) => {
        const seed = id + 1;
        const durationBase = Math.max(7, 18 - speed * 3);

        return {
          x: (seed * 37) % 100,
          y: (seed * 53) % 100,
          size: 3 + ((seed * 17) % 10),
          delay: -((seed * 19) % 100) / 10,
          duration: durationBase + ((seed * 11) % 6),
        };
      };

      const createPetal = (id, speed) => {
        const seed = id + 1;
        const durationBase = Math.max(8, 24 - speed * 4);

        return {
          x: (seed * 29) % 100,
          size: 8 + ((seed * 13) % 12),
          delay: -((seed * 23) % 140) / 10,
          duration: durationBase + ((seed * 7) % 8),
          drift: -24 + ((seed * 31) % 48),
          rotation: (seed * 47) % 360,
        };
      };

      const createSnowflake = (id, speed) => {
        const seed = id + 1;

        return {
          x: (seed * 41) % 100,
          size: 2 + ((seed * 11) % 6),
          delay: -((seed * 17) % 120) / 10,
          duration: Math.max(7, 22 - speed * 4) + ((seed * 5) % 8),
          drift: -28 + ((seed * 23) % 56),
        };
      };

      const createDrop = (id, speed) => {
        const seed = id + 1;

        return {
          x: (seed * 31) % 100,
          length: 34 + ((seed * 13) % 34),
          delay: -((seed * 7) % 80) / 10,
          duration: Math.max(0.45, 1.8 - speed * 0.28) + ((seed * 3) % 5) / 10,
        };
      };

      const createFirefly = (id, speed) => {
        const seed = id + 1;

        return {
          x: (seed * 43) % 100,
          y: 35 + ((seed * 19) % 55),
          delay: -((seed * 29) % 100) / 10,
          duration: Math.max(5, 15 - speed * 2) + ((seed * 7) % 6),
          driftX: -36 + ((seed * 17) % 72),
          driftY: -24 + ((seed * 11) % 48),
        };
      };

      const createFog = (id, speed) => {
        const seed = id + 1;

        return {
          y: 18 + ((seed * 23) % 70),
          delay: -((seed * 13) % 80) / 10,
          duration: Math.max(12, 34 - speed * 5) + ((seed * 7) % 8),
          scale: 0.8 + ((seed * 5) % 8) / 10,
        };
      };

      const createRay = (id, speed) => {
        const seed = id + 1;

        return {
          x: (seed * 21) % 90,
          width: 12 + ((seed * 9) % 20),
          delay: -((seed * 17) % 90) / 10,
          duration: Math.max(8, 24 - speed * 3) + ((seed * 5) % 7),
          rotation: -22 + ((seed * 11) % 28),
        };
      };

      const createStar = (id, speed) => {
        const seed = id + 1;

        return {
          x: (seed * 47) % 100,
          y: (seed * 31) % 82,
          size: 1 + ((seed * 7) % 3),
          delay: -((seed * 19) % 80) / 10,
          duration: Math.max(2.5, 8 - speed) + ((seed * 5) % 4),
        };
      };

      const renderGlowParticles = (effect) => {
        const layer = document.createElement('div');
        layer.className = 'effect-layer glow-particles-layer effect-variant-' + (effect.variant || 'soft_glow');
        layer.style.opacity = effect.opacity;

        for (let index = 0; index < effect.count; index += 1) {
          const particle = createGlowParticle(index, effect.speed);
          const element = document.createElement('span');
          element.className = 'glow-particle';
          element.style.setProperty('--particle-x', particle.x + '%');
          element.style.setProperty('--particle-y', particle.y + '%');
          element.style.setProperty('--particle-size', particle.size + 'px');
          element.style.setProperty('--particle-delay', particle.delay + 's');
          element.style.setProperty('--particle-duration', particle.duration + 's');
          layer.append(element);
        }

        return layer;
      };

      const renderPetals = (effect) => {
        const layer = document.createElement('div');
        layer.className = 'effect-layer petals-layer effect-variant-' + (effect.variant || 'sakura');
        layer.style.opacity = effect.opacity;

        for (let index = 0; index < effect.count; index += 1) {
          const petal = createPetal(index, effect.speed);
          const element = document.createElement('span');
          element.className = 'petal';
          element.style.setProperty('--petal-x', petal.x + '%');
          element.style.setProperty('--petal-size', petal.size + 'px');
          element.style.setProperty('--petal-delay', petal.delay + 's');
          element.style.setProperty('--petal-duration', petal.duration + 's');
          element.style.setProperty('--petal-drift', petal.drift + 'px');
          element.style.setProperty('--petal-rotation', petal.rotation + 'deg');
          layer.append(element);
        }

        return layer;
      };

      const renderSnow = (effect) => {
        const layer = document.createElement('div');
        layer.className = 'effect-layer snow-layer effect-variant-' + (effect.variant || 'light_snow');
        layer.style.opacity = effect.opacity;

        for (let index = 0; index < effect.count; index += 1) {
          const flake = createSnowflake(index, effect.speed);
          const element = document.createElement('span');
          element.className = 'snowflake';
          element.style.setProperty('--snow-x', flake.x + '%');
          element.style.setProperty('--snow-size', flake.size + 'px');
          element.style.setProperty('--snow-delay', flake.delay + 's');
          element.style.setProperty('--snow-duration', flake.duration + 's');
          element.style.setProperty('--snow-drift', flake.drift + 'px');
          layer.append(element);
        }

        return layer;
      };

      const renderRain = (effect) => {
        const layer = document.createElement('div');
        layer.className = 'effect-layer rain-layer effect-variant-' + (effect.variant || 'drizzle');
        layer.style.opacity = effect.opacity;

        for (let index = 0; index < effect.count; index += 1) {
          const drop = createDrop(index, effect.speed);
          const element = document.createElement('span');
          element.className = 'raindrop';
          element.style.setProperty('--rain-x', drop.x + '%');
          element.style.setProperty('--rain-length', drop.length + 'px');
          element.style.setProperty('--rain-delay', drop.delay + 's');
          element.style.setProperty('--rain-duration', drop.duration + 's');
          layer.append(element);
        }

        return layer;
      };

      const renderFireflies = (effect) => {
        const layer = document.createElement('div');
        layer.className = 'effect-layer fireflies-layer effect-variant-' + (effect.variant || 'warm_fireflies');
        layer.style.opacity = effect.opacity;

        for (let index = 0; index < effect.count; index += 1) {
          const firefly = createFirefly(index, effect.speed);
          const element = document.createElement('span');
          element.className = 'firefly';
          element.style.setProperty('--firefly-x', firefly.x + '%');
          element.style.setProperty('--firefly-y', firefly.y + '%');
          element.style.setProperty('--firefly-delay', firefly.delay + 's');
          element.style.setProperty('--firefly-duration', firefly.duration + 's');
          element.style.setProperty('--firefly-drift-x', firefly.driftX + 'px');
          element.style.setProperty('--firefly-drift-y', firefly.driftY + 'px');
          layer.append(element);
        }

        return layer;
      };

      const renderFog = (effect) => {
        const layer = document.createElement('div');
        layer.className = 'effect-layer fog-layer effect-variant-' + (effect.variant || 'soft_mist');
        layer.style.opacity = effect.opacity;

        for (let index = 0; index < effect.count; index += 1) {
          const fog = createFog(index, effect.speed);
          const element = document.createElement('span');
          element.className = 'fog-bank';
          element.style.setProperty('--fog-y', fog.y + '%');
          element.style.setProperty('--fog-delay', fog.delay + 's');
          element.style.setProperty('--fog-duration', fog.duration + 's');
          element.style.setProperty('--fog-scale', fog.scale);
          layer.append(element);
        }

        return layer;
      };

      const renderLightRays = (effect) => {
        const layer = document.createElement('div');
        layer.className = 'effect-layer light-rays-layer effect-variant-' + (effect.variant || 'morning_rays');
        layer.style.opacity = effect.opacity;

        for (let index = 0; index < effect.count; index += 1) {
          const ray = createRay(index, effect.speed);
          const element = document.createElement('span');
          element.className = 'light-ray';
          element.style.setProperty('--ray-x', ray.x + '%');
          element.style.setProperty('--ray-width', ray.width + '%');
          element.style.setProperty('--ray-delay', ray.delay + 's');
          element.style.setProperty('--ray-duration', ray.duration + 's');
          element.style.setProperty('--ray-rotation', ray.rotation + 'deg');
          layer.append(element);
        }

        return layer;
      };

      const renderStars = (effect) => {
        const layer = document.createElement('div');
        layer.className = 'effect-layer stars-layer effect-variant-' + (effect.variant || 'twinkle');
        layer.style.opacity = effect.opacity;

        for (let index = 0; index < effect.count; index += 1) {
          const star = createStar(index, effect.speed);
          const element = document.createElement('span');
          element.className = 'star';
          element.style.setProperty('--star-x', star.x + '%');
          element.style.setProperty('--star-y', star.y + '%');
          element.style.setProperty('--star-size', star.size + 'px');
          element.style.setProperty('--star-delay', star.delay + 's');
          element.style.setProperty('--star-duration', star.duration + 's');
          layer.append(element);
        }

        return layer;
      };

      const layerToEffect = (layer) => {
        if (layer.type === 'background' || !layer.visible) {
          return null;
        }

        return {
          type: layer.type,
          enabled: layer.visible,
          count: layer.settings.count || 0,
          speed: layer.settings.speed || 1,
          opacity: layer.settings.opacity || 0,
          variant: layer.settings.variant,
          zIndex: layer.zIndex,
        };
      };

      const getRenderableEffects = (spec) => {
        if (Array.isArray(spec.layers) && spec.layers.length > 0) {
          return spec.layers
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .map(layerToEffect)
            .filter(Boolean);
        }

        return spec.effects || [];
      };

      const renderWallpaper = (spec) => {
        wallpaper.innerHTML = '';

        const image = document.createElement('img');
        image.className = 'wallpaper-image';
        image.src = spec.imageUrl;
        image.alt = '';
        image.style.setProperty('--camera-zoom', spec.camera.zoom);
        image.style.zIndex =
          (spec.layers || []).find((layer) => layer.type === 'background')
            ?.zIndex || 0;
        image.style.setProperty(
          '--camera-duration',
          Math.max(6, 28 - spec.camera.speed * 4) + 's',
        );

        if ((spec.camera.enabled || spec.camera.type !== 'static') && spec.camera.type !== 'static') {
          image.classList.add('camera-' + spec.camera.type);
        }

        wallpaper.append(image);

        getRenderableEffects(spec)
          .filter((effect) => effect.enabled && effect.count > 0)
          .forEach((effect) => {
            const appendLayer = (layer) => {
              layer.style.zIndex = effect.zIndex || 2;
              wallpaper.append(layer);
            };

            if (effect.type === 'glow_particles') {
              appendLayer(renderGlowParticles(effect));
            }

            if (effect.type === 'petals') {
              appendLayer(renderPetals(effect));
            }

            if (effect.type === 'snow') {
              appendLayer(renderSnow(effect));
            }

            if (effect.type === 'rain') {
              appendLayer(renderRain(effect));
            }

            if (effect.type === 'fireflies') {
              appendLayer(renderFireflies(effect));
            }

            if (effect.type === 'fog') {
              appendLayer(renderFog(effect));
            }

            if (effect.type === 'light_rays') {
              appendLayer(renderLightRays(effect));
            }

            if (effect.type === 'stars') {
              appendLayer(renderStars(effect));
            }
          });
      };

      fetch('./wallpaperSpec.json')
        .then((response) => {
          if (!response.ok) {
            throw new Error('WallpaperSpec could not be loaded.');
          }

          return response.json();
        })
        .then(renderWallpaper)
        .catch(() => setError('WallpaperSpec could not be loaded.'));
    </script>
  </body>
</html>
`

export const exportWallpaperPackage = async (
  spec: WallpaperSpec,
): Promise<void> => {
  const imageBlob = await fetchWallpaperImage(spec.imageUrl)
  const portableSpec = createPortableSpec(spec)
  const zip = new JSZip()
  const root = zip.folder(PACKAGE_ROOT)

  if (!root) {
    throw new Error('Failed to create wallpaper package.')
  }

  root.file('index.html', createPackageHtml())
  root.file('wallpaperSpec.json', serializeWallpaperSpec(portableSpec))
  root.file('README.md', createPackageReadme())
  root.folder('assets')?.file('wallpaper-image.png', imageBlob)

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(zipBlob, PACKAGE_ZIP_FILENAME)
}
