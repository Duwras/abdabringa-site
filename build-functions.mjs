/* Előállítja a közzétehető weboldalt a deploy/ mappába.

   Az oldal GitHub Pages-en fut — nincs szerveroldali kód, minden
   fájl statikus. A közzétételt a .github/workflows/deploy.yml
   végzi: minden main-re küldött push után lefuttatja ezt a scriptet,
   és a deploy/ tartalmát teszi ki élesbe.

   Helyi ellenőrzésre:  npm run build   majd   npm run elonezet
   Utána:               npm run ellenorzes   (linkek, meta, JSON-LD)
*/
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const OUT = 'deploy';

/* A cégadatok EGY helyen élnek: ceg-adatok.json. Innen kerülnek a
   {{kulcs}} helyekre minden oldalon (NAP-blokk, impresszum, JSON-LD),
   hogy a név, cím, telefon és nyitvatartás mindenhol betűre egyezzen. */
const CEG = JSON.parse(readFileSync('ceg-adatok.json', 'utf8'));
const ARLISTA = JSON.parse(readFileSync('arlista.json', 'utf8'));

/* A Pages ezekre a fájlokra figyel a publish mappa gyökerében:
   CNAME     — a saját domain; enélkül minden közzététel után
               visszaesne a *.github.io címre
   .nojekyll — kikapcsolja a Jekyll feldolgozást, ami különben
               eldobná az aláhúzással kezdődő fájlokat és mappákat */
const DOMAIN = CEG.domain;
const SITE = `https://${DOMAIN}`;

/* Az oldalak listája. Ez vezérli a feldolgozást ÉS a sitemap.xml-t is:
   új aloldalnál ide kell felvenni, máshol nem.
     url      — a kanonikus cím (mappás oldalnál perjellel a végén)
     sitemap  — kerüljön-e a sitemapba (csak indexelhető oldal!)
     deps     — adatfájlok, amelyek változása az oldal tartalmát is
                megváltoztatja (a <lastmod> ezekből is számol)
     images   — képek a képes sitemaphoz */
const PAGES = [
  { file: 'index.html', url: '/', sitemap: true,
    deps: ['arlista.json', 'keszlet-seed.json', 'aktualitas.json', 'ceg-adatok.json'],
    images: [
      ['img/hero-muhely.jpg', 'A Bringázol¿ kerékpárműhely festett bejárati ajtaja Abdán'],
      ['img/svc/muhely-belso.jpg', 'Küllős kerék javítása a műhely szerszámfala előtt']
    ] },
  { file: 'szolgaltatasok/index.html', url: '/szolgaltatasok/', sitemap: true, deps: ['arlista.json'] },
  { file: 'arak/index.html', url: '/arak/', sitemap: true, deps: ['arlista.json'] },
  { file: 'kerekparszerviz-gyor/index.html', url: '/kerekparszerviz-gyor/', sitemap: true, deps: ['ceg-adatok.json'] },
  { file: 'szervizterulet/index.html', url: '/szervizterulet/', sitemap: true },
  { file: 'kerekparbolt-gyor/index.html', url: '/kerekparbolt-gyor/', sitemap: true, deps: ['keszlet-seed.json'] },
  { file: 'kapcsolat/index.html', url: '/kapcsolat/', sitemap: true, deps: ['ceg-adatok.json'] },
  { file: 'tudastar/index.html', url: '/tudastar/', sitemap: true },
  { file: 'tudastar/mikor-kell-kerekparlancot-cserelni/index.html', url: '/tudastar/mikor-kell-kerekparlancot-cserelni/', sitemap: true },
  { file: 'tudastar/tavaszi-kerekpar-szerviz/index.html', url: '/tudastar/tavaszi-kerekpar-szerviz/', sitemap: true },
  { file: 'impresszum.html', url: '/impresszum.html', sitemap: true, deps: ['ceg-adatok.json'] },
  { file: 'adatkezeles.html', url: '/adatkezeles.html', sitemap: true, deps: ['ceg-adatok.json'] },
  { file: 'sutik.html', url: '/sutik.html', sitemap: true, deps: ['ceg-adatok.json'] },
  // nem indexelendők: noindex van rajtuk, sitemapba nem kerülnek
  { file: 'admin.html', url: '/admin.html', sitemap: false },
  { file: '404.html', url: '/404.html', sitemap: false }
];

/* A weboldal fájljai — csak ezek kerülnek fel.
   Az img/ mappából szándékosan csak a ténylegesen használt
   képek: az img/svc/ a kicsinyített változatokat tartalmazza,
   a nagy eredetiket nem kell feltölteni. */
const ASSETS = [
  ...new Set(PAGES.map((p) => p.file.split('/')[0])),
  'style.css', 'admin.css', 'jogi.css', 'page.css',
  'script.js', 'admin.js', 'consent.js',
  // saját szerverről kiszolgált betűtípusok (lásd fonts.css)
  'fonts.css', 'fonts',
  'keszlet-seed.json',
  'robots.txt', 'site.webmanifest',
  'img/logo.jpg', 'img/hero-muhely.jpg', 'img/og-kep.jpg',
  // a hero görgetős bringájának rétegei (Blender render, átlátszó WebP)
  'img/hero3d',
  // valódi műhelyfotók az aloldalakhoz (a svc-web képei stockfotók)
  'img/svc/muhely-belso.jpg', 'img/svc/bringak-sor.jpg',
  'img/svc/hajtomu.jpg', 'img/svc/ebike.jpg',
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
   minden buildnél újra a forrásból készül.

   webp: a tartalmi fotókból WebP testvér is készül (azonos néven,
   .webp kiterjesztéssel); a HTML <picture> elemmel kínálja fel, a
   .jpg marad a tartalék. */
const IMG_RULES = [
  // narrow: mobilra készülő keskenyebb változat (-480 utótaggal)
  { dir: 'img/keszlet',  width: 700, narrow: 480 },  // rácskép, 295 px @2x
  { dir: 'img/svc-web',  width: 640 },  // lebegő előnézet, 300 px @2x
  { dir: 'img/svc',      width: 900, webp: true },
  { dir: 'img',          width: 900, webp: true }   // almappák kimaradnak
];

/* A logó egyben favicon, apple-touch-icon és a webmanifest ikonja,
   de sehol nem jelenik meg 512 px-nél nagyobban. A site.webmanifest
   ehhez a mérethez van igazítva — a kettő együtt mozog.
   Az og-kep.jpg pontosan 1200x630-as megosztási kép: nem méretezzük. */
const LOGO_WIDTH = 512;
const IMG_FILE_WIDTH = { 'img/logo.jpg': LOGO_WIDTH, 'img/og-kep.jpg': 1200 };
const NO_WEBP = new Set(['img/logo.jpg', 'img/og-kep.jpg']);

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
    const width = IMG_FILE_WIDTH[rel] || rule.width;
    const after = await encode(before, width);

    // ha a tömörítés nem nyert semmit, marad az eredeti
    if (after.length < before.length) {
      writeFileSync(path, after);
      saved += before.length - after.length;
    }

    if (rule.narrow) {
      const small = await encode(before, rule.narrow);
      writeFileSync(path.replace(/\.jpe?g$/i, `-${rule.narrow}.jpg`), small);
    }

    if (rule.webp && !NO_WEBP.has(rel)) {
      await sharp(before)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 74, effort: 5 })
        .toFile(path.replace(/\.jpe?g$/i, '.webp'));
    }
  }
}

/* Célzott változatok a teljesítménymérés alapján (Slow 4G, 4x CPU,
   390 px széles telefon):

   - A hero görgetős bringájának rétegei 1400 px szélesek, mobilon
     viszont ~380 px-en látszanak — és telefonon épp a váz rétege a
     legnagyobb kirajzolt elem (LCP). 860 px alatt 800 px-es változatot
     kap (<picture media>), ez 3x-os kijelzőn is éles marad.
   - A hero háttérfotója a CSS-ben úgyis szürkeárnyalatos és sötétített:
     a színinformáció felesleges bájt. A -bg.webp előre szürke, és
     erősebben tömörített — kinézetre ugyanaz, fele akkora.
   - A fejléc logója 34 px-en látszik: 102 px (3x) bőven elég, az 512 px-es
     változat marad a faviconnak és a megosztásnak. */
for (const layer of ['bike-body', 'bike-crank', 'bike-wheel-front', 'bike-wheel-rear']) {
  await sharp(`img/hero3d/${layer}.webp`)
    .resize({ width: 800 })
    .webp({ quality: 80, alphaQuality: 90, effort: 5 })
    .toFile(`${OUT}/img/hero3d/${layer}-800.webp`);
}
await sharp('img/hero-muhely.jpg')
  .resize({ width: 700 })
  .grayscale()
  .webp({ quality: 50, effort: 6 })
  .toFile(`${OUT}/img/hero-muhely-bg.webp`);
await sharp('img/logo.jpg')
  .resize({ width: 102 })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(`${OUT}/img/logo-nav.jpg`);

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
const VERSIONED = [
  'style.css', 'admin.css', 'jogi.css', 'page.css', 'fonts.css',
  'script.js', 'admin.js', 'consent.js',
  'img/hero3d/bike-body.webp', 'img/hero3d/bike-crank.webp',
  'img/hero3d/bike-wheel-front.webp', 'img/hero3d/bike-wheel-rear.webp',
  'img/hero3d/bike-body-800.webp', 'img/hero3d/bike-crank-800.webp',
  'img/hero3d/bike-wheel-front-800.webp', 'img/hero3d/bike-wheel-rear-800.webp'
];

const stamps = VERSIONED.map((rel) => [
  rel,
  createHash('sha1').update(readFileSync(`${OUT}/${rel}`)).digest('hex').slice(0, 8)
]);


/* ================= generált tartalom ================= */

const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// „1 500 Ft" — nem törhető szóközzel, hogy a szám ne szakadjon ketté
const NBSP = String.fromCharCode(0xa0);
// „1 500 Ft" — ezres tagolás nem törhető szóközzel (a hu-HU ICU a négyjegyűt nem tagolja)
const ft = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)}${NBSP}Ft`;

/* ---- nyitvatartás ---- */
const HOURS = CEG.nyitvatartas;
const DAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const hoursListHtml = HOURS.map((d) => d.nyit
  ? `<li data-day="${d.nap}" data-open="${d.nyit}" data-close="${d.zar}"><span>${d.nev}</span><b>${d.nyit} — ${d.zar}</b></li>`
  : `<li class="is-closed" data-day="${d.nap}"><span>${d.nev}</span><b>Zárva</b></li>`
).join('\n        ');

// Az egymást követő, azonos idejű napokat összevonjuk:
// „hétfő–péntek 17:00–20:00, szombat–vasárnap zárva"
const hoursGroups = [];
for (const d of HOURS) {
  const key = d.nyit ? `${d.nyit}–${d.zar}` : 'zárva';
  const last = hoursGroups[hoursGroups.length - 1];
  if (last && last.key === key) last.to = d.nev;
  else hoursGroups.push({ key, from: d.nev, to: null });
}
const hoursShort = hoursGroups.map((g) =>
  `${(g.to ? `${g.from}–${g.to}` : g.from).toLowerCase()} ${g.key}`
).join(', ');

const ldOpeningHours = [];
for (const d of HOURS) {
  const opens = d.nyit || '00:00';
  const closes = d.zar || '00:00';
  const same = ldOpeningHours.find((o) => o.opens === opens && o.closes === closes);
  if (same) same.dayOfWeek.push(DAY_EN[d.nap]);
  else ldOpeningHours.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: [DAY_EN[d.nap]], opens, closes });
}

/* ---- árlista ---- */
const ITEMS = ARLISTA.tetelek;
const ITEM = Object.fromEntries(ITEMS.map((t) => [t.id, t]));
const prices = ITEMS.map((t) => t.ar).filter((n) => typeof n === 'number');
const priceRange = `${Math.min(...prices)}–${Math.max(...prices)} HUF`;

// főoldal: a megszokott 01–15 sorrend, lebegő előnézettel
const arlistaHome = ITEMS.map((t, i) => `<li class="svc" data-img="${t.kep}">
        <em>${String(i + 1).padStart(2, '0')}</em>
        <h3>${escapeHtml(t.nev)}</h3>
        <p>${t.leiras ? escapeHtml(t.leiras) : t.egyseg ? escapeHtml(t.egyseg) : '&nbsp;'}</p>
        <b>${t.ar != null ? ft(t.ar) : 'Egyedi'}</b>
      </li>`).join('\n      ');

// /arak/: kategóriánként csoportosított, olvasható táblázat
const arlistaTable = ARLISTA.kategoriak.map((k) => {
  const rows = ITEMS.filter((t) => t.kategoria === k.id).map((t) => `<tr>
          <th scope="row">${escapeHtml(t.nev)}${t.leiras ? `<small>${escapeHtml(t.leiras)}</small>` : ''}</th>
          <td>${t.egyseg ? escapeHtml(t.egyseg) : '—'}</td>
          <td class="price">${t.ar != null ? ft(t.ar) : 'Egyedi'}</td>
        </tr>`).join('\n        ');
  return `<section class="price-group" id="${k.id}" aria-labelledby="ar-${k.id}">
      <h2 id="ar-${k.id}">${escapeHtml(k.nev)}</h2>
      <div class="table-scroll">
      <table class="price-table" aria-labelledby="ar-${k.id}">
        <thead><tr><th scope="col">Szolgáltatás</th><th scope="col">Egység</th><th scope="col">Munkadíj</th></tr></thead>
        <tbody>
        ${rows}
        </tbody>
      </table>
      </div>
      <p class="price-more"><a href="${k.oldal}">Mit tartalmaz? ${escapeHtml(k.nev)} részletesen →</a></p>
    </section>`;
}).join('\n\n    ');

const ldArlista = {
  '@type': 'OfferCatalog',
  '@id': `${SITE}/arak/#arlista`,
  name: 'Kerékpárszerviz munkadíj árlista',
  url: `${SITE}/arak/`,
  itemListElement: [
    ...ARLISTA.kategoriak.map((k) => ({
      '@type': 'OfferCatalog',
      name: k.nev,
      itemListElement: ITEMS.filter((t) => t.kategoria === k.id).map((t) => ({
        '@type': 'Offer',
        priceCurrency: 'HUF',
        ...(t.ar != null ? { price: String(t.ar) } : {}),
        itemOffered: {
          '@type': 'Service',
          name: t.nev,
          ...(t.leiras || t.egyseg ? { description: t.leiras || t.egyseg } : {}),
          provider: { '@id': `${SITE}/#muhely` }
        }
      }))
    })),
    {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: ARLISTA.szallitas.nev,
        description: ARLISTA.szallitas.leiras,
        provider: { '@id': `${SITE}/#muhely` }
      }
    }
  ]
};

/* ---- készlet (előre renderelve) ----
   Korábban a rács csak JavaScripttel, a keszlet-seed.json letöltése
   után töltődött fel — a kereső egy üres „Készlet betöltése…" sort
   látott. Most a build beleírja a HTML-be; a script.js csak a
   képnagyítót köti rá. */
const bikeName = (b) => {
  const generic = !b.alt || /^Raktáron lévő/i.test(b.alt);
  const fromNote = (b.leiras || '').split('\n')[0].slice(0, 80).trim();
  return (generic && fromNote) ? fromNote : (b.alt || fromNote || 'Kerékpár');
};

const stockHtml = !bikes.length
  ? '<p class="stock-state" id="stockState">Jelenleg nincs raktáron bringa. Hívj minket, és szólunk, ha érkezik.</p>'
  : bikes.map((b) => {
    const name = bikeName(b);
    const seed = /^\/img\/keszlet\/([^/]+)\.jpg$/i.exec(b.src);
    const srcset = seed
      ? ` srcset="/img/keszlet/${seed[1]}-480.jpg 480w, ${b.src} 700w" sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw"`
      : '';
    return `<figure class="stock-item in" role="listitem"><img src="${escapeHtml(b.src)}"${srcset} width="700" height="875" alt="${escapeHtml(name)} — felújított, eladó kerékpár" loading="lazy" decoding="async" tabindex="0" role="button" aria-label="${escapeHtml(name)} — kép megnyitása nagyban" data-full="${escapeHtml(b.src)}" data-nev="${escapeHtml(name)}"${b.leiras ? ` data-leiras="${escapeHtml(b.leiras)}"` : ''}></figure>`;
  }).join('\n      ');

/* Aktualitás — a nyitvatartás mellett megjelenő kiemelt üzenet.
   A szöveget a készletkezelő írja az aktualitas.json-ba. Ha nincs
   mit kiírni, az egész dobozt kivágjuk a HTML-ből: üresen tátongó
   keret rosszabb, mint a semmi. */
const AKTUALITAS = String(
  JSON.parse(readFileSync('aktualitas.json', 'utf8')).szoveg || ''
).trim();

const VALUES = {
  ...Object.fromEntries(Object.entries(CEG).filter(([k, v]) => !k.startsWith('_') && typeof v === 'string')),
  telefonHivas: CEG.telefon.replace(/\s+/g, ''),
  ev: String(new Date().getFullYear()),
  nyitvatartasRovid: hoursShort,
  nyitvatartasLista: hoursListHtml,
  priceRange,
  ldNyitvatartas: JSON.stringify(ldOpeningHours),
  ldArlista: JSON.stringify(ldArlista, null, 2)
};

const missing = Object.entries(CEG)
  .filter(([, v]) => typeof v === 'string' && v.startsWith('[KITÖLTENDŐ'))
  .map(([k]) => k);


/* ================= oldalak feldolgozása ================= */

/* <!--#include partials/x.html--> — a közös fejléc, lábléc és a
   strukturált adat egyetlen példányban él a partials/ mappában. */
const include = (html, depth = 0) => html.replace(
  /<!--#include ([\w./-]+)-->/g,
  (_, file) => {
    if (depth > 4) throw new Error(`Túl mély include: ${file}`);
    return include(readFileSync(file, 'utf8').replace(/\s+$/, ''), depth + 1);
  }
);

for (const page of PAGES) {
  const file = `${OUT}/${page.file}`;
  let html = include(readFileSync(file, 'utf8'));

  // generált blokkok
  html = html
    .replace(/<!--@ARLISTA-->[\s\S]*?<!--\/@ARLISTA-->/g, arlistaHome)
    .replace(/<!--@ARTABLA-->[\s\S]*?<!--\/@ARTABLA-->/g, arlistaTable)
    .replace(/<!--@KESZLET-->[\s\S]*?<!--\/@KESZLET-->/g, stockHtml)
    .replace(/\{\{ar:([\w-]+)\}\}/g, (_, id) => {
      if (!ITEM[id]) throw new Error(`Ismeretlen árlista-tétel: {{ar:${id}}} — ${page.file}`);
      return ITEM[id].ar != null ? ft(ITEM[id].ar) : 'egyedi ár';
    });

  for (const [key, value] of Object.entries(VALUES)) {
    html = html.split(`{{${key}}}`).join(value);
  }

  html = AKTUALITAS
    ? html.split('{{aktualitasSzoveg}}').join(escapeHtml(AKTUALITAS))
    : html.replace(/[ \t]*<!--AKTUALITAS-->[\s\S]*?<!--\/AKTUALITAS-->\r?\n?/g, '');

  // a menüben az aktuális oldal jelölése
  html = html
    .split(`data-nav href="${page.url}"`).join(`aria-current="page" href="${page.url}"`)
    .split('data-nav href=').join('href=');

  for (const [rel, v] of stamps) {
    html = html.split(`"${rel}"`).join(`"${rel}?v=${v}"`);
    html = html.split(`"/${rel}"`).join(`"/${rel}?v=${v}"`);
  }

  const leftover = html.match(/\{\{[^}]+\}\}|<!--#include|<!--@/g);
  if (leftover) {
    console.error(`\n!! HIBA — feldolgozatlan helyőrző a(z) ${page.file} oldalon: ${[...new Set(leftover)].join(', ')}\n`);
    process.exit(1);
  }

  writeFileSync(file, html);
}


/* ================= sitemap.xml ================= */

/* A <lastmod> a tartalom valódi utolsó módosítása: az oldal forrásának
   és az adatfájljainak legutóbbi commitja (git). Korábban minden build a
   mai dátumot írta minden oldalra — a Google az ilyen megbízhatatlan
   dátumot figyelmen kívül hagyja. A CI teljes előzménnyel klónoz
   (fetch-depth: 0), ezért a git itt pontos. */
const today = new Date().toISOString().slice(0, 10);
const gitDate = (paths) => {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...paths], { encoding: 'utf8' }).trim();
    return out || today;
  } catch {
    return today;
  }
};
// helyben még nem commitolt változásnál a mai nap a helyes
const dirty = (paths) => {
  try {
    return execFileSync('git', ['status', '--porcelain', '--', ...paths], { encoding: 'utf8' }).trim() !== '';
  } catch {
    return false;
  }
};

const sitemapUrls = PAGES.filter((p) => p.sitemap).map((p) => {
  const paths = [p.file, ...(p.deps || [])];
  const lastmod = dirty(paths) ? today : gitDate(paths);
  const imgs = (p.images || []).map(([src, title]) => `
    <image:image>
      <image:loc>${SITE}/${src}</image:loc>
      <image:title>${escapeHtml(title)}</image:title>
    </image:image>`).join('');
  return `  <url>
    <loc>${SITE}${p.url}</loc>
    <lastmod>${lastmod}</lastmod>${imgs}
  </url>`;
});

writeFileSync(`${OUT}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<!-- A build készíti (build-functions.mjs, PAGES lista) — kézzel ne szerkeszd. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${sitemapUrls.join('\n')}
</urlset>
`);

console.log(
  `Kész: ${PAGES.length} oldal a ${OUT}/ mappában, domain ${DOMAIN}, ` +
  `${bikes.length} bringa a készletben, ${ITEMS.length} árlista-tétel. ` +
  `Képtömörítés: -${Math.round(saved / 1024)} KB.\n` +
  `Nyitvatartás: ${hoursShort}\n` +
  `Aktualitás: ${AKTUALITAS ? `„${AKTUALITAS}”` : 'nincs — a doboz kimarad az oldalról.'}`
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
