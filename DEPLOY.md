# Üzemeltetés

Az oldal **GitHub Pages**-en fut, a repó:
<https://github.com/Duwras/abdabringa-site>

**Bringa fel- és levétele: [KESZLET.md](KESZLET.md)**
**SEO — teendők élesítés után: [SEO.md](SEO.md)**
**Jogi dokumentumok — ITT VAN KITÖLTENDŐ ADAT: [JOGI.md](JOGI.md)**

## Hogyan kerül ki a változás

Nincs kézi feltöltés. Minden `main` ágra küldött push után a GitHub
lefuttatja a [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
munkafolyamatot, ami:

1. `npm ci` — telepíti a `sharp` képtömörítőt
2. `npm run build` — a forrásból elkészíti a `deploy/` mappát
3. kiteszi élesbe a `deploy/` tartalmát

Kb. **1–2 perc**. Az állapot az Actions fülön látszik; ha piros, ott a
hibaüzenet is. A `deploy/` mappa **nincs verziókövetve** — mindig a
forrásból készül, így nem tud szétcsúszni a repó és az éles oldal.

Helyi ellenőrzésre:

```bash
npm.cmd run build
```

```bash
npm.cmd run elonezet
```

## Egyszeri beállítás

Ezt egyszer kell megcsinálni, utána soha többé.

### 1. GitHub Pages bekapcsolása

Repó → *Settings* → *Pages* → **Source: GitHub Actions**.

> A repónak **publikusnak** kell maradnia. Ingyenes GitHub-fiókon a
> Pages csak publikus repóból szolgál ki — privátra állítva az oldal
> leáll. (Fizetős GitHub Pro/Team esetén a privát is működik.)

### 2. Domain rákötése — rackhost

A rackhost DNS-kezelőjében a `abdabringa.hu` zónába:

| Típus | Név | Érték |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `duwras.github.io.` |

Mind a négy `A` rekord kell — ezek a GitHub Pages kiszolgálói.

Utána: repó → *Settings* → *Pages* → *Custom domain* → `abdabringa.hu`
→ *Save*. A GitHub ellenőrzi a DNS-t (pár perc – pár óra), majd
pipáld be az **Enforce HTTPS**-t. A tanúsítvány ingyenes, magától
újul meg.

A `CNAME` fájlt nem kell kézzel létrehozni — a build minden alkalommal
megírja a `ceg-adatok.json` `domain` mezőjéből. Ha domaint váltasz,
elég ott átírni (plusz a `SEO.md` szerinti helyeken).

## Amit ez a felállás nem tud

A GitHub Pages **csak statikus fájlokat** szolgál ki, szerveroldali kód
nincs. Ebből következik:

- **Nincs admin felület.** A készletet fájlszerkesztéssel kezeled,
  lásd [KESZLET.md](KESZLET.md). Telefonról is megy, a GitHub
  webes felületén.
- **Nem állíthatók HTTP-fejlécek.** A gyorsítótárazást a GitHub
  szabja meg. Ez nem okoz gondot: a build a CSS/JS hivatkozások mögé
  a fájl tartalmából számolt `?v=` bélyeget tesz, tehát ha a fájl
  változik, a böngésző biztosan újat tölt.
- **A korábbi `Permissions-Policy` fejléc elveszett.** Ez egy védelmi
  többlet volt (kamera/mikrofon/geolokáció letiltása), nem
  működésbeli elem — az oldal egyiket sem használja.

Ami **változatlanul működik**: a kapcsolati űrlap (Web3Forms, külső
szolgáltatás), a sütibanner, a Google Térkép beágyazás, a képnagyító,
és a teljes SEO-beállítás.
