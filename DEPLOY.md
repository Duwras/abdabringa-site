# Üzemeltetés

**A feltöltés lépésről lépésre: [FELTOLTES.md](FELTOLTES.md)**
**SEO — mi van kész és mi a teendő domainvásárlás után: [SEO.md](SEO.md)**
**Jogi dokumentumok — ITT VAN KITÖLTENDŐ ADAT: [JOGI.md](JOGI.md)**

Röviden: a drag & drop feltöltés **nem viszi fel a függvényeket**, ezért
azzal nem működik az admin belépés. Helyette:

```bash
npm.cmd run build
```

```bash
npm.cmd run deploy
```

## Napi használat

1. Az oldal láblécében: **Admin** gomb → jelszó → átdob a kezelőfelületre.
2. **Új képek**: válaszd ki vagy húzd be őket (telefonról HEIC is jó),
   majd *Feltöltés*. A böngésző feltöltés előtt 1400 px-re kicsinyíti.
3. **Törlés**: a kép alatti *Törlés* gomb.

A változás azonnal látszik a weboldalon. Feltölteni csak akkor kell
újra, ha maga az oldal kódja változik — a bringák kezeléséhez soha.

## Hogyan tárolódnak a képek

A készlet listája a Netlify Blobs tárolóban él. Ha még sosem
szerkesztetted, automatikusan a `keszlet-seed.json`-ból töltődik fel.
Ha az API bármiért nem érhető el, az oldal ugyanerre a fájlra esik
vissza — üres szekciót a látogató sosem lát.

## Az admin felület védelme

Az `admin.html` egy statikus fájl — aki kitalálja a címét, meg tudja
nyitni. **Ettől még nem tud semmit csinálni**, mert a védelem nem ott
van, hanem a szerveren (`src/lib/auth.mjs`):

1. **A jelszó nincs a kódban.** Csak az `ADMIN_PASSWORD` környezeti
   változóból jön. Ha nincs beállítva, az admin API mindenre 503-mal
   válaszol — nincs beépített tartalék jelszó, amit ki lehetne
   olvasni a fájlokból.
   ```bash
   npm.cmd run jelszo -- "a-jelszavad"
   ```
2. **Munkamenet-token.** A sikeres belépés egy HMAC-SHA256 aláírású,
   8 óra után lejáró tokent ad. A jelszó ezután nem megy vissza többé
   a hálózaton, és a tokent nem lehet hamisítani vagy meghosszabbítani
   (az aláírás a lejárati időt is fedi). A token a lap bezárásakor
   eltűnik, jelszócserekor pedig az összes kiadott token érvénytelen lesz.
3. **Kizárás.** 5 hibás próbálkozás után az adott IP-cím 15 percre,
   10 után 1 órára ki van tiltva a belépésből. Ugyanez vonatkozik a
   találgatott tokenekkel érkező kérésekre is. Az IP nyersen nem
   tárolódik, csak egy visszafejthetetlen lenyomata.

Minden feltöltés és törlés érvényes tokent kér. Token nélkül a válasz
`401` — a felület látszik, de üres és használhatatlan marad.

## Korlátok

- Egyszerre max. 12 kép, képenként max. 8 MB.
- A belépés 8 óráig, de legfeljebb a lap bezárásáig él (`sessionStorage`).
- A `seed-` előtagú képek statikus fájlok az `img/keszlet/` mappában.
  Törlés után eltűnnek a listából, de a fájl megmarad; ha végleg
  nem kell, kézzel törölhető a következő feltöltés előtt.
