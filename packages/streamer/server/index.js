import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// HTTP server — serves the built React client from dist/
const server = http.createServer((req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url;
  // Resolve and validate the path to prevent directory traversal
  const safeSuffix = path.normalize(url.split('?')[0]);
  const filePath = path.join(DIST_DIR, safeSuffix);
  if (!filePath.startsWith(DIST_DIR + path.sep) && filePath !== DIST_DIR) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad request');
    return;
  }
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] ?? 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback — serve index.html for any unknown route
      fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, html) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html);
        }
      });
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

// WebSocket server — attached to the same HTTP server so both share one port
const wss = new WebSocketServer({ server });

server.listen(PORT, () => {
  console.log(`NoConsole streamer listening on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint:            ws://localhost:${PORT}`);
});

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message, isBinary) => {
    // Always relay as a UTF-8 text frame so browser clients receive a string,
    // not a Blob/ArrayBuffer (which happens when a raw Buffer is forwarded).
    const text = isBinary ? message.toString('utf8') : message.toString();
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(text);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Send a welcome message
  ws.send(JSON.stringify({
    type: 'info',
    args: ['Connected to NoConsole streamer'],
    timestamp: Date.now(),
    id: crypto.randomUUID(),
  }));
});
