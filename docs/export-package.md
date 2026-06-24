# Export Package

AI Wallpaper Engine can export a standalone web wallpaper package.

## Zip Contents

```text
ai-wallpaper-package.zip
`-- ai-wallpaper-package/
    |-- index.html
    |-- wallpaperSpec.json
    |-- README.md
    `-- assets/
        `-- wallpaper-image.png
```

## How Export Works

The editor reads the current `WallpaperSpec`, fetches the uploaded wallpaper image, and writes it into the zip as `assets/wallpaper-image.png`.

The exported `wallpaperSpec.json` changes `imageUrl` to:

```text
./assets/wallpaper-image.png
```

This makes the package portable and independent from the browser object URL used inside the editor.

## Previewing the Package

Extract `ai-wallpaper-package.zip`, then open:

```text
ai-wallpaper-package/index.html
```

The HTML file is a standalone runtime. It loads `wallpaperSpec.json`, displays the background image, applies camera motion, and renders supported effect layers without React or the Vite dev server.

Some browsers restrict loading JSON from local files. If the wallpaper does not load when opened directly, serve the extracted folder with any static file server and open the local URL.

## Lively Wallpaper

To use the package with Lively Wallpaper:

1. Extract `ai-wallpaper-package.zip`.
2. Open Lively Wallpaper.
3. Add a new wallpaper.
4. Select `ai-wallpaper-package/index.html`.

## Notes

The package is not an Electron app and does not include a backend. It is a static web wallpaper bundle designed for previewing and future desktop integrations.
