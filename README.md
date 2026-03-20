# NoConsole

A real-time WebSocket-based log streaming system with AI-powered analysis.

## 📦 Packages

### `@noconsole/logger`

Drop-in replacement for the browser `console` API that routes all output over a WebSocket.

```typescript
import { WebSocketLogger } from '@noconsole/logger';

const ws = new WebSocket('ws://localhost:8080');
const logger = new WebSocketLogger(ws);

logger.log('Hello world!', { foo: 'bar' });
logger.warn('High memory', { usage: '92%' });
logger.error('Unhandled rejection', err);
// Sends: { type, args, timestamp, id }
```

- Full `Console` interface (`log`, `warn`, `error`, `info`, `debug`, `time`/`timeEnd`, `count`, `table`, `group`, …)
- `WebSocket | null` — caller owns the socket lifecycle
- Silent no-op when socket is null or not `OPEN`
- Full TypeScript support

### `@noconsole/streamer`

All-in-one viewer: a WebSocket broadcast server **plus** the React web client in a single package.

#### Server (`packages/streamer/server/index.js`)

Minimal WebSocket server that accepts connections from `@noconsole/logger` instances and broadcasts each message to all connected viewer clients.

```bash
npm run server --workspace=packages/streamer
# or
node packages/streamer/server/index.js
```

Listens on `ws://localhost:8080` by default (override with `PORT=…`).

#### Client (React + Vite)

Real-time log viewer served at `http://localhost:5173` in dev mode.

- **Virtualized list** (`@tanstack/react-virtual`) — handles thousands of entries without degradation
- **Level filters**: All / Log / Info / Warn / Error / Debug
- **Search**: real-time substring match with inline highlight; case-sensitivity toggle
- **Pause/Resume**: buffers up to 10k logs while paused, flushes on resume
- **Auto-scroll** with smart manual override
- **AI Analysis panel**: streams logs to a local [Ollama](https://ollama.com) instance, response parsed into Errors / Warnings / Performance / Recommendations
- Export logs as JSON

## 🗂️ Monorepo Structure

```
noconsole/
├── packages/
│   ├── logger/          # @noconsole/logger — WebSocket logger library
│   └── streamer/        # @noconsole/streamer — WS server + React viewer
│       └── server/      #   broadcast server (Node.js)
└── package.json         # workspace root
```

## 🚀 Quick Start

```bash
# 1. Install all dependencies
npm install

# 2. Build all packages
npm run build

# 3a. Start the broadcast server
npm run server

# 3b. In another terminal, start the dev viewer (client + server together)
npm run dev
```

`npm run dev` inside `packages/streamer` starts both the WS server and the Vite dev server concurrently via `concurrently`.

## 🏗️ Architecture

### Log Message Format

```typescript
interface LogMessage {
  type: 'log' | 'warn' | 'error' | 'info' | 'debug' | ...;
  args: any[];
  timestamp: number;
  id: string;
}
```

### Logger Package

- `WebSocketLogger.ts` — implements the Console interface
- `index.ts` — public API
- `index.test.ts` — Jest tests

### Streamer Package

- `server/index.js` — Node.js WebSocket broadcast server
- `src/` — React + TypeScript viewer
  - **Hooks**: `useWebSocket` (connection + log state), `useLLM` (Ollama)
  - **Components**: `Header`, `FilterBar`, `LogViewer`, `LogRow`, `LLMPanel`

## 🛠️ Commands

```bash
# Root
npm install           # install all workspace dependencies
npm run build         # build all packages
npm run dev           # start streamer dev server (WS + Vite)
npm run server        # start WS broadcast server only
npm test              # run logger tests

# packages/logger
npm run build
npm test

# packages/streamer
npm run dev           # WS server + Vite (concurrent)
npm run build         # production build
npm run server:start  # WS server only
```

## 🤖 AI Analysis

1. Install [Ollama](https://ollama.ai/) and pull a model: `ollama pull llama3.2`
2. Start Ollama (`http://localhost:11434`)
3. Click **AI Analysis** in the viewer
4. Select your model and click **Analyze Logs**

## 📄 License

MIT
