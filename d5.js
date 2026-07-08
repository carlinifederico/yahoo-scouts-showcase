/* ============================================================
   Yahoo Scouts — Delivery #5 v2 (in-product / estados)
   Sin dependencias. 3 piezas: chrome (nav+reveal), state players, autoplay por viewport.
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $all = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- nav shadow + active link + reveal ---------- */
  function chrome() {
    var nav = $('#nav');
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

    // reveal on scroll
    var revs = $all('.reveal');
    if ('IntersectionObserver' in window) {
      var ro = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      revs.forEach(function (n) { ro.observe(n); });
    } else { revs.forEach(function (n) { n.classList.add('in'); }); }

    // active nav link
    var links = {};
    $all('.nav-links a').forEach(function (a) {
      var id = a.getAttribute('href'); if (id && id.charAt(0) === '#') links[id.slice(1)] = a;
    });
    var secs = $all('main section[id]');
    if ('IntersectionObserver' in window && secs.length) {
      var so = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) {
          if (!e.isIntersecting) return;
          var a = links[e.target.id]; if (!a) return;
          $all('.nav-links a.active').forEach(function (x) { x.classList.remove('active'); });
          a.classList.add('active');
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      secs.forEach(function (s) { so.observe(s); });
    }
  }

  /* ---------- state players ---------- */
  function playSafe(v) { if (!v) return; try { var p = v.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }

  function initPlayer(root) {
    var vids = $all('.sp-vid', root);
    var chips = $all('.sp-chip', root);
    var sayEl = $('.sp-say', root);
    var byState = {};
    vids.forEach(function (v) { byState[v.dataset.state] = v; });

    function go(state, doPlay) {
      var v = byState[state]; if (!v) return;
      root.setAttribute('data-cur', state);
      vids.forEach(function (o) {
        if (o === v) { o.classList.add('on'); }
        else { o.classList.remove('on'); o.pause(); }
      });
      chips.forEach(function (c) { c.classList.toggle('active', c.dataset.go === state); });
      if (sayEl && v.dataset.say) sayEl.textContent = v.dataset.say;
      if (doPlay) playSafe(v);
    }

    chips.forEach(function (c) {
      c.addEventListener('click', function () { go(c.dataset.go, true); });
    });

    var start = root.dataset.start || (vids[0] && vids[0].dataset.state);
    go(start, false); // set visible state; playback starts when in viewport

    // play/pause the active video based on visibility
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) {
          var cur = root.getAttribute('data-cur');
          var v = byState[cur];
          if (e.isIntersecting) playSafe(v); else if (v) v.pause();
        });
      }, { threshold: 0.35 });
      io.observe(root);
    } else { playSafe(byState[start]); }
  }

  /* ---------- generic autoplay-in-view videos (.autovid) ---------- */
  function autovids() {
    var vids = $all('.autovid');
    if (!vids.length) return;
    if (!('IntersectionObserver' in window)) { vids.forEach(playSafe); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting) playSafe(e.target); else e.target.pause();
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { io.observe(v); });
  }

  /* ---------- lightbox (squad / range / mini) ---------- */
  function lightbox() {
    var lb = $('#lightbox'), closeBtn = $('#lbClose');
    if (!lb) return;
    function open(node) {
      $all('img,video', lb).forEach(function (n) { n.remove(); });
      var el;
      if (node.tagName === 'VIDEO') {
        el = document.createElement('video');
        el.src = node.currentSrc || node.src; el.muted = true; el.loop = true; el.autoplay = true; el.playsInline = true; el.controls = true;
      } else {
        el = document.createElement('img'); el.src = node.currentSrc || node.src; el.alt = node.alt || '';
      }
      lb.appendChild(el); lb.classList.add('open');
    }
    function close() { lb.classList.remove('open'); $all('video', lb).forEach(function (v) { v.pause(); }); }
    $all('.sq, .rg, .mini-pair figure').forEach(function (fig) {
      fig.addEventListener('click', function () {
        var m = $('img', fig) || $('video', fig); if (m) open(m);
      });
    });
    closeBtn.addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---------- boot ---------- */
  function boot() {
    chrome();
    $all('.splayer').forEach(initPlayer);
    autovids();
    lightbox();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
