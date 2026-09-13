# Google Cégprofil (Google Business Profile) — ellenőrzőlista

A helyi találatok (Térkép / „Local Pack”) elsősorban a Cégprofilból épülnek. A weboldal ezt
csak megerősíti. Ezt a listát a profil tulajdonosának kell végigvinnie — kódból nem módosítható.

A Google a helyi rangsorolásnál három dolgot néz: **relevancia** (mennyire illik a profil a
kereséshez), **távolság** (mennyire van közel a keresőhöz) és **ismertség/megbízhatóság**
(értékelések, hivatkozások, említések). A távolságon nem lehet változtatni — ezért nem is
szabad Győrbe „költöztetni” a profilt.

## 1. NAP-egyeztetés (név, cím, telefon) — CRITICAL

A weboldal minden oldalán, a láblécben és a strukturált adatban ez szerepel
(forrás: `ceg-adatok.json`):

| Mező | Weboldalon | Teendő |
|---|---|---|
| Név | **BRINGÁZOLi Kerékpárszervíz** | Ellenőrizd, hogy a Cégprofilban BETŰRE így szerepel-e (kis „i”, „szervíz” ékezettel). Ha nem, a `ceg-adatok.json` `uzletNev` mezőjét írd át a Cégprofil szerinti alakra — NE fordítva, és ne tegyél a névbe kulcsszót („… Győr”): ez a Google irányelveibe ütközik. |
| Cím | 9151 Abda, Bécsi utca 128. | Egyezzen. A tű pontosan a műhely bejáratán legyen. |
| Telefon | +36 30 364 0141 | Egyezzen (elsődleges szám). |
| Weboldal | https://abdabringa.hu/ | Pontosan ez (https, www nélkül, perjellel). |
| Nyitvatartás | hétfő–péntek 17:00–20:00, szombat–vasárnap zárva | Egyezzen. Ünnepnapokra állíts be **különleges nyitvatartást**. |

- [ ] Név egyezik
- [ ] Cím és tű egyezik
- [ ] Telefon egyezik
- [ ] Weboldal URL beállítva
- [ ] Nyitvatartás egyezik, ünnepnapok beállítva
- [ ] A tű koordinátáját írd fel (Térkép → jobb klikk a tűre) — a strukturált adatba (`geo`) csak pontos adat kerülhet, most szándékosan nincs benne.

## 2. Kategóriák — HIGH

- [ ] **Elsődleges kategória:** a kerékpárjavítás kategóriája (angol felületen *Bicycle repair shop*; a magyar felületen a pontos megnevezés eltérhet — a javításra/szervizre utalót válaszd). Ez a fő tevékenység.
- [ ] **Másodlagos kategória:** kerékpárbolt (*Bicycle store*) — csak azért indokolt, mert a műhely ténylegesen árul felújított használt kerékpárokat.
- [ ] Ne adj hozzá olyan kategóriát, amihez nincs szolgáltatás (pl. e-bike bolt, kerékpárkölcsönző).

## 3. Szolgáltatások — HIGH

Vidd fel a tényleges szolgáltatásokat, a weboldallal azonos néven és áron (`arlista.json`):
- [ ] Külső, belső gumi csere — 1 500 Ft / kerék
- [ ] Centrírozás — 1 800 Ft / kerék
- [ ] Agy zsírzás, tengelycsere — 2 000 Ft / kerék
- [ ] Kerékfűzés — 7 000 Ft / kerék
- [ ] V-fék beállítás — 850 Ft / kerék
- [ ] Fékbetét, bowden csere — 1 500 Ft / kerék
- [ ] Olajos fék légtelenítés, olajcsere — 2 500 Ft / fék
- [ ] Váltó beállítás — 500 Ft
- [ ] Lánccsere — 900 Ft
- [ ] Hajtómű javítás, csapágy- vagy monoblokk csere — 2 200 Ft
- [ ] Általános karbantartás — 8 000 Ft
- [ ] Teljes karbantartás — 15 000 Ft
- [ ] Elektromos kerékpár és roller defektjavítás — 2 500 Ft / kerék
- [ ] Kosár, pálcás sárvédő felszerelés — 1 000 Ft
- [ ] Koszos kerékpár takarítás — 1 000 Ft
- [ ] Háztól házig kerékpárszállítás — ár nélkül („a távolságtól függ”)

Árváltozáskor a Cégprofilt is frissíteni kell.

## 4. Leírás — MEDIUM

Természetes, 750 karakter alatti szöveg, kulcsszóhalmozás nélkül. Javaslat:

> Kerékpárszerviz Abdán, Győr szomszédságában, a Bécsi utca 128. alatt. Defektet javítunk,
> fékeket és váltót állítunk, kereket centrírozunk és fűzünk, általános és teljes karbantartást
> végzünk — előre megmondott áron, alkatrészt csak akkor cserélünk, ha tényleg kell. Városi,
> MTB-, országúti és gyerekbringával is foglalkozunk, és felújított használt kerékpárokat is
> árulunk. Ha nem tudod behozni a bringát, háztól házig elhozzuk és visszavisszük.

- [ ] Leírás frissítve (link és telefonszám ne kerüljön bele — a Google tiltja)

## 5. Linkek — MEDIUM

- [ ] Weboldal: `https://abdabringa.hu/`
- [ ] Időpont-link: **nincs online időpontfoglalás**. Ha a felület engedi, használható a `https://abdabringa.hu/kapcsolat/#urlap` (üzenetküldés időpont-egyeztetésre) — de ne nevezd „online foglalásnak”.
- [ ] Facebook-oldal a profilban (ha van rá mező)

## 6. Képek — MEDIUM

- [ ] Logó és borítókép (a festett „MŰHELY” ajtó jó felismerhető borító)
- [ ] Külső kép a bejáratról / utcafrontról (segít megtalálni a műhelyt)
- [ ] Belső képek: szerszámfal, munka közben
- [ ] Munkafotók: előtte–utána (felújított bringák)
- [ ] Rendszeresen (pl. havonta) új, valós fotó. Ne használj stockfotót.

## 7. Értékelések — HIGH

Jelenleg kb. **5,0 csillag, ~35 értékelés**; a környék versenytársainál 100–200+ is van. A
mennyiség és a frissesség számít — a cél a folyamatos, természetes gyűjtés.

### Szabályos gyűjtési folyamat (nem ösztönzött)

1. **Közvetlen értékelő link** létrehozása: Cégprofil → „Értékelések kérése” → link másolása.
2. **Rövid link / QR-kód** a linkből. A QR mehet a pultra, a számlára/munkalapra, egy kis
   matricára a kiadott bringára.
3. **Kérés a kiadáskor, szóban**, minden ügyfélnek (nem csak az elégedetteknek):
   „Ha segítettünk, sokat jelentene egy Google-értékelés — itt a QR-kód.”
4. **Utókövetés**: ha az ügyfél telefonszámot vagy e-mailt adott, 1–3 nappal később egy rövid
   üzenet a linkkel. Egyszer, nem többször.
5. **Mindenkitől kérj** — válogatás nélkül. Csak a várhatóan pozitív ügyfelektől kérni
   („review gating”) a Google szabályaiba ütközik.

**Tilos:**
- kedvezmény, ajándék vagy bármilyen ellenszolgáltatás értékelésért (még pozitív értékelés nélkül is),
- értékelés vásárlása, ismerősökkel/alkalmazottakkal íratott vagy kitalált értékelés,
- több értékelés egy eszközről, a műhelyben kiadott telefonon,
- a weboldalon csillagos értékelés-markup (AggregateRating) a Google-értékelésekből.

### Válaszadás

- [ ] **Minden** értékelésre válasz, lehetőleg pár napon belül.
- [ ] Pozitívnál: köszönet + konkrétum („örülünk, hogy a három bringa mind jól gurul”).
- [ ] Negatívnál: nyugodt, tárgyszerű, személyes megoldási ajánlat telefonon; nincs vita nyilvánosan.
- [ ] Hamis/spam értékelést a Google-nál jelenteni — nem vitatkozni rajta.

## 8. Kérdések és válaszok — LOW

- [ ] Nézd át a profilban feltett kérdéseket; válaszolj a tulajdonosi fiókból.
- [ ] Gyakori kérdések (pl. „kell időpont?”, „Győrből elhozzátok?”) válaszai legyenek
      összhangban a weboldal GYIK-jével (`/kerekparszerviz-gyor/`).

## 9. Bejegyzések (Google Posts) — LOW

Hasznos lehet (szezonkezdés, szabadság, új bringák érkezése), de **nem garantált rangsorolási
tényező** — inkább az ügyfél tájékoztatására és a profil frissen tartására jó.
Rendkívüli zárásnál a weboldalon az „Aktualitás” mező (admin) is kitölthető.

## 10. Citation audit (céglistázások) — MEDIUM

Ellenőrizd, hogy ahol a cég szerepel, ott a NAP egyezik (név, cím, telefon, weboldal):
- [ ] Facebook oldal (Névjegy: cím, telefon, weboldal, nyitvatartás)
- [ ] Apple Térkép (Apple Business Connect)
- [ ] Bing Places (a Google-profil importálható)
- [ ] OpenStreetMap (a Bécsi utca 128. pont: `shop=bicycle`, `service:bicycle:repair=yes`, név, telefon, weboldal, nyitvatartás)
- [ ] Magyar cégkatalógusok, ahol már szerepel a vállalkozás (pl. Cylex, Nyitva.hu, Firmania) — csak javítani / egységesíteni, nem tömegesen új regisztráció
- [ ] Abda község honlapja (helyi vállalkozások listája, ha van)

Minden eltérést (régi cím, más telefonszám, más név) javítani kell — ezek gyengítik a
Cégprofil megbízhatóságát.
