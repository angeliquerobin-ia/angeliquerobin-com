// Exporte les inscrit·es à la démo de Cléobule en CSV.
// node scripts/export-demo-cleobule.mjs > inscrits-demo.csv
// Lit la clé dans ~/.config/lumail/api-key ou LUMAIL_API_TOKEN, sans l'afficher.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const cle = process.env.LUMAIL_API_TOKEN || readFileSync(`${homedir()}/.config/lumail/api-key`, 'utf8').trim();
const base = process.env.LUMAIL_BASE || 'https://lumail.io';
const csv = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;

console.log('nom,email,telephone,statut,inscription');
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
  for (const s of liste) {
    // La liste ne donne pas le téléphone : il est sur la fiche de chaque personne.
    const f = await fetch(`${base}/api/v1/subscribers/${encodeURIComponent(s.email)}`, { headers: { Authorization: `Bearer ${cle}` } });
    const fiche = f.ok ? await f.json() : {};
    const telephone = (fiche.subscriber ?? fiche.data ?? fiche).phone;
    console.log([s.name, s.email, telephone, s.status, s.createdAt].map(csv).join(','));
  }
  curseur = page.nextCursor ?? page.next_cursor ?? page.pagination?.nextCursor ?? null;
} while (curseur);
