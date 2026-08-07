/* Előállítja a feltölthető csomagot.

   deploy/             — a nyilvános weboldal (publish mappa)
   netlify/functions/  — a becsomagolt Netlify függvények

   A kettő szándékosan külön van: ami a publish mappában van, azt
   a Netlify statikus fájlként is kiszolgálja. A függvény forrása
   ott nem lehet, mert benne van az alapértelmezett admin jelszó.

   A függvények egyetlen, függőség nélküli fájlba vannak csomagolva,
   hogy a Netlify-nak ne kelljen npm install-t futtatnia.

   Futtatás:  npm run build   majd   npm run deploy
*/
import { build } from 'esbuild';
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const SRC = 'src/functions';
const OUT = 'deploy';
const FN_OUT = 'netlify/functions';

/* A weboldal fájljai — csak ezek kerülnek fel.
   Az img/ mappából szándékosan csak a ténylegesen használt
   képek: az img/svc/ a kicsinyített változatokat tartalmazza,
   a nagy eredetiket nem kell feltölteni. */
const ASSETS = [
  'index.html', 'admin.html', '404.html',
  // jogi aloldalak
  'impresszum.html', 'adatkezeles.html', 'sutik.html',
  'style.css', 'admin.css', 'jogi.css',
  'script.js', 'admin.js', 'consent.js',
  // saját szerverről kiszolgált betűtípusok (lásd fonts.css)
  'fonts.css', 'fonts',
  'keszlet-seed.json',
  'robots.txt', 'sitemap.xml', 'site.webmanifest',
  'img/logo.jpg', 'img/hero-muhely.jpg',
  // a hero görgetős bringájának rétegei (Blender render, átlátszó WebP)
  'img/hero3d',
  // az img/svc/ mappából egyedül ez van használatban (index.html)
  'img/svc/muhely-belso.jpg',
  'img/svc-web', 'img/keszlet'
];

rmSync(OUT, { recursive: true, force: true });
rmSync(FN_OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
mkdirSync(FN_OUT, { recursive: true });

const entries = readdirSync(SRC).filter((f) => f.endsWith('.mjs'));

await build({
  entryPoints: entries.map((f) => `${SRC}/${f}`),
  outdir: FN_OUT,
  outExtension: { '.js': '.mjs' },
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  legalComments: 'none'
});

for (const asset of ASSETS) {
  cpSync(asset, `${OUT}/${asset}`, { recursive: true });
}

/* Képtömörítés.

   A forrásképek nagyobbak, mint amekkorán valaha látszanak: a
   készletképek 900x1200-asak, de a rácsban 272 px szélesek, az
   árlista lebegő előnézete pedig 300x380-as dobozban jelenik meg.
   A méretet a tényleges megjelenítéshez igazítjuk (kétszeres
   pixelsűrűségre hagyva ráhagyást), és mozjpeg-gel újrakódoljuk.

   A kiterjesztés szándékosan marad .jpg: így egyetlen hivatkozást
   sem kell átírni sem a HTML-ben, sem a keszlet-seed.json-ban, sem
   a függvényekben. A forrásfájlokhoz nem nyúlunk — a deploy mappa
   minden buildnél újra a forrásból készül. */
const IMG_RULES = [
  // narrow: mobilra készülő keskenyebb változat (-480 utótaggal)
  { dir: 'img/keszlet',  width: 700, narrow: 480 },  // rácskép, 295 px @2x
  { dir: 'img/svc-web',  width: 640 },  // lebegő előnézet, 300 px @2x
  { dir: 'img/svc',      width: 900 },
  { dir: 'img',          width: 900 }   // almappák kimaradnak
];

/* A logó egyben favicon, apple-touch-icon és a webmanifest ikonja,
   de sehol nem jelenik meg 512 px-nél nagyobban. A site.webmanifest
   ehhez a mérethez van igazítva — a kettő együtt mozog. */
const LOGO_WIDTH = 512;
const IMG_FILE_WIDTH = { 'img/logo.jpg': LOGO_WIDTH };

const encode = (buf, width) => sharp(buf)
  .resize({ width, withoutEnlargement: true })
  .jpeg({ quality: 78, mozjpeg: true, progressive: true })
  .toBuffer();

let saved = 0;
for (const rule of IMG_RULES) {
  const dir = `${OUT}/${rule.dir}`;
  const files = readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && /\.jpe?g$/i.test(e.name));

  for (const entry of files) {
    const rel = `${rule.dir}/${entry.name}`;
    const path = `${OUT}/${rel}`;
    const before = readFileSync(path);
    const after = await encode(before, IMG_FILE_WIDTH[rel] || rule.width);

    // ha a tömörítés nem nyert semmit, marad az eredeti
    if (after.length < before.length) {
      writeFileSync(path, after);
      saved += before.length - after.length;
    }

    if (rule.narrow) {
      const small = await encode(before, rule.narrow);
      writeFileSync(path.replace(/\.jpe?g$/i, `-${rule.narrow}.jpg`), small);
    }
  }
}

/* Gyorsítótár-törés.

   A netlify.toml a CSS/JS fájlokat egy hétre, a képeket egy évre
   gyorsítótárazza, a HTML viszont mindig frissül. Enélkül a
   visszatérő látogató az ÚJ HTML-t kapná a RÉGI CSS-sel — és a
   friss elemek (pl. a hero bringa rétegei) stílus nélkül szétesnek.

   Megoldás: minden ilyen hivatkozás mögé a fájl tartalmából
   számolt rövid hash kerül. Ha a fájl változik, változik az URL is,
   tehát a böngésző biztosan újat tölt. Ha nem változik, marad a
   gyorsítótárban. Kézzel semmit nem kell verziózni. */
const VERSIONED = [
  'style.css', 'admin.css', 'jogi.css', 'fonts.css',
  'script.js', 'admin.js', 'consent.js',
  'img/hero3d/bike-body.webp', 'img/hero3d/bike-crank.webp',
  'img/hero3d/bike-wheel-front.webp', 'img/hero3d/bike-wheel-rear.webp'
];

const stamps = VERSIONED.map((rel) => [
  rel,
  createHash('sha1').update(readFileSync(`${OUT}/${rel}`)).digest('hex').slice(0, 8)
]);

const PAGES = [
  'index.html', 'admin.html', '404.html',
  'impresszum.html', 'adatkezeles.html', 'sutik.html'
];

/* A cégadatok EGY helyen élnek: ceg-adatok.json. Innen kerülnek a
   {{kulcs}} helyekre az impresszumban és a tájékoztatókban, hogy ne
   kelljen három fájlban külön karbantartani őket. */
const CEG = JSON.parse(readFileSync('ceg-adatok.json', 'utf8'));
CEG.telefonHivas = CEG.telefon.replace(/\s+/g, '');

const missing = Object.entries(CEG)
  .filter(([, v]) => typeof v === 'string' && v.startsWith('[KITÖLTENDŐ'))
  .map(([k]) => k);

for (const page of PAGES) {
  const file = `${OUT}/${page}`;
  let html = readFileSync(file, 'utf8');

  for (const [rel, v] of stamps) {
    html = html.split(`"${rel}"`).join(`"${rel}?v=${v}"`);
    html = html.split(`"/${rel}"`).join(`"/${rel}?v=${v}"`);
  }
  for (const [key, value] of Object.entries(CEG)) {
    if (key.startsWith('_')) continue;
    html = html.split(`{{${key}}}`).join(value);
  }

  writeFileSync(file, html);
}

/* A sitemap <lastmod> dátuma mindig a feltöltés napja legyen —
   így nem marad benne kézzel karbantartandó dátum. */
const today = new Date().toISOString().slice(0, 10);
const sitemapPath = `${OUT}/sitemap.xml`;
writeFileSync(
  sitemapPath,
  readFileSync(sitemapPath, 'utf8').replace(
    /<lastmod>[^<]*<\/lastmod>/g,
    `<lastmod>${today}</lastmod>`
  )
);

console.log(
  `Kész: ${ASSETS.length} elem a ${OUT}/ mappában, ${entries.length} függvény a ` +
  `${FN_OUT}/ mappában. Képtömörítés: -${Math.round(saved / 1024)} KB.`
);

if (missing.length) {
  console.log(
    `\n!! FIGYELEM — a ceg-adatok.json még kitöltetlen mezőket tartalmaz:\n` +
    missing.map((k) => `   - ${k}`).join('\n') +
    `\n   Ezek a helyükön "[KITÖLTENDŐ: ...]" szövegként jelennek meg az\n` +
    `   impresszumban és az adatkezelési tájékoztatóban. A weboldal\n` +
    `   így is működik, de a jogi oldalak addig nem hitelesek.\n`
  );
}
