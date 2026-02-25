# Teams Chat Viewer

A cross-platform desktop application for browsing Microsoft Teams chat export JSON files. Built with [Wails](https://wails.io) (Go backend + React/TypeScript frontend).

## Features

- **Browse chats** — sidebar lists all chats sorted by most recent, with avatars and member counts
- **View messages** — full message history with sender, timestamps, HTML rendering, attachments, and system events
- **Search** — instant search across all chat names, message content, and sender names with result highlighting
- **Keyboard navigation** — arrow keys to navigate chats and search results
- **Native file picker** — open any Teams export JSON via the OS file dialog

## Prerequisites

- [Go 1.23+](https://go.dev/dl/)
- [Node.js 16+](https://nodejs.org/)
- [Wails CLI v2](https://wails.io/docs/gettingstarted/installation)

Install the Wails CLI:

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

Check your environment is ready:

```bash
wails doctor
```

## Development

Run the app in live-reload dev mode:

```bash
cd viewer
wails dev
```

This starts a Vite dev server with hot reload for frontend changes. Go changes trigger an automatic rebuild.

## Building

Build a production binary:

```bash
cd viewer
wails build
```

The binary is output to `build/bin/viewer` (or `viewer.exe` on Windows).

### Cross-compilation

```bash
wails build -platform windows/amd64
wails build -platform darwin/universal
```

## Usage

1. Launch the app (or run `wails dev` for development)
2. Click **Open Export File** and select your Teams export JSON
3. Browse chats in the sidebar, click to view messages
4. Use the search bar to find messages across all chats — click a result to jump to that message

## Project Structure

```
viewer/
├── main.go                      # Wails entry point
├── app.go                       # App struct with bound methods
├── internal/
│   ├── model/models.go          # Go structs matching the export JSON
│   ├── loader/loader.go         # File loading, chat summaries
│   └── search/search.go         # Search logic
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Root layout and state
│   │   ├── App.css              # All styles
│   │   └── components/
│   │       ├── ChatList.tsx     # Sidebar chat list
│   │       ├── MessageView.tsx  # Message display
│   │       └── SearchBar.tsx    # Search input + results dropdown
│   └── wailsjs/                 # Auto-generated TS bindings
└── wails.json                   # Wails project config
```

## Export JSON Format

The viewer expects the JSON structure produced by the MS Teams data export:

```json
{
  "chats": [
    {
      "id": "...",
      "name": "Chat Name",
      "chatType": "oneOnOne|group",
      "members": [{ "id": "...", "displayName": "..." }],
      "messages": [
        {
          "id": "...",
          "createdDateTime": "2024-01-15T10:30:00Z",
          "from": { "displayName": "Alice" },
          "body": { "content": "Hello!", "contentProcessed": "<p>Hello!</p>" },
          "messageType": "RichText/Html"
        }
      ]
    }
  ]
}
```
