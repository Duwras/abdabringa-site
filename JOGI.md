# Jogi dokumentumok — mi készült el és mi a teendőd

## 1. AMIT KI KELL TÖLTENED (enélkül nem hiteles)

Nyisd meg a **`ceg-adatok.json`** fájlt, és írd át a `[KITÖLTENDŐ: ...]`
részeket. Négy adat hiányzik:

| Mező | Mit írj bele | Honnan nézd meg |
|---|---|---|
| `nev` | A teljes neved, ahogy a nyilvántartásban szerepel | Vállalkozói igazolvány |
| `szekhely` | A székhely címe irányítószámmal | Vállalkozói igazolvány |
| `nyilvantartasiSzam` | Egyéni vállalkozói nyilvántartási szám | [nyilvantarto.hu](https://www.nyilvantarto.hu/evny-lekerdezo/) — név alapján kereshető |
| `adoszam` | Adószám, `12345678-1-08` formában | NAV, vagy a vállalkozói igazolvány |

Ha a **székhely megegyezik** a műhellyel (Bécsi utca 128), akkor is írd be
külön — a törvény a székhelyet kéri, nem a telephelyet.

Mentés után futtasd:

```bash
npm.cmd run build
```

A build **szól, ha maradt kitöltetlen mező**. Az adatok egy helyről
kerülnek mind a három dokumentumba, tehát máshol nem kell átírni semmit.

---

## 2. Mi készült el

| Dokumentum | Fájl | Miért kötelező |
|---|---|---|
| **Impresszum** | `impresszum.html` | 2001. évi CVIII. tv. (Ekertv.) 4. § — minden üzleti weboldalnak |
| **Adatkezelési tájékoztató** | `adatkezeles.html` | GDPR 13. cikk — mert a kapcsolati űrlap személyes adatot gyűjt |
| **Sütik és tárolt adatok** | `sutik.html` | GDPR + Eht. — a külső beágyazás és a tárolt hozzájárulás miatt |
| **Hozzájárulási sáv** | `consent.js` | A Google Térkép beágyazásához előzetes hozzájárulás kell |

Mindhárom oldal linkelve van a lábléc**ben**, és egymásra is hivatkoznak.

### ÁSZF-et szándékosan NEM készítettem
A weboldalon nem lehet online megrendelni, foglalni vagy fizetni — a
megállapodás mindig telefonon vagy személyesen jön létre. Így a
45/2014. (II. 26.) Korm. rendelet szerinti távollévők közötti
szerződéskötés nem valósul meg, ÁSZF nem kötelező. Ezt az impresszum
külön ki is mondja. **Ha később online időpontfoglalás vagy webshop
indul, az ÁSZF kötelezővé válik** — szólj, és megírom.

---

## 3. Mi változott az oldalon

### A hozzájárulási sáv
Első látogatáskor alul feljön egy sáv két gombbal: **Elfogadom** és
**Csak a szükségeset**. A két gomb szándékosan azonos méretű — ha az
elutasítás nehezebb lenne, a hozzájárulás nem önkéntes, tehát
érvénytelen. A válasz 12 hónapig él, utána újra kérdez.

A látogató bármikor módosíthatja: lábléc → **Sütibeállítások**, vagy a
sütitájékoztató oldal alján lévő gomb.

### A térkép csak elfogadás után tölt be
Korábban a Google Térkép azonnal betöltött, és minden látogató IP-címét
elküldte a Google-nek. Most a helyén egy doboz áll egy gombbal.
**Elfogadás nélkül egyetlen kérés sem indul a Google felé** — ezt
méréssel ellenőriztem.

### A betűtípusok a saját szerverünkről jönnek
A Google Fonts korábban szintén elküldte minden látogató IP-címét a
Google-nek. A betűfájlok (Open Font License) most a `fonts/` mappában
vannak. Mellékhatás: az oldal gyorsabb lett, mert megszűnt egy külső,
megjelenítést blokkoló stíluslap.

### A kapcsolati űrlapon kötelező jelölőnégyzet
Az űrlap adatai a **Web3Forms** szolgáltatáson keresztül jutnak el
hozzád. Ezt üzemeltető cég Indiában van bejegyezve, a szerverek az
USA-ban — ez EGT-n kívüli adattovábbítás, amihez a GDPR 49. cikk
(1) a) pontja szerint **kifejezett hozzájárulás** kell. Ezért nem lehet
elküldeni az űrlapot a jelölőnégyzet bepipálása nélkül.

---

## 4. Amit érdemes tudnod

**Ezek szakmailag megalapozott, az oldal tényleges működéséhez igazított
dokumentumok, de nem ügyvédi ellenjegyzés.** Ha a vállalkozás nő, vagy
vitás ügy merül fel, egy ügyvédi átnézés olcsóbb, mint egy
fogyasztóvédelmi bírság. A NAIH adatvédelmi bírsága kisvállalkozásnál
is indulhat több százezer forintról.

**Amit külön nézz át a szövegben:**
- Az impresszumban a **jótállás/szavatosság** rész általánosan
  fogalmaz. Ha a használt bringákra egy évre rövidíted a szavatosságot,
  arról a vásárlás előtt írásban is tájékoztasd a vevőt.
- A megőrzési idő az üzenetekre **1 év** — ezt te választottad. Ha
  hosszabb kell, írd át a `adatkezeles.html`-ben (2.1 táblázat).

**Ha egyszer analitikát vagy Facebook pixelt tennél az oldalra:** szólj,
mert akkor a sütitájékoztatót és a hozzájárulási sávot bővíteni kell —
a jelenlegi szöveg kimondja, hogy ilyen nincs.

---

## 5. Amit a hatóságok felé tudni kell

| Kérdés | Válasz |
|---|---|
| Kell NAIH-nál regisztrálni? | **Nem.** Az adatvédelmi nyilvántartás 2018-ban megszűnt. |
| Kell adatvédelmi tisztviselő? | **Nem.** Csak nagy volumenű megfigyelésnél vagy különleges adatoknál kötelező. |
| Kell adatkezelési nyilvántartást vezetni? | Kisvállalkozásnál (250 fő alatt) általában nem, de a rendszeres adatkezelés miatt **ajánlott** egy egyoldalas belső feljegyzés. |
| Kell adatvédelmi hatásvizsgálat? | **Nem.** Nincs magas kockázatú adatkezelés. |

**Békéltető testület** (fogyasztói vitákhoz, benne van az impresszumban):
Győr-Moson-Sopron Vármegyei Békéltető Testület, 9021 Győr, Szent István út 10/A.

> Az EU online vitarendezési (ODR) platformja **2025. július 20-án
> megszűnt**. A legtöbb interneten talált sablon még mindig hivatkozik rá
> — a mi dokumentumaink szándékosan nem.
