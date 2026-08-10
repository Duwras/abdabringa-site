# Bringa fel- és levétele a készletből

Két út van. A **készletkezelő felület** a kényelmes; a **kézi
szerkesztés** akkor jó, ha valamit ki kell javítani.

Mindkettő ugyanoda ír: a [keszlet-seed.json](keszlet-seed.json)
fájlba és az `img/keszlet/` mappába. Mentés után a GitHub magától
újraépíti az oldalt, **kb. 1–2 perc** múlva látszik élesben.

---

# A) Készletkezelő felület

Cím: **<https://abdabringa.hu/admin.html>** — az oldal láblécében is
ott a *Admin* link. Telefonról ugyanúgy megy.

Feltöltéskor a böngésző 1400 px-re kicsinyíti a képet, a build utána
készít belőle egy 700 és egy 480 px-es változatot. A telefonod
4-5 MB-os fotójával nem kell foglalkoznod.

## Egyszeri beállítás: hozzáférési kulcs

Az oldal mögött nincs szerver, tehát nincs mit jelszóval védeni. A
belépést a GitHub végzi, egy **hozzáférési kulccsal** (personal access
token). Ezt egyszer kell elkészíteni.

1. <https://github.com/settings/personal-access-tokens> → **Generate
   new token**
2. Töltsd ki:

   | Mező | Mit válassz |
   |---|---|
   | Token name | `bringazol-keszlet` |
   | Expiration | 1 év (a lejárat után újat kell csinálni) |
   | Repository access | **Only select repositories** → `abdabringa-site` |
   | Permissions → Repository permissions → **Contents** | **Read and write** |

   Csak a `Contents` kell. Semmi mást ne kapcsolj be.

3. **Generate token** → másold ki. **A GitHub csak egyszer mutatja meg.**
4. Nyisd meg az admin oldalt, illeszd be a kulcsot, *Belépés*.

A kulcs a te böngésződben marad, a repóba soha nem kerül bele. Alapból
a lap bezárásáig él; ha bepipálod a *„Jegyezze meg ezen az eszközön"*
jelölőt, a kilépésig marad — ezt **csak saját telefonon vagy gépen**
tedd meg.

> Ha a kulcs elveszik vagy illetéktelen kezébe kerül, a fenti oldalon
> töröld (*Revoke*), és csinálj újat. Mást nem kell tenni — a régi
> azonnal használhatatlan.

## Napi használat

**Új bringa**: *Válassz képeket* (vagy húzd be őket) → mindegyik kép
alá írd be a **rövid leírást** és — ha van mit — a **részletes
leírást** → *Feltöltés*.

A **rövid leírás** nem díszítés: ezt mondja fel a képernyőolvasó, és ezt
indexeli a Google. Jó: `Zöld Gepida trekking kerékpár`. Rossz: `kép`,
`IMG_2841`. Ha üresen hagyod, egy általános szöveg kerül oda.

A **részletes leírás** az ügyfélnek szól: ez jelenik meg a weboldalon,
amikor rákattint a képre. Ide való minden, amit tudnia kell — méret,
sebességek, mit cseréltünk rajta, milyen hibája van. Több sor is lehet,
a sortörések megmaradnak. Ha üresen hagyod, a rövid leírás látszik.

**Levétel**: a kép alatti *Törlés* gomb. A képfájl is törlődik a repóból.

Egyszerre legfeljebb 12 kép. Az egész művelet **egyetlen commit**, tehát
12 kép feltöltése is egy újraépítést indít, nem tizenkettőt.

---

# B) Kézi szerkesztés

Ha a felület nem elérhető, vagy csak egy leírást akarsz javítani.

### Kép feltöltése

<https://github.com/Duwras/abdabringa-site/tree/main/img/keszlet>

*Add file* → *Upload files* → *Commit changes*. A fájlnév legyen
`k16.jpg`, `k17.jpg`… — a soron következő szám, csak `.jpg`.

> Ha a telefonod HEIC-et készít, előbb mentsd JPG-ként. A Fotók appban
> a *Megosztás → Másolás és exportálás → JPEG* elég hozzá.

### Sor hozzáadása

<https://github.com/Duwras/abdabringa-site/edit/main/keszlet-seed.json>

Az előző sor végére vessző kell:

```json
  { "id": "seed-k15", "src": "/img/keszlet/k15.jpg", "alt": "Kék Schwinn kerékpár" },
  { "id": "seed-k16", "src": "/img/keszlet/k16.jpg", "alt": "Zöld Gepida trekking kerékpár", "leiras": "28\" váz, 3x8 sebesség. Új fékbetét és lánc, a hátsó sárvédő kicsit karcos." }
]
```

| Mező | Mi legyen benne |
|---|---|
| `id` | egyedi azonosító, `seed-` + a fájlnév (`seed-k16`) |
| `src` | `/img/keszlet/` + a feltöltött fájl neve |
| `alt` | rövid leírás: szín + márka + típus |
| `leiras` | *(elhagyható)* részletes leírás az ügyfélnek — ez látszik a képre kattintva |

> A `leiras` mezőben az idézőjelet `\"`-ként, a sortörést `\n`-ként
> kell írni — a JSON így kéri. A felületen ezzel nem kell bajlódni.

### Levétel

Töröld ki a sorát, és ügyelj rá, hogy az utolsó megmaradó sor végén
**ne maradjon vessző**. Ha minden bringa elfogy, üres lista is jó:

```json
[]
```

Ilyenkor az oldalon ez jelenik meg: *„Jelenleg nincs raktáron bringa.
Hívj minket, és szólunk, ha érkezik."*

---

## Ha valami elromlik

Az oldal nem tud „félig" kikerülni — a build inkább megáll:

- **Elgépelt fájlnév** (a JSON olyan képre hivatkozik, ami nincs meg):
  a build hibával leáll, és kiírja, melyik sor a hibás.
- **Elrontott JSON** (hiányzó vessző, zárójel): ugyanez.

Mindkét esetben az **élő oldal a régi, ép változaton marad**.

Az állapot itt látszik:
<https://github.com/Duwras/abdabringa-site/actions> — zöld pipa = kint
van, piros = megállt, kattints rá a hibaüzenetért.

A legutóbbi működő állapot mindig visszaállítható: a fájl *History*
nézetében kiválasztod a jó változatot, és visszamented.
