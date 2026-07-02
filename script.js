/* ============================================================
   Yahoo Scouts — shared interactions (index + history)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById('lightbox');
  if (lightbox) {
    var lightboxImg = lightbox.querySelector('img');
    var closeBtn = lightbox.querySelector('.lightbox-close');

    var openLightbox = function (src, alt) {
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
    };
    var closeLightbox = function () {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      lightboxImg.src = '';
    };

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
