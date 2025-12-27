# mempool.channel 

A real-time room-based application with Lightning Network payment integration. Users can create or join rooms, submit content requests via Bitcoin Lightning payments, and interact through a live chat and request queue system.


## Prerequisites

- Node.js 20+
- pnpm (`corepack enable && corepack prepare pnpm@latest --activate`)

## Project Structure

```
packages/
  frontend/   # React SPA (Vite + Tailwind)
  server/     # WebSocket server (Express + ws)
  shared/     # Shared types and utilities
```

## Development

Install dependencies:

```bash
pnpm install
```

Run both frontend and server in development mode:

```bash
pnpm dev
```

Or run them separately:

```bash
pnpm dev:frontend  # Vite dev server at http://localhost:5173
pnpm dev:server    # WebSocket server at ws://localhost:8080
```

## Building

Build all packages:

```bash
pnpm build
```

## Production

### Option 1: Docker (Recommended)

Build and run the container:

```bash
docker build -t mempool-band .
docker run -p 8080:8080 mempool-band
```

The application will be available at `http://localhost:8080`.

### Option 2: Manual

Build all packages:

```bash
pnpm build
```

Start the server with static file serving:

```bash
cd packages/server
STATIC_DIR=../frontend/dist node dist/index.js
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `STATIC_DIR` | Path to frontend build directory | - |
| `VITE_WS_URL` | WebSocket URL override (frontend build-time) | Auto-detected |
