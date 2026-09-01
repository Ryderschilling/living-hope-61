/* Living Hope, built by Ryder Schilling */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE_MS = 1150;

  /* ---------------------------------------------------------
     Header state
     --------------------------------------------------------- */
  var header = document.querySelector('.site-header');
  var onScroll = function () {
    if (!header) return;
    var down = window.scrollY > 24;
    header.classList.toggle('is-scrolled', down);
    // The tall bar is an enhancement: only at the very top, never while the
    // mobile drawer is open, and never on a page that forces the solid bar.
    header.classList.toggle(
      'site-header--top',
      !down && !header.classList.contains('nav-open') &&
      !header.classList.contains('site-header--solid')
    );
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     Mobile nav disclosure
     --------------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');
  var mq = window.matchMedia('(max-width: 1150px)');

  /* Split each label into letters once, so the menu can write itself in.
     The anchor carries aria-label and the wrapper is aria-hidden, or a
     screen reader spells the word out one letter at a time. */
  function splitLabels() {
    if (!nav) return;
    nav.querySelectorAll('a:not([data-split])').forEach(function (a, li) {
      var text = a.textContent.trim();
      a.setAttribute('data-split', '');
      a.setAttribute('aria-label', text);
      var wrap = document.createElement('span');
      wrap.className = 'nav-word';
      wrap.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < text.length; i++) {
        var sp = document.createElement('span');
        sp.className = 'ltr';
        sp.textContent = text[i];
        /* the row's own offset plus a per-letter step. The inline delay
           applies in BOTH directions, so closing reverses the wave free. */
        sp.style.setProperty('--ld', (li * 55 + i * 26) + 'ms');
        wrap.appendChild(sp);
      }
      a.textContent = '';
      a.appendChild(wrap);
    });
  }

  /* The circle has to reach the farthest corner from the burger.
     hypot(max(x, vw-x), max(y, vh-y)) is that distance, but innerWidth/
     innerHeight can come back un-zoomed, which leaves a dark wedge in the
     far corner. The 1.14 + 24 margin is what makes that impossible. */
  function menuGeometry() {
    var r = toggle.getBoundingClientRect();
    var x = r.left + r.width / 2;
    var y = r.top + r.height / 2;
    var vw = Math.max(window.innerWidth, document.documentElement.clientWidth);
    var vh = Math.max(window.innerHeight, document.documentElement.clientHeight);
    var far = Math.hypot(Math.max(x, vw - x), Math.max(y, vh - y));
    nav.style.setProperty('--mx', x + 'px');
    nav.style.setProperty('--my', y + 'px');
    nav.style.setProperty('--mr', Math.ceil(far * 1.14 + 24) + 'px');
  }

  var scrollLock = 0;
  function setNav(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', String(open));
    if (mq.matches) {
      nav.hidden = false;
      if (open) { splitLabels(); menuGeometry(); }
      nav.classList.toggle('is-open', open);
      if (open) {
        scrollLock = window.scrollY;
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    } else {
      nav.hidden = false;
      nav.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    if (header) header.classList.toggle('nav-open', open && mq.matches);
    onScroll();   // the menu must never open against the tall bar
  }
  function syncNav() {
    if (!toggle || !nav) return;
    nav.hidden = false;
    if (!mq.matches) {
      nav.classList.remove('is-open');
      document.body.style.overflow = '';
      toggle.setAttribute('aria-expanded', 'false');
      if (header) header.classList.remove('nav-open');
    } else {
      setNav(toggle.getAttribute('aria-expanded') === 'true');
    }
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mq.matches && toggle.getAttribute('aria-expanded') === 'true') {
        setNav(false); toggle.focus();
      }
    });
    /* the circle's origin is a pixel position, so it goes stale on resize
       and on an orientation flip while the menu is open */
    window.addEventListener('resize', function () {
      if (mq.matches && nav.classList.contains('is-open')) menuGeometry();
    });
    mq.addEventListener('change', syncNav);
    syncNav();
    /* arm the transition only after the closed state has painted once */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { nav.classList.add('nav-ready'); });
    });
    setTimeout(function () { nav.classList.add('nav-ready'); }, 600);
  }

  /* ---------------------------------------------------------
     Quick exit
     --------------------------------------------------------- */
  document.querySelectorAll('.quick-exit').forEach(function (btn) {
    btn.addEventListener('click', function () {
      try { window.open('https://www.accuweather.com', '_blank'); } catch (e) { /* popup blocked */ }
      window.location.replace('https://www.google.com/search?q=weather');
    });
  });

  /* ---------------------------------------------------------
     Smooth image loading.
     Mark each photo pending, then fade it in over its blur-up
     placeholder once the file has actually DECODED, not merely
     loaded. Frames also get img-ready, which is what releases the
     curtain wipe: wiping open over an undecoded image is what made
     the load read as a pop.

     Every path is belt and braces. If decode() rejects, if the file
     404s, or if anything throws, the same reveal runs on a timer, so
     an image can never be left invisible.
     --------------------------------------------------------- */
  function readyImages(root) {
    var imgs = (root || document).querySelectorAll('img:not([data-img-managed])');
    Array.prototype.forEach.call(imgs, function (img) {
      var frame = img.closest('.figure-frame, .hero__media, .band-media');
      var done = false;
      function reveal() {
        if (done) return;
        done = true;
        img.classList.remove('img-pending');
        if (frame) frame.classList.add('img-ready');
      }
      function whenDecoded() {
        if (img.decode) {
          img.decode().then(reveal).catch(reveal);
        } else {
          reveal();
        }
      }
      img.addEventListener('load', whenDecoded);
      img.addEventListener('error', reveal);
      // Never strand a photo, whatever the network does. Long on purpose:
      // a short timer fires mid-download and shows a half-painted file,
      // which is uglier than waiting. Normal loads finish far inside this.
      setTimeout(reveal, 10000);
      img.setAttribute('data-img-managed', '');

      if (img.complete && img.naturalWidth > 0) {
        whenDecoded();               // already cached
      } else if (!REDUCED && frame) {
        img.classList.add('img-pending');   // hide only what we are watching
      }
    });
  }
  readyImages();
  window.addEventListener('load', function () { readyImages(); });

  /* ---------------------------------------------------------
     Reveal system.
     Hand-placed [data-reveal] still works; everything else in a
     section is auto-tagged so new pages inherit the motion.
     Skip rules: sticky elements, anything inside a scroller, and
     anything already tagged.
     --------------------------------------------------------- */
  function isSticky(el) {
    return getComputedStyle(el).position === 'sticky';
  }

  function tagReveals(root) {
    if (REDUCED) return;
    (root || document).querySelectorAll('main > section').forEach(function (section) {
      if (section.classList.contains('hero')) return;
      var wrap = section.querySelector(':scope > .container') || section;
      var kids = Array.prototype.slice.call(wrap.children);
      // seq cascades the top-level blocks of a section instead of fading
      // them in together. A stagger group resets it, so a grid keeps its
      // own rhythm and whatever follows starts clean.
      var seq = 0;
      kids.forEach(function (kid) {
        if (kid.hasAttribute('data-rv-done')) return;
        kid.setAttribute('data-rv-done', '');
        if (isSticky(kid)) return;

        var grandkids = Array.prototype.slice.call(kid.children).filter(function (g) {
          return g.nodeType === 1 && !isSticky(g);
        });
        // A row of 2 to 8 siblings becomes a staggered group.
        if (grandkids.length >= 2 && grandkids.length <= 8 &&
            (kid.classList.contains('grid-2') || kid.classList.contains('grid-3') ||
             kid.classList.contains('split') || kid.classList.contains('allies-grid') ||
             kid.classList.contains('video-grid'))) {
          grandkids.forEach(function (g, i) {
            // build.py hand-places data-reveal on some cards. Returning early
            // on those meant they NEVER got a stagger delay, so those grids
            // arrived as one block. Tag and delay are now independent.
            if (!g.hasAttribute('data-reveal')) g.setAttribute('data-reveal', '');
            if (!g.style.getPropertyValue('--rv-delay')) {
              g.style.setProperty('--rv-delay', (i * 0.14).toFixed(3) + 's');
            }
          });
          seq = 0;
          return;
        }
        if (!kid.hasAttribute('data-reveal')) {
          kid.setAttribute('data-reveal', '');
          // Capped so a long section still finishes arriving quickly.
          kid.style.setProperty('--rv-delay', (Math.min(seq, 4) * 0.085).toFixed(3) + 's');
          seq++;
        }
      });
    });
  }
  /* A revealed block that opens with an eyebrow cascades its own parts
     instead of arriving as one slab. Delays are indexed off the markup
     order, so the gold rule draws, then the heading, body and CTA follow.
     The hidden state lives only under [data-rv-cascade], and .is-in is
     guaranteed by the 2.5s sweep, so nothing can strand. */
  function tagCascades(root) {
    if (REDUCED) return;
    (root || document).querySelectorAll('[data-reveal]:not([data-rv-casc-done])').forEach(function (el) {
      el.setAttribute('data-rv-casc-done', '');
      if (!el.querySelector(':scope > .eyebrow')) return;
      var kids = Array.prototype.slice.call(el.children).filter(function (k) {
        return k.nodeType === 1 && !isSticky(k);
      });
      if (kids.length < 2 || kids.length > 10) return;
      // Tag with transitions muted for one frame. Without this the children
      // are already painted at opacity 1, so applying the hidden state
      // TRANSITIONS them out and the block visibly fades away before the
      // observer fades it back in.
      el.classList.add('rv-nt');
      el.setAttribute('data-rv-cascade', '');
      kids.forEach(function (k, i) {
        k.style.setProperty('--c-delay', (0.06 + i * 0.085).toFixed(3) + 's');
      });
      void el.offsetWidth;
      requestAnimationFrame(function () { el.classList.remove('rv-nt'); });
    });
  }

  window.lhTagReveals = tagReveals;

  var io;
  function observeReveals() {
    var targets = document.querySelectorAll('[data-reveal]:not([data-rv-watched]), .leaf-divider:not([data-rv-watched])');
    if (!targets.length) return;
    if (!io) {
      if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('[data-reveal], .leaf-divider').forEach(function (el) { el.classList.add('is-in'); });
        return;
      }
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    }
    targets.forEach(function (el) { el.setAttribute('data-rv-watched', ''); io.observe(el); });
  }

  tagReveals();
  tagCascades();
  observeReveals();
  window.addEventListener('load', function () { tagReveals(); tagCascades(); observeReveals(); });
  setTimeout(function () { tagReveals(); tagCascades(); observeReveals(); readyImages(); }, 700);

  /* Backstop: nothing may stay invisible. A background tab gets no
     intersections at all, so force anything near the viewport in. */
  function sweep() {
    document.querySelectorAll('[data-reveal]:not(.is-in), .leaf-divider:not(.is-in)').forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 1.2) el.classList.add('is-in');
    });
    // A frame whose image never reported back must not hold its wipe shut.
    document.querySelectorAll('.figure-frame:not(.img-ready), .hero__media:not(.img-ready)').forEach(function (el) {
      el.classList.add('img-ready');
      el.querySelectorAll('img').forEach(function (i) { i.classList.remove('img-pending'); });
    });
  }
  setTimeout(sweep, 2500);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) setTimeout(sweep, 300);
  });

  /* ---------------------------------------------------------
     Parallax: the scripture band photo drifts against the scroll.
     Transform only, gated on motion preference and pointer size.
     --------------------------------------------------------- */
  if (!REDUCED) {
    var layers = Array.prototype.slice.call(document.querySelectorAll('.band-media img'));
    if (layers.length) {
      var ticking = false;
      var run = function () {
        ticking = false;
        var vh = window.innerHeight;
        layers.forEach(function (img) {
          var band = img.closest('.band-dark');
          if (!band) return;
          var r = band.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) return;
          // -1 (band below fold) to 1 (band above fold)
          var p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
          img.style.transform = 'translate3d(0,' + (p * 7).toFixed(2) + '%,0) scale(1.14)';
        });
      };
      var queue = function () {
        if (!ticking) { ticking = true; requestAnimationFrame(run); }
      };
      window.addEventListener('scroll', queue, { passive: true });
      window.addEventListener('resize', queue);
      run();
    }
  }

  /* ---------------------------------------------------------
     Year
     --------------------------------------------------------- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------------------------------------------------------
     Mail-composed forms. No backend, nothing stored.
     --------------------------------------------------------- */
  document.querySelectorAll('form[data-mailform]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var subject = form.getAttribute('data-subject') || 'Website message';
      var lines = [];
      form.querySelectorAll('input, select, textarea').forEach(function (field) {
        if (!field.name || field.type === 'submit') return;
        if ((field.type === 'checkbox' || field.type === 'radio') && !field.checked) return;
        var labelEl = field.closest('label') || form.querySelector('label[for="' + field.id + '"]');
        var label = labelEl ? labelEl.textContent.trim() : field.name;
        if (field.value) lines.push(label + ': ' + field.value);
      });
      var mailto = 'mailto:Livinghopeinc61@gmail.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(lines.join('\n'));
      var status = form.querySelector('.form-status');
      if (status) status.textContent = 'Your email app is opening with your message ready to send. If nothing opens, email us at Livinghopeinc61@gmail.com.';
      window.location.href = mailto;
    });
  });
})();

/* ---------- Dialogs ----------
   Native <dialog> so focus trapping, Esc and inertness come from the
   browser. The opener is remembered so focus lands back on it, and the
   body is locked so the page behind cannot scroll on iOS.
   The teardown watches the open ATTRIBUTE rather than the close event:
   some engines never dispatch close, which left the body scroll-locked
   after Esc. The attribute is the one signal that is always true. */
(function () {
  var dialogs = document.querySelectorAll('dialog.lh-dialog');
  if (!dialogs.length) return;
  var opener = null;

  function release() {
    document.body.style.overflow = '';
    if (opener) { opener.focus(); opener = null; }
  }

  document.querySelectorAll('[data-open-dialog]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var dlg = document.getElementById(btn.getAttribute('data-open-dialog'));
      if (!dlg || typeof dlg.showModal !== 'function') return;
      opener = btn;
      document.body.style.overflow = 'hidden';
      dlg.showModal();
      var first = dlg.querySelector('input, select, textarea');
      if (first) first.focus();
    });
  });

  dialogs.forEach(function (dlg) {
    dlg.querySelectorAll('[data-close-dialog]').forEach(function (btn) {
      btn.addEventListener('click', function () { dlg.close(); });
    });
    /* Clicking the backdrop closes: the panel fills the dialog box, so a
       click that lands on the dialog itself landed outside the panel. */
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) dlg.close();
    });
    dlg.addEventListener('close', release);
    dlg.addEventListener('cancel', release);
    if (window.MutationObserver) {
      new MutationObserver(function () {
        if (!dlg.hasAttribute('open')) release();
      }).observe(dlg, { attributes: true, attributeFilter: ['open'] });
    }
  });
})();

/* ---------- Footer: dawn + wordmark ----------
   One observer, one class, fires once. The clip-path lives on the
   wordmark, never on the observed element, so the footer's own
   intersection rect stays intact. JS adds .is-armed, so a no-JS or
   reduced-motion reader gets the finished footer with no transitions. */
(function () {
  var f = document.querySelector('.site-footer');
  if (!f) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  f.classList.add('is-armed');
  var lit = false;
  function light() { if (!lit) { lit = true; f.classList.add('is-lit'); } }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { light(); io.disconnect(); }
    });
  }, { threshold: 0.01, rootMargin: '0px 0px -10% 0px' });
  io.observe(f);

  /* backstop, in case the observer never fires */
  setTimeout(light, 2500);
})();
