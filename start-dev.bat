@echo off
setlocal

cd /d "%~dp0"

if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo Failed to install dependencies.
    pause
    exit /b 1
  )
)

echo Starting AI Wallpaper Engine...
echo Open http://127.0.0.1:5173/ after Vite is ready.
start "AI Wallpaper Runtime Host" /min cmd /c npm run runtime:host
call npm run dev -- --host 127.0.0.1

pause
