# Tudástár — tartalomterv

A `/tudastar/` technikai váza kész (lista oldal, BlogPosting + BreadcrumbList JSON-LD,
sitemap, belső linkek). **Két cikk él**, a többi terv. Havonta legfeljebb 1–2 új cikk —
tömegesen generált, AI-ízű szöveg többet árt, mint használ.

## Szabályok minden cikkhez

- Egy H1, logikus H2/H3; 600–1200 szó, valódi, gyakorlati tudás.
- Legalább **2 belső link**: a témába vágó szolgáltatás-horgonyra (`/szolgaltatasok/#…`) és
  az árlistára vagy a Győr-oldalra. Természetes horgonyszöveg, nem mindig exact-match.
- Helyi kontextus (Abda, Győr) csak ott, ahol természetes — tipikusan a cikk végén.
- Ár csak `{{ar:azonosito}}` helyőrzővel (az `arlista.json`-ból jön, nem avul el).
- Kép: lehetőleg saját műhelyfotó, leíró alt-szöveggel. Stockfotónál az alt ne állítsa,
  hogy „az abdai műhelyben” készült.
- Ne állíts olyat a műhelyről, ami nem igaz (szolgáltatás, idő, garancia).
- Új cikk felvétele: mappa + `index.html` a meglévő cikk mintájára → kártya a
  `tudastar/index.html`-be (és az ItemListbe) → sor a `build-functions.mjs` `PAGES`
  listájába → `npm run build` + `npm run ellenorzes`.

## Kész

| URL | Cím | Belső linkek |
|---|---|---|
| `/tudastar/mikor-kell-kerekparlancot-cserelni/` | Mikor kell kerékpárláncot cserélni? | `/szolgaltatasok/#karbantartas`, `/arak/`, `/kerekparszerviz-gyor/` |
| `/tudastar/tavaszi-kerekpar-szerviz/` | Tavaszi kerékpár szerviz: mit érdemes ellenőrizni? | `/szolgaltatasok/#karbantartas`, `/arak/`, `/kerekparszerviz-gyor/`, `/szervizterulet/#hazhoz` |

## Tervezett (javasolt sorrend)

| # | Munkacím | Fő kérdés / kulcsszó | Céllink | Megjegyzés |
|---|---|---|---|---|
| 1 | Mit tartalmaz egy teljes kerékpár átvizsgálás? | kerékpár átvizsgálás, teljes karbantartás | `/szolgaltatasok/#karbantartas`, `/arak/` | Az általános és a teljes karbantartás tételesen, mikor melyik. Legközelebb a konverzióhoz. |
| 2 | Mikor kell fékbetétet cserélni kerékpáron? | fékbetét csere, kopott fékpofa | `/szolgaltatasok/#fek` | V-fék és tárcsafék külön; kopásjelek, fotókkal. |
| 3 | Kerékpár karbantartás tél után | téli tárolás után bringa | `/tudastar/tavaszi-kerekpar-szerviz/`, `/szolgaltatasok/` | Tárolási hibák (lapos gumi, rozsdás lánc) — kiegészíti a tavaszi cikket, nem ismétli. |
| 4 | Kerékpár felkészítés hosszabb túrára | túra előtti bringa ellenőrzés | `/szolgaltatasok/#karbantartas` | Pótbelső, szerszám, fékek, csavarok. |
| 5 | Kerékpár mosás és hajtás tisztítás otthon | bringa mosás, lánc tisztítás | `/szolgaltatasok/#egyeb` | Házi mosás lépései. NE ígérjen bringamosó állomást — a műhely „koszos kerékpár takarítást” vállal. |
| 6 | Defekt az úton: mit tegyél? | defekt javítás, belső csere | `/szolgaltatasok/#kerek`, `/szervizterulet/#hazhoz` | Háztól házig természetesen bekerül. |
| 7 | Nyolcas a keréken: mikor kell centrírozni? | centrírozás | `/szolgaltatasok/#kerek` | |
| 8 | Használt kerékpár vásárlás: mire figyelj? | használt kerékpár vásárlás | `/kerekparbolt-gyor/` | A saját felújított bringák felé vezet, őszintén. |

## Frissítés

- Évente egyszer nézd át a cikkeket (árak automatikusan frissek; a `dateModified` kézzel
  írandó a JSON-LD-ben, ha a tartalom érdemben változik).
- Search Console → Teljesítmény → „Oldalak”: mely cikkek hoznak megjelenést, melyik
  lekérdezésre — ebből jöhet a következő téma.
