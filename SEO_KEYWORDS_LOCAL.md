# Helyi kulcsszótérkép — abdabringa.hu

Prioritás: **1. Abda → 2. Győr és közvetlen környéke → 3. Győr-Moson-Sopron → 4. országos (csak mellékhatás).**
A műhely Abdán van. Győrre soha nem mondjuk, hogy „Győrben” vagyunk — csak „Győr mellett / Győr szomszédságában / Győr közelében”.

Kiinduló SEMrush adatok (HU adatbázis, 2026): 3 organikus kulcsszó, 0 Top 10, ~0 forgalom.

| Kulcsszó | Volumen/hó | KD | Jelenlegi pozíció |
|---|---|---|---|
| kerékpár műhely | ~70 | 42 | 12 |
| bringa műhely | ~170 | 20 | 24 |
| bringamosó | ~170 | 17 | 52 |
| kerékpárbolt Győr | ~390 | 25 | — |
| bicikli bolt Győr | ~260 | 24 | — |
| kerékpár bolt Győr | ~140 | 26 | — |
| elektromos kerékpár szerviz Győr | ~30 | — | — |
| kerékpár javítás Győr | ~20 | — | — |
| kerékpár alkatrész Győr | ~20 | — | — |

---

## Kulcsszó → URL hozzárendelés

| URL | Elsődleges kulcsszó | Másodlagos kulcsszavak | Szándék | Célhely | Oldal | Prioritás | Megjegyzés |
|---|---|---|---|---|---|---|---|
| `/` | kerékpárszerviz Abda | kerékpár műhely, bringa műhely, kerékpár szerviz Abda, kerékpár javítás Abda, bringa szerviz | helyi / tranzakciós | Abda (+ Győr mellett) | meglévő, átírva | **CRITICAL** | Title: „Kerékpárszerviz Abda – Győr mellett \| BRINGÁZOLi”. H1: „Kerékpárszerviz Abdán, Győr mellett”. A „kerékpár műhely” (poz. 12) és „bringa műhely” (poz. 24) itt él — a „Nem gyár. Műhely.” szekció és a műhelyfotók viszik. |
| `/kerekparszerviz-gyor/` | kerékpárszerviz Győr | kerékpár szerviz Győr, kerékpár javítás Győr, bicikli szerviz Győr, bringa szerviz Győr, kerékpár műhely Győr, bringa műhely Győr | helyi / tranzakciós | Győr | **új** | **CRITICAL** | Egyetlen Győr-oldal a teljes klaszterre. Szándékosan NINCS külön `/kerekpar-javitas-gyor/` — ugyanaz a keresési szándék, két oldal egymás elől venné el a helyezést (kannibalizáció), és doorway-gyanús lenne. |
| `/szolgaltatasok/` | kerékpár javítás | kerékpár karbantartás, defekt javítás, fék beállítás, váltó beállítás, centrírozás, kerékfűzés, lánccsere | információs / tranzakciós | Abda | **új** | HIGH | Szolgáltatásonként horgony (#kerek, #fek, #hajtas, #karbantartas, #egyeb, #hazhoz) — ezekre linkel az árlista és a Győr-oldal. |
| `/arak/` | kerékpárszerviz árak | kerékpár szerviz árlista, kerékpár javítás ár, defekt javítás ár, centrírozás ár, lánccsere ár | kereskedelmi | Abda / Győr | **új** | HIGH | Az árak az `arlista.json`-ból jönnek — a főoldal, az /arak/ és a JSON-LD nem csúszhat szét. |
| `/szervizterulet/` | kerékpárszerviz Győr környéke | kerékpár szerviz Abda Győr, háztól házig kerékpár szerviz, kerékpár szállítás szervizbe | helyi | Abda, Győr, Öttevény, Ikrény | **új** | MEDIUM | Egy erős oldal a 30–50 településoldal helyett. Új település csak igazolt kiszolgálás esetén kerüljön rá. |
| `/kerekparbolt-gyor/` | használt kerékpár Győr | kerékpárbolt Győr, használt bicikli eladó Győr, felújított kerékpár, bicikli bolt Győr | kereskedelmi | Győr / Abda | **új** | MEDIUM | A cég valóban árul (felújított, használt) bringát — ezért van oldal. A „kerékpárbolt Győr” keresők nagy része új bringát/alkatrészt keres: ezt a szándékot csak részben szolgáljuk ki, NE ígérjünk új kerékpárt vagy alkatrész-kereskedést. |
| `/kapcsolat/` | BRINGÁZOLi kerékpárszerviz kapcsolat | nyitvatartás, telefonszám, útvonal Abda | navigációs | Abda | **új** | MEDIUM | NAP-oldal; ContactPage JSON-LD. |
| `/tudastar/…` | cikkenként | lásd CONTENT_PLAN.md | információs | országos (mellékesen) | **új** | LOW | Minden cikk a megfelelő szolgáltatás- és Győr-oldalra linkel. |

### Nem célzott (szándékosan)

| Kulcsszó | Miért nem |
|---|---|
| **bringamosó** (poz. 52) | A kereső többnyire önkiszolgáló bringamosó állomást keres. A műhely „koszos kerékpár takarítást” vállal (1 000 Ft) — ez nem bringamosó. Külön oldal nem készült; a szolgáltatás a `/szolgaltatasok/#egyeb` alatt szerepel. |
| **bringamosás Győr** | Ugyanaz, mint fent. Ha a műhely egyszer bringamosó pontot üzemeltet, akkor érdemes külön oldal. |
| **elektromos kerékpár szerviz Győr** | Az árlistán csak **e-bike és roller defektjavítás** szerepel. Teljes e-bike szerviz (motor, akku, elektronika) nincs igazolva. Külön oldal csak akkor, ha a műhely ezt ténylegesen vállalja. |
| **kerékpár alkatrész Győr** | Alkatrész-kereskedés (bolt/webshop) nincs igazolva; az alkatrész a javítás része. |
| **kerékpárbolt Győr / bicikli bolt Győr** (új bringa) | Új kerékpárok értékesítése nincs igazolva. A `/kerekparbolt-gyor/` csak a felújított használt bringákra épít. |

---

## SEMrush Position Tracking — javasolt beállítás

**Projekt:** abdabringa.hu · **Keresőmotor:** Google · **Eszköz:** mobil ÉS asztali (két külön kampány vagy eszközbontás)
**Elsődleges hely:** Győr (Győr-Moson-Sopron, HU) — ZIP/település szint, ha a csomag engedi. **Másodlagos hely:** Abda, ha kiválasztható; ha nem, Győr.
**Nyelv:** magyar. **Címkék (tag):** `abda`, `gyor`, `alap`, `csak-ha-szolgaltatas`.
**Helyi csomag (Local Pack) követése:** bekapcsolva — a cél elsősorban a Térkép-találat.

### Kötelező lista

| Kulcsszó | Címke | Céloldal |
|---|---|---|
| kerékpárszerviz Abda | abda | / |
| kerékpár szerviz Abda | abda | / |
| kerékpár javítás Abda | abda | / |
| kerékpár műhely | alap | / |
| bringa műhely | alap | / |
| kerékpárszerviz Győr | gyor | /kerekparszerviz-gyor/ |
| kerékpár szerviz Győr | gyor | /kerekparszerviz-gyor/ |
| kerékpár javítás Győr | gyor | /kerekparszerviz-gyor/ |
| bicikli szerviz Győr | gyor | /kerekparszerviz-gyor/ |
| bringa szerviz Győr | gyor | /kerekparszerviz-gyor/ |
| kerékpár műhely Győr | gyor | /kerekparszerviz-gyor/ |
| bringa műhely Győr | gyor | /kerekparszerviz-gyor/ |

### Kiegészítő lista (megfigyelés, nem fő cél)

| Kulcsszó | Címke | Céloldal | Megjegyzés |
|---|---|---|---|
| kerékpárszerviz árak | alap | /arak/ | |
| használt kerékpár Győr | gyor | /kerekparbolt-gyor/ | tényleges termék |
| kerékpárbolt Győr | csak-ha-szolgaltatas | /kerekparbolt-gyor/ | csak használt bringára releváns |
| bringamosó | csak-ha-szolgaltatas | — | kiinduló pozíció miatt követni; nem célzott |
| bringamosó Győr / bringamosás Győr | csak-ha-szolgaltatas | — | csak ha lesz ilyen szolgáltatás |
| elektromos kerékpár szerviz Győr | csak-ha-szolgaltatas | — | csak ha lesz teljes e-bike szerviz |
| kerékpár alkatrész Győr | csak-ha-szolgaltatas | — | csak ha lesz alkatrész-értékesítés |

Az elvárható javulás hetekben-hónapokban mérhető: az új oldalak indexelése, majd a Cégprofil és a helyi hivatkozások ereje dönt. Heti bontás elég.
