# AI Wallpaper Engine

AI Wallpaper Engine is a React-based dynamic wallpaper studio. It lets users upload an image, build a layer-based animated wallpaper, preview it fullscreen, and export the project as either JSON or a standalone web wallpaper package.

## Core Features

- Upload wallpaper image
- Layer based editor
- Effect library
- WallpaperSpec
- Fullscreen preview
- Export wallpaperSpec.json
- Export standalone wallpaper package

## Tech Stack

- React
- TypeScript
- Vite
- CSS animations
- JSZip

## Running Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Architecture

```text
Image Upload -> WallpaperSpec -> Layer System -> Renderer -> Preview / Export
```

The editor stores the current wallpaper as a `WallpaperSpec`. The spec includes the uploaded image URL, camera settings, legacy effect data, and the current layer stack. The renderer reads the layer stack, orders layers by `zIndex`, and renders the background plus animated effect layers. Preview and export flows reuse the same spec.

## Directory Structure

```text
ai-wallpaper-engine/
|-- docs/
|   |-- export-package.md
|   |-- layer-system.md
|   `-- wallpaper-spec.md
|-- public/
|-- src/
|   |-- components/
|   |   `-- studio/
|   |-- pages/
|   |-- renderer/
|   |   `-- effects/
|   |-- services/
|   |-- specs/
|   `-- types/
|-- package.json
`-- vite.config.ts
```

## Key Modules

- `src/pages/WallpaperStudioPage.tsx`: main editor page.
- `src/pages/WallpaperPreviewPage.tsx`: fullscreen preview route.
- `src/renderer/WallpaperRenderer.tsx`: renders background and animated layers.
- `src/renderer/effects/`: effect layer implementations.
- `src/components/studio/`: editor panels, canvas, layer UI, and inspector.
- `src/services/exportWallpaperSpec.ts`: JSON export.
- `src/services/exportWallpaperPackage.ts`: standalone zip package export.
- `src/types/WallpaperSpec.ts`: shared spec and layer types.

## Roadmap

- Smart Match
- Image similarity case search
- Electron desktop mode
- More effect layers
