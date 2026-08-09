/* Hozzájárulás-kezelő: külső tartalom és látogatottságmérés.

   Két, egymástól FÜGGETLEN célra kérünk engedélyt:

     terkep     — Google Térkép beágyazás a Kapcsolat szekcióban.
                  A beágyazás elküldi a látogató IP-címét a Google-nek
                  és saját sütiket helyezhet el.

     meres      — Google Analytics 4 látogatottságmérés. Sütiket tesz
                  (_ga, _ga_*), és az adat az Egyesült Államokba kerül.

   Mindkettő alapból KI van kapcsolva, és külön-külön kapcsolható.
   Amíg nincs kifejezett engedély, EGYETLEN kérés sem indul sem a
   Google Térkép, sem az Analytics felé — a script nem kerül be a
   DOM-ba, nem elég csak "nem küldeni" eseményt.

   Fontos, hogy az elutasítás ugyanolyan egyszerű legyen, mint az
   elfogadás: azonos súlyú, azonos méretű gomb mindkettő. A csak
   elfogadást kínáló sáv nem érvényes hozzájárulás.

   A választ a localStorage-ban tároljuk (nem süti), 12 hónapig. */
(function () {
  'use strict';

  /* ==========================================================
     BEÁLLÍTÁS

     A GA4 mérőazonosítót ide kell beírni: Google Analytics →
     Adminisztrálás → Adatfolyamok → a webes adatfolyam adatai →
     "Mérőazonosító", G-betűvel kezdődik.

     Az azonosítót a ceg-adatok.json "gaId" mezőjébe kell írni, ide a
     build helyettesíti be. Amíg üresen marad, a mérés nem indul el —
     a sávon a kapcsoló akkor sem jelenik meg, tehát nem kérünk
     engedélyt olyasmire, ami nem is fut.
     ========================================================== */
  var GA_ID = '{{gaId}}';
  /* Ha a fájl build nélkül kerül kiszolgálásra, a helyőrző marad benne.
     Csak a valódi, G-vel kezdődő azonosítót fogadjuk el. */
  if (!/^G-[A-Z0-9]+$/.test(GA_ID)) GA_ID = '';

  var KEY = 'bringazol-consent';
  /* 1 → 2: a mérés új, önálló cél. A régi (v1) válasz nem terjedhet
     ki rá, ezért a korábbi döntések érvénytelenné válnak, és a sáv
     újra megjelenik. Aki addig igent mondott a térképre, most újra
     dönthet — külön a térképről és külön a mérésről. */
  var VERSION = 2;
  var MAX_AGE = 365 * 24 * 60 * 60 * 1000;   // 12 hónap

  var DOCS = {
    sutik: 'sutik.html',
    adat: 'adatkezeles.html'
  };

  /* A jogi aloldalak egy szinten vannak a főoldallal, tehát a relatív
     hivatkozás mindenhol jó. A 404 viszont bármilyen útvonalon
     megjelenhet, ott gyökérből kell hivatkozni. */
  if (location.pathname.replace(/\/+$/, '').split('/').length > 2) {
    DOCS.sutik = '/' + DOCS.sutik;
    DOCS.adat = '/' + DOCS.adat;
  }

  var MAP_LINK = 'https://www.google.com/maps/search/' +
    'BRING%C3%81ZOL+Ker%C3%A9kp%C3%A1rzerv%C3%ADz+B%C3%A9csi+utca+128+9151+Abda';

  /* ---------- a döntés tárolása ---------- */

  function read() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY));
      if (!raw || raw.v !== VERSION) return null;
      if (Date.now() - raw.ts > MAX_AGE) return null;
      return { terkep: !!raw.terkep, meres: !!raw.meres };
    } catch (e) {
      return null;
    }
  }

  function write(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        v: VERSION, terkep: !!state.terkep, meres: !!state.meres, ts: Date.now()
      }));
    } catch (e) {
      /* privát böngészés vagy letiltott tárolás: a döntés csak erre
         az oldalbetöltésre él, a következőnél újra kérdezünk */
    }
  }

  /* ---------- látogatottságmérés (Google Analytics 4) ---------- */

  var gaLoaded = false;

  function measureOn() {
    if (!GA_ID) return;
    window['ga-disable-' + GA_ID] = false;
    if (gaLoaded) return;
    gaLoaded = true;

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag('js', new Date());

    /* Hozzájárulási mód. A mérési tárolás engedélyezett — idáig csak
       akkor jutunk el, ha a látogató kifejezetten igent mondott rá.
       A hirdetési célok viszont tiltva maradnak: erre nem kértünk és
       nem is kérünk engedélyt, hirdetést nem futtatunk. */
    gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });

    /* A GA4 az IP-címet alapértelmezésben csonkolja, és nem tárolja —
       az anonymize_ip itt csak kifejezett szándéknyilvánítás.
       A hirdetési jelzések külön ki vannak kapcsolva. */
    gtag('config', GA_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }

  function measureOff() {
    if (!GA_ID) return;
    /* A gtag ezt a globális kapcsolót minden találat előtt megnézi:
       ha be van kapcsolva, a már betöltött könyvtár sem küld többet. */
    window['ga-disable-' + GA_ID] = true;

    /* A visszavonás akkor ér valamit, ha a már kihelyezett sütik is
       eltűnnek. A domain három változatát is próbáljuk, mert a GA a
       ponttal kezdődő alakot használja, és süti csak a saját
       domain-attribútumával törölhető. */
    var host = location.hostname;
    var domains = ['', '; domain=' + host, '; domain=.' + host];
    document.cookie.split(';').forEach(function (pair) {
      var name = pair.split('=')[0].trim();
      if (name !== '_ga' && name !== '_gid' && name.indexOf('_ga_') !== 0) return;
      for (var i = 0; i < domains.length; i++) {
        document.cookie = name + '=; Max-Age=0; path=/' + domains[i];
      }
    });
  }

  /* ---------- a térkép be- és kikapcsolása ---------- */

  function mapOn() {
    var slots = document.querySelectorAll('[data-consent-src]');
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      if (slot.dataset.consentDone) continue;

      var frame = document.createElement('iframe');
      frame.src = slot.dataset.consentSrc;
      frame.title = slot.dataset.consentTitle || 'Beágyazott tartalom';
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      frame.setAttribute('allowfullscreen', '');

      slot.textContent = '';
      slot.appendChild(frame);
      slot.dataset.consentDone = '1';
      slot.classList.add('consent-slot-on');
    }
  }

  function mapOff() {
    var slots = document.querySelectorAll('[data-consent-src]');
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      /* Az iframe eltávolítása nem törli a Google már elhelyezett
         sütijeit — arra csak a böngésző beállításai valók. Ezt a
         sutik.html le is írja. */
      slot.textContent = '';
      delete slot.dataset.consentDone;
      slot.classList.remove('consent-slot-on');
      placeholder(slot);
    }
  }

  /* ---------- helyőrző a térkép helyén ---------- */

  function placeholder(slot) {
    var wrap = document.createElement('div');
    wrap.className = 'consent-slot-ask';

    var text = document.createElement('p');
    text.innerHTML = 'Itt egy <strong>Google Térkép</strong> lenne. ' +
      'Megjelenítéséhez a Google megkapja az IP-címedet és sütiket helyezhet el.';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-solid consent-slot-btn';
    btn.innerHTML = '<span>Térkép megjelenítése</span>';
    btn.addEventListener('click', function () {
      /* Csak a térképre mond igent — a mérés érintetlen marad. */
      var now = read() || { terkep: false, meres: false };
      now.terkep = true;
      write(now);
      apply(now);
      hideBar();
    });

    var alt = document.createElement('a');
    alt.className = 'consent-slot-alt';
    alt.href = MAP_LINK;
    alt.target = '_blank';
    alt.rel = 'noopener';
    alt.textContent = 'Vagy nyisd meg külön ablakban ↗';

    wrap.appendChild(text);
    wrap.appendChild(btn);
    wrap.appendChild(alt);
    slot.appendChild(wrap);
  }

  /* ---------- a döntés érvényesítése ---------- */

  function apply(state) {
    if (state.terkep) mapOn(); else mapOff();
    if (state.meres) measureOn(); else measureOff();
  }

  /* ---------- a sáv ---------- */

  var bar = null;

  function buildBar(state) {
    if (bar) return bar;

    bar = document.createElement('div');
    bar.className = 'consent';
    bar.id = 'consentBar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-modal', 'false');
    bar.setAttribute('aria-labelledby', 'consentTitle');

    /* A mérés kapcsolója csak akkor kerül ki, ha van beállított
       mérőazonosító. Enélkül olyasmire kérnénk engedélyt, ami nem fut. */
    var meresRow = !GA_ID ? '' :
      '<label class="consent-opt">' +
        '<input type="checkbox" id="optMeres"' + (state.meres ? ' checked' : '') + '>' +
        '<span class="consent-opt-txt">' +
          '<strong>Látogatottság mérése</strong>' +
          '<em>Google Analytics 4. Sütiket helyez el, és az adat az Egyesült Államokba kerül. ' +
          'Azt látjuk belőle, hányan és mely oldalakat nézték — téged személy szerint nem.</em>' +
        '</span>' +
      '</label>';

    bar.innerHTML =
      '<div class="consent-box">' +
        '<div class="consent-text">' +
          '<h2 id="consentTitle">Sütik és külső tartalom</h2>' +
          '<p>A weboldal működéséhez semmi ilyesmi nem kell — ezek nélkül is ' +
          'minden olvasható. Az alábbiakat csak akkor kapcsoljuk be, ha te ' +
          'engeded. Alapból mind ki van kapcsolva.</p>' +
          '<div class="consent-opts">' +
            '<label class="consent-opt">' +
              '<input type="checkbox" id="optTerkep"' + (state.terkep ? ' checked' : '') + '>' +
              '<span class="consent-opt-txt">' +
                '<strong>Google Térkép</strong>' +
                '<em>A Kapcsolat résznél. A Google megkapja az IP-címedet és sütiket helyezhet el. ' +
                'A műhely címe enélkül is olvasható.</em>' +
              '</span>' +
            '</label>' +
            meresRow +
          '</div>' +
          '<p class="consent-links">' +
            '<a href="' + DOCS.sutik + '">Sütitájékoztató</a>' +
            '<a href="' + DOCS.adat + '">Adatkezelési tájékoztató</a>' +
          '</p>' +
        '</div>' +
        '<div class="consent-actions">' +
          '<button type="button" class="consent-btn consent-yes" id="consentAll">Mindet elfogadom</button>' +
          '<button type="button" class="consent-btn consent-no" id="consentNone">Csak a szükségeset</button>' +
          '<button type="button" class="consent-btn consent-save" id="consentSave">Kiválasztottak mentése</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(bar);

    function decide(next) {
      write(next);
      apply(next);
      hideBar();
    }

    bar.querySelector('#consentAll').addEventListener('click', function () {
      decide({ terkep: true, meres: !!GA_ID });
    });
    bar.querySelector('#consentNone').addEventListener('click', function () {
      decide({ terkep: false, meres: false });
    });
    bar.querySelector('#consentSave').addEventListener('click', function () {
      var t = bar.querySelector('#optTerkep');
      var m = bar.querySelector('#optMeres');
      decide({ terkep: !!(t && t.checked), meres: !!(m && m.checked) });
    });

    return bar;
  }

  function showBar() {
    buildBar(read() || { terkep: false, meres: false });
    requestAnimationFrame(function () { bar.classList.add('on'); });
  }

  function hideBar() {
    if (!bar) return;
    bar.classList.remove('on');
    setTimeout(function () {
      if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
      bar = null;
    }, 400);
  }

  /* ---------- indulás ---------- */

  function start() {
    var choice = read();

    /* Nincs döntés: minden ki van kapcsolva, és megkérdezzük.
       A helyőrzőt ilyenkor is kirakjuk, hogy a térkép helye ne
       maradjon üres lyuk. */
    apply(choice || { terkep: false, meres: false });
    if (choice === null) showBar();

    // „Sütibeállítások módosítása" — a láblécben és a sutik.html-en
    var reopen = document.querySelectorAll('#consentReopen, [data-consent-reopen]');
    for (var j = 0; j < reopen.length; j++) {
      reopen[j].addEventListener('click', function (e) {
        e.preventDefault();
        showBar();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
