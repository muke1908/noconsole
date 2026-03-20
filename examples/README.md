# Example WebSocket Server

This directory contains example servers that you can use to test the NoConsole logger and client.

## Node.js WebSocket Server

A simple WebSocket server that echoes received log messages.

### Prerequisites

```bash
npm install ws
```

### Run

```bash
node server.js
```

The server will start on `ws://localhost:8080`.

## Testing

1. Start the WebSocket server: `node server.js`
2. Start the client: `npm run dev` (from root)
3. Open browser to `http://localhost:5173`
4. Open the example HTML page or use the logger programmatically

You should see the client connect and display any logs sent through the WebSocket.
