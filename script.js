/* ============================================================
   Yahoo Scouts — shared interactions (index + history)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Lightbox (with wheel-zoom + drag-pan) ---------- */
  var lightbox = document.getElementById('lightbox');
  if (lightbox) {
    var lightboxImg = lightbox.querySelector('img');
    var closeBtn = lightbox.querySelector('.lightbox-close');
    var scale = 1, tx = 0, ty = 0, MIN = 1, MAX = 6;

    var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
    var apply = function () {
      lightboxImg.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
      lightboxImg.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
    };
    var reset = function () { scale = 1; tx = 0; ty = 0; apply(); };

    // zoom by `factor`, keeping the point under (clientX,clientY) fixed
    var zoomAt = function (factor, clientX, clientY) {
      var prev = scale;
      scale = clamp(scale * factor, MIN, MAX);
      var f = scale / prev;
      if (scale === MIN) { tx = 0; ty = 0; }
      else if (typeof clientX === 'number') {
        var r = lightboxImg.getBoundingClientRect();
        var vx = clientX - (r.left + r.width / 2);
        var vy = clientY - (r.top + r.height / 2);
        tx -= vx * (f - 1);
        ty -= vy * (f - 1);
      }
      apply();
    };

    var openLightbox = function (src, alt) {
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      reset();
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
    };
    var closeLightbox = function () {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      lightboxImg.src = '';
      reset();
    };

    lightboxImg.addEventListener('wheel', function (e) {
      e.preventDefault();
      zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX, e.clientY);
    }, { passive: false });

    lightboxImg.addEventListener('dblclick', function (e) {
      if (scale > 1) reset(); else zoomAt(2.5, e.clientX, e.clientY);
    });

    // drag to pan (only when zoomed in)
    var dragging = false, sx = 0, sy = 0;
    lightboxImg.addEventListener('pointerdown', function (e) {
      if (scale <= 1) return;
      dragging = true; sx = e.clientX - tx; sy = e.clientY - ty;
      lightboxImg.style.cursor = 'grabbing';
      lightboxImg.style.transition = 'none';
      try { lightboxImg.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    });
    lightboxImg.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      tx = e.clientX - sx; ty = e.clientY - sy;
      lightboxImg.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
    });
    var endDrag = function () { if (dragging) { dragging = false; lightboxImg.style.cursor = 'grab'; lightboxImg.style.transition = ''; } };
    lightboxImg.addEventListener('pointerup', endDrag);
    lightboxImg.addEventListener('pointercancel', endDrag);
    lightboxImg.addEventListener('dragstart', function (e) { e.preventDefault(); });

    // any image marked zoomable opens the lightbox
    document.querySelectorAll(
      '.scout-card img, .spec img, .style-media img, .product-shot img, .avatar img, .history-item img, .feature-media img, .sticker-sheet img, .sticker-shot img'
    ).forEach(function (img) {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function () { openLightbox(img.src, img.alt); });
    });

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
  }

  /* ---------- Animation auto-detect ----------
     Drop <scout>.mp4 files into assets/anim/ and they appear automatically.
     The <video> must live in the DOM to start loading in Chrome, so we append
     it up front (hidden) and only reveal it once it can actually play. */
  document.querySelectorAll('.anim-card').forEach(function (card) {
    var scout = card.getAttribute('data-scout');
    var video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('loop', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('playsinline', '');
    video.preload = 'auto';
    video.style.opacity = '0'; // hidden until confirmed playable
    var reveal = function () {
      if (card.classList.contains('has-video')) return;
      card.classList.add('has-video');
      video.style.opacity = '';
      video.play().catch(function () {});
    };
    video.addEventListener('loadeddata', reveal);
    video.addEventListener('canplay', reveal);
    video.addEventListener('error', function () { video.remove(); });
    card.appendChild(video);
    video.src = 'assets/anim/' + scout + '.mp4';
  });

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Nav: shadow + scroll-spy ---------- */
  var nav = document.getElementById('nav');
  if (nav) {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
    var sections = links
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean);

    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 8);
      if (!sections.length) return;
      var pos = window.scrollY + 120;
      var current = sections[0];
      sections.forEach(function (s) { if (s.offsetTop <= pos) current = s; });
      links.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current.id);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
