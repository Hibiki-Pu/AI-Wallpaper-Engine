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

      .wallpaper-image.ken-burns {
        animation: ken-burns var(--camera-duration) ease-in-out infinite alternate;
        will-change: transform;
      }

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

      .error {
        display: grid;
        place-items: center;
        width: 100%;
        height: 100%;
        color: #dce9f5;
        font: 18px/1.5 system-ui, sans-serif;
      }

      @keyframes ken-burns {
        from {
          transform: scale(1) translate3d(-0.4%, -0.4%, 0);
        }

        to {
          transform: scale(var(--camera-zoom)) translate3d(0.6%, 0.5%, 0);
        }
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

      const renderGlowParticles = (effect) => {
        const layer = document.createElement('div');
        layer.className = 'effect-layer glow-particles-layer';
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
        layer.className = 'effect-layer petals-layer';
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

      const renderWallpaper = (spec) => {
        wallpaper.innerHTML = '';

        const image = document.createElement('img');
        image.className = 'wallpaper-image';
        image.src = spec.imageUrl;
        image.alt = '';
        image.style.setProperty('--camera-zoom', spec.camera.zoom);
        image.style.setProperty(
          '--camera-duration',
          Math.max(6, 28 - spec.camera.speed * 4) + 's',
        );

        if (spec.camera.type === 'ken_burns') {
          image.classList.add('ken-burns');
        }

        wallpaper.append(image);

        spec.effects
          .filter((effect) => effect.enabled && effect.count > 0)
          .forEach((effect) => {
            if (effect.type === 'glow_particles') {
              wallpaper.append(renderGlowParticles(effect));
            }

            if (effect.type === 'petals') {
              wallpaper.append(renderPetals(effect));
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
