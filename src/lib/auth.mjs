import { getStore } from '@netlify/blobs';

/* ============================================================
   Admin hitelesítés — szerveroldali.

   Az admin.html egy statikus fájl: bárki letöltheti, aki
   kitalálja a címét. Ezért a védelem NEM ott van, hanem itt:
   a képet feltölteni vagy törölni csak érvényes, a szerver
   által aláírt munkamenet-tokennel lehet.

   Három réteg:
     1. A jelszó CSAK az ADMIN_PASSWORD környezeti változóból
        jön. Ha nincs beállítva, az admin API teljesen zárva
        marad — nincs beégetett tartalék jelszó.
     2. A sikeres belépés egy HMAC-SHA256 aláírású, lejáró
        tokent ad vissza. A jelszó ezután nem megy vissza
        többé a hálózaton, és a token 8 óra múlva magától
        érvénytelen.
     3. IP-alapú kizárás: néhány hibás próbálkozás után az
        adott cím időlegesen ki van tiltva a belépésből.

   FIGYELEM: ez a fájl a forrás. A telepített változatba az
   `npm run build` csomagolja bele.
   ============================================================ */

const AUTH_STORE = 'bringazol-auth';

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;   // meddig él egy belépés

/* Kizárás. Az ablakon belüli hibás próbák számítanak; a
   számláló az utolsó hiba után WINDOW_MS-mel nullázódik. */
const WINDOW_MS    = 15 * 60 * 1000;
const SOFT_LIMIT   = 5;                    // ennyi hiba után 15 perc
const HARD_LIMIT   = 10;                   // ennyi hiba után 1 óra
const SOFT_LOCK_MS = 15 * 60 * 1000;
const HARD_LOCK_MS = 60 * 60 * 1000;

export function json(body, status = 200, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: Object.assign({
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'referrer-policy': 'no-referrer'
    }, extraHeaders || {})
  });
}

/* ---------- jelszó ---------- */

/* A trim() azért kell, mert a Netlify felületére bemásolt
   értékre könnyen ráragad egy szóköz vagy sortörés. */
export function adminPassword() {
  return String(process.env.ADMIN_PASSWORD || '').trim();
}

/* Nincs tartalék jelszó: ha a környezeti változó hiányzik,
   az admin oldal használhatatlan. Ez szándékos — így egy
   félresikerült telepítés nem nyit kaput, csak elromlik. */
export function passwordMissing() {
  return adminPassword().length === 0;
}

export const NOT_CONFIGURED = json(
  { error: 'Az admin jelszó nincs beállítva a szerveren (ADMIN_PASSWORD). Lásd DEPLOY.md.' },
  503
);

/* Konstans idejű összehasonlítás, hogy a válaszidő ne szivárogtasson. */
export function sameSecret(given, expected) {
  const a = String(given || '').trim();
  const b = String(expected || '').trim();
  if (!b) return false;
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/* ---------- munkamenet-token ---------- */

/* Az aláíró kulcs alapból magából a jelszóból származik. Ennek
   kellemes mellékhatása van: ha a jelszót lecseréled, minden
   kiadott token azonnal érvénytelen lesz. Külön kulcs is
   megadható az ADMIN_SESSION_SECRET változóval. */
let keyCache = null;

function signingKey() {
  const raw = String(process.env.ADMIN_SESSION_SECRET || '').trim() || ('pw:' + adminPassword());
  if (!keyCache || keyCache.raw !== raw) {
    keyCache = {
      raw,
      key: crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(raw),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
    };
  }
  return keyCache.key;
}

function b64url(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sign(payload) {
  const sig = await crypto.subtle.sign('HMAC', await signingKey(), new TextEncoder().encode(payload));
  return b64url(sig);
}

export async function issueToken() {
  const exp = Date.now() + TOKEN_TTL_MS;
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const payload = `${exp}.${nonce}`;
  return { token: `${payload}.${await sign(payload)}`, expiresAt: exp };
}

/* 'ok' | 'expired' | 'bad'
   A lejárt, de szabályosan aláírt token nem támadás, csak elévült
   belépés — azt nem büntetjük kizárással. */
export async function checkToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return 'bad';

  const [expRaw, nonce, sig] = parts;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || !/^[0-9a-f]{32}$/.test(nonce)) return 'bad';
  if (!sameSecret(sig, await sign(`${expRaw}.${nonce}`))) return 'bad';

  return exp > Date.now() ? 'ok' : 'expired';
}

export async function verifyToken(token) {
  return (await checkToken(token)) === 'ok';
}

/* ---------- kizárás hibás próbák után ---------- */

/* Az IP-cím nem kerül tárolásra nyersen: csak egy belőle és a
   titokból számolt lenyomat, amiből visszafejteni nem lehet.
   (Adatvédelmi tájékoztató: nem tárolunk azonosítható adatot.) */
async function ipKey(req) {
  const ip = req.headers.get('x-nf-client-connection-ip')
    || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    || 'ismeretlen';
  const salt = String(process.env.ADMIN_SESSION_SECRET || '').trim() || adminPassword();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + '|' + ip));
  return 'fail/' + Array.from(new Uint8Array(digest)).slice(0, 12)
    .map((b) => b.toString(16).padStart(2, '0')).join('');
}

function authStore() {
  return getStore(AUTH_STORE);
}

async function readRecord(store, key) {
  try {
    return await store.get(key, { type: 'json', consistency: 'strong' });
  } catch (_) {
    return null;                       // a tár hibája ne zárja ki a tulajdonost
  }
}

/* Ha épp kizárás van érvényben, visszaad egy kész 429-es választ. */
export async function lockResponse(req) {
  const store = authStore();
  const rec = await readRecord(store, await ipKey(req));
  const until = rec && rec.until;
  if (!until || until <= Date.now()) return null;

  const secs = Math.ceil((until - Date.now()) / 1000);
  const perc = Math.max(1, Math.ceil(secs / 60));
  return json(
    { error: `Túl sok hibás próbálkozás. Próbáld újra ${perc} perc múlva.` },
    429,
    { 'retry-after': String(secs) }
  );
}

export async function recordFailure(req) {
  const store = authStore();
  const key = await ipKey(req);
  const now = Date.now();

  let rec = await readRecord(store, key);
  if (!rec || typeof rec.fails !== 'number' || now - (rec.last || 0) > WINDOW_MS) {
    rec = { fails: 0, last: now, until: 0 };
  }
  rec.fails += 1;
  rec.last = now;
  if (rec.fails >= HARD_LIMIT)      rec.until = now + HARD_LOCK_MS;
  else if (rec.fails >= SOFT_LIMIT) rec.until = now + SOFT_LOCK_MS;

  try { await store.setJSON(key, rec); } catch (_) { /* a tiltás elmarad, a jelszó nem */ }
  return rec;
}

export async function clearFailures(req) {
  try { await authStore().delete(await ipKey(req)); } catch (_) {}
}

/* ---------- kapuőr az írási műveletekhez ---------- */

/* Null = mehet. Bármi más = kész válasz, amit vissza kell adni.
   A hamis tokennel érkező kérés ugyanúgy hibás próbának számít,
   mint a rossz jelszó — így a tokent sem lehet találgatni. */
export async function guard(req) {
  if (passwordMissing()) return NOT_CONFIGURED;

  const locked = await lockResponse(req);
  if (locked) return locked;

  const state = await checkToken(req.headers.get('x-admin-token'));
  if (state === 'ok') return null;

  if (state === 'bad') await recordFailure(req);
  return json({ error: 'Lejárt vagy érvénytelen belépés.' }, 401);
}
