# Feltöltés Netlify-ra — részletes leírás

## Miért nem működik a drag & drop

A Netlify-nak két különböző dolgot kell kitennie:

| Rész | Mi ez | Drag & drop feltölti? |
|---|---|---|
| Statikus fájlok | `index.html`, `style.css`, képek | **Igen** |
| Függvények | `bikes.mjs`, `bike-image.mjs` — az admin belépés és a képfeltöltés | **Nem** |

A drag & drop feltöltésnél a Netlify **nem futtat build lépést**, és a
függvényeket kizárólag build közben csomagolja be és telepíti. Ezért ad
a `/api/login` 404-et akárhányszor húzod be a mappát: a weboldal fent van,
de a mögötte lévő két függvény sosem jutott ki.

Ez a Netlify felületének a korlátja, nem beállítás kérdése — semmilyen
mappaszerkezettel vagy `netlify.toml`-lal nem kerülhető meg. A `deploy.zip`
ugyanígy manuális feltöltés, azzal sem megy.

Két működő út van. Az **A) módszer** a rövidebb, és nem kell hozzá GitHub.

---

# A) módszer — Netlify CLI (ajánlott)

Ugyanolyan manuális feltöltés, mint a húzás, csak a függvényeket is
felviszi. Nem kell hozzá GitHub-fiók és nem kell semmit összekötni.

## Előfeltétel

Node.js a gépen. Ellenőrzés — nyiss egy **PowerShell**-t a projekt
mappájában (a `Documents\Claude\bringazol-site` mappában jobb klikk →
*Megnyitás a terminálban*), és futtasd:

```bash
node --version
```

Ha kiír egy verziószámot (pl. `v22.17.0`), minden rendben. Ha „nem
ismerhető fel" hibát ír, telepítsd innen: <https://nodejs.org> (LTS verzió,
Next-Next-Finish), majd nyiss **új** PowerShell ablakot.

> **Miért `npm.cmd` és nem `npm`?**
> A Windows alapból tiltja a PowerShell-szkriptek futtatását, az `npm`
> parancs pedig egy ilyen szkript. Ezért adna ilyen hibát:
> `npm.ps1 cannot be loaded because running scripts is disabled on this system`
>
> Az `npm.cmd` ugyanazt csinálja, de nem szkript — a tiltás nem érinti.
> **Írj mindenhol `npm.cmd`-ot, és nincs több gond.** Rendszerbeállítást
> nem kell módosítani.

## 1. lépés — bejelentkezés (csak egyszer, valaha)

```bash
npm.cmd run login
```

Megnyílik a böngésző a Netlify oldalán. Kattints az **Authorize** gombra.
A PowerShell-ben megjelenik, hogy `You are now logged in as ...`.

Ha nem nyílna meg magától a böngésző, a PowerShell kiír egy hosszú
linket — azt másold be a böngésző címsorába.

## 2. lépés — az oldal összekötése (csak egyszer)

```bash
npm.cmd run link
```

Kérdéseket tesz fel, nyilakkal választasz, Enterrel nyugtázol:

1. **How do you want to link this folder to a site?**
   → válaszd: `Search by full or partial site name`
2. **Enter the site name (or just part of it):**
   → írd be a Netlify-on lévő oldal nevét (pl. `bringazol`), Enter
3. Kilistázza a találatot → Enter

A végén ezt írja: `Directory Linked` és alatta az oldal címét.

> Ha nem tudod az oldal nevét: Netlify → a projekt megnyitása → a cím a
> böngésző címsorában, pl. `bringazol.netlify.app` → a név `bringazol`.

## 3. lépés — feltöltés

Ezt a kettőt kell futtatni minden alkalommal, amikor az oldal változik:

```bash
npm.cmd run build
```

```bash
npm.cmd run deploy
```

A `build` előállítja a `deploy/` mappát és a `netlify/functions/` mappát.
A `deploy` mindkettőt felteszi. A végén kiírja:

```
Website URL: https://bringazol.netlify.app
```

Ennyi. A 2. feltöltéstől kezdve csak ez a két parancs kell, az 1–2. lépést
soha többé.

## 4. lépés — ellenőrzés

1. Netlify → a projekt → bal oldalt **Functions** menüpont.
   Két függvénynek kell ott lennie: `bikes` és `bike-image`.
   Ha üres a lista, a feltöltés nem vitte fel őket — lásd a hibakeresést.
2. Nyisd meg böngészőben: `https://<az-oldalad>.netlify.app/api/bikes`
   Ha JSON-t látsz (`{"bikes":[...]}`), a függvény él.
3. Az oldal láblécében **Admin** → a beállított jelszó → be kell engednie.
   (Ha még nem állítottad be az `ADMIN_PASSWORD`-öt, itt fog szólni —
   lásd lent: *Admin jelszó — KÖTELEZŐ beállítani*.)

## Hibakeresés

| Tünet | Ok / megoldás |
|---|---|
| `npm.ps1 cannot be loaded because running scripts is disabled` | Ez a PowerShell szkript-tiltása. Írj `npm.cmd`-ot `npm` helyett. |
| `npx.ps1 cannot be loaded because running scripts is disabled` | Ugyanaz: írj `npx.cmd`-ot `npx` helyett. |
| `npm : The term 'npm' is not recognized` | Nincs Node.js, vagy régi ablakban vagy. Telepítsd, nyiss új PowerShell-t. |
| `Error: Not logged in` | Futtasd: `npm.cmd run login` |
| `Error: No site id supplied` | Futtasd: `npm.cmd run link` |
| A Functions lista üres | A `netlify/functions/` mappa üres. Futtasd előbb: `npm.cmd run build` |
| Belépéskor „nincs telepítve (404)" | A függvények nem jutottak ki — 4/1. pont szerint ellenőrizd |
| Belépéskor „Hibás jelszó" | A jelszó tényleg nem stimmel — lásd lejjebb a jelszó beállítását |
| „Az admin jelszó nincs beállítva a szerveren" | Nincs `ADMIN_PASSWORD` környezeti változó — lásd lejjebb |
| „Túl sok hibás próbálkozás" | 5 hibás jelszó után a saját IP-címed 15 percre ki van zárva. Várd ki. |

---

# B) módszer — GitHub + automatikus feltöltés

Hosszabb beállítás, de utána a feltöltés annyi, hogy elmented a fájlt és
egy gombot nyomsz — a Netlify magától újraépíti az oldalt.

## 1. lépés — Git telepítése

<https://git-scm.com/download/win> → letöltés, telepítés végig Next-tel.
Utána új PowerShell-ben:

```bash
git --version
```

## 2. lépés — GitHub-fiók és üres repó

1. <https://github.com> → *Sign up*, ha még nincs fiókod.
2. Jobb felül **+** → **New repository**.
3. **Repository name**: `bringazol-site`
4. **Private** legyen kiválasztva.
5. Semmit ne pipálj be (se README, se .gitignore).
6. **Create repository**.
7. A következő oldalon másold ki a `https://github.com/...bringazol-site.git` címet.

## 3. lépés — a projekt feltöltése a GitHubra

A projekt mappájában, PowerShell-ben:

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Bringazol weboldal"
```

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/FELHASZNALONEV/bringazol-site.git
```

(a `FELHASZNALONEV`-et cseréld a sajátodra)

```bash
git push -u origin main
```

Első alkalommal felugrik egy ablak: **Sign in with your browser** → engedélyezd.

## 4. lépés — összekötés a Netlify-jal

1. Netlify → a meglévő projekt → **Project configuration**
2. **Build & deploy** → **Continuous deployment** → **Link repository**
   (ha új oldalt csinálnál: *Add new project* → *Import an existing project*)
3. **GitHub** → engedélyezd a hozzáférést → válaszd a `bringazol-site` repót.
4. A build beállításoknál ennek kell szerepelnie (a `netlify.toml`-ból
   automatikusan kitölti, csak ellenőrizd):

   | Mező | Érték |
   |---|---|
   | Build command | `npm run build` |
   | Publish directory | `deploy` |
   | Functions directory | `netlify/functions` |

   > Itt `npm run build` a helyes, `.cmd` nélkül — ez a Netlify Linux
   > szerverén fut, ott nincs `npm.cmd`. A `.cmd` csak a te Windows
   > gépeden kell.

5. **Deploy**.

Az első build 1–2 perc. A **Deploys** lapon látod a naplót; a végén
`Site is live`. A **Functions** lapon meg kell jelennie a `bikes` és
`bike-image` függvénynek.

## 5. lépés — a napi használat ezután

Ha az oldal kódja változik:

```bash
git add .
```

```bash
git commit -m "mi valtozott"
```

```bash
git push
```

A Netlify magától újraépít és élesít. Nem kell se `build`, se `deploy`.

> A bringák fel- és letöltéséhez **soha** nem kell semmit feltölteni —
> az az admin felületen megy, és azonnal látszik.

---

# Admin jelszó — KÖTELEZŐ beállítani

A jelszó **nincs benne a kódban**. Ha nem állítod be, az admin felület
nem enged be senkit (se téged, se mást) — „Az admin jelszó nincs
beállítva a szerveren" üzenetet ad.

Netlify → **Project configuration** → **Environment variables** → **Add a variable**:

```
ADMIN_PASSWORD = <a jelszó>
```

Mentés után **Deploys** → **Trigger deploy** → *Deploy site*, hogy a
függvény felvegye az értéket.

Parancssorból ugyanez (a `.cmd` végződés a PowerShell szkript-tiltása miatt kell):

```bash
npm.cmd run jelszo -- "a-jelszavad"
```

Ellenőrzés, hogy tényleg beállt:

```bash
npm.cmd run jelszo-ellenorzes
```

> Ügyelj rá, hogy ne maradjon szóköz az érték végén — a kód levágja,
> de a Netlify felülete néha láthatatlanul beilleszti.

Jelszócsere után **minden addigi belépés azonnal megszűnik** — akit be
volt lépve, annak újra meg kell adnia az újat.

---

# Mi hol van

| Fájl / mappa | Mire való |
|---|---|
| `index.html`, `style.css`, `script.js` | a nyilvános weboldal |
| `admin.html`, `admin.css`, `admin.js` | a készletkezelő felület |
| `src/functions/bikes.mjs` | készlet API — **ezt szerkeszd**, ha kell |
| `src/functions/bike-image.mjs` | a feltöltött képek kiszolgálása |
| `src/lib/auth.mjs` | admin védelem: jelszó, munkamenet-token, kizárás |
| `build-functions.mjs` | ebből készül a `deploy/` és a `netlify/functions/` |
| `netlify.toml` | a Netlify beállításai (útvonalak, fejlécek) |
| `keszlet-seed.json` + `img/keszlet/` | a kiinduló készlet |
| `img/svc-web/` | az árlista hover-képei |
| `deploy/` | **generált** — a weboldal statikus fájljai |
| `netlify/functions/` | **generált** — a becsomagolt függvények |

A `deploy/` és a `netlify/functions/` szándékosan külön van: ami a
`deploy/` mappában van, azt a Netlify bárkinek kiszolgálja fájlként.
A függvények forrása nem lehet ott — az csak szerveroldalon fut.

## Képek

A forrásképekhez **nem kell hozzányúlni** — az `npm.cmd run build`
minden alkalommal újratömöríti őket a `deploy/` mappába:

- a méretet a tényleges megjelenítéshez igazítja (kétszeres
  pixelsűrűségre hagyva ráhagyást),
- a készletképekből egy keskenyebb, 480 px-es változatot is készít
  telefonra (`k01-480.jpg`) — a képnagyító továbbra is a nagyot nyitja,
- mozjpeg-gel újrakódol.

Így lett a feltöltendő csomag 7,5 MB-ról 4,5 MB, a telefonon letöltött
készlet pedig 3,7 MB-ról 1,1 MB. Új képet elég a forrásmappába tenni.
