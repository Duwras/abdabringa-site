# Konverziómérés — GA4 események

## Meglévő állapot (ellenőrizve)

- **GA4** mérőazonosító: `G-LBTEV8V0K8` (`ceg-adatok.json` → `gaId`). A `consent.js` tölti
  be, **csak a látogató kifejezett hozzájárulása után**. Egyetlen GA-példány van, GTM nincs —
  duplikált mérés nincs.
- A hozzájárulás-kezelés (Consent Mode: `analytics_storage: granted`, hirdetési jelek
  `denied`) nem változott.

## Új: konverziós események

Minden esemény a `consent.js`-ben él (`track()` / `window.bringaTrack`). Ha a látogató nem
engedélyezte a mérést, **semmi nem fut és semmi nem gyűlik** későbbre sem.

| Esemény | Mikor | Paraméterek |
|---|---|---|
| `phone_click` | bármely `tel:` link kattintása (fejléc, mobil gyorssáv, CTA-k, lábléc) | `link_url`, `link_location`, `page_path` |
| `directions_click` | Google Térkép / útvonaltervező link | ugyanaz |
| `contact_click` | `mailto:` link | ugyanaz |
| `appointment_click` | „Időpont egyeztetése üzenetben” CTA (`data-track="appointment_click"`) | ugyanaz |
| `contact_form_submit` | sikeres Web3Forms beküldés (a `script.js` hívja) | `form_location` |

`link_location` értékei: `fejlec`, `lablec`, `mobil_gyorssav`, vagy a szekció `id`-ja
(pl. `utvonal`, `hazhoz`), egyébként `oldal`.

Új mérendő link: elég egy `data-track="esemeny_neve"` attribútum az `<a>` elemen.

Ellenőrizve helyben: hozzájárulás nélkül 0 esemény; engedélyezés után a hívás-, útvonal- és
e-mail kattintás a megfelelő eseménnyel és hellyel került a `dataLayer`-be.

## Teendő a GA4 felületen (kézi)

1. **Adminisztrálás → Események**: az első élő kattintások után megjelennek (24–48 óra).
2. **Kulcsesemény (konverzió)** jelölés: `phone_click`, `directions_click`,
   `contact_form_submit` — ezek a valódi üzleti célok. `contact_click` és
   `appointment_click` opcionális.
3. **Egyéni dimenziók** (esemény hatókör): `link_location`, `form_location` — enélkül a
   jelentésekben nem bontható helyszín szerint.
4. **DebugView**-ban ellenőrizd egyszer, saját telefonnal (engedélyezett méréssel).
5. Search Console ↔ GA4 összekapcsolás (Adminisztrálás → Termékkapcsolatok).

## Adatvédelem

A `sutik.html` 2.2 pontja kiegészült: engedélyezett mérésnél a hívás/útvonal/e-mail
kattintás és a sikeres űrlapküldés ténye rögzül — a beírt adatok nem.
