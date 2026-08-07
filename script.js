/* ============================================================
   Bringázol¿ — interactions. No dependencies.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine    = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- year ---------- */
  $('#year').textContent = new Date().getFullYear();

  /* ---------- preloader ----------
     Counts real image loads so the curtain lifts when the hero is
     actually painted, not after an arbitrary timeout. */
  (function preloader() {
    var el    = $('#preloader');
    var out   = $('#preCount');
    // lazy images never load before their viewport, so waiting on them
    // would pin the counter to the deadline every time
    var imgs  = $$('img').filter(function (i) { return i.loading !== 'lazy'; });
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
    var deadline = Date.now() + 4000;

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

    document.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      cur.classList.add('on');
    });

    (function loop() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();

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
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      nav.classList.toggle('solid', y > 40);
      nav.classList.toggle('hide', y > last && y > 260 && !menuOpen);
      last = y;
    }, { passive: true });
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
    var ticking = false;

    /* Előbb MINDEN mérés, utána MINDEN írás. Ha a kettőt váltogatnánk
       (mérek egy elemet, írok rá, mérem a következőt...), a böngésző
       minden mérésnél újraszámolná az elrendezést — a DevTools ezt
       296 ms kényszerített újratördelésként mutatta ki. */
    var jobs = [];

    function frame() {
      var vh = window.innerHeight;
      jobs.length = 0;

      for (var i = 0; i < els.length; i++) {
        var r = els[i].getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        var speed = parseFloat(els[i].dataset.parallax) || 0.15;
        // -1 .. 1 a nézetablakon át
        var progress = (r.top + r.height / 2 - vh / 2) / vh;
        jobs.push(els[i], (progress * speed * 100).toFixed(2));
      }

      for (var j = 0; j < jobs.length; j += 2) {
        jobs[j].style.transform = 'translate3d(0,' + jobs[j + 1] + 'px,0)';
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }, { passive: true });
    frame();
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

    var m = { rigW: 0, startX: 0, span: 0, run: 1 };
    var cur = 0, aim = 0, prev = 0, lean = 0, ticking = false, alive = false;

    function measure() {
      var vw = window.innerWidth;
      m.rigW  = bike.offsetWidth || 1;
      // induláskor az első kerék már belóg: ez hívja görgetésre a látogatót
      m.startX = -m.rigW * 0.82;
      m.span   = vw + m.rigW * 0.96;
      m.run    = Math.max(1, hero.offsetHeight - window.innerHeight);
    }

    function progress() {
      var y = window.scrollY - hero.offsetTop;
      return Math.max(0, Math.min(1, y / m.run));
    }

    function draw() {
      ticking = false;
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
      if (ink) ink.style.width = Math.max(0, x + m.rigW * REAR_HUB).toFixed(1) + 'px';

      var p = m.span ? cur / m.span : 0;
      if (type) {
        type.style.transform = 'translate3d(0,' + (-p * 34).toFixed(1) + 'px,0)';
        type.style.opacity = (1 - p * 0.42).toFixed(3);
      }
      if (hint) hint.style.opacity = Math.max(0, 1 - p * 5).toFixed(3);
    }

    // a lemaradó követés adja a lendületet: görgetés után még kigurul
    function loop() {
      cur += (aim - cur) * 0.13;
      draw();
      if (Math.abs(aim - cur) > 0.08) {
        requestAnimationFrame(loop);
      } else {
        cur = aim;
        draw();
        alive = false;
      }
    }

    function sync() {
      aim = progress() * m.span;
      if (!alive) { alive = true; requestAnimationFrame(loop); }
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(sync); }
    }, { passive: true });

    window.addEventListener('resize', function () {
      measure();
      cur = aim = progress() * m.span;
      prev = cur;
      draw();
    });

    measure();
    cur = aim = prev = progress() * m.span;
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
        });
        li.addEventListener('mouseleave', function () {
          box.classList.remove('on');
          active = false;
        });
      });

      document.addEventListener('mousemove', function (e) { hx = e.clientX; hy = e.clientY; });

      (function loop() {
        if (active) {
          dx += (hx - dx) * 0.1;
          dy += (hy - dy) * 0.1;
          box.style.left = dx + 'px';
          box.style.top  = dy + 'px';
        } else { dx = hx; dy = hy; }
        requestAnimationFrame(loop);
      })();
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
        var img = document.createElement('img');
        img.src = b.src;
        img.alt = (b.alt ? b.alt + ' — ' : '') + 'eladó felújított kerékpár a Bringázol¿ műhelyben, Abdán';

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

    function open(src, alt) {
      img.src = src;
      img.alt = alt || '';
      box.hidden = false;
      document.body.classList.add('locked');
      requestAnimationFrame(function () { box.classList.add('on'); });
    }

    function shut() {
      box.classList.remove('on');
      document.body.classList.remove('locked');
      setTimeout(function () { box.hidden = true; img.src = ''; }, 260);
    }

    grid.addEventListener('click', function (e) {
      var hit = e.target.closest('.stock-item img');
      // data-full = a nagy változat; hit.src a rácsban épp kiválasztott
      // (telefonon a keskeny) verzió lenne, az nagyítva homályos
      if (hit) open(hit.dataset.full || hit.src, hit.alt);
    });
    close.addEventListener('click', shut);
    box.addEventListener('click', function (e) { if (e.target === box) shut(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !box.hidden) shut();
    });
  })();


})();
