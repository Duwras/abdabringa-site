/* ============================================================
   Bringázol¿ — készletkezelés.

   Az oldal GitHub Pages-en fut, ahol nincs szerveroldali kód —
   nincs tehát mit jelszóval védeni, és nincs mihez feltölteni.
   Helyette ez a felület KÖZVETLENÜL a GitHub API-val dolgozik:
   a böngésző készít egy commitot a repóba, a commit elindítja a
   közzétételt, és 1-2 perc múlva kint van a változás.

   Amit ez jelent a védelemre nézve:

   - A hitelesítést a GitHub végzi, nem mi. A felület megnyitása
     önmagában semmit nem enged; kulcs nélkül minden írási kérés
     401-gyel elszáll. Ezért nincs is baj abból, hogy az admin.html
     egy publikus repóban lévő statikus fájl.
   - A kulcs (fine-grained personal access token) SOHA nem kerül
     be a kódba vagy a repóba. A tulajdonos gépén, a böngésző
     tárolójában él, és csak a api.github.com felé megy ki.
   - Alapból a lap bezárásáig él (sessionStorage). A "jegyezze meg"
     jelölővel localStorage-be kerül — ezt csak saját eszközön
     érdemes bepipálni.

   Minden művelet EGYETLEN commit (Git Data API: blob → tree →
   commit → ref). Tizenkét kép feltöltése is egy közzétételt
   indít, nem tizenkettőt.
   ============================================================ */
(function () {
  'use strict';

  var OWNER  = 'Duwras';
  var REPO   = 'abdabringa-site';
  var BRANCH = 'main';

  var API  = 'https://api.github.com/repos/' + OWNER + '/' + REPO;
  var RAW  = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO;
  var LIST = 'keszlet-seed.json';
  var DIR  = 'img/keszlet';

  var KEY = 'abdabringaGithubToken';
  var MAX_FILES = 12;
  var MAX_EDGE  = 1400;   // a feltöltött kép hosszabb oldala
  var QUALITY   = 0.82;

  var $ = function (s) { return document.querySelector(s); };

  var gate = $('#gate');
  var app  = $('#app');

  var queued = [];        // { file, url, alt, leiras }
  var bikes  = [];        // a készlet aktuális állapota
  var headSha = '';       // a legutóbbi commit — a képek ezzel hivatkozódnak

  /* ---------- GitHub API ---------- */

  function token() {
    return sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || '';
  }

  function gh(path, opts) {
    opts = opts || {};
    var headers = {
      'Authorization': 'Bearer ' + token(),
      'Accept': opts.raw ? 'application/vnd.github.raw' : 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    var init = { method: opts.method || 'GET', headers: headers };
    if (opts.body) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }

    return fetch(API + path, init).then(function (r) {
      if (opts.raw && r.ok) return r.text();
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) {
          var e = new Error(githubError(r.status, d));
          e.status = r.status;
          throw e;
        }
        return d;
      });
    });
  }

  /* A GitHub angolul és fejlesztőknek válaszol. Ami tényleg elő
     tud fordulni, azt lefordítjuk használható mondatra. */
  function githubError(status, d) {
    if (status === 401) return 'A kulcs érvénytelen vagy lejárt. Készíts újat.';
    if (status === 403) return 'A kulcsnak nincs írási joga ehhez a repóhoz (Contents: Read and write kell).';
    if (status === 404) return 'Nem található a repó vagy a fájl. Jó kulcsot adtál meg?';
    if (status === 409 || status === 422) return 'Időközben más is módosított valamit. Töltsd újra az oldalt, és próbáld újra.';
    return (d && d.message ? d.message : 'Hiba') + ' (' + status + ')';
  }

  /* ---------- base64 ---------- */

  function b64Blob(blob) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload  = function () { resolve(String(fr.result).split(',')[1]); };
      fr.onerror = function () { reject(new Error('A kép nem olvasható.')); };
      fr.readAsDataURL(blob);
    });
  }

  // btoa csak bájtokkal dolgozik, a JSON viszont ékezetes UTF-8
  function b64Text(text) {
    var bytes = new TextEncoder().encode(text);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  /* ---------- commit ----------
     changes: [{ path, base64 }] vagy [{ path, remove: true }]
     Egy hívás = egy commit = egy közzététel. */
  function commit(message, changes) {
    var parent;

    return gh('/git/ref/heads/' + BRANCH)
      .then(function (ref) {
        parent = ref.object.sha;
        return gh('/git/commits/' + parent);
      })
      .then(function (base) {
        return Promise.all(changes.map(function (ch) {
          if (ch.remove) {
            // sha: null a fában = a fájl törlése
            return { path: ch.path, mode: '100644', type: 'blob', sha: null };
          }
          return gh('/git/blobs', {
            method: 'POST',
            body: { content: ch.base64, encoding: 'base64' }
          }).then(function (blob) {
            return { path: ch.path, mode: '100644', type: 'blob', sha: blob.sha };
          });
        })).then(function (tree) {
          return gh('/git/trees', {
            method: 'POST',
            body: { base_tree: base.tree.sha, tree: tree }
          });
        });
      })
      .then(function (tree) {
        return gh('/git/commits', {
          method: 'POST',
          body: { message: message, tree: tree.sha, parents: [parent] }
        });
      })
      .then(function (made) {
        return gh('/git/refs/heads/' + BRANCH, {
          method: 'PATCH',
          body: { sha: made.sha }
        }).then(function () {
          headSha = made.sha;
          return made.sha;
        });
      });
  }

  /* ---------- belépés ---------- */

  function setMsg(el, text, cls) {
    el.className = 'msg' + (cls ? ' ' + cls : '');
    el.textContent = text;
  }

  function forget() {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
  }

  function showGate(message) {
    forget();
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

  /* A tárolt kulcsot a GitHubbal ellenőriztetjük, mielőtt a felület
     megjelenne — és nem csak azt, hogy létezik, hanem hogy tényleg
     van vele írási jog. Enélkül a felhasználó a feltöltés végén
     szembesülne azzal, hogy a kulcs csak olvasni tud. */
  function verify() {
    return gh('').then(function (repo) {
      if (!repo.permissions || !repo.permissions.push) {
        var e = new Error('Ennek a kulcsnak nincs írási joga. A GitHubon állítsd be: Contents → Read and write.');
        e.status = 403;
        throw e;
      }
      return true;
    });
  }

  $('#gateForm').addEventListener('submit', function (e) {
    e.preventDefault();
    // a beillesztett kulcs végén könnyen marad szóköz vagy sortörés
    var value = $('#gatePass').value.trim();
    var btn   = $('#gateSubmit');
    if (!value) return;

    btn.disabled = true;
    setMsg($('#gateMsg'), 'Ellenőrzés…');

    forget();
    ($('#gateRemember').checked ? localStorage : sessionStorage).setItem(KEY, value);

    verify()
      .then(function () {
        btn.disabled = false;
        $('#gateForm').reset();
        setMsg($('#gateMsg'), '');
        showApp();
      })
      .catch(function (err) {
        btn.disabled = false;
        forget();
        setMsg($('#gateMsg'), err.message, 'err');
      });
  });

  $('#logout').addEventListener('click', function () {
    forget();
    window.location.href = 'index.html';
  });

  /* ---------- készlet lista ---------- */

  function loadStock() {
    setMsg($('#listMsg'), 'Betöltés…');

    gh('/git/ref/heads/' + BRANCH)
      .then(function (ref) {
        headSha = ref.object.sha;
        return gh('/contents/' + LIST + '?ref=' + BRANCH, { raw: true });
      })
      .then(function (text) {
        bikes = JSON.parse(text);
        renderStock();
      })
      .catch(function (err) {
        if (err.status === 401) return showGate('Lejárt a kulcs, add meg újra.');
        setMsg($('#listMsg'), 'A készlet nem tölthető be: ' + err.message, 'err');
      });
  }

  /* A képet a repóból mutatjuk, az AKTUÁLIS commit szerint — így az
     imént feltöltött kép is rögtön látszik, jóval azelőtt, hogy a
     weboldal újraépülne. */
  function repoImg(src) {
    return RAW + '/' + headSha + src;
  }

  function renderStock() {
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
      img.src = repoImg(b.src);
      img.alt = b.alt || 'Raktáron lévő kerékpár';
      // a felvitt leírás egérrel ráállva ellenőrizhető
      if (b.leiras) img.title = b.leiras;
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
    setMsg($('#listMsg'), 'Törlés…');

    var maradok = bikes.filter(function (b) { return b.id !== bike.id; });
    var changes = [{ path: LIST, base64: b64Text(listJson(maradok)) }];

    // a képfájl is menjen, hogy ne hízzon a repó feleslegesen
    if (bike.src.indexOf('/' + DIR + '/') === 0) {
      changes.push({ path: bike.src.slice(1), remove: true });
    }

    commit('Készlet: bringa levéve (' + bike.id + ')', changes)
      .then(function () {
        bikes = maradok;
        renderStock();
        setMsg($('#listMsg'), 'Kép törölve. Az oldalon 1-2 perc múlva tűnik el.', 'ok');
      })
      .catch(function (err) {
        card.classList.remove('busy');
        if (err.status === 401) return showGate('Lejárt a kulcs, add meg újra.');
        setMsg($('#listMsg'), err.message, 'err');
      });
  }

  /* A fájl kézzel is szerkeszthető (KESZLET.md), ezért olvasható
     formában írjuk vissza: soronként egy bringa. */
  function listJson(list) {
    if (!list.length) return '[]\n';
    return '[\n' + list.map(function (b) {
      return '  ' + JSON.stringify(b);
    }).join(',\n') + '\n]\n';
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

    files.forEach(function (f) {
      queued.push({ file: f, url: URL.createObjectURL(f), alt: '', leiras: '' });
    });
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

      /* A leírást a képernyőolvasó mondja fel, és ezt indexeli a
         Google is — ezért kérjük el, nem generáljuk. */
      var alt = document.createElement('input');
      alt.type = 'text';
      alt.className = 'alt';
      alt.placeholder = 'pl. Kék Merida MTB kerékpár';
      alt.value = item.alt;
      alt.setAttribute('aria-label', 'A kép rövid leírása');
      alt.addEventListener('input', function () { item.alt = alt.value; });

      /* A hosszabb leírás az ügyfélnek szól: ez jelenik meg a
         weboldalon, amikor rákattint a képre. Nem kötelező —
         ha üresen marad, a rövid leírás látszik helyette. */
      var leiras = document.createElement('textarea');
      leiras.className = 'leiras';
      leiras.rows = 3;
      leiras.placeholder = 'Mit kell tudni róla? pl. 28" váz, 3x8 sebesség, új fékbetét, kis karcolás a vázon';
      leiras.value = item.leiras;
      leiras.setAttribute('aria-label', 'Részletes leírás az ügyfélnek');
      leiras.addEventListener('input', function () { item.leiras = leiras.value; });

      fig.appendChild(img);
      fig.appendChild(x);
      fig.appendChild(alt);
      fig.appendChild(leiras);
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

  /* A következő szabad kNN sorszám. A repóban lévő FÁJLOKBÓL
     számoljuk, nem a listából: ha egy törölt kép fájlja bármiért
     bennmaradt, azt így sem írjuk felül. */
  function nextIndex() {
    return gh('/contents/' + DIR + '?ref=' + BRANCH).then(function (files) {
      var max = 0;
      files.forEach(function (f) {
        var m = /^k(\d+)\.jpe?g$/i.exec(f.name);
        if (m) max = Math.max(max, parseInt(m[1], 10));
      });
      return max + 1;
    });
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  $('#uploadBtn').addEventListener('click', function () {
    if (!queued.length) return;

    var btn = $('#uploadBtn');
    btn.disabled = true;
    setMsg($('#uploadMsg'), 'Képek előkészítése…');

    var added = [];

    Promise.all(queued.map(function (q) {
      return shrink(q.file).then(function (small) {
        return b64Blob(small).then(function (b64) {
          return { base64: b64, alt: q.alt.trim(), leiras: q.leiras.trim() };
        });
      });
    }))
      .then(function (prepared) {
        setMsg($('#uploadMsg'), 'Feltöltés… (' + prepared.length + ' kép)');
        return nextIndex().then(function (start) {
          var changes = prepared.map(function (p, i) {
            var name = 'k' + pad(start + i) + '.jpg';
            var src  = '/' + DIR + '/' + name;
            var bike = {
              id: 'seed-' + name.replace('.jpg', ''),
              src: src,
              alt: p.alt || 'Raktáron lévő felújított kerékpár'
            };
            // üres leírás ne kerüljön be a fájlba: a weboldal
            // ilyenkor a rövid leírást mutatja
            if (p.leiras) bike.leiras = p.leiras;
            added.push(bike);
            return { path: DIR + '/' + name, base64: p.base64 };
          });

          changes.push({ path: LIST, base64: b64Text(listJson(bikes.concat(added))) });

          var message = added.length === 1
            ? 'Készlet: új bringa'
            : 'Készlet: ' + added.length + ' új bringa';
          return commit(message, changes);
        });
      })
      .then(function () {
        queued.forEach(function (q) { URL.revokeObjectURL(q.url); });
        queued = [];
        renderQueue();
        bikes = bikes.concat(added);
        renderStock();
        setMsg($('#uploadMsg'), added.length + ' kép feltöltve. Az oldalon 1-2 perc múlva jelenik meg.', 'ok');
        btn.disabled = false;
      })
      .catch(function (err) {
        btn.disabled = false;
        if (err.status === 401) return showGate('Lejárt a kulcs, add meg újra.');
        setMsg($('#uploadMsg'), err.message, 'err');
      });
  });

  /* ---------- indulás ---------- */
  (function start() {
    if (!token()) return showGate();

    verify()
      .then(showApp)
      .catch(function (err) { showGate(err.message); });
  })();

})();
