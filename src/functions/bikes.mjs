import { getStore } from '@netlify/blobs';
import {
  json, adminPassword, passwordMissing, NOT_CONFIGURED, sameSecret,
  issueToken, verifyToken, guard, lockResponse, recordFailure, clearFailures
} from '../lib/auth.mjs';

/* ============================================================
   Készlet API — a raktáron lévő bringák listája.

   A függvény saját útvonalain él (lásd `config` alul):
     GET    /api/bikes        → nyilvános lista
     POST   /api/bikes        → új képek (admin)
     DELETE /api/bikes?id=…   → törlés (admin)
     POST   /api/login        → jelszó ellenőrzés, tokent ad
     GET    /api/session      → él-e még a belépés

   A lista egyetlen JSON blobban él ("manifest"), a feltöltött
   képek külön blobokban. Első hívásnál a manifest a statikus
   keszlet-seed.json-ból töltődik fel, hogy az oldal ne
   induljon üresen.

   VÉDELEM: az admin.html statikus fájl, bárki megnyithatja —
   de ott semmi nem történik. Írni csak ezen az API-n át lehet,
   és minden írás érvényes munkamenet-tokent kér (src/lib/auth.mjs).

   FIGYELEM: ez a fájl a forrás. A telepített változat a
   netlify/functions/ mappában van, azt a `npm run build`
   állítja elő (egyetlen, függőség nélküli fájl, hogy
   drag & drop feltöltéssel is működjön).
   ============================================================ */

const STORE_NAME  = 'bringazol-keszlet';
const MANIFEST    = 'manifest';
const IMG_PREFIX  = 'img/';
const MAX_FILES   = 12;
const MAX_BYTES   = 8 * 1024 * 1024;
const ALLOWED     = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/* A seed csak akkor kell, ha még sosem írtunk manifestet.
   Üres tömb is érvényes állapot — azt nem írjuk felül. */
async function loadManifest(store, req) {
  const current = await store.get(MANIFEST, { type: 'json' });
  if (Array.isArray(current)) return current;

  let seed = [];
  try {
    const res = await fetch(new URL('/keszlet-seed.json', req.url));
    if (res.ok) seed = await res.json();
  } catch (_) { /* seed nélkül is működik, csak üresen indul */ }

  await store.setJSON(MANIFEST, seed);
  return seed;
}

/* Saját útvonalak — a függvény közvetlenül ezeken a címeken él.
   FIGYELEM: emiatt a /.netlify/functions/bikes alapcím megszűnik,
   tehát a netlify.toml-ban NEM lehet rewrite ezekre a címekre. */
export const config = { path: ['/api/bikes', '/api/login', '/api/session'] };

export default async (req) => {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  /* ---------- belépés ---------- */
  const isLogin = action === 'login' || /\/login\/?$/.test(url.pathname);

  if (isLogin) {
    if (req.method !== 'POST') return json({ error: 'method' }, 405);
    if (passwordMissing()) return NOT_CONFIGURED;

    // ki van tiltva? akkor a jelszót meg sem nézzük
    const locked = await lockResponse(req);
    if (locked) return locked;

    let body = {};
    try { body = await req.json(); } catch (_) {}

    if (!sameSecret(body.password, adminPassword())) {
      const rec = await recordFailure(req);
      // apró késleltetés a vak próbálgatás ellen
      await new Promise((r) => setTimeout(r, 600));
      return json({
        ok: false,
        error: rec.until > Date.now()
          ? 'Túl sok hibás próbálkozás. A cím időlegesen ki van tiltva.'
          : 'Hibás jelszó.'
      }, 401);
    }

    await clearFailures(req);
    const { token, expiresAt } = await issueToken();
    return json({ ok: true, token, expiresAt });
  }

  /* ---------- él-e még a belépés ---------- */
  if (action === 'session' || /\/session\/?$/.test(url.pathname)) {
    if (passwordMissing()) return NOT_CONFIGURED;
    const ok = await verifyToken(req.headers.get('x-admin-token'));
    return ok ? json({ ok: true }) : json({ ok: false }, 401);
  }

  const store = getStore(STORE_NAME);

  /* ---------- nyilvános lista ---------- */
  if (req.method === 'GET') {
    const bikes = await loadManifest(store, req);
    return json({ bikes });
  }

  /* ---------- innentől csak érvényes tokennel ---------- */
  const denied = await guard(req);
  if (denied) return denied;

  if (req.method === 'POST') {
    let form;
    try { form = await req.formData(); }
    catch (_) { return json({ error: 'Hibás feltöltés.' }, 400); }

    const files = form.getAll('file').filter((f) => typeof f === 'object' && f.size > 0);
    if (!files.length)   return json({ error: 'Nem érkezett kép.' }, 400);
    if (files.length > MAX_FILES) return json({ error: `Egyszerre legfeljebb ${MAX_FILES} kép tölthető fel.` }, 400);

    for (const f of files) {
      if (f.size > MAX_BYTES) return json({ error: `Túl nagy kép: ${f.name} (max 8 MB).` }, 413);
      if (f.type && !ALLOWED.includes(f.type)) return json({ error: `Nem támogatott formátum: ${f.type}` }, 415);
    }

    const manifest = await loadManifest(store, req);
    const added = [];

    for (const file of files) {
      const id = crypto.randomUUID();
      await store.set(IMG_PREFIX + id, file, {
        metadata: { type: file.type || 'image/jpeg', name: file.name || '' }
      });
      added.push({ id, src: `/api/bike-image/${id}`, alt: 'Raktáron lévő kerékpár' });
    }

    // a friss darabok kerüljenek előre
    const next = added.concat(manifest);
    await store.setJSON(MANIFEST, next);
    return json({ bikes: next, added: added.length });
  }

  if (req.method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'Hiányzó azonosító.' }, 400);

    const manifest = await loadManifest(store, req);
    const next = manifest.filter((b) => b.id !== id);
    if (next.length === manifest.length) return json({ error: 'Nincs ilyen kép.' }, 404);

    await store.setJSON(MANIFEST, next);
    // a seed képek statikus fájlok, azoknak nincs blobjuk
    if (!id.startsWith('seed-')) {
      await store.delete(IMG_PREFIX + id);
    }
    return json({ bikes: next });
  }

  return json({ error: 'method' }, 405);
};
