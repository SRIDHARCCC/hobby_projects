const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(__dirname, 'public');

// In-memory traffic log for analysis
const trafficLogs = [];
const MAX_LOGS = 50;

function logRequest(req, res, durationMs, extra = {}) {
  const logEntry = {
    id: Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    durationMs: Math.round(durationMs * 100) / 100,
    clientIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    proto: req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http'),
    host: req.headers['host'] || 'localhost',
    contentLength: req.headers['content-length'] || 0,
    ...extra
  };

  trafficLogs.unshift(logEntry);
  if (trafficLogs.length > MAX_LOGS) {
    trafficLogs.pop();
  }
  return logEntry;
}

// SSE Clients for live real-time network stream
const sseClients = new Set();

function broadcastSSE(event, data) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(message);
  }
}

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const startTime = process.hrtime();
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS headers for flexible testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Helper to record log and finish response
  const finish = (statusCode, headers = {}, body = '') => {
    const diff = process.hrtime(startTime);
    const durationMs = diff[0] * 1000 + diff[1] / 1e6;
    res.writeHead(statusCode, headers);
    res.end(body);
    const entry = logRequest(req, res, durationMs);
    broadcastSSE('traffic', entry);
  };

  // --- API Endpoints ---

  // 1. Inspect Client & Network Headers
  if (pathname === '/api/inspect') {
    const info = {
      timestamp: new Date().toISOString(),
      client: {
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        forwardedFor: req.headers['x-forwarded-for'] || null,
        forwardedProto: req.headers['x-forwarded-proto'] || 'direct',
        forwardedHost: req.headers['x-forwarded-host'] || null,
        userAgent: req.headers['user-agent'] || '',
        acceptLanguage: req.headers['accept-language'] || '',
        acceptEncoding: req.headers['accept-encoding'] || '',
        remotePort: req.socket.remotePort,
      },
      connection: {
        httpVersion: req.httpVersion,
        method: req.method,
        url: req.url,
        headers: req.headers,
        encryptedDirectly: !!req.socket.encrypted
      },
      server: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        localAddress: req.socket.localAddress,
        localPort: req.socket.localPort
      }
    };
    return finish(200, { 'Content-Type': 'application/json' }, JSON.stringify(info, null, 2));
  }

  // 2. High-precision Ping / Latency Check
  if (pathname === '/api/ping') {
    const clientTimestamp = parsedUrl.searchParams.get('t') || null;
    const responsePayload = {
      pong: true,
      serverTime: Date.now(),
      clientSentTime: clientTimestamp ? Number(clientTimestamp) : null,
      message: 'Network round-trip pong response'
    };
    return finish(200, { 'Content-Type': 'application/json' }, JSON.stringify(responsePayload));
  }

  // 3. Dynamic HTTP Status Code Simulation
  if (pathname.startsWith('/api/status/')) {
    const code = parseInt(pathname.split('/')[3], 10) || 200;
    const statusMessages = {
      200: 'OK - Request succeeded.',
      201: 'Created - New resource successfully created on the server.',
      204: 'No Content - Action performed, no body returned.',
      301: 'Moved Permanently - URL redirection.',
      304: 'Not Modified - Client cache is still valid (ETag/conditional request).',
      400: 'Bad Request - Malformed syntax or invalid client input.',
      401: 'Unauthorized - Missing or invalid authentication token/credentials.',
      403: 'Forbidden - Authenticated, but lacking permission for this resource.',
      404: 'Not Found - The requested URL endpoint does not exist on this server.',
      429: 'Too Many Requests - Rate limit exceeded.',
      500: 'Internal Server Error - Unhandled exception in server logic.',
      502: 'Bad Gateway - Reverse proxy received invalid upstream response.',
      503: 'Service Unavailable - Server overloaded or under maintenance.',
      504: 'Gateway Timeout - Upstream server took too long to respond.'
    };

    const message = statusMessages[code] || `Simulated HTTP status ${code}`;
    return finish(code, { 'Content-Type': 'application/json' }, JSON.stringify({
      statusCode: code,
      message,
      category: code < 300 ? '2xx Success' : code < 400 ? '3xx Redirection' : code < 500 ? '4xx Client Error' : '5xx Server Error',
      timestamp: new Date().toISOString()
    }));
  }

  // 4. Simulated Network Latency / Delay
  if (pathname === '/api/delay') {
    const delayMs = Math.min(Math.max(parseInt(parsedUrl.searchParams.get('ms') || '1000', 10), 0), 10000);
    setTimeout(() => {
      finish(200, { 'Content-Type': 'application/json' }, JSON.stringify({
        message: `Response intentionally delayed by ${delayMs}ms to demonstrate Time To First Byte (TTFB).`,
        delaySimulatedMs: delayMs,
        timestamp: new Date().toISOString()
      }));
    }, delayMs);
    return;
  }

  // 5. Echo endpoint (Inspect body payload and size)
  if (pathname === '/api/echo') {
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk;
      // Cap at 1MB to prevent memory exhaustion
      if (bodyData.length > 1e6) {
        req.destroy();
      }
    });

    req.on('end', () => {
      let parsed = null;
      try {
        parsed = JSON.parse(bodyData);
      } catch (e) {
        parsed = bodyData;
      }

      const responsePayload = {
        receivedMethod: req.method,
        receivedBytes: Buffer.byteLength(bodyData, 'utf8'),
        receivedHeadersCount: Object.keys(req.headers).length,
        receivedContentType: req.headers['content-type'] || 'none',
        receivedBody: parsed,
        serverEchoTime: new Date().toISOString()
      };
      finish(200, { 'Content-Type': 'application/json' }, JSON.stringify(responsePayload, null, 2));
    });
    return;
  }

  // 6. Recent Traffic Log
  if (pathname === '/api/traffic') {
    return finish(200, { 'Content-Type': 'application/json' }, JSON.stringify(trafficLogs));
  }

  // 7. Server-Sent Events (SSE) Stream
  if (pathname === '/api/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write(`event: init\ndata: ${JSON.stringify({ message: 'Connected to live network stream', clientCount: sseClients.size + 1 })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // --- Static File Serving ---
  if (pathname === '/mobile' || pathname === '/mobile.html') {
    const mobileFile = path.join(PUBLIC_DIR, 'index.html');
    fs.readFile(mobileFile, (err, content) => {
      if (err) return finish(404, { 'Content-Type': 'text/plain' }, '404 Not Found');
      return finish(200, { 'Content-Type': 'text/html; charset=utf-8' }, content);
    });
    return;
  }

  let safePath = pathname === '/' ? '/index.html' : pathname;
  // Normalize and prevent directory traversal
  const cleanPath = path.normalize(safePath).replace(/^(\.\.[\/\\])+/, '');

  // Prevent serving hidden files
  if (cleanPath.split(path.sep).some(part => part.startsWith('.'))) {
    return finish(403, { 'Content-Type': 'text/plain' }, '403 Forbidden');
  }

  const rootCandidate = path.join(ROOT_DIR, cleanPath);
  const publicCandidate = path.join(PUBLIC_DIR, cleanPath);

  const serveFile = (targetFile) => {
    const ext = path.extname(targetFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    fs.readFile(targetFile, (readErr, data) => {
      if (readErr) {
        return finish(500, { 'Content-Type': 'text/plain' }, '500 Server Error');
      }
      finish(200, { 'Content-Type': contentType }, data);
    });
  };

  fs.stat(rootCandidate, (errRoot, statsRoot) => {
    if (!errRoot && statsRoot.isFile()) {
      return serveFile(rootCandidate);
    }
    fs.stat(publicCandidate, (errPub, statsPub) => {
      if (!errPub && statsPub.isFile()) {
        return serveFile(publicCandidate);
      }
      // Fallback to index.html for SPA if exists, or 404
      const fallbackPath = path.join(ROOT_DIR, 'index.html');
      fs.readFile(fallbackPath, (errFallback, content) => {
        if (errFallback) {
          return finish(404, { 'Content-Type': 'text/plain' }, '404 Not Found');
        }
        return finish(200, { 'Content-Type': 'text/html; charset=utf-8' }, content);
      });
    });
  });
});

// Periodic heartbeat broadcast for active SSE connections
setInterval(() => {
  if (sseClients.size > 0) {
    broadcastSSE('heartbeat', {
      timestamp: Date.now(),
      uptime: Math.floor(process.uptime()),
      connectedClients: sseClients.size,
      memUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024)
    });
  }
}, 3000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[NetworkLab Server] Running on http://localhost:${PORT}`);
  console.log(`[NetworkLab Server] Listening on all network interfaces (0.0.0.0:${PORT})`);
});
