# SEO — mi van kész, és mi a dolgod élesítéskor

Az oldal a **https://abdabringa.hu** címre van felkészítve. Ha végül
más domain lesz, keresd meg a `abdabringa.hu` szöveget ezekben a
fájlokban, és írd át mindenhol:

| Fájl | Hol |
|---|---|
| `index.html` | canonical, `og:url`, `og:image`, `twitter:image`, teljes JSON-LD blokk |
| `robots.txt` | `Sitemap:` sor |
| `sitemap.xml` | `<loc>` és a két `<image:loc>` |

Semmi más fájlban nincs domain.

---

## Ami már be van építve

**Meta / alap**
- Kulcsszavas title: „Kerékpárszerviz Abdán — Bringázol¿ kerékpárműhely”
- 155 karakteres leírás, benne Abda + Győr + a fő szolgáltatások
- `canonical` a saját domainre (duplikált tartalom ellen)
- `robots`: `index, follow, max-image-preview:large` — nagy kép a
  Google találatban
- `lang="hu"`, `og:locale=hu_HU`, geo meta (HU-GS, Abda, koordináta)

**Megosztás**
- Teljes Open Graph (Facebook, Messenger) és Twitter/X `summary_large_image`
- `og:image` abszolút URL-lel + méret + alt — enélkül a Facebook
  gyakran nem húzza be a képet

**Strukturált adat (JSON-LD)** — ez a legfontosabb helyi SEO elem
- `BikeStore`: név, cím, irányítószám, telefon, e-mail, logó, kép,
  térkép, Facebook, kiszolgált települések (Abda, Győr, Öttevény, Ikrény)
- `WebSite`
- `OfferCatalog`: mind a 15 szolgáltatás névvel és forint árral —
  ettől a Google érti, hogy „centrírozás ár”, „defektjavítás Győr”
  típusú keresésekre releváns vagy

**Technikai**
- `sitemap.xml` képekkel; a `<lastmod>` minden `npm run build`-nál
  magától a mai dátumra frissül
- `robots.txt` sitemap-hivatkozással
- `404.html` — a Google ne „soft 404”-ként lássa a hibás címeket
- `site.webmanifest` + apple-touch-icon
- Gyorsítótár-törés: a CSS/JS hivatkozások mögé a build a fájl
  tartalmából számolt `?v=` bélyeget teszi — a böngésző csak akkor
  tölt újat, ha a fájl tényleg változott

**Tartalom / akadálymentesség**
- Egyetlen `<h1>`, benne rejtett kulcsszavas kiegészítés
  („kerékpárszerviz és kerékpárműhely Abdán, Győr mellett”)
- Minden `h2` kapott rejtett, kereső számára olvasható pontosítást
- Képek: leíró `alt`, `width`/`height` (nem ugrál a layout = jobb CLS),
  `loading`/`decoding`/`fetchpriority`
- A készlet képeinek `alt`-ja is kulcsszavas lett
- Szekciók `aria-labelledby`-vel

---

## Élesítés utáni teendők (ezeket nem lehet kódból megcsinálni)

1. **Domain rákötése és HTTPS** — a lépések a [DEPLOY.md](DEPLOY.md)
   „Egyszeri beállítás" részében. A GitHub a `www.` címet magától
   átirányítja az `abdabringa.hu`-ra, a HTTPS-t az *Enforce HTTPS*
   kapcsolja be — a Google rangsorol rá.
2. **Google Search Console** (search.google.com/search-console):
   domain tulajdonlás igazolása → *Sitemaps* → küldd be:
   `https://abdabringa.hu/sitemap.xml` → *URL Inspection* → *Request indexing*.
3. **Google Cégprofil (Business Profile)**: ez hozza a helyi
   találatok 80%-át. Fontos: a név, cím, telefon **betűre ugyanúgy**
   szerepeljen, mint az oldalon (Bécsi utca 128, 9151 Abda,
   +36 30 364 0141). A profilba írd be a weboldal címét is.
   Ha már létezik a profil, csak a webcímet kell frissíteni.
4. **Nyitvatartás**: az oldalon jelenleg sehol nincs. Ha megadod,
   beteszem a JSON-LD-be `openingHoursSpecification`-ként — a Google
   ki tudja írni a találat mellé. Ez most szándékosan hiányzik, mert
   nem találgatok.
5. **Facebook**: az oldal „Névjegy” részébe is menjen be a weboldal
   linkje — ez visszamutató link, és segít az összekapcsolásban.
6. **Bing Webmaster Tools**: importálható a Search Console-ból, két kattintás.

---

## Amit szándékosan NEM tettem bele

- **Csillagos értékelés a strukturált adatba.** A Google irányelve
  tiltja, hogy a saját oldalad markupjában szerepeltesd a máshonnan
  (Google Térkép) származó értékelésedet — kézi büntetést is hozhat.
  A látogatónak megjelenő idézet és a Google-linkkel maradt.
- **Nyitvatartás** — lásd fentebb, adat kell hozzá.
- **Blog / aloldalak.** Egy egyoldalas site esetén ez a maximum;
  ha később kulcsszavanként külön aloldal kell („defektjavítás Győr”,
  „e-bike szerviz”), az már tartalomírás, nem technikai SEO.

## Egy javasolt kép

A megosztási kép (`img/hero-muhely.jpg`) négyzetes, 849×846.
A Facebook és az X 1200×630-at szeret — négyzetesből levágja a
tetejét-alját. Ha csinálsz egy 1200×630-as változatot
(`img/og-kep.jpg`), szólj, és átírom rá a meta tageket.
