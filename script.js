/* ============================================================
   Yahoo Scouts — showcase interactions
   ============================================================ */
(function () {
  'use strict';

  var SCOUTS = ['science', 'sports', 'technology', 'weather'];
  var currentStyle = 'a'; // 'a' = humanoid, 'b' = iconic

  /* ---------- Scout gallery: build + toggle ---------- */
  var gallery = document.getElementById('gallery');

  function paintGallery(style) {
    currentStyle = style;
    var cards = gallery.querySelectorAll('.scout-card');
    cards.forEach(function (card) {
      var scout = card.getAttribute('data-scout');
      var imgWrap = card.querySelector('.scout-img');
      var img = imgWrap.querySelector('img');
      var tag = card.querySelector('.scout-tag');
      imgWrap.classList.add('swap');
      window.setTimeout(function () {
        img.src = 'assets/scouts/' + scout + '-' + style + '.png';
        imgWrap.classList.remove('swap');
      }, 160);
      tag.textContent = style === 'a' ? 'Humanoid' : 'Iconic';
    });
  }

  // initial paint
  paintGallery('a');

  /* ---------- Toggle control ---------- */
  var toggleBtns = document.querySelectorAll('.toggle-btn');
  var pill = document.querySelector('.toggle-pill');
  toggleBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var style = btn.getAttribute('data-style');
      if (style === currentStyle) return;
      toggleBtns.forEach(function (b) {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      pill.classList.toggle('right', style === 'b');
      paintGallery(style);
    });
  });

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = lightbox.querySelector('img');
  var closeBtn = lightbox.querySelector('.lightbox-close');

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
  }

  gallery.addEventListener('click', function (e) {
    var card = e.target.closest('.scout-card');
    if (!card) return;
    var img = card.querySelector('img');
    openLightbox(img.src, img.alt);
  });
  document.querySelectorAll('.spec img, .style-media img, .product-shot img').forEach(function (img) {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', function () { openLightbox(img.src, img.alt); });
  });
  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });

  /* ---------- Animation auto-detect ----------
     Drop <scout>.mp4 files into assets/anim/ and they appear automatically. */
  document.querySelectorAll('.anim-card').forEach(function (card) {
    var scout = card.getAttribute('data-scout');
    var src = 'assets/anim/' + scout + '.mp4';
    var probe = document.createElement('video');
    probe.muted = true;
    probe.preload = 'metadata';
    probe.addEventListener('loadeddata', function () {
      probe.setAttribute('autoplay', '');
      probe.setAttribute('loop', '');
      probe.setAttribute('playsinline', '');
      card.classList.add('has-video');
      card.appendChild(probe);
      probe.play().catch(function () {});
    });
    probe.src = src;
  });

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Nav: shadow + scroll-spy ---------- */
  var nav = document.getElementById('nav');
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 8);
    var pos = window.scrollY + 120;
    var current = sections[0];
    sections.forEach(function (s) { if (s.offsetTop <= pos) current = s; });
    links.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current.id);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
