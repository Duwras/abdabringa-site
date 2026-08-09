/* Előállítja a közzétehető weboldalt a deploy/ mappába.

   Az oldal GitHub Pages-en fut — nincs szerveroldali kód, minden
   fájl statikus. A közzétételt a .github/workflows/deploy.yml
   végzi: minden main-re küldött push után lefuttatja ezt a scriptet,
   és a deploy/ tartalmát teszi ki élesbe.

   Helyi ellenőrzésre:  npm run build   majd   npm run elonezet
*/
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const OUT = 'deploy';

/* A Pages ezekre a fájlokra figyel a publish mappa gyökerében:
   CNAME     — a saját domain; enélkül minden közzététel után
               visszaesne a *.github.io címre
   .nojekyll — kikapcsolja a Jekyll feldolgozást, ami különben
               eldobná az aláhúzással kezdődő fájlokat és mappákat */
const DOMAIN = JSON.parse(readFileSync('ceg-adatok.json', 'utf8')).domain;

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
mkdirSync(OUT, { recursive: true });

for (const asset of ASSETS) {
  cpSync(asset, `${OUT}/${asset}`, { recursive: true });
}

writeFileSync(`${OUT}/CNAME`, `${DOMAIN}\n`);
writeFileSync(`${OUT}/.nojekyll`, '');

/* A készletet mostantól kézzel szerkeszted (KESZLET.md). Egy elgépelt
   fájlnév némán törött képet adna az éles oldalon, ezért itt ellenőrizzük
   — a build inkább álljon meg, mint hogy hibás oldal menjen ki. */
const bikes = JSON.parse(readFileSync('keszlet-seed.json', 'utf8'));
const brokenBikes = bikes.filter((b) => !existsSync(`${OUT}${b.src}`));

if (brokenBikes.length) {
  console.error(
    `\n!! HIBA — a keszlet-seed.json olyan képre hivatkozik, ami nincs meg:\n` +
    brokenBikes.map((b) => `   - ${b.src}  (id: ${b.id})`).join('\n') +
    `\n   Tedd be a képet az img/keszlet/ mappába, vagy vedd ki a sort\n` +
    `   a keszlet-seed.json-ból. Lásd KESZLET.md.\n`
  );
  process.exit(1);
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

   A GitHub Pages saját fejléceket ad, amiket nem tudunk átírni —
   a CSS/JS akár a régi változatban is a böngészőben maradhat, míg a
   HTML már frissült. Enélkül a visszatérő látogató az ÚJ HTML-t
   kapná a RÉGI CSS-sel — és a friss elemek (pl. a hero bringa
   rétegei) stílus nélkül szétesnek.

   Megoldás: minden ilyen hivatkozás mögé a fájl tartalmából
   számolt rövid hash kerül. Ha a fájl változik, változik az URL is,
   tehát a böngésző biztosan újat tölt. Ha nem változik, marad a
   gyorsítótárban. Kézzel semmit nem kell verziózni. */
/* A cégadatok EGY helyen élnek: ceg-adatok.json. Innen kerülnek a
   {{kulcs}} helyekre az impresszumban és a tájékoztatókban, hogy ne
   kelljen három fájlban külön karbantartani őket. */
const CEG = JSON.parse(readFileSync('ceg-adatok.json', 'utf8'));
CEG.telefonHivas = CEG.telefon.replace(/\s+/g, '');

/* A GA4 mérőazonosító a consent.js-be kerül, nem a HTML-be — a mérést
   ugyanis a hozzájárulás-kezelő indítja, más nem nyúl hozzá.

   A behelyettesítésnek a hash-számítás ELŐTT kell megtörténnie: a
   gyorsítótár-törő bélyeg a kiszolgált fájl tartalmából számol. Ha
   utólag írnánk bele az azonosítót, a bélyeg változatlan maradna, és
   a visszatérő látogató a régi, mérő nélküli consent.js-t kapná. */
{
  const path = `${OUT}/consent.js`;
  writeFileSync(
    path,
    readFileSync(path, 'utf8').split('{{gaId}}').join(CEG.gaId || '')
  );
}

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
  `Kész: ${ASSETS.length} elem a ${OUT}/ mappában, domain ${DOMAIN}, ` +
  `${bikes.length} bringa a készletben. Képtömörítés: -${Math.round(saved / 1024)} KB.`
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
