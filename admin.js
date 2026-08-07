/* ============================================================
   Bringázol¿ — készletkezelés.

   A jelszó NEM tárolódik és a belépés után nem is megy vissza
   a hálózaton. A szerver egy aláírt, 8 óra után lejáró
   munkamenet-tokent ad, az él sessionStorage-ben (lap
   bezárásáig), és az megy az x-admin-token fejlécben.

   Ez a fájl csak a felületet kezeli — az érdemi ellenőrzés
   szerveroldalon van (src/lib/auth.mjs). Az admin felület
   megnyitása önmagában semmit nem enged: token nélkül minden
   írási kérés 401-gyel elszáll.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'bringazolAdminToken';
  var MAX_FILES = 12;
  var MAX_EDGE  = 1400;   // a feltöltött kép hosszabb oldala
  var QUALITY   = 0.82;

  var $ = function (s) { return document.querySelector(s); };

  var gate = $('#gate');
  var app  = $('#app');

  var queued = [];        // { file, url }

  /* ---------- API ---------- */

  function key() { return sessionStorage.getItem(KEY) || ''; }

  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ 'x-admin-token': key() }, opts.headers || {});
    return fetch(path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) {
          var e = new Error(d.error || 'Hiba (' + r.status + ')');
          e.status = r.status;
          throw e;
        }
        return d;
      });
    });
  }

  /* ---------- belépés ---------- */

  function showGate(message) {
    sessionStorage.removeItem(KEY);
    app.hidden = true;
    gate.hidden = false;
    if (message) setMsg($('#gateMsg'), message, 'err');
    $('#gatePass').focus();
  }

  function showApp() {
    gate.hidden = true;
    app.hidden = false;
    loadStock();
  }

  /* A /api/login egy netlify.toml rewrite. Ha az nem él, a válasz nem
     JSON, hanem a 404-es HTML — ilyenkor a függvény saját címét is
     megpróbáljuk, mielőtt hibás jelszót kiáltanánk. */
  var LOGIN_URLS = ['/api/login', '/.netlify/functions/bikes?action=login'];

  function postLogin(url, pass) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pass })
    }).then(function (r) {
      return r.text().then(function (t) {
        var data = null;
        try { data = JSON.parse(t); } catch (_) { /* nem JSON: rossz útvonal */ }
        return { status: r.status, ok: r.ok, data: data };
      });
    });
  }

  function attemptLogin(pass, i) {
    return postLogin(LOGIN_URLS[i], pass).then(function (res) {
      if (res.data === null && i + 1 < LOGIN_URLS.length) return attemptLogin(pass, i + 1);
      return res;
    }, function (err) {
      if (i + 1 < LOGIN_URLS.length) return attemptLogin(pass, i + 1);
      throw err;
    });
  }

  $('#gateForm').addEventListener('submit', function (e) {
    e.preventDefault();
    // a beillesztett jelszó végén könnyen marad szóköz
    var pass = $('#gatePass').value.trim();
    var btn  = $('#gateSubmit');
    if (!pass) return;

    btn.disabled = true;
    setMsg($('#gateMsg'), 'Ellenőrzés…');

    attemptLogin(pass, 0)
      .then(function (res) {
        btn.disabled = false;
        if (res.data === null) {
          setMsg($('#gateMsg'), 'Az admin funkció nincs telepítve (' + res.status + '). A drag & drop feltöltés nem viszi fel a függvényeket — lásd FELTOLTES.md.', 'err');
          return;
        }
        if (!res.ok || !res.data.ok) {
          setMsg($('#gateMsg'), res.data.error || 'Hibás jelszó.', 'err');
          return;
        }
        if (!res.data.token) {
          setMsg($('#gateMsg'), 'A szerver nem adott munkamenetet. Telepítsd újra a függvényeket (lásd DEPLOY.md).', 'err');
          return;
        }
        sessionStorage.setItem(KEY, res.data.token);
        $('#gateForm').reset();
        setMsg($('#gateMsg'), '');
        showApp();
      })
      .catch(function () {
        btn.disabled = false;
        setMsg($('#gateMsg'), 'Nem sikerült a kapcsolat. Próbáld újra.', 'err');
      });
  });

  $('#logout').addEventListener('click', function () {
    sessionStorage.removeItem(KEY);
    window.location.href = 'index.html';
  });

  /* ---------- készlet lista ---------- */

  function setMsg(el, text, cls) {
    el.className = 'msg' + (cls ? ' ' + cls : '');
    el.textContent = text;
  }

  function loadStock() {
    setMsg($('#listMsg'), 'Betöltés…');
    fetch('/api/bikes')
      .then(function (r) { if (!r.ok) throw new Error('api'); return r.json(); })
      .then(function (d) { renderStock(d.bikes || []); })
      .catch(function () {
        setMsg($('#listMsg'), 'A készlet nem tölthető be. Fut már a Netlify függvény?', 'err');
      });
  }

  function renderStock(bikes) {
    var grid = $('#grid');
    grid.innerHTML = '';
    $('#stockCount').textContent = bikes.length + ' db';

    if (!bikes.length) {
      setMsg($('#listMsg'), 'Jelenleg egy kép sincs a készletben.');
      return;
    }
    setMsg($('#listMsg'), '');

    bikes.forEach(function (b) {
      var card = document.createElement('figure');
      card.className = 'card';

      var img = document.createElement('img');
      img.src = b.src;
      img.alt = b.alt || 'Raktáron lévő kerékpár';
      img.loading = 'lazy';

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'del';
      del.textContent = 'Törlés';
      del.addEventListener('click', function () { remove(b, card); });

      card.appendChild(img);
      card.appendChild(del);
      grid.appendChild(card);
    });
  }

  function remove(bike, card) {
    if (!window.confirm('Biztosan törlöd ezt a képet a készletből?')) return;
    card.classList.add('busy');
    api('/api/bikes?id=' + encodeURIComponent(bike.id), { method: 'DELETE' })
      .then(function (d) {
        renderStock(d.bikes || []);
        setMsg($('#listMsg'), 'Kép törölve.', 'ok');
      })
      .catch(function (e) {
        card.classList.remove('busy');
        if (e.status === 401) return showGate('Lejárt a belépés, add meg újra a jelszót.');
        setMsg($('#listMsg'), e.message, 'err');
      });
  }

  /* ---------- kiválasztás ---------- */

  var drop  = $('#drop');
  var input = $('#fileInput');

  ['dragenter', 'dragover'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); });
  });
  drop.addEventListener('drop', function (e) {
    if (e.dataTransfer && e.dataTransfer.files) enqueue(e.dataTransfer.files);
  });

  input.addEventListener('change', function () {
    enqueue(input.files);
    input.value = '';
  });

  function enqueue(fileList) {
    var files = Array.prototype.slice.call(fileList).filter(function (f) {
      return f.type.indexOf('image/') === 0 || /\.hei[cf]$/i.test(f.name);
    });
    if (!files.length) {
      setMsg($('#uploadMsg'), 'Csak képfájlt lehet feltölteni.', 'err');
      return;
    }
    var room = MAX_FILES - queued.length;
    if (files.length > room) {
      setMsg($('#uploadMsg'), 'Egyszerre legfeljebb ' + MAX_FILES + ' kép tölthető fel.', 'err');
      files = files.slice(0, Math.max(0, room));
    } else {
      setMsg($('#uploadMsg'), '');
    }

    files.forEach(function (f) { queued.push({ file: f, url: URL.createObjectURL(f) }); });
    renderQueue();
  }

  function renderQueue() {
    var box = $('#queue');
    box.innerHTML = '';
    queued.forEach(function (item, i) {
      var fig = document.createElement('figure');
      var img = document.createElement('img');
      img.src = item.url;
      img.alt = '';

      var x = document.createElement('button');
      x.type = 'button';
      x.className = 'x';
      x.setAttribute('aria-label', 'Eltávolítás');
      x.innerHTML = '&times;';
      x.addEventListener('click', function () {
        URL.revokeObjectURL(item.url);
        queued.splice(i, 1);
        renderQueue();
      });

      fig.appendChild(img);
      fig.appendChild(x);
      box.appendChild(fig);
    });
    $('#uploadActions').hidden = queued.length === 0;
  }

  $('#clearQueue').addEventListener('click', function () {
    queued.forEach(function (q) { URL.revokeObjectURL(q.url); });
    queued = [];
    renderQueue();
    setMsg($('#uploadMsg'), '');
  });

  /* ---------- kicsinyítés feltöltés előtt ----------
     Telefonról érkező 4-5 MB-os képeket nincs értelme
     teljes méretben tárolni. Ha a böngésző nem tudja
     dekódolni (pl. HEIC asztali gépen), megy az eredeti. */
  function shrink(file) {
    if (!window.createImageBitmap || !HTMLCanvasElement.prototype.toBlob) {
      return Promise.resolve(file);
    }
    return createImageBitmap(file, { imageOrientation: 'from-image' })
      .then(function (bmp) {
        var scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
        var w = Math.round(bmp.width * scale);
        var h = Math.round(bmp.height * scale);

        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
        bmp.close();

        return new Promise(function (resolve) {
          canvas.toBlob(function (blob) {
            if (!blob || blob.size >= file.size) return resolve(file);
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }));
          }, 'image/jpeg', QUALITY);
        });
      })
      .catch(function () { return file; });
  }

  /* ---------- feltöltés ---------- */

  $('#uploadBtn').addEventListener('click', function () {
    if (!queued.length) return;

    var btn = $('#uploadBtn');
    btn.disabled = true;
    setMsg($('#uploadMsg'), 'Képek előkészítése…');

    Promise.all(queued.map(function (q) { return shrink(q.file); }))
      .then(function (files) {
        setMsg($('#uploadMsg'), 'Feltöltés… (' + files.length + " kép)");
        var form = new FormData();
        files.forEach(function (f) { form.append('file', f, f.name); });
        return api('/api/bikes', { method: 'POST', body: form });
      })
      .then(function (d) {
        queued.forEach(function (q) { URL.revokeObjectURL(q.url); });
        queued = [];
        renderQueue();
        renderStock(d.bikes || []);
        setMsg($('#uploadMsg'), d.added + ' kép feltöltve.', 'ok');
        btn.disabled = false;
      })
      .catch(function (e) {
        btn.disabled = false;
        if (e.status === 401) return showGate('Lejárt a belépés, add meg újra a jelszót.');
        setMsg($('#uploadMsg'), e.message, 'err');
      });
  });

  /* ---------- indulás ----------
     A tárolt token önmagában semmit nem jelent: a szerverrel
     ellenőriztetjük, mielőtt a felület megjelenne. Így egy
     kézzel odaírt sessionStorage-értékkel sem lehet "belépni". */
  (function start() {
    if (!key()) return showGate();

    fetch('/api/session', { headers: { 'x-admin-token': key() } })
      .then(function (r) { return r.ok; })
      .then(function (ok) { ok ? showApp() : showGate('Lejárt a belépés, add meg újra a jelszót.'); })
      .catch(function () { showGate(); });
  })();

})();
