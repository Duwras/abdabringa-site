# SEO — hogyan tartsd karban

A teljes helyi SEO-átalakítás leírása, a megtalált hibák és a kézi teendők:
**[SEO_IMPLEMENTATION_REPORT.md](SEO_IMPLEMENTATION_REPORT.md)**.

Kapcsolódó dokumentumok:
- [SEO_KEYWORDS_LOCAL.md](SEO_KEYWORDS_LOCAL.md) — kulcsszó → oldal térkép, SEMrush Position Tracking lista
- [LOCAL_SEO_GBP_CHECKLIST.md](LOCAL_SEO_GBP_CHECKLIST.md) — Google Cégprofil, értékelésgyűjtés, citation audit
- [LOCAL_LINK_BUILDING.md](LOCAL_LINK_BUILDING.md) — helyi hivatkozásépítés
- [CONTENT_PLAN.md](CONTENT_PLAN.md) — tudástár cikktervek
- [ANALYTICS_EVENTS.md](ANALYTICS_EVENTS.md) — GA4 konverziós események

## Hol mit írj át

| Mit | Hol (EGYETLEN helyen) | Hová kerül automatikusan |
|---|---|---|
| Név, cím, telefon, e-mail, Facebook, térkép-linkek | `ceg-adatok.json` | minden oldal lábléce (NAP), kapcsolat, Győr-oldal, JSON-LD, impresszum |
| Nyitvatartás | `ceg-adatok.json` → `nyitvatartas` | főoldal + kapcsolat lista, lábléc, meta description, JSON-LD `openingHoursSpecification` |
| Árak | `arlista.json` | főoldali árlista, `/arak/` táblázat, `{{ar:…}}` helyek a szövegekben, JSON-LD árkatalógus |
| Domain | `ceg-adatok.json` → `domain` | canonical, og:url, JSON-LD, sitemap, CNAME (a `robots.txt` Sitemap sorát kézzel) |
| Fejléc, menü | `partials/header.html` | minden tartalomoldal |
| Lábléc, mobil gyorssáv | `partials/footer.html` | minden oldal |
| Vállalkozás JSON-LD | `partials/ld-business.json` | főoldal, szolgáltatások, árak, Győr, szervizterület, kapcsolat, eladó bringák |
| Új oldal | mappa + `index.html`, sor a `build-functions.mjs` `PAGES` listájába | feldolgozás + `sitemap.xml` |

A `sitemap.xml` a build terméke (a `<lastmod>` a git-előzményből jön) — kézzel ne írd.

## Ellenőrzés

```bash
npm.cmd run build
```

```bash
npm.cmd run ellenorzes
```

Az `ellenorzes` (`seo-check.mjs`) megállítja a közzétételt, ha törött belső link, hiányzó
kép/alt, duplikált title/description, nem egy H1, rossz canonical, hibás JSON-LD, rejtett
címsor-szöveg, árva oldal vagy hibás sitemap-bejegyzés van. A CI minden push után lefuttatja.

## Szándékosan nincs

- **AggregateRating / csillagok a strukturált adatban** — a Google tiltja a máshonnan
  (Google Térkép) származó értékelés saját oldalon való jelölését.
- **`geo` koordináta** — a korábbi érték ~100 m-re volt a címtől. Csak a Cégprofil tűjének
  pontos koordinátája kerülhet be (`partials/ld-business.json`).
- **Településenkénti landing oldalak** — doorway-kockázat; helyette egy `/szervizterulet/`.
- **Külön e-bike, bringamosó, alkatrész oldal** — nincs rá igazolt szolgáltatás.
- **hreflang** — nincs más nyelvű változat.
