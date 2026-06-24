# AI Wallpaper Engine

AI Wallpaper Engine is a React-based dynamic wallpaper studio. It lets users upload an image, build a layer-based animated wallpaper, preview it fullscreen, and export the project as either JSON or a standalone web wallpaper package.

AI Wallpaper Engine 是一个基于 React 的动态壁纸工作台。用户可以上传图片，用图层系统编辑动态特效，全屏预览壁纸，并导出 `WallpaperSpec` 或独立网页壁纸包。

## Core Features

核心功能：

- Upload wallpaper image
- 上传壁纸图片
- Layer based editor
- 图层化编辑器
- Effect library
- 特效库
- WallpaperSpec
- 壁纸配置协议
- Fullscreen preview
- 全屏预览
- Export wallpaperSpec.json
- 导出 wallpaperSpec.json
- Export standalone wallpaper package
- 导出独立网页壁纸包

## Tech Stack

技术栈：

- React
- TypeScript
- Vite
- CSS animations
- JSZip

## Running Locally / 本地运行

You do not need to start many services. This project only needs one Vite dev server.

不需要开很多东西。这个项目本地运行时只需要启动一个 Vite 开发服务器。

### One-click on Windows / Windows 一键运行

Double-click:

```text
start-dev.bat
```

Or run it from the terminal:

```bash
start-dev.bat
```

The script will install dependencies if `node_modules` does not exist, then start the dev server.

这个脚本会在没有 `node_modules` 时自动安装依赖，然后启动开发服务器。

Open:

```text
http://127.0.0.1:5173/
```

### Manual commands / 手动命令

Install dependencies once:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Or:

```bash
npm start
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

编辑器会把当前壁纸保存为 `WallpaperSpec`。Spec 包含上传图片 URL、相机配置、兼容用 effects 数据，以及当前图层栈。渲染器读取图层栈，按 `zIndex` 排序，渲染背景和动态特效图层。预览与导出流程复用同一份 Spec。

## Directory Structure

目录结构：

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

关键模块：

- `src/pages/WallpaperStudioPage.tsx`: main editor page.
- `src/pages/WallpaperStudioPage.tsx`: 主编辑器页面。
- `src/pages/WallpaperPreviewPage.tsx`: fullscreen preview route.
- `src/pages/WallpaperPreviewPage.tsx`: 全屏预览页面。
- `src/renderer/WallpaperRenderer.tsx`: renders background and animated layers.
- `src/renderer/WallpaperRenderer.tsx`: 渲染背景与动态特效图层。
- `src/renderer/effects/`: effect layer implementations.
- `src/renderer/effects/`: 特效图层实现。
- `src/components/studio/`: editor panels, canvas, layer UI, and inspector.
- `src/components/studio/`: 编辑器面板、画布、图层 UI 和检查器。
- `src/services/exportWallpaperSpec.ts`: JSON export.
- `src/services/exportWallpaperSpec.ts`: JSON 导出。
- `src/services/exportWallpaperPackage.ts`: standalone zip package export.
- `src/services/exportWallpaperPackage.ts`: 独立 zip 壁纸包导出。
- `src/types/WallpaperSpec.ts`: shared spec and layer types.
- `src/types/WallpaperSpec.ts`: 共享 Spec 与图层类型。

## Roadmap

路线图：

- Smart Match
- 智能匹配
- Image similarity case search
- 图片相似案例搜索
- Electron desktop mode
- Electron 桌面模式
- More effect layers
- 更多特效图层
