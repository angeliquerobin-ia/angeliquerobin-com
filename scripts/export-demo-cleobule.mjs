// Exporte les inscrit·es à la démo de Cléobule en CSV.
// node scripts/export-demo-cleobule.mjs > inscrits-demo.csv
// Lit la clé dans ~/.config/lumail/api-key ou LUMAIL_API_TOKEN, sans l'afficher.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const cle = process.env.LUMAIL_API_TOKEN || readFileSync(`${homedir()}/.config/lumail/api-key`, 'utf8').trim();
const base = process.env.LUMAIL_BASE || 'https://lumail.io';
const csv = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;

console.log('prenom,email,statut,inscription');
let curseur;
do {
  const url = new URL(`${base}/api/v1/subscribers`);
  url.searchParams.set('tag', 'Démo Cléobule');
  url.searchParams.set('limit', '100');
  if (curseur) url.searchParams.set('cursor', curseur);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${cle}` } });
  if (!r.ok) throw new Error(`Lumail a répondu ${r.status}`);
  const page = await r.json();
  const liste = page.subscribers ?? page.data ?? [];
  for (const s of liste) console.log([s.name, s.email, s.status, s.createdAt].map(csv).join(','));
  curseur = page.nextCursor ?? page.next_cursor ?? page.pagination?.nextCursor ?? null;
} while (curseur);
