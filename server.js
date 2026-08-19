'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;

// Charge .env en local si présent (dev uniquement — en prod, Coolify injecte
// les variables directement, donc on ne touche jamais à une variable déjà définie).
try {
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  }
} catch (err) {
  // ignore
}

const PORT = process.env.PORT || 80;
const LUMAIL_API_TOKEN = process.env.LUMAIL_API_TOKEN || '';
const LUMAIL_ENDPOINT = 'https://lumail.io/api/v1/subscribers';

// Un tag = une liste Lumail. On restreint volontairement aux tags connus
// pour empêcher un appel /api/subscribe forgé d'écrire vers une liste arbitraire.
const ALLOWED_TAGS = new Set(['colette-ia-liste', 'Newsletter Lotus']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const IMMUTABLE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.ico', '.css', '.js', '.woff', '.woff2']);

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
  });
  res.end(data);
}

function readJsonBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('payload_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

function callLumail(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request(
      LUMAIL_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${LUMAIL_API_TOKEN}`,
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 10000,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let json;
          try {
            json = raw ? JSON.parse(raw) : {};
          } catch (err) {
            json = {};
          }
          resolve({ status: res.statusCode, body: json });
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('lumail_timeout')));
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function handleSubscribe(req, res) {
  if (!LUMAIL_API_TOKEN) {
    sendJson(res, 500, { success: false, error: 'server_not_configured' });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(req, 10 * 1024);
  } catch (err) {
    sendJson(res, 400, { success: false, error: 'invalid_request' });
    return;
  }

  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const name = typeof payload.name === 'string' ? payload.name.trim().slice(0, 200) : '';
  const tag = typeof payload.tag === 'string' ? payload.tag.trim() : '';

  if (!EMAIL_RE.test(email) || email.length > 254) {
    sendJson(res, 400, { success: false, error: 'invalid_email' });
    return;
  }
  if (!ALLOWED_TAGS.has(tag)) {
    sendJson(res, 400, { success: false, error: 'invalid_tag' });
    return;
  }

  const lumailPayload = { email, tags: [tag] };
  if (name) lumailPayload.name = name;

  try {
    const { status, body } = await callLumail(lumailPayload);
    sendJson(res, status, body);
  } catch (err) {
    sendJson(res, 502, { success: false, error: 'upstream_unreachable' });
  }
}

function serveStatic(req, res, pathname) {
  if (pathname === '/') pathname = '/accueil.html';

  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch (err) {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }

  const safePath = path.normalize(path.join(ROOT, decoded));
  if (!safePath.startsWith(ROOT)) {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(safePath).toLowerCase();
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
    if (IMMUTABLE_EXT.has(ext)) {
      headers['Cache-Control'] = 'public, max-age=2592000, immutable';
    } else if (ext === '.xml') {
      headers['Cache-Control'] = 'public, max-age=3600';
    }
    res.writeHead(200, headers);
    fs.createReadStream(safePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const host = (req.headers.host || '').split(':')[0];
  if (host === 'angeliquerobin.com') {
    res.writeHead(301, { Location: `https://www.angeliquerobin.com${req.url}` });
    res.end();
    return;
  }

  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch (err) {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }

  if (url.pathname === '/api/subscribe' && req.method === 'POST') {
    handleSubscribe(req, res);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end('Method not allowed');
    return;
  }

  serveStatic(req, res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  if (!LUMAIL_API_TOKEN) {
    console.warn('LUMAIL_API_TOKEN is not set — /api/subscribe will return 500 until it is configured.');
  }
});
