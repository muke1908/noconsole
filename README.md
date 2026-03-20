# NoConsole

A beautiful, real-time WebSocket-based logging system with AI-powered log analysis.

## 🌟 Features

- **WebSocket Logger Library** (`@noconsole/logger`)
  - Drop-in replacement for browser `console` API
  - Sends structured log messages over WebSocket
  - Dependency injection for WebSocket instance
  - Graceful fallback when disconnected
  - Full TypeScript support

- **Beautiful Web Client** (`@noconsole/client`)
  - Dark-themed, terminal-style interface
  - Real-time log streaming with pause/resume
  - Virtualized rendering for excellent performance (thousands of logs)
  - Advanced filtering (by level, text search with highlight)
  - AI-powered log analysis using Ollama
  - Export logs as JSON
  - Auto-scroll with manual override

## 📦 Monorepo Structure

```
noconsole/
├── packages/
│   ├── logger/          # TypeScript logger library
│   └── client/          # Vite + React web client
└── package.json         # Workspace configuration
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Packages

```bash
npm run build
```

### 3. Run the Client

```bash
npm run dev
```

The client will start at `http://localhost:5173` and attempt to connect to a WebSocket server at `ws://localhost:8080`.

## 📚 Usage

### Using the Logger Library

```typescript
import { WebSocketLogger } from '@noconsole/logger';

// Create WebSocket connection
const ws = new WebSocket('ws://localhost:8080');

// Create logger instance
const logger = new WebSocketLogger(ws);

// Use like normal console
logger.log('Hello world!', { foo: 'bar' });
logger.warn('This is a warning');
logger.error('Error occurred:', new Error('Oops'));
logger.info('Information message');
logger.debug('Debug details', [1, 2, 3]);

// All standard console methods supported:
logger.time('operation');
// ... do work ...
logger.timeEnd('operation');

logger.count('clicks');
logger.table([{ name: 'Alice', age: 30 }]);
logger.group('Group Title');
logger.log('Inside group');
logger.groupEnd();
```

### Log Message Format

Each log message sent over WebSocket has this structure:

```typescript
interface LogMessage {
  type: 'log' | 'warn' | 'error' | 'info' | 'debug' | ...;
  args: any[];
  timestamp: number;
  id: string;
}
```

Example:
```json
{
  "type": "error",
  "args": ["Failed to fetch", { "status": 404 }],
  "timestamp": 1710932400000,
  "id": "a1b2c3d4e"
}
```

## 🎨 Client Features

### Filtering
- Filter by log level (log, info, warn, error, debug)
- Text search with real-time highlighting
- Case-sensitive search toggle

### Controls
- **Pause/Resume**: Stop receiving new logs temporarily
- **Clear**: Remove all logs from view
- **Export**: Download logs as JSON file
- **AI Analysis**: Analyze logs with Ollama (requires local Ollama installation)

### AI Analysis

The client can send logs to a local Ollama instance for intelligent analysis:

1. Install [Ollama](https://ollama.ai/)
2. Pull a model: `ollama pull llama3.2`
3. Start Ollama (it runs on `http://localhost:11434` by default)
4. Click "AI Analysis" in the client
5. Select your model and click "Analyze Logs"

The AI will categorize findings into:
- **Errors**: Detected errors and their causes
- **Warnings**: Potential issues
- **Performance**: Performance-related concerns
- **Recommendations**: Actionable improvements

## 🛠️ Development

### Project Commands

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run client in dev mode
npm run dev

# Run tests (if available)
npm test
```

### Package-Specific Commands

**Logger:**
```bash
cd packages/logger
npm run build
npm test
```

**Client:**
```bash
cd packages/client
npm run dev
npm run build
npm run preview
```

## 🏗️ Architecture

### Logger Package

- **WebSocketLogger.ts**: Main logger class implementing Console interface
- **index.ts**: Public API exports
- **index.test.ts**: Jest tests

Built with TypeScript, outputs to `dist/` with type declarations.

### Client Package

- **Components**:
  - `Header`: Top bar with connection status and controls
  - `FilterBar`: Level filters and search
  - `LogViewer`: Virtualized log display
  - `LogRow`: Individual log entry rendering
  - `LLMPanel`: AI analysis sidebar
  - `StatusBar`: WebSocket connection indicator

- **Hooks**:
  - `useWebSocket`: Manages WebSocket connection and log state
  - `useLLM`: Handles Ollama API communication

- **Tech Stack**:
  - React 18
  - TypeScript
  - Vite (build tool)
  - TailwindCSS (styling)
  - @tanstack/react-virtual (virtualization)

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please feel free to submit issues or pull requests.

Not a console logger
