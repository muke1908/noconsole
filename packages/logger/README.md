# @noconsole/logger

A zero-dependency browser logger that forwards `console`-compatible calls over WebSocket to a [NoConsole streamer](../streamer) server.

## Usage

Import the logger directly from your deployed streamer instance — no npm install needed:

```js
const { WebSocketLogger } = await import('https://<your-streamer-host>/logger');

const logger = new WebSocketLogger('wss://<your-streamer-host>');

logger.log('Hello from the browser!');
logger.warn('Something looks off');
logger.error('Oops', new Error('details'));
```

### Example (Azure Web App)

```js
const { WebSocketLogger } = await import(
  'https://noconsole-streamer-cfgaebcsfee6d0bj.westeurope-01.azurewebsites.net/logger'
);

const logger = new WebSocketLogger(
  'wss://noconsole-streamer-cfgaebcsfee6d0bj.westeurope-01.azurewebsites.net'
);

logger.log('Connected!');
```

## API

`WebSocketLogger` implements the full browser `Console` interface, so you can use it as a drop-in replacement for `console`:

| Method | Description |
|---|---|
| `log(...args)` | Log a message |
| `warn(...args)` | Log a warning |
| `error(...args)` | Log an error |
| `info(...args)` | Log info |
| `debug(...args)` | Log debug |
| `group(...args)` | Start a group |
| `groupEnd()` | End a group |
| `groupCollapsed(...args)` | Start a collapsed group |
| `table(data, columns?)` | Log tabular data |
| `time(label?)` | Start a timer |
| `timeEnd(label?)` | Stop a timer and log duration |
| `timeLog(label?, ...data)` | Log elapsed time |
| `count(label?)` | Increment and log a counter |
| `countReset(label?)` | Reset a counter |
| `assert(condition, ...data)` | Log if condition is false |
| `clear()` | Clear the log |
| `dir(obj, options?)` | Log object properties |
| `trace(...data)` | Log a stack trace |

## How it works

1. The streamer server serves `dist/index.js` (this package, bundled as ESM) at the `/logger` path.
2. The browser dynamically imports it via `import()`.
3. `WebSocketLogger` connects to the streamer's WebSocket endpoint and forwards all log calls as JSON messages.
4. The streamer relays messages to all connected dashboard clients.
