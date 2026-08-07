/* Hozzájárulási sáv a külső tartalmakhoz.

   Miért van rá szükség: a weboldal saját sütit nem használ, de a
   Kapcsolat szekcióban Google Térkép beágyazás van. Az ilyen külső
   beágyazás a látogató IP-címét és böngészőadatait elküldi a
   Google-nek, és saját sütiket helyezhet el — ehhez előzetes
   hozzájárulás kell.

   A megoldás: a beágyazás NEM kerül a DOM-ba, amíg nincs elfogadás.
   A HTML-ben csak egy helyőrző áll, benne a valódi cím a
   data-consent-src attribútumban. Amíg nincs hozzájárulás, egyetlen
   kérés sem indul a Google felé.

   Fontos, hogy az elutasítás ugyanolyan egyszerű legyen, mint az
   elfogadás — egy kattintás mindkettő, azonos méretű gombokkal.
   A csak elfogadást kínáló sáv nem érvényes hozzájárulás.

   A választ a localStorage-ban tároljuk (nem süti), 12 hónapig. */
(function () {
  'use strict';

  var KEY = 'bringazol-consent';
  var VERSION = 1;
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

  function read() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY));
      if (!raw || raw.v !== VERSION) return null;
      if (Date.now() - raw.ts > MAX_AGE) return null;
      return raw.choice;
    } catch (e) {
      return null;
    }
  }

  function write(choice) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        v: VERSION, choice: choice, ts: Date.now()
      }));
    } catch (e) {
      /* privát böngészés vagy letiltott tárolás: a döntés csak erre
         az oldalbetöltésre él, a következőnél újra kérdezünk */
    }
  }

  /* ---------- a beágyazások be- és kikapcsolása ---------- */

  function unlock() {
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

  function lock() {
    var slots = document.querySelectorAll('[data-consent-src]');
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      if (!slot.dataset.consentDone) continue;
      /* Az iframe eltávolítása nem törli a Google már elhelyezett
         sütijeit — arra csak a böngésző beállításai valók. Ezt a
         sutik.html le is írja. */
      slot.textContent = '';
      delete slot.dataset.consentDone;
      slot.classList.remove('consent-slot-on');
      placeholder(slot);
    }
  }

  /* ---------- helyőrző a beágyazás helyén ---------- */

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
      write('all');
      unlock();
      hideBar();
    });

    var alt = document.createElement('a');
    alt.className = 'consent-slot-alt';
    alt.href = 'https://www.google.com/maps?q=B%C3%A9csi+utca+128%2C+9151+Abda';
    alt.target = '_blank';
    alt.rel = 'noopener';
    alt.textContent = 'Vagy nyisd meg külön ablakban ↗';

    wrap.appendChild(text);
    wrap.appendChild(btn);
    wrap.appendChild(alt);
    slot.appendChild(wrap);
  }

  /* ---------- a sáv ---------- */

  var bar = null;

  function buildBar() {
    if (bar) return bar;

    bar = document.createElement('div');
    bar.className = 'consent';
    bar.id = 'consentBar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-modal', 'false');
    bar.setAttribute('aria-labelledby', 'consentTitle');

    bar.innerHTML =
      '<div class="consent-box">' +
        '<div class="consent-text">' +
          '<h2 id="consentTitle">Sütik és külső tartalom</h2>' +
          '<p>Ez az oldal <strong>saját sütit nem használ</strong>, és nem mér ' +
          'látogatottságot. Csak egy dolgot kérdezünk: betölthetjük-e a ' +
          '<strong>Google Térképet</strong> a Kapcsolat résznél? Ha igen, a Google ' +
          'megkapja az IP-címedet és sütiket helyezhet el.</p>' +
          '<p class="consent-links">' +
            '<a href="' + DOCS.sutik + '">Sütitájékoztató</a>' +
            '<a href="' + DOCS.adat + '">Adatkezelési tájékoztató</a>' +
          '</p>' +
        '</div>' +
        '<div class="consent-actions">' +
          '<button type="button" class="consent-btn consent-yes" id="consentAll">Elfogadom</button>' +
          '<button type="button" class="consent-btn consent-no" id="consentNone">Csak a szükségeset</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(bar);

    bar.querySelector('#consentAll').addEventListener('click', function () {
      write('all');
      unlock();
      hideBar();
    });
    bar.querySelector('#consentNone').addEventListener('click', function () {
      write('necessary');
      lock();
      hideBar();
    });

    return bar;
  }

  function showBar() {
    buildBar();
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

    if (choice === 'all') {
      unlock();
    } else {
      // minden helyőrzőt felkészítünk: elutasításnál és első
      // látogatásnál is a gombos doboz látszik a térkép helyén
      var slots = document.querySelectorAll('[data-consent-src]');
      for (var i = 0; i < slots.length; i++) {
        if (!slots[i].querySelector('.consent-slot-ask')) placeholder(slots[i]);
      }
      if (choice === null) showBar();
    }

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
