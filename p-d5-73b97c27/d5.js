/* ============================================================
   Yahoo Scouts — Delivery #5 · editable galleries + nav/reveal
   Todo client-side, sin dependencias. Persiste en localStorage.
   ============================================================ */
(function () {
  'use strict';

  var LS = 'd5.gal.';           // localStorage namespace por galería
  var MAXDIM = 820;             // downscale para que entre en localStorage
  var Q = 0.82;
  var liveURLs = {};            // id -> objectURL (solo esta sesión, para reproducir video)

  /* ---------- helpers ---------- */
  function $(s, c) { return (c || document).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function uid() { return 'i' + Math.floor(performance.now() * 1000).toString(36) + Object.keys(liveURLs).length; }

  var toastEl = $('#toast'), toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  function load(key) { try { return JSON.parse(localStorage.getItem(LS + key)) || []; } catch (e) { return []; } }
  function save(key, arr) {
    try { localStorage.setItem(LS + key, JSON.stringify(arr)); return true; }
    catch (e) { toast('⚠ Muchas imágenes para guardar en el navegador — se ven, pero exportá para no perderlas.'); return false; }
  }

  /* ---------- downscale image file -> dataURL ---------- */
  function imgToThumb(file, cb) {
    var url = URL.createObjectURL(file), im = new Image();
    im.onload = function () {
      var w = im.naturalWidth, h = im.naturalHeight, s = Math.min(1, MAXDIM / Math.max(w, h));
      var c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      cb(c.toDataURL('image/jpeg', Q));
    };
    im.onerror = function () { URL.revokeObjectURL(url); cb(null); };
    im.src = url;
  }

  /* ---------- video file -> poster dataURL (+ live url this session) ---------- */
  function videoToPoster(file, id, cb) {
    var url = URL.createObjectURL(file); liveURLs[id] = url;
    var v = document.createElement('video'); v.muted = true; v.preload = 'metadata'; v.src = url;
    v.onloadeddata = function () {
      try { v.currentTime = Math.min(0.1, (v.duration || 1) / 3); } catch (e) { drawPoster(); }
    };
    v.onseeked = drawPoster;
    v.onerror = function () { cb(null); };
    function drawPoster() {
      var w = v.videoWidth || 640, h = v.videoHeight || 640, s = Math.min(1, MAXDIM / Math.max(w, h));
      var c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
      try { c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', Q)); }
      catch (e) { cb(null); }
    }
  }

  /* ---------- render one gallery ---------- */
  function render(gal) {
    var key = gal.dataset.gallery, items = load(key), wide = gal.dataset.tile === 'wide';
    // header (count) — sits above the gallery, inject once
    var head = gal.parentNode.querySelector('.ghead');
    if (!head) {
      head = document.createElement('div'); head.className = 'ghead';
      head.innerHTML = '<span class="gname"></span><span class="ghint"></span><span class="gcount"></span>';
      gal.parentNode.insertBefore(head, gal);
      head.querySelector('.gname').textContent = '＋ Galería';
      head.querySelector('.ghint').textContent = gal.dataset.hint || 'Agregá y ordená imágenes';
    }
    head.querySelector('.gcount').textContent = items.length + (items.length === 1 ? ' img' : ' imgs');

    gal.innerHTML = '';
    items.forEach(function (it, idx) {
      var t = document.createElement('div'); t.className = 'tile' + (wide ? ' wide' : ''); t.draggable = true; t.dataset.idx = idx;
      var media;
      if (it.type === 'video' && liveURLs[it.id]) {
        media = '<video src="' + liveURLs[it.id] + '" muted loop playsinline></video>';
      } else if (it.type === 'video') {
        media = '<img src="' + it.thumb + '" alt=""><span class="vbadge">▶</span>';
      } else {
        media = '<img src="' + it.thumb + '" alt="">';
      }
      t.innerHTML = media +
        '<span class="cap">' + (it.name || '') + '</span>' +
        '<button class="del" title="Quitar" aria-label="Quitar">&times;</button>';
      gal.appendChild(t);
    });

    // add tile
    var add = document.createElement('div'); add.className = 'tile add' + (wide ? ' wide' : '');
    var isVid = /video/.test(gal.dataset.accept || '');
    add.innerHTML = '<span class="plus">+</span><span class="lab">' + (isVid ? 'Agregar video / imagen' : 'Agregar imagen') + '</span>';
    gal.appendChild(add);
  }

  /* ---------- wire a gallery ---------- */
  function wire(gal) {
    var key = gal.dataset.gallery;
    var input = document.createElement('input');
    input.type = 'file'; input.accept = gal.dataset.accept || 'image/*'; input.multiple = true; input.style.display = 'none';
    document.body.appendChild(input);

    render(gal);

    gal.addEventListener('click', function (e) {
      var add = e.target.closest('.tile.add');
      var del = e.target.closest('.del');
      var tile = e.target.closest('.tile:not(.add)');
      if (add) { input.click(); return; }
      if (del) { e.stopPropagation(); removeAt(key, +del.parentNode.dataset.idx); render(gal); return; }
      if (tile) { openLightbox(load(key)[+tile.dataset.idx]); }
    });

    input.addEventListener('change', function () {
      var files = Array.prototype.slice.call(input.files); input.value = '';
      var arr = load(key), pending = files.length;
      if (!pending) return;
      toast('Procesando ' + pending + (pending === 1 ? ' archivo…' : ' archivos…'));
      files.forEach(function (f) {
        var id = uid();
        if (/^video/.test(f.type)) {
          videoToPoster(f, id, function (thumb) {
            arr.push({ id: id, name: f.name, type: 'video', thumb: thumb || '' });
            done();
          });
        } else {
          imgToThumb(f, function (thumb) {
            if (thumb) arr.push({ id: id, name: f.name, type: 'image', thumb: thumb });
            done();
          });
        }
      });
      function done() { if (--pending === 0) { save(key, arr); render(gal); } }
    });

    /* drag reorder */
    var dragIdx = null;
    gal.addEventListener('dragstart', function (e) {
      var t = e.target.closest('.tile:not(.add)'); if (!t) return;
      dragIdx = +t.dataset.idx; t.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move';
    });
    gal.addEventListener('dragend', function () {
      dragIdx = null; $all('.tile', gal).forEach(function (t) { t.classList.remove('dragging', 'over'); });
    });
    gal.addEventListener('dragover', function (e) {
      e.preventDefault(); var t = e.target.closest('.tile:not(.add)');
      $all('.tile', gal).forEach(function (x) { x.classList.remove('over'); });
      if (t && +t.dataset.idx !== dragIdx) t.classList.add('over');
    });
    gal.addEventListener('drop', function (e) {
      e.preventDefault(); var t = e.target.closest('.tile:not(.add)'); if (t == null || dragIdx == null) return;
      var to = +t.dataset.idx; if (to === dragIdx) return;
      var arr = load(key); var moved = arr.splice(dragIdx, 1)[0]; arr.splice(to, 0, moved);
      save(key, arr); dragIdx = null; render(gal);
    });
  }

  function removeAt(key, idx) { var arr = load(key); arr.splice(idx, 1); save(key, arr); }

  /* ---------- lightbox ---------- */
  var lb = $('#lightbox');
  function openLightbox(it) {
    if (!it) return;
    $all('img,video', lb).forEach(function (n) { n.remove(); });
    var node;
    if (it.type === 'video' && liveURLs[it.id]) { node = document.createElement('video'); node.src = liveURLs[it.id]; node.controls = true; node.autoplay = true; node.loop = true; }
    else { node = document.createElement('img'); node.src = it.thumb; }
    lb.appendChild(node); lb.classList.add('open');
  }
  $('#lbClose').addEventListener('click', function () { lb.classList.remove('open'); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.classList.remove('open'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.classList.remove('open'); });

  /* ---------- export / reset toolbar ---------- */
  function buildBar() {
    var bar = document.createElement('div'); bar.className = 'editbar';
    bar.innerHTML =
      '<span class="state" id="ebState"></span>' +
      '<button class="ebtn ghost" id="ebReset">Vaciar</button>' +
      '<button class="ebtn primary" id="ebExport">⬇ Exportar</button>';
    document.body.appendChild(bar);
    updateState();
    $('#ebExport').addEventListener('click', exportAll);
    $('#ebReset').addEventListener('click', function () {
      if (!confirm('¿Vaciar TODAS las galerías de este navegador? (No borra nada publicado.)')) return;
      $all('.gal[data-gallery]').forEach(function (g) { localStorage.removeItem(LS + g.dataset.gallery); render(g); });
      updateState(); toast('Galerías vaciadas.');
    });
  }
  function totalCount() {
    return $all('.gal[data-gallery]').reduce(function (n, g) { return n + load(g.dataset.gallery).length; }, 0);
  }
  function updateState() {
    var n = totalCount(); $('#ebState').textContent = n ? (n + ' imgs cargadas · exportá para publicar') : 'Cargá imágenes con +';
  }

  function exportAll() {
    var manifest = { delivery: 5, generated: new Date().toISOString(), galleries: {} }, embed = {};
    $all('.gal[data-gallery]').forEach(function (g) {
      var key = g.dataset.gallery, items = load(key);
      manifest.galleries[key] = items.map(function (it, i) { return { order: i, name: it.name, type: it.type }; });
      embed[key] = items.map(function (it) { return { name: it.name, type: it.type, thumb: it.thumb }; });
    });
    manifest.embed = embed; // thumbs incluidos por si hace falta reconstruir
    var blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'delivery5-manifest.json'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast('Manifiesto exportado (' + totalCount() + ' imgs). Pasámelo cuando quieras publicar.');
  }

  /* ---------- nav active + scroll shadow + reveal ---------- */
  function chrome() {
    var nav = $('#nav');
    var links = $all('.nav-links a[href^="#"]');
    var secs = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          var id = '#' + e.target.id;
          links.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { s && io.observe(s); });

    window.addEventListener('scroll', function () { nav.classList.toggle('scrolled', window.scrollY > 8); }, { passive: true });

    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
    }, { threshold: 0.12 });
    $all('.reveal').forEach(function (n) { rio.observe(n); });
  }

  /* ---------- init ---------- */
  $all('.gal[data-gallery]').forEach(wire);
  buildBar();
  chrome();
  // refresh toolbar state after any gallery change
  document.addEventListener('click', function () { setTimeout(updateState, 60); });
})();
