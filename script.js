/* ============================================================
   Bringázol¿ — interactions. No dependencies.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine    = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- közös görgetés-ütemező ----------

     Korábban a fejléc, a parallax és a hero-bringa külön iratkozott fel
     a scroll eseményre, és mindegyik külön requestAnimationFrame-et
     kért. Egy képkockán belül így többször váltott a böngésző olvasás és
     írás között: a parallax getBoundingClientRect()-je a bringa
     stílusírásai UTÁN futott, ezért a böngészőnek ott helyben újra kellett
     tördelnie az oldalt (forced synchronous layout).

     Most egyetlen rAF fut, két szigorúan elválasztott fázissal:
     előbb MINDEN mérés, utána MINDEN írás. Így a méréskor az elrendezés
     még az előző képkockából érvényes, tehát ingyen van.

     A geom fázis csak méretváltozáskor fut — a gyorsítótárazott
     geometriát az ablakméret, a tájolás és a lusta képek betöltése
     avítja el, más nem. */
  var geomFns = [], readFns = [], writeFns = [];
  var frameQueued = false;

  function frame() {
    frameQueued = false;
    var y = window.scrollY;
    for (var i = 0; i < readFns.length; i++) readFns[i](y);
    for (var j = 0; j < writeFns.length; j++) writeFns[j](y);
  }

  function schedule() {
    if (!frameQueued) { frameQueued = true; requestAnimationFrame(frame); }
  }

  function register(o) {
    if (o.geom)  geomFns.push(o.geom);
    if (o.read)  readFns.push(o.read);
    if (o.write) writeFns.push(o.write);
  }

  function remeasure() {
    for (var i = 0; i < geomFns.length; i++) geomFns[i]();
    schedule();
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', remeasure);
  window.addEventListener('orientationchange', remeasure);
  window.addEventListener('load', remeasure);

  /* ---------- year ---------- */
  $('#year').textContent = new Date().getFullYear();

  /* ---------- preloader ----------
     Counts real image loads so the curtain lifts when the hero is
     actually painted, not after an arbitrary timeout. */
  (function preloader() {
    var el    = $('#preloader');
    var out   = $('#preCount');
    /* A függöny addig takarja az oldalt, amíg ez a számláló be nem ér —
       tehát amire itt várunk, az a látogató által mért betöltési idő
       (LCP) is egyben.

       Lusta képre nem várunk: azok a nézetablakon kívül vannak, sosem
       töltenének be idejében. Az alacsony prioritásúakra sem: a hero
       bringájának négy rétege 158 KB, díszítés, és a görgetés első
       pillanatában még a képernyő szélén kívül gurul. Csak az LCP-t
       adó hero fotóra és a logóra várunk. */
    var imgs  = $$('img').filter(function (i) {
      return i.loading !== 'lazy' && i.getAttribute('fetchpriority') !== 'low';
    });
    var total = imgs.length || 1;
    var done  = 0;
    var shown = 0;
    var raf;

    imgs.forEach(function (img) {
      if (img.complete) { done++; return; }
      var bump = function () { done++; };
      img.addEventListener('load', bump, { once: true });
      img.addEventListener('error', bump, { once: true });
    });

    // hard ceiling: never trap the user behind a stalled asset
    var deadline = Date.now() + 2500;

    function tick() {
      var target = Math.min(100, Math.round((done / total) * 100));
      if (Date.now() > deadline) target = 100;
      shown += (target - shown) * 0.12;
      out.textContent = Math.round(shown);

      if (shown > 99.3) {
        out.textContent = '100';
        cancelAnimationFrame(raf);
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    }

    function finish() {
      setTimeout(function () {
        el.classList.add('done');
        document.body.classList.add('ready');
        setTimeout(function () { el.remove(); }, 1100);
      }, 240);
    }

    if (reduced) { el.remove(); document.body.classList.add('ready'); return; }
    raf = requestAnimationFrame(tick);
  })();

  /* ---------- custom cursor ---------- */
  if (fine && !reduced) {
    var cur   = $('#cursor');
    var label = $('.cursor-label', cur);
    var cx = 0, cy = 0, tx = 0, ty = 0;

    /* A hurok korábban a betöltéstől a lap bezárásáig futott, akkor is,
       ha az egér egy pixelt sem mozdult — 60 hívás másodpercenként a
       görgetés főszálidejéből. Most csak addig fut, amíg a kurzor
       tényleg utoléri az egeret. */
    var curAlive = false;

    function curLoop() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
        requestAnimationFrame(curLoop);
      } else {
        curAlive = false;
      }
    }

    document.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      cur.classList.add('on');
      if (!curAlive) { curAlive = true; requestAnimationFrame(curLoop); }
    }, { passive: true });

    $$('[data-cursor]').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        label.textContent = el.dataset.cursor;
        cur.classList.add('big');
      });
      el.addEventListener('mouseleave', function () { cur.classList.remove('big'); });
    });
  }

  /* ---------- nav: solid + hide on scroll down ---------- */
  (function navBar() {
    var nav  = $('#nav');
    var last = 0;
    // az előző állapot: azonos értékkel is stílus-érvénytelenítést
    // váltana ki a classList.toggle, ezért csak változáskor írunk
    var wasSolid = false, wasHidden = false;

    register({ write: function (y) {
      var solid = y > 40;
      var hidden = y > last && y > 260 && !menuOpen;
      if (solid !== wasSolid)  { nav.classList.toggle('solid', solid); wasSolid = solid; }
      if (hidden !== wasHidden) { nav.classList.toggle('hide', hidden); wasHidden = hidden; }
      last = y;
    } });
  })();

  /* ---------- mobile menu ---------- */
  var menuOpen = false;
  (function menu() {
    var burger  = $('#burger');
    var overlay = $('#menuOverlay');

    function set(open) {
      menuOpen = open;
      burger.classList.toggle('open', open);
      overlay.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
      document.body.classList.toggle('locked', open);
    }

    burger.addEventListener('click', function () { set(!menuOpen); });
    $$('a', overlay).forEach(function (a) {
      a.addEventListener('click', function () { set(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) set(false);
    });
  })();

  /* ---------- scroll reveal ---------- */
  (function reveal() {
    var items = $$('.reveal');
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, i) {
        if (!e.isIntersecting) return;
        var el = e.target;
        setTimeout(function () { el.classList.add('in'); }, i * 70);
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- stat counters ---------- */
  (function counters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      nums.forEach(function (n) { n.textContent = n.dataset.count; });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el     = e.target;
        var target = parseInt(el.dataset.count, 10);
        var t0     = performance.now();
        (function step(now) {
          var p = Math.min(1, (now - t0) / 1400);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(step);
        })(t0);
        io.unobserve(el);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { io.observe(n); });
  })();

  /* ---------- parallax ---------- */
  (function parallax() {
    var els = $$('[data-parallax]');
    if (!els.length || reduced) return;

    /* A getBoundingClientRect() maradt: a hero képe egy position: sticky
       konténerben ül, ott a dokumentumbeli offsetTop nem írja le, hol
       van a képernyőn — a ragadás miatt a kettő elválik egymástól.
       A mérés viszont átkerült a közös ütemező OLVASÁSI fázisába, ahol
       az elrendezés még érintetlen az előző képkockából, tehát a
       lekérdezés nem kényszerít újratördelést.

       A sebesség és a korábbi érték gyorsítótárazva: ha egy elem nem
       mozdult, nem írunk rá stílust feleslegesen. */
    var speeds = els.map(function (el) { return parseFloat(el.dataset.parallax) || 0.15; });
    var next   = new Array(els.length);
    var last   = new Array(els.length);

    register({
      read: function () {
        var vh = window.innerHeight;
        for (var i = 0; i < els.length; i++) {
          var r = els[i].getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) { next[i] = null; continue; }
          // -1 .. 1 a nézetablakon át
          var progress = (r.top + r.height / 2 - vh / 2) / vh;
          next[i] = (progress * speeds[i] * 100).toFixed(2);
        }
      },
      write: function () {
        for (var i = 0; i < els.length; i++) {
          if (next[i] === null || next[i] === last[i]) continue;
          last[i] = next[i];
          els[i].style.transform = 'translate3d(0,' + next[i] + 'px,0)';
        }
      }
    });

    schedule();
  })();

  /* ---------- hero: a bringa végiggurul görgetésre ----------
     A modell Blenderben készült, négy egymásra illesztett rétegben
     renderelve (váz / két kerék / hajtókar). A kerekek nem "csak
     forognak": a megtett út és a kerék kerülete alapján pontosan annyit
     fordulnak, amennyit egy valódi bringa gurulna — a hajtókar pedig a
     15/50-es áttétel szerint lassabban. */
  (function ride() {
    var hero  = $('#hero');
    var bike  = $('#rideBike');
    var wf    = $('#rbWf');
    var wr    = $('#rbWr');
    var cr    = $('#rbCr');
    var ink   = $('#roadInk');
    var type  = $('.hero-type');
    var hint  = $('.scroll-hint');
    if (!hero || !bike || reduced) return;

    var IMG_W_M   = 1.85;                 // a render szélessége méterben
    var WHEEL_C   = 2 * Math.PI * 0.335;  // kerékkerület (700x25)
    var GEAR      = 15 / 50;              // hátsó fogaskerék / lánckerék
    var REAR_HUB  = 0.2297;               // hátsó agy vízszintes helye a képen

    var m = { rigW: 0, startX: 0, span: 0, run: 1, roadW: 1, heroTop: 0 };
    var cur = 0, aim = 0, prev = 0, lean = 0, settled = true;

    function measure() {
      var vw = window.innerWidth;
      m.rigW  = bike.offsetWidth || 1;
      // induláskor az első kerék már belóg: ez hívja görgetésre a látogatót
      m.startX = -m.rigW * 0.82;
      m.span   = vw + m.rigW * 0.96;
      m.run    = Math.max(1, hero.offsetHeight - window.innerHeight);
      /* Mindkettő elrendezés-olvasás. Görgetés közben egyik sem változik,
         ezért itt mérjük egyszer — a draw()-ban képkockánként kiolvasva
         újratördelést kényszerítenének. */
      m.roadW   = (ink && ink.parentNode.offsetWidth) || vw || 1;
      m.heroTop = hero.offsetTop;
    }

    function progress(y) {
      return Math.max(0, Math.min(1, (y - m.heroTop) / m.run));
    }

    function draw() {
      var d = cur - prev;
      prev = cur;

      // gyorsulásra előre-, lassulásra hátradől — mint egy igazi bringás
      lean += (Math.max(-3.2, Math.min(3.2, d * 0.11)) - lean) * 0.12;

      var x    = m.startX + cur;
      var met  = cur * IMG_W_M / m.rigW;
      var deg  = met / WHEEL_C * 360;
      var bob  = Math.sin(met * 3.6) * 2.4;

      bike.style.transform =
        'translate3d(' + x.toFixed(1) + 'px,' + bob.toFixed(2) + 'px,0) rotate(' +
        (-lean).toFixed(2) + 'deg)';
      if (wf) wf.style.transform = 'rotate(' + deg.toFixed(2) + 'deg)';
      if (wr) wr.style.transform = 'rotate(' + deg.toFixed(2) + 'deg)';
      if (cr) cr.style.transform = 'rotate(' + (deg * GEAR).toFixed(2) + 'deg)';

      /* Az út festése korábban az ink SZÉLESSÉGÉT állította képkockánként.
         A width elrendezést és újrafestést von maga után; a scaleX viszont
         a kompozitorban fut, elrendezés nélkül. Mérve ugyanazon a gépen,
         60 képkockára átlagolva: width 0,328 ms/kép, scaleX 0,027 ms/kép.
         Az elem szélessége ezért fixen 100%, a hosszát a skála adja. */
      if (ink) {
        var len = Math.max(0, x + m.rigW * REAR_HUB);
        ink.style.transform = 'scaleX(' + (len / m.roadW).toFixed(4) + ')';
      }

      var p = m.span ? cur / m.span : 0;
      if (type) {
        type.style.transform = 'translate3d(0,' + (-p * 34).toFixed(1) + 'px,0)';
        type.style.opacity = (1 - p * 0.42).toFixed(3);
      }
      if (hint) hint.style.opacity = Math.max(0, 1 - p * 5).toFixed(3);
    }

    /* A lemaradó követés adja a lendületet: görgetés után még kigurul.
       Amíg tart a kigurulás, a write maga kér új képkockát; ha beállt,
       nem kér — így álló oldalon egyetlen rAF sem fut feleslegesen. */
    register({
      geom: function () {
        measure();
        cur = aim = prev = progress(window.scrollY) * m.span;
        settled = false;
      },
      read: function (y) {
        aim = progress(y) * m.span;
        if (Math.abs(aim - cur) > 0.08) settled = false;
      },
      write: function () {
        if (settled) return;
        cur += (aim - cur) * 0.13;
        if (Math.abs(aim - cur) <= 0.08) { cur = aim; settled = true; }
        draw();
        if (!settled) schedule();
      }
    });

    measure();
    cur = aim = prev = progress(window.scrollY) * m.span;
    draw();
  })();

  /* ---------- services: image follows pointer ---------- */
  if (fine && !reduced) {
    (function svcHover() {
      var box = $('#svcHover');
      var img = $('img', box);
      var hx = 0, hy = 0, dx = 0, dy = 0, active = false;

      $$('.svc').forEach(function (li) {
        li.addEventListener('mouseenter', function () {
          img.src = li.dataset.img;
          box.classList.add('on');
          active = true;
          wake();
        });
        li.addEventListener('mouseleave', function () {
          box.classList.remove('on');
          active = false;
        });
      });

      /* A left/top írása elrendezést érvénytelenít: minden képkockán
         újratördelést kért, ráadásul pont abban a fázisban, ahol a
         parallax mérni akart. A translate3d ehelyett a kompozitorban
         mozgatja a dobozt. A hurok is csak akkor fut, amikor egy
         szolgáltatássoron áll az egér. */
      var hoverAlive = false;

      function hoverLoop() {
        if (!active) { dx = hx; dy = hy; hoverAlive = false; return; }
        dx += (hx - dx) * 0.1;
        dy += (hy - dy) * 0.1;
        box.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)';
        requestAnimationFrame(hoverLoop);
      }

      function wake() {
        if (!hoverAlive) { hoverAlive = true; requestAnimationFrame(hoverLoop); }
      }

      document.addEventListener('mousemove', function (e) {
        hx = e.clientX; hy = e.clientY;
        if (active) wake();
      }, { passive: true });
    })();
  }

  /* ---------- contact form → Web3Forms ----------
     The form also works without JS: it posts natively to the same
     action and Web3Forms renders its own thank-you page. */
  (function contactForm() {
    var form = $('#contactForm');
    if (!form || !window.fetch) return;

    var status = $('#formStatus');
    var btn    = $('button[type="submit"]', form);
    var label  = $('span', btn);

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var original = label.textContent;
      label.textContent = 'Küldés…';
      btn.disabled = true;
      status.className = 'form-status';
      status.textContent = '';

      fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d.success) throw new Error(d.message || 'ismeretlen hiba');
          form.reset();
          status.classList.add('ok');
          status.textContent = 'Megvan — hamarosan jelentkezünk.';
        })
        .catch(function () {
          status.classList.add('err');
          status.textContent = 'Nem sikerült elküldeni. Hívj minket: (30) 364 0141';
        })
        .then(function () {
          label.textContent = original;
          btn.disabled = false;
        });
    });
  })();

  /* ---------- raktáron lévő bringák ----------
     A lista a keszlet-seed.json statikus fájlból jön. Az oldal
     GitHub Pages-en fut, ahol nincs szerveroldali kód: új bringa
     úgy kerül fel, hogy a kép bemegy az img/keszlet/ mappába és
     egy sor a keszlet-seed.json-ba. Lásd KESZLET.md. */
  (function stock() {
    var grid  = $('#stockGrid');
    var state = $('#stockState');
    if (!grid) return;

    function render(bikes) {
      grid.innerHTML = '';
      if (!bikes.length) {
        var p = document.createElement('p');
        p.className = 'stock-state';
        p.textContent = 'Jelenleg nincs raktáron bringa. Hívj minket, és szólunk, ha érkezik.';
        grid.appendChild(p);
        return;
      }
      bikes.forEach(function (b, i) {
        var fig = document.createElement('figure');
        fig.className = 'stock-item';
        fig.setAttribute('role', 'listitem');
        var img = document.createElement('img');
        img.src = b.src;
        img.alt = (b.alt ? b.alt + ' — ' : '') + 'eladó felújított kerékpár a Bringázol¿ műhelyben, Abdán';

        /* A CSS aspect-ratio: 4/5 tartja a helyet, de a stíluslap
           betöltése előtt (és képhiba esetén) az explicit méret az,
           ami megakadályozza a layout ugrálást — ez a CLS mutató.
           A 700x875 pontosan a 4/5, hogy a kettő ne feszüljön egymásnak. */
        img.width = 700;
        img.height = 875;

        /* A rácsban a kép telefonon ~213 px széles, asztalon ~295.
           A 700 px-es változat telefonra pazarlás, ezért a buildben
           készül egy 480 px-es is. A képnagyítóhoz viszont mindig a
           nagy kell — azt tesszük el a data-full attribútumba.
           A keskeny változat csak az img/keszlet/ mappa képeihez
           készül; máshonnan hivatkozott kép srcset nélkül marad. */
        var seed = /^\/img\/keszlet\/([^/]+)\.jpg$/i.exec(b.src);
        if (seed) {
          img.srcset = '/img/keszlet/' + seed[1] + '-480.jpg 480w, ' + b.src + ' 700w';
          img.sizes = '(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw';
        }
        img.dataset.full = b.src;

        /* A készlet mélyen a hajtás alatt van — az első néhány kép
           mohó betöltése csak elvette a sávszélességet a hero elől
           (a mérés szerint 669 ms LCP-késés). Mind lusta. */
        img.loading = 'lazy';
        img.decoding = 'async';

        /* A kép kattintásra nagyít, tehát viselkedésében gomb — enélkül
           billentyűzettel nem lehetne megnyitni a képnagyítót. */
        img.tabIndex = 0;
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', (b.alt || 'Kerékpár') + ' — kép megnyitása nagyban');

        fig.appendChild(img);
        grid.appendChild(fig);
        requestAnimationFrame(function () { fig.classList.add('in'); });
      });
    }

    fetch('keszlet-seed.json', { headers: { 'Accept': 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('keszlet'); return r.json(); })
      .then(render)
      .catch(function () {
        if (state) state.textContent = 'A készlet most nem tölthető be. Hívj minket: (30) 364 0141';
      });
  })();

  /* ---------- képnagyító ---------- */
  (function lightbox() {
    var box   = $('#lightbox');
    var img   = $('#lightboxImg');
    var close = $('#lightboxClose');
    var grid  = $('#stockGrid');
    if (!box || !grid) return;

    // ide tér vissza a fókusz bezáráskor
    var opener = null;

    function open(src, alt, from) {
      opener = from || null;
      img.src = src;
      img.alt = alt || '';
      box.hidden = false;
      document.body.classList.add('locked');
      requestAnimationFrame(function () {
        box.classList.add('on');
        close.focus();
      });
    }

    function shut() {
      box.classList.remove('on');
      document.body.classList.remove('locked');
      // removeAttribute, nem img.src = '' — az utóbbi a dokumentum
      // saját URL-jét kérné le még egyszer, képként
      setTimeout(function () { box.hidden = true; img.removeAttribute('src'); }, 260);
      if (opener) { opener.focus(); opener = null; }
    }

    grid.addEventListener('click', function (e) {
      var hit = e.target.closest('.stock-item img');
      // data-full = a nagy változat; hit.src a rácsban épp kiválasztott
      // (telefonon a keskeny) verzió lenne, az nagyítva homályos
      if (hit) open(hit.dataset.full || hit.src, hit.alt, hit);
    });

    // a rácsképek role="button"-ok: az Enter és a szóköz is nyisson
    grid.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var hit = e.target.closest('.stock-item img');
      if (!hit) return;
      e.preventDefault();
      open(hit.dataset.full || hit.src, hit.alt, hit);
    });
    close.addEventListener('click', shut);
    box.addEventListener('click', function (e) { if (e.target === box) shut(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !box.hidden) shut();
    });
  })();


})();
