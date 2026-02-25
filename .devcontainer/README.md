# Dev Container - Teams Chat Viewer

Covers all technologies in the Wails implementation plan:

- **Go 1.22** – backend, JSON parsing, search
- **Node.js LTS** – frontend (Vite, React/Vue, TypeScript)
- **Wails CLI** – `wails dev`, `wails build`
- **Linux deps** – GTK, WebKit (native WebView for `wails dev` on Linux)
- **Tailwind CSS** – via VS Code extension (frontend will add its own deps)
- **GStreamer** – `gstreamer1.0-plugins-good` for audio/video in WebView

## Usage

1. Open the project in VS Code.
2. Use “Reopen in Container” when prompted, or run **Dev Containers: Reopen in Container**.
3. In the container: `cd viewer && wails dev` (after the viewer is scaffolded).

## Note for Ubuntu 24.04+

If you use a base image based on Ubuntu 24.04, `libwebkit2gtk-4.0` may not be available. Then either:

- Switch to `libwebkit2gtk-4.1-dev`, or  
- Build with: `wails build -tags webkit2_41`
