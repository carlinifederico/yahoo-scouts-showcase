/* ============================================================
   stage.js — editor liviano de galerías para el área de STAGING (oculta).
   Sin dependencias. Cada <div class="gal" data-gid="..."> se vuelve editable:
   agregar (file→dataURL), borrar, reordenar (drag) y persistir en localStorage.
   Los assets viven en el navegador de quien arma (NO se commitean); para publicar
   se dejan los archivos reales en la carpeta media/ de la entrega y se referencian.
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $all = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var KEY = 'stage:' + location.pathname;

  var store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { store = {}; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} count(); }

  var picker = document.createElement('input');
  picker.type = 'file'; picker.accept = 'image/*,video/*'; picker.multiple = true;
  picker.style.display = 'none'; document.body.appendChild(picker);
  var activeGid = null;

  picker.addEventListener('change', function () {
    var files = Array.prototype.slice.call(picker.files || []);
    var gid = activeGid; if (!gid) return;
    var pending = files.length;
    files.forEach(function (f) {
      var r = new FileReader();
      r.onload = function () {
        store[gid] = store[gid] || [];
        store[gid].push({ t: f.type.indexOf('video') === 0 ? 'v' : 'i', src: r.result, cap: f.name.replace(/\.[^.]+$/, '') });
        if (--pending === 0) { save(); render(gid); }
      };
      r.readAsDataURL(f);
    });
    picker.value = '';
  });

  function tileNode(item, gid, idx) {
    var fig = document.createElement('figure');
    fig.className = 'tile'; fig.draggable = true; fig.dataset.idx = idx;
    var media = item.t === 'v'
      ? '<video src="' + item.src + '" muted loop playsinline autoplay></video><span class="vbadge">▶</span>'
      : '<img src="' + item.src + '" alt="">';
    fig.innerHTML = media + '<span class="cap">' + (item.cap || '') + '</span><button class="del" title="Remove">&times;</button>';
    fig.querySelector('.del').addEventListener('click', function (e) {
      e.stopPropagation(); store[gid].splice(idx, 1); save(); render(gid);
    });
    // drag reorder
    fig.addEventListener('dragstart', function () { fig.classList.add('dragging'); activeGid = gid; });
    fig.addEventListener('dragend', function () { fig.classList.remove('dragging'); });
    fig.addEventListener('dragover', function (e) { e.preventDefault(); fig.classList.add('over'); });
    fig.addEventListener('dragleave', function () { fig.classList.remove('over'); });
    fig.addEventListener('drop', function (e) {
      e.preventDefault(); fig.classList.remove('over');
      var from = +document.querySelector('.tile.dragging').dataset.idx, to = idx;
      if (from === to) return;
      var arr = store[gid]; var m = arr.splice(from, 1)[0]; arr.splice(to, 0, m); save(); render(gid);
    });
    return fig;
  }

  function addTile(gid) {
    var add = document.createElement('button');
    add.className = 'tile add'; add.type = 'button';
    add.innerHTML = '<span class="plus">+</span><span class="lab">Add art</span>';
    add.addEventListener('click', function () { activeGid = gid; picker.click(); });
    return add;
  }

  function render(gid) {
    var gal = $('.gal[data-gid="' + gid + '"]'); if (!gal) return;
    gal.innerHTML = '';
    (store[gid] || []).forEach(function (item, i) { gal.appendChild(tileNode(item, gid, i)); });
    gal.appendChild(addTile(gid));
    count();
  }

  function count() {
    $all('.gcount[data-for]').forEach(function (el) {
      var n = (store[el.dataset.for] || []).length;
      el.textContent = n + (n === 1 ? ' item' : ' items');
    });
  }

  function editbar() {
    var bar = document.createElement('div');
    bar.className = 'editbar';
    bar.innerHTML = '<span class="state">Local draft · saved in this browser</span>' +
      '<button class="ebtn ghost" id="stExport">Copy embed</button>' +
      '<button class="ebtn primary" id="stClear">Clear</button>';
    document.body.appendChild(bar);
    $('#stClear', bar).addEventListener('click', function () {
      if (!confirm('Clear all local draft art on this page?')) return;
      store = {}; save(); $all('.gal[data-gid]').forEach(function (g) { render(g.dataset.gid); });
      toast('Cleared');
    });
    $('#stExport', bar).addEventListener('click', function () {
      var out = '';
      $all('.gal[data-gid]').forEach(function (g) {
        var gid = g.dataset.gid; out += '<!-- gallery: ' + gid + ' -->\n';
        (store[gid] || []).forEach(function (it) {
          out += it.t === 'v'
            ? '<figure class="tile"><video src="media/REPLACE" muted loop playsinline autoplay></video><span class="cap">' + (it.cap || '') + '</span></figure>\n'
            : '<figure class="tile"><img src="media/REPLACE" alt=""><span class="cap">' + (it.cap || '') + '</span></figure>\n';
        });
      });
      navigator.clipboard && navigator.clipboard.writeText(out);
      toast('Embed copied — swap media/REPLACE for the committed files');
    });
  }

  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  function boot() {
    var gals = $all('.gal[data-gid]');
    if (!gals.length) return;
    gals.forEach(function (g) { render(g.dataset.gid); });
    editbar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
