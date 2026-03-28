import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const LOGGER_DIST_DIR = path.resolve(__dirname, '../../logger/dist');
const LOGGER_PATH_PREFIX = '/logger';
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

// Namespace management
// Map from namespace → Set of viewer WebSocket connections
const namespaceViewers = new Map();
// Map from namespace → count of active logger connections
const activeLoggerCounts = new Map();

// Pattern used to identify viewer connections by URL path.
// Matches namespace slugs that are either UUIDs or url-based slugs (e.g. https-www.domain1.com-3000).
const NAMESPACE_PATH_RE = /^\/([a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?)\/?$/;

// Valid namespace characters (no colons so IPv6 addresses fall back to UUID).
const VALID_NAMESPACE_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?$/;

/** Derive a namespace slug from the WebSocket request's Origin header.
 *  Uses the full URL (scheme + hostname + port) so that different origins
 *  on the same host (e.g. http://localhost:3000 vs http://localhost:4000)
 *  receive distinct namespaces.
 */
function getNamespaceFromOrigin(originHeader) {
  if (!originHeader) return null;
  try {
    const { protocol, hostname, port } = new URL(originHeader);
    const scheme = protocol.replace(':', ''); // strip trailing colon
    const namespace = port
      ? `${scheme}-${hostname}-${port}`
      : `${scheme}-${hostname}`;
    return VALID_NAMESPACE_RE.test(namespace) ? namespace : null;
  } catch {
    return null;
  }
}

// HTTP server — serves the built React client from dist/
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const reqUrl = req.url ?? '/';

  // Serve the logger package from /logger/
  if (reqUrl === LOGGER_PATH_PREFIX || reqUrl.startsWith(LOGGER_PATH_PREFIX + '/')) {
    const suffix = reqUrl.slice(LOGGER_PATH_PREFIX.length) || '/index.js';
    const safeSuffix = path.normalize(suffix.split('?')[0]);
    const filePath = path.join(LOGGER_DIST_DIR, safeSuffix);
    if (!filePath.startsWith(LOGGER_DIST_DIR + path.sep) && filePath !== LOGGER_DIST_DIR) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Bad request');
      return;
    }
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] ?? 'text/plain';
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      }
    });
    return;
  }

  // Return the list of namespaces that currently have an active logger
  if (reqUrl === '/api/namespaces') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([...activeLoggerCounts.keys()]));
    return;
  }

  const url = reqUrl === '/' ? '/index.html' : reqUrl;
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

wss.on('connection', (ws, req) => {
  const urlPath = (req.url ?? '/').split('?')[0];
  const namespaceMatch = urlPath.match(NAMESPACE_PATH_RE);

  if (namespaceMatch) {
    // ── Viewer connection ─────────────────────────────────────────────────
    const namespace = namespaceMatch[1].toLowerCase();
    if (!namespaceViewers.has(namespace)) {
      namespaceViewers.set(namespace, new Set());
    }
    namespaceViewers.get(namespace).add(ws);
    console.log(`Viewer connected    | namespace: ${namespace}`);

    ws.send(JSON.stringify({
      type: 'info',
      args: [`Connected to NoConsole streamer | namespace: ${namespace}`],
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    }));

    ws.on('close', () => {
      const viewers = namespaceViewers.get(namespace);
      if (viewers) {
        viewers.delete(ws);
        if (viewers.size === 0 && !activeLoggerCounts.has(namespace)) {
          namespaceViewers.delete(namespace);
        }
      }
      console.log(`Viewer disconnected | namespace: ${namespace}`);
    });

    ws.on('error', (error) => {
      console.error('Viewer WebSocket error:', error);
    });
  } else {
    // ── Logger connection ─────────────────────────────────────────────────
    // Derive namespace from the Origin header so that all connections from
    // the same origin share one namespace.  The full URL (scheme + hostname +
    // port) is encoded into a path-safe slug so that different ports on the
    // same host get distinct namespaces.  Fall back to a UUID when the
    // header is absent (e.g. Node.js clients) or contains an unusable value.
    const originNamespace = getNamespaceFromOrigin(req.headers.origin);
    const namespace = originNamespace ?? crypto.randomUUID();

    activeLoggerCounts.set(namespace, (activeLoggerCounts.get(namespace) ?? 0) + 1);
    if (!namespaceViewers.has(namespace)) {
      namespaceViewers.set(namespace, new Set());
    }
    console.log(`Logger connected    | namespace: ${namespace}`);
    console.log(`View logs at:         http://localhost:${PORT}/${namespace}`);

    const host = req.headers.host ?? `localhost:${PORT}`;
    const protocol = req.socket?.encrypted ? 'https' : 'http';
    const viewerUrl = `${protocol}://${host}/${namespace}`;

    ws.send(JSON.stringify({
      type: 'namespace',
      namespace,
      viewerUrl,
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    }));

    ws.on('message', (message, isBinary) => {
      // Always relay as a UTF-8 text frame so browser clients receive a string,
      // not a Blob/ArrayBuffer (which happens when a raw Buffer is forwarded).
      const text = isBinary ? message.toString('utf8') : message.toString();
      const viewers = namespaceViewers.get(namespace);
      if (viewers) {
        viewers.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(text);
          }
        });
      }
    });

    ws.on('close', () => {
      const count = (activeLoggerCounts.get(namespace) ?? 1) - 1;
      if (count <= 0) {
        activeLoggerCounts.delete(namespace);
        const viewers = namespaceViewers.get(namespace);
        if (viewers && viewers.size === 0) {
          namespaceViewers.delete(namespace);
        }
      } else {
        activeLoggerCounts.set(namespace, count);
      }
      console.log(`Logger disconnected | namespace: ${namespace}`);
    });

    ws.on('error', (error) => {
      console.error('Logger WebSocket error:', error);
    });
  }
});
