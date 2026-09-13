# SEO implementációs riport — abdabringa.hu

Dátum: 2026-09-13 · Hatókör: helyi SEO (1. Abda, 2. Győr és környéke, 3. Győr-Moson-Sopron, 4. országos csak mellékesen)

Az oldal üzenete Google és a látogatók felé:
**„BRINGÁZOLi egy Abdán működő kerékpárszerviz, Győr közvetlen közelében, amely helyi kerékpárosoknak kínál tényleges szervizszolgáltatásokat.”**
Sehol nem állítjuk, hogy a műhely Győrben van.

Prioritás-jelölés: **CRITICAL** · **HIGH** · **MEDIUM** · **LOW**

---

## 1. Jelenlegi (kiinduló) állapot

| Terület | Megállapítás |
|---|---|
| Technológia | Statikus HTML/CSS/JS, saját Node build (`build-functions.mjs`, `sharp` képtömörítés), GitHub Pages, GitHub Actions deploy. SSG-jellegű: minden HTML szerveroldalon kész, kivéve a készletrácsot (kliensoldali `fetch`). |
| Oldalak | 1 tartalmi oldal (`/`) + 3 jogi + admin + 404. Nem volt Győr-, szolgáltatás-, ár-, kapcsolat-, szervizterület oldal. |
| Indexelés | HTTPS kényszerítve, `www` → apex 301 egy lépésben, valódi 404 — **rendben**. `/index.html` és `/impresszum` (kiterjesztés nélkül) is 200 — canonical kezeli. |
| SEMrush | 3 organikus kulcsszó, 0 Top 10, ~0 forgalom. |
| Cégprofil | ~5,0 csillag, ~35 értékelés. |
| Mérés | GA4 hozzájárulás után (helyes), de **nincs konverziómérés**. |

## 2. Megtalált hibák

| # | Hiba | Prioritás | Állapot |
|---|---|---|---|
| 1 | **Rejtett szöveg**: a H1 a „BRINGÁZOL¿” márkanév volt, a leírás `sr-only` (vizuálisan rejtett) spanban ült; mind az 5 H2-ben is rejtett kulcsszavas kiegészítés. Rejtett-szöveg kockázat. | CRITICAL | ✅ javítva |
| 2 | Nincs Győrt célzó oldal; a teljes relevancia egy egyoldalas site-on. | CRITICAL | ✅ `/kerekparszerviz-gyor/` |
| 3 | Nincs önálló szolgáltatás-, ár-, kapcsolat-, szervizterület oldal. | HIGH | ✅ |
| 4 | Nincs konverziómérés (hívás, útvonal, űrlap). | HIGH | ✅ |
| 5 | NAP csak egy sorban a láblécben; a név 3 alakban szerepelt; nyitvatartás csak a főoldalon. | HIGH | ✅ közös NAP-lábléc minden oldalon, egy forrásból |
| 6 | `robots.txt` tiltotta az `admin.html`-t → a keresők nem látják a `noindex`-et (URL-ként indexelhető maradhatott). | MEDIUM | ✅ |
| 7 | `sitemap.xml`: minden build minden oldalra a mai `<lastmod>`-ot írta (megbízhatatlan jel). | MEDIUM | ✅ git-alapú lastmod |
| 8 | Készletrács csak JavaScripttel töltődött (a kereső „Készlet betöltése…”-t látott). | MEDIUM | ✅ build-időben renderelve |
| 9 | Mobilon az LCP-elem a hero 3D bringa 1400 px-es, alacsony prioritású rétege volt. | MEDIUM | ✅ |
| 10 | Megosztási kép négyzetes (849×846); FB/X levágja. | MEDIUM | ✅ 1200×630 `og-kep.jpg` |
| 11 | JSON-LD `geo` ~100 m-re a címtől (Szent Imre utcára esik). | MEDIUM | ✅ eltávolítva (csak pontos adat kerülhet vissza) |
| 12 | „Győrtől 10 percre” — nem igazolt menetidő a meta descriptionben. | MEDIUM | ✅ eltávolítva |
| 13 | „5,0 csillag 34 értékelésből” — elavuló szám. | LOW | ✅ szám nélkül |
| 14 | `(nem kötelező)` űrlapfelirat kontrasztja 2,48:1 (WCAG AA bukó). | LOW | ✅ |
| 15 | Mobilon nincs telefonszám a fejlécben (860 px alatt rejtett), nincs kiemelt hívás-CTA. | HIGH | ✅ mobil gyorssáv |
| 16 | A hozzájárulási sáv relatív linkjei mappás oldalakon 404-re mutattak volna. | LOW | ✅ |

## 3. Elvégzett módosítások

### Tartalom és struktúra
- **Főoldal**: új title/description; látható H1 „Kerékpárszerviz Abdán, Győr mellett”; a márkanév-felirat díszlet `<p>` lett; hero-szöveg: kerékpár javítás, műhely, fő szolgáltatások; minden rejtett címsorszöveg törölve; Győr-bekezdés (1-es főút, Bécsi utca — OSM-mel ellenőrizve) linkkel; belső linkek az árlista alatt, a háztól-házig blokkban, a kapcsolatnál; NAP a kapcsolat-szekcióban.
- **Új oldalak**: lásd 5. pont. Mind egyedi title/description, egy H1, H2/H3 hierarchia, CTA, NAP, belső linkek, morzsamenü, JSON-LD.
- **GYIK** a Győr-, ár- és szolgáltatásoldalon — csak a weboldalon / repóban igazolt tényekből.
- **Tudástár** 2 cikkel (lánccsere, tavaszi szerviz) + tartalomterv (`CONTENT_PLAN.md`).

### Egy forrásból kezelt adatok (NAP- és árkonzisztencia)
- `ceg-adatok.json`: új mezők — `uzletNev`, címrészek, `terkepLink`, `utvonalLink`, `facebook`, `nyitvatartas`.
- `arlista.json` (új): a 15 tétel + kategóriák. Ebből készül a főoldali lista, az `/arak/` táblázat, a `{{ar:id}}` helyek és a JSON-LD árkatalógus.
- `partials/`: `header.html`, `footer.html` (NAP-blokk + mobil gyorssáv), `ld-business.json`, `lightbox.html` — a build `<!--#include …-->`-dal húzza be.

### Technikai
- Build: include-ok, generált árlista/nyitvatartás/készlet, `aria-current` a menüben, feldolgozatlan helyőrző esetén leáll.
- `sitemap.xml` a build terméke, csak kanonikus, indexelhető URL-ekkel, git-alapú `<lastmod>`.
- `seo-check.mjs` + `npm run ellenorzes`, a CI-ben is: törött link/horgony, hiányzó kép/alt, title/description duplikáció, H1-szám, canonical, JSON-LD szintaxis, rejtett címsorszöveg, árva oldal, sitemap.
- Workflow: `fetch-depth: 0` (lastmod), ellenőrző lépés a deploy előtt.
- `robots.txt`: admin tiltás megszüntetve (a `noindex` így érvényesül).
- `script.js`: null-biztos (aloldalakon is fut), SSR-készlet esetén nem tölt újra, abszolút `/keszlet-seed.json`, űrlap-konverzió esemény.
- `consent.js`: konverziós események, gyökérből hivatkozott jogi oldalak.

## 4. Módosított fájlok

**Módosítva:** `index.html`, `404.html`, `impresszum.html`, `adatkezeles.html`, `sutik.html`, `style.css`, `script.js`, `consent.js`, `build-functions.mjs`, `ceg-adatok.json`, `robots.txt`, `package.json`, `.github/workflows/deploy.yml`, `SEO.md`, `DEPLOY.md`
**Törölve:** `sitemap.xml` (a build generálja)
**Új:** `arlista.json`, `page.css`, `seo-check.mjs`, `img/og-kep.jpg`, `partials/*`, a 9 új oldal (`*/index.html`), `SEO_KEYWORDS_LOCAL.md`, `LOCAL_SEO_GBP_CHECKLIST.md`, `LOCAL_LINK_BUILDING.md`, `CONTENT_PLAN.md`, `ANALYTICS_EVENTS.md`, `SEO_IMPLEMENTATION_REPORT.md`

## 5. Új URL-ek

| URL | Cél |
|---|---|
| `/szolgaltatasok/` | szolgáltatások részletesen, horgonyokkal |
| `/arak/` | HTML árlista kategóriánként + tudnivalók |
| `/kerekparszerviz-gyor/` | Győr landing („Győr mellett, Abdán”) |
| `/szervizterulet/` | Abda, Győr, szomszédos falvak, háztól házig |
| `/kerekparbolt-gyor/` | felújított használt bringák (valós készlet) |
| `/kapcsolat/` | teljes NAP, nyitvatartás, űrlap, térkép |
| `/tudastar/` + 2 cikk | tartalomklaszter alapja |

**Szándékosan nem készült:** `/kerekpar-javitas-gyor/` (ugyanaz a szándék, mint a Győr-oldalé → kannibalizáció/doorway), `/bringamosas-gyor/` (nincs bringamosó szolgáltatás, csak „koszos kerékpár takarítás”), `/elektromos-kerekpar-szerviz-gyor/` (csak e-bike defektjavítás igazolt), településenkénti oldalak.

## 6. Redirectek

Nem kellett: egyetlen meglévő URL sem változott (a jogi oldalak `.html` címe maradt). HTTP→HTTPS és www→apex a GitHub Pages-en élőben ellenőrizve: egylépéses 301, lánc nélkül. A perjel nélküli mappacímet (pl. `/arak` → `/arak/`) a GitHub Pages magától 301-gyel irányítja — élesítés után érdemes egyszer `curl -I`-vel megnézni. A canonical és minden belső link a perjeles alakot használja.

## 7. Title / meta változások

| URL | Title | Description (röviden) |
|---|---|---|
| `/` | Kerékpárszerviz Abda – Győr mellett \| BRINGÁZOLi | kerékpárszerviz és -műhely Abdán, Győr mellett, fő szolgáltatások, háztól házig |
| `/szolgaltatasok/` | Kerékpár javítás és karbantartás Abdán \| BRINGÁZOLi | defekt, fék, váltó, lánc, centrírozás, karbantartás |
| `/arak/` | Kerékpárszerviz árak, munkadíjak – Abda \| BRINGÁZOLi | konkrét árak `arlista.json`-ból |
| `/kerekparszerviz-gyor/` | Kerékpárszerviz Győr mellett, Abdán \| BRINGÁZOLi | Győr szomszédságában, Abdán, Bécsi utca |
| `/szervizterulet/` | Szervizterület: Abda, Győr és környéke \| BRINGÁZOLi | honnan hozható, háztól házig |
| `/kerekparbolt-gyor/` | Használt kerékpár eladó Győr mellett, Abdán \| BRINGÁZOLi | felújított városi, MTB, országúti, gyerekbringák |
| `/kapcsolat/` | Kapcsolat, nyitvatartás, útvonal – Abda \| BRINGÁZOLi | teljes NAP + nyitvatartás |
| `/tudastar/` | Tudástár: kerékpár karbantartás tippek \| BRINGÁZOLi | |
| cikkek | saját cím + márka | |

Minden oldalon: self-referencing canonical, `og:url`, `og:image` (1200×630), Twitter card, `lang="hu"`. Hreflang nincs (nincs más nyelv).

## 8. Schema változások

- **BikeStore** (LocalBusiness altípus) megtartva: a műhely szervizel ÉS ténylegesen árul felújított használt kerékpárokat (készlet + impresszum igazolja). A leírás a szervizt helyezi előre.
- `name` = Cégprofil-név (`uzletNev`), `alternateName` a korábbi alakok; `telephone`, `address`, `openingHoursSpecification` (generált), `areaServed` (Abda, Győr, Öttevény, Ikrény, megye — a meglévő adatból), `sameAs` (Facebook), `hasMap`, `priceRange` (500–15000 HUF, az árlistából), `hasOfferCatalog`.
- `geo` eltávolítva (pontatlan). **AggregateRating nincs** (Google irányelv).
- Új: `OfferCatalog` kategóriánként (generált), `Service` entitások (`provider` = a műhely), `BreadcrumbList` minden aloldalon, `ContactPage`, `CollectionPage`, `BlogPosting`.
- Mind a 15 oldal JSON-LD-je szintaktikailag ellenőrizve (`npm run ellenorzes`).

## 9. Belső linkelés

Főoldal → szolgáltatások, árak, Győr, szervizterület, kapcsolat, eladó bringák · Menü (minden oldalon) → 5 fő oldal · Lábléc (minden oldalon) → 7 szervizoldal + jogi · Szolgáltatások → árak, tudástár, Győr, szervizterület · Árak → szolgáltatás-horgonyok kategóriánként · Győr → szolgáltatás-horgonyok, árak, szervizterület, kapcsolat, eladó bringák · Szervizterület → Győr, főoldal, kapcsolat · Cikkek → szolgáltatások, árak, Győr, háztól házig. Árva oldal nincs (ellenőrizve).

## 10. Teljesítmény

Mérés: Chrome DevTools, 390×844 mobil, Slow 4G + 4× CPU, helyi szerver **tömörítés nélkül** (élesben gzip):

| | Előtte | Utána |
|---|---|---|
| LCP | 3 705 ms | 2 868 ms (−23%) |
| CLS | 0,00 | 0,00 |
| Hero háttér | 99 KB WebP / 115 KB JPG | 46 KB előre szürkített WebP |
| 3D bringa rétegek mobilon | 161 KB (1400 px) | 77 KB (800 px, `<picture media>`) |
| Nav logó | 512 px, ~15 KB | 102 px, 2 KB |

- A mobil LCP-elem (a bringa váza) már nem alacsony prioritású; a kerekek/hajtókar igen.
- A render-blocking CSS helyben 1,3 s-nak látszik, de élesben a `style.css` gzip-pel 11 KB — alacsony tétel.
- Lighthouse (mobil): Accessibility / Best Practices / SEO **100** a főoldalon, szolgáltatások, árak, Győr, kapcsolat, eladó bringák és cikk oldalon.

## 11. Még manuálisan elvégzendő

| Feladat | Prioritás |
|---|---|
| **Commit + push** (élesítés). A változtatások helyben kész és ellenőrzött állapotban vannak, nincsenek élesítve. | CRITICAL |
| **Cégprofil-név ellenőrzése**: a weboldal „BRINGÁZOLi Kerékpárszervíz” alakot használ (a brief alapján). Ha a Cégprofilban más, a `ceg-adatok.json` → `uzletNev` átírandó. | CRITICAL |
| `areaServed`: Öttevény és Ikrény a korábbi adatból jön — erősítsd meg, hogy onnan valóban jönnek ügyfelek. | MEDIUM |
| `paymentAccepted: Készpénz` (korábbi adat) — ha kártyát is elfogadtok, javítsd a `partials/ld-business.json`-ban. | LOW |
| Pontos koordináta a Cégprofil tűjéről → `geo` visszaírható. | LOW |
| A 2 tudástár cikk szakmai átnézése a műhely részéről. | MEDIUM |
| Ha van e-bike teljes szerviz / bringamosó / alkatrész-értékesítés: szólj, és kaphat saját oldalt. | LOW |

## 12. Google Business Profile feladatok

Részletesen: **[LOCAL_SEO_GBP_CHECKLIST.md](LOCAL_SEO_GBP_CHECKLIST.md)**. Legfontosabbak:
- **CRITICAL** — NAP betűre egyezzen a weboldallal; weboldal URL: `https://abdabringa.hu/`.
- **HIGH** — elsődleges kategória: kerékpárjavítás; másodlagos: kerékpárbolt; mind a 15 szolgáltatás felvitele árakkal.
- **HIGH** — szabályos értékelésgyűjtés (QR a pultra, szóbeli kérés mindenkitől, egyszeri utókövetés; ösztönzés és válogatás tilos); minden értékelésre válasz.
- **MEDIUM** — leírás, valós fotók havonta, citation audit (Facebook, Apple, Bing, OSM, katalógusok).

## 13. Search Console feladatok

| Feladat | Prioritás |
|---|---|
| Sitemap újraküldése: `https://abdabringa.hu/sitemap.xml` (13 URL) | CRITICAL |
| URL-ellenőrzés + indexelés kérése: `/`, `/kerekparszerviz-gyor/`, `/szolgaltatasok/`, `/arak/`, `/kapcsolat/` | HIGH |
| Oldalak jelentés: 2–4 hét múlva nézd meg, mind a 13 URL „Indexelve” állapotban van-e | HIGH |
| Fejlesztések / Strukturált adatok: morzsamenü és cikk-jelölés hibamentes-e | MEDIUM |
| Rich Results Test a főoldalra és a Győr-oldalra (LocalBusiness) | MEDIUM |
| GA4 ↔ Search Console összekapcsolás | LOW |

## 14. SEMrush Site Audit feladatok

- Új projekt-audit élesítés után; várható: 13 indexelhető oldal, 0 törött link, 0 duplikált title/description.
- Figyelmeztetés várható lehet a hosszú (>160 karakteres) descriptionökre — a Google levágja, nem hiba.
- Havonta újrafuttatás; új oldalnál mindig.
- „Crawled pages” ≠ 13? → ellenőrizd a `PAGES` listát a `build-functions.mjs`-ben.

## 15. SEMrush Position Tracking lista

Részletek, címkék, céloldalak: **[SEO_KEYWORDS_LOCAL.md](SEO_KEYWORDS_LOCAL.md)**. Hely: **Győr** (ha elérhető, Abda is), mobil + asztali bontás, Local Pack követés bekapcsolva.

**Kötelező:** kerékpárszerviz Abda · kerékpár szerviz Abda · kerékpár javítás Abda · kerékpár műhely · bringa műhely · kerékpárszerviz Győr · kerékpár szerviz Győr · kerékpár javítás Győr · bicikli szerviz Győr · bringa szerviz Győr · kerékpár műhely Győr · bringa műhely Győr

**Kiegészítő (megfigyelés):** kerékpárszerviz árak · használt kerékpár Győr · kerékpárbolt Győr (csak használt bringára releváns) · bringamosó (kiinduló pozíció miatt; nem célzott) · bringamosó Győr / bringamosás Győr, elektromos kerékpár szerviz Győr, kerékpár alkatrész Győr — **csak ha a szolgáltatás elindul**.

## 16. Analytics

Részletek: **[ANALYTICS_EVENTS.md](ANALYTICS_EVENTS.md)**. `phone_click`, `directions_click`, `contact_click`, `appointment_click`, `contact_form_submit` — csak hozzájárulás után. GA4-ben kulcseseménynek jelölendő: `phone_click`, `directions_click`, `contact_form_submit` (**HIGH**). Nincs duplikált mérés, GTM nincs, azonosító nincs kitalálva.

## 17. Amit szándékosan NEM tettünk

Kulcsszóhalmozás, rejtett szöveg, cloaking, településoldal-spam, hamis értékelés/ár/szolgáltatás/nyitvatartás, értékelés-markup, indexelhető belső keresés, tömeges AI-cikkek, „Győrben” kommunikáció — egyik sincs az oldalon.

Megjegyzés: a felhasználói CLAUDE.md-ben előírt `ui-ux-pro-max` / `frontend-design` / `design-system` skillek ebben a környezetben nem érhetők el; az új oldalak a meglévő `style.css` design tokenjeire (színek, betűk, térközök) épülnek, új vizuális irány nélkül. A teljesítménymérés a `web-perf` skill szerint, Chrome DevTools-szal történt.
