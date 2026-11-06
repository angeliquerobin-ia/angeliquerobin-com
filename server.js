'use strict';

const crypto = require('crypto');
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
const LUMAIL_BASE = process.env.LUMAIL_BASE || 'https://lumail.io';
const LUMAIL_ENDPOINT = `${LUMAIL_BASE}/api/v1/subscribers`;

// Démo de Cléobule : DEMO_LIEN porte la clé d'accès, il n'est jamais dans le code.
const DEMO_LIEN = process.env.DEMO_LIEN || '';
const DEMO_TAG = 'Démo Cléobule';
const DEMO_EXPEDITEUR = 'Angélique Robin <contact@angeliquerobin.com>';
const DEMO_APPEL = 'https://cal.com/angelique-robin/visio-cleobule';
const SITE = 'https://www.angeliquerobin.com';

// Un tag = une liste Lumail. On restreint volontairement aux tags connus
// pour empêcher un appel /api/subscribe forgé d'écrire vers une liste arbitraire.
const ALLOWED_TAGS = new Set(['colette-ia-liste', 'Newsletter Lotus', 'Le Café du Dimanche']);
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

function callLumail(payload, url = LUMAIL_ENDPOINT, method = 'POST') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const client = url.startsWith('https:') ? https : http;
    const req = client.request(
      url,
      {
        method,
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

  // Inscription directe, sans mail de confirmation : depuis le 15 septembre 2026,
  // Lumail n'envoie plus les mails du double opt-in. À retirer quand Lumail aura corrigé.
  const lumailPayload = { email, tags: [tag], skipDoubleOptIn: true };
  if (name) lumailPayload.name = name;

  try {
    const { status, body } = await callLumail(lumailPayload);
    sendJson(res, status, body);
  } catch (err) {
    sendJson(res, 502, { success: false, error: 'upstream_unreachable' });
  }
}

// Limites en mémoire : assez pour un seul serveur, et pour éviter qu'on se serve
// du formulaire pour bombarder une adresse.
const compteurs = new Map();
function depasseLimite(cle, max, dureeMs) {
  const maintenant = Date.now();
  const recent = (compteurs.get(cle) || []).filter((t) => maintenant - t < dureeMs);
  if (recent.length >= max) return true;
  recent.push(maintenant);
  compteurs.set(cle, recent);
  return false;
}

function adresseIp(req) {
  // La dernière valeur est celle du proxy : les précédentes viennent du visiteur.
  return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',').pop().trim();
}

// Le lien de désinscription est signé : personne ne peut désinscrire une autre adresse.
function signatureDemo(email) {
  return crypto.createHmac('sha256', LUMAIL_API_TOKEN).update(`demo:${email}`).digest('base64url');
}

// Numéro saisi librement : on garde le format international, 06… devient +336….
function telephoneDemo(valeur) {
  const brut = typeof valeur === 'string' ? valeur.replace(/[\s.()-]/g, '') : '';
  const numero = /^0\d{9}$/.test(brut) ? `+33${brut.slice(1)}` : brut.replace(/^00/, '+');
  return /^\+\d{8,15}$/.test(numero) ? numero : '';
}

function emailDemo(prenom, lienDesinscription) {
  return `Bonjour ${prenom},

Voici ton accès à la démo de Cléobule, l’application que j’ai créée pour alléger le suivi de tes séances.

[Ouvrir la démo](${DEMO_LIEN})

Tu y découvres l’accompagnement fictif de Nora, suivie par sa coach Camille. Tu arrives dans l’interface de la coach et, depuis le bandeau en haut de page, tu peux ouvrir l’espace de sa cliente. Tout est en lecture seule : explore à ton rythme, tu ne peux rien casser.

Si tu as envie qu’on en parle, réserve un appel de 20 minutes avec moi :

[Réserver mon appel](${DEMO_APPEL})

À très vite,
Angélique

Tu reçois cet email parce que tu as demandé l’accès à la démo de Cléobule. [Me désinscrire](${lienDesinscription})`;
}

async function handleDemoInscription(req, res) {
  if (!LUMAIL_API_TOKEN || !DEMO_LIEN) {
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

  // Champ invisible : seul un robot le remplit. On lui répond comme à tout le monde.
  if (payload.site) {
    sendJson(res, 200, { success: true });
    return;
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const prenom = typeof payload.prenom === 'string'
    ? payload.prenom.replace(/[\[\]()<>\r\n]/g, '').trim().slice(0, 80)
    : '';
  const nom = typeof payload.nom === 'string'
    ? payload.nom.replace(/[\[\]()<>\r\n]/g, '').trim().slice(0, 80)
    : '';
  const telephone = telephoneDemo(payload.telephone);

  if (!EMAIL_RE.test(email) || email.length > 254) {
    sendJson(res, 400, { success: false, error: 'invalid_email' });
    return;
  }
  if (!prenom || !nom) {
    sendJson(res, 400, { success: false, error: 'invalid_name' });
    return;
  }
  if (!telephone) {
    sendJson(res, 400, { success: false, error: 'invalid_phone' });
    return;
  }
  if (payload.consentement !== true) {
    sendJson(res, 400, { success: false, error: 'consent_required' });
    return;
  }
  if (depasseLimite(`ip:${adresseIp(req)}`, 5, 3600000) || depasseLimite(`email:${email}`, 3, 86400000)) {
    sendJson(res, 429, { success: false, error: 'too_many_requests' });
    return;
  }

  try {
    const inscription = await callLumail({
      email,
      name: `${prenom} ${nom}`,
      phone: telephone,
      tags: [DEMO_TAG],
      skipDoubleOptIn: true,
      triggerWorkflows: false,
    });
    if (inscription.status >= 300) {
      console.error('[demo] inscription refusée par Lumail :', inscription.status);
      sendJson(res, 502, { success: false, error: 'upstream_error' });
      return;
    }

    // Preuve du consentement : date et texte accepté, gardés avec la fiche.
    await callLumail(
      {
        eventType: 'consentement_demo_cleobule',
        subscriber: email,
        data: { date: new Date().toISOString(), texte: String(payload.texteConsentement || '').slice(0, 500) },
      },
      `${LUMAIL_BASE}/api/v1/events`,
    ).catch((err) => console.error('[demo] consentement non noté :', err.message));

    const lien = `${SITE}/demo-desinscription?e=${encodeURIComponent(email)}&s=${signatureDemo(email)}`;
    const envoi = await callLumail(
      {
        from: DEMO_EXPEDITEUR,
        to: email,
        subject: 'Ton accès à la démo de Cléobule',
        markdown: emailDemo(prenom, lien),
        reply_to: 'contact@angeliquerobin.com',
        tags: ['demo-cleobule'],
      },
      `${LUMAIL_BASE}/api/v2/emails`,
    );
    if (envoi.status >= 300) {
      console.error('[demo] email refusé par Lumail :', envoi.status);
      sendJson(res, 502, { success: false, error: 'upstream_error' });
      return;
    }
    sendJson(res, 200, { success: true });
  } catch (err) {
    sendJson(res, 502, { success: false, error: 'upstream_unreachable' });
  }
}

async function handleDemoDesinscription(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req, 2 * 1024);
  } catch (err) {
    sendJson(res, 400, { success: false, error: 'invalid_request' });
    return;
  }
  const email = typeof payload.email === 'string' ? payload.email : '';
  const signature = Buffer.from(typeof payload.signature === 'string' ? payload.signature : '');
  const attendue = Buffer.from(signatureDemo(email));
  if (!LUMAIL_API_TOKEN || signature.length !== attendue.length || !crypto.timingSafeEqual(signature, attendue)) {
    sendJson(res, 403, { success: false, error: 'invalid_link' });
    return;
  }

  // Seule la liste de la démo est quittée : la newsletter, si elle existe, ne bouge pas.
  const tags = encodeURIComponent(JSON.stringify([DEMO_TAG]));
  try {
    const { status } = await callLumail(
      {},
      `${LUMAIL_BASE}/api/v1/subscribers/${encodeURIComponent(email)}/tags?tags=${tags}`,
      'DELETE',
    );
    if (status >= 300 && status !== 404) {
      sendJson(res, 502, { success: false, error: 'upstream_error' });
      return;
    }
    sendJson(res, 200, { success: true });
  } catch (err) {
    sendJson(res, 502, { success: false, error: 'upstream_unreachable' });
  }
}

const NESTED_ROUTES = {
};

function resolveCleanUrl(pathname) {
  if (pathname === '/') return { file: '/accueil.html' };

  // Nested routes (e.g. /quatre-saisons/quiz)
  if (NESTED_ROUTES[pathname]) return { file: NESTED_ROUTES[pathname] };

  // /blog/slug → blog-slug.html
  const blogMatch = pathname.match(/^\/blog\/([a-z0-9-]+)$/);
  if (blogMatch) return { file: `/blog-${blogMatch[1]}.html` };

  // URL has an extension → it's a direct file request (asset, etc.)
  if (path.extname(pathname)) return { file: pathname };

  // /page → page.html
  return { file: `${pathname}.html` };
}

// Anciennes adresses supprimées volontairement (ancien WordPress, pages .html) :
// on répond 410 pour que Google les retire de son index, sans renvoi.
const GONE_PATHS = new Set([
  '/coaching-spirituel',
  '/coaching-de-vie',
  '/coaching-innerpreneur',
  '/quisuisje',
  '/Suis-moi',
  '/feed',
]);

function isGoneUrl(pathname) {
  const p = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return GONE_PATHS.has(p) || /\.(html|php)$/.test(p);
}

// Pages renommées : l'ancienne adresse renvoie en 301 vers la nouvelle.
const MOVED_PATHS = {
  '/lotus': '/lotus-coaching-personnel',
  '/colette-ia': '/cleobule-academie',
  // accueil.html est servie à la racine : /accueil serait un doublon de /.
  '/accueil': '/',
};

// Trailing slash → strip it (/lotus-coaching-personnel/ → /lotus-coaching-personnel),
// puis renvoi des pages renommées, en un seul saut.
function redirectOldUrl(pathname) {
  const stripped = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  if (MOVED_PATHS[stripped]) return MOVED_PATHS[stripped];
  if (stripped !== pathname) return stripped;
  return null;
}

function sendGone(res) {
  res.writeHead(410, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('410 Page supprimée');
}

function serveStatic(req, res, pathname) {
  if (isGoneUrl(pathname)) {
    sendGone(res);
    return;
  }

  const redirect = redirectOldUrl(pathname);
  if (redirect) {
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    res.writeHead(301, { Location: redirect + qs });
    res.end();
    return;
  }

  const { file } = resolveCleanUrl(pathname);

  let decoded;
  try {
    decoded = decodeURIComponent(file);
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
    if (isGoneUrl(req.url.split('?')[0])) {
      sendGone(res);
      return;
    }
    // Applique aussi les redirections de chemin ici, pour un seul saut vers l'URL finale.
    const q = req.url.indexOf('?');
    const pathname = q === -1 ? req.url : req.url.slice(0, q);
    const qs = q === -1 ? '' : req.url.slice(q);
    const finalPath = redirectOldUrl(pathname) || pathname;
    res.writeHead(301, { Location: `https://www.angeliquerobin.com${finalPath}${qs}` });
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

  if (url.pathname === '/api/demo-cleobule' && req.method === 'POST') {
    handleDemoInscription(req, res);
    return;
  }

  if (url.pathname === '/api/demo-desinscription' && req.method === 'POST') {
    handleDemoDesinscription(req, res);
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
