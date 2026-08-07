# Bringa fel- és levétele a készletből

A raktáron lévő bringák listája a [keszlet-seed.json](keszlet-seed.json)
fájlban van, a képek az `img/keszlet/` mappában. Nincs admin felület —
ez a két hely a készlet.

Minden mentés után a GitHub magától újraépíti és kiteszi az oldalt,
**kb. 1–2 perc** múlva látszik élesben.

---

## Új bringa felvétele — telefonról vagy gépről

Végig a GitHub webes felületén, telepítés nélkül.

### 1. Kép feltöltése

Menj ide: <https://github.com/Duwras/abdabringa-site/tree/main/img/keszlet>

*Add file* → *Upload files* → válaszd ki a fényképet → *Commit changes*.

**A fájlnév legyen `k16.jpg`, `k17.jpg`… — a soron következő szám.**
Csak `.jpg` lehet. A méretével nem kell foglalkozni: a build
automatikusan 700 px-re kicsinyíti, és készít egy 480 px-es változatot
is telefonra.

> Ha a telefonod HEIC-et készít, előbb mentsd JPG-ként. A Fotók appban
> a *Megosztás → Másolás és exportálás → JPEG* elég hozzá.

### 2. Sor hozzáadása a listához

Menj ide: <https://github.com/Duwras/abdabringa-site/edit/main/keszlet-seed.json>

Illessz be egy új sort a lista végére — **az előző sor végére vessző kell**:

```json
  { "id": "seed-k15", "src": "/img/keszlet/k15.jpg", "alt": "Kék Schwinn kerékpár" },
  { "id": "seed-k16", "src": "/img/keszlet/k16.jpg", "alt": "Zöld Gepida trekking kerékpár" }
]
```

| Mező | Mi legyen benne |
|---|---|
| `id` | egyedi azonosító, `seed-` + a fájlnév (`seed-k16`) |
| `src` | `/img/keszlet/` + a feltöltött fájl neve |
| `alt` | **rövid leírás: szín + márka + típus** |

Az `alt` nem díszítés: ezt olvassa fel a képernyőolvasó, és ezt látja a
Google. Jó: `"Zöld Gepida trekking kerékpár"`. Rossz: `"kép"`, `"IMG_2841"`.

*Commit changes* → kész.

## Bringa levétele

Ugyanott, a [keszlet-seed.json](keszlet-seed.json)-ból **töröld ki a
sorát**, és ügyelj rá, hogy az utolsó megmaradó sor végén **ne maradjon
vessző**. A képfájlt nem kötelező törölni, de ha már nem kell, nyugodtan
mehet.

Ha minden bringa elfogy, üres lista is jó:

```json
[]
```

Ilyenkor az oldalon ez jelenik meg: *„Jelenleg nincs raktáron bringa.
Hívj minket, és szólunk, ha érkezik."*

---

## Ha valami elromlik

Az oldal nem tud „félig" kikerülni — a build inkább megáll:

- **Elgépelt fájlnév** (a JSON olyan képre hivatkozik, ami nincs meg):
  a build hibával leáll, és kiírja, melyik sor a hibás. Az élő oldal
  marad a régi, ép változaton.
- **Elrontott JSON** (hiányzó vessző, zárójel): ugyanez.

Az állapotot itt látod:
<https://github.com/Duwras/abdabringa-site/actions> — zöld pipa = kint
van, piros = megállt, kattints rá a hibaüzenetért.

Ha elakadtál, a legutóbbi működő állapot mindig visszaállítható: a
fájl *History* nézetében kiválasztod a jó változatot, és visszamented.
