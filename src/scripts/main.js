// Nyan portfolio — all client interactivity.
import Lenis from 'lenis';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ------------------------------------------------- Smooth momentum scrolling */
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ duration: 1.05, smoothWheel: true });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  // smooth anchor jumps
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id); }
    });
  });
}

/* ------------------------------------------------------- Scroll progress bar */
(() => {
  const bar = document.querySelector('.scroll-progress span');
  if (!bar || reduceMotion) return;
  let ticking = false;
  const update = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();

/* --------------------------------------------------- Custom cursor (desktop) */
(() => {
  if (!finePointer || reduceMotion) return;
  const cur = document.querySelector('[data-cursor]');
  if (!cur) return;
  document.documentElement.classList.add('has-cursor');
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  const loop = () => {
    cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
    cur.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(loop);
  };
  loop();
  document.querySelectorAll('[data-card]').forEach((el) => {
    el.addEventListener('mouseenter', () => cur.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => cur.classList.remove('is-hover'));
  });
  document.querySelectorAll('a, .chip, .btn, [data-lb-close]').forEach((el) => {
    el.addEventListener('mouseenter', () => cur.classList.add('is-link'));
    el.addEventListener('mouseleave', () => cur.classList.remove('is-link'));
  });
})();

/* ---------------------------------------------------------------- Nav state */
(() => {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ------------------------------------------------------------ Scroll reveal */
(() => {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
  );
  els.forEach((el) => io.observe(el));
})();

/* -------------------------------------------------------------- Hero player */
(() => {
  const video = document.querySelector('[data-hero-video]');
  if (!video || reduceMotion) return; // reduced-motion → poster stays
  const source = video.querySelector('source[data-src]');
  let loaded = false;
  const load = () => {
    if (loaded || !source) return;
    loaded = true;
    source.src = source.dataset.src;
    video.load();
    video.play().catch(() => {});
  };
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) load();
      else if (loaded) video.pause();
      if (e.isIntersecting && loaded) video.play().catch(() => {});
    }),
    { threshold: 0.15 }
  );
  io.observe(video);

  /* Scroll-driven hero: media parallax + content scales & fades away */
  const media = document.querySelector('[data-parallax]');
  const inner = document.querySelector('.hero__inner');
  if (media) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const vh = window.innerHeight;
        const y = Math.min(window.scrollY, vh);
        const p = y / vh; // 0..1 through the first screen
        media.style.transform = `translate3d(0, ${y * 0.18}px, 0) scale(${1.08 + p * 0.06})`;
        if (inner) {
          inner.style.transform = `translateY(${y * 0.16}px) scale(${1 - p * 0.06})`;
          inner.style.opacity = `${Math.max(0, 1 - p * 1.25)}`;
        }
        ticking = false;
      });
    }, { passive: true });
  }
})();

/* ------------------------------------------- Scroll-to-play inline previews ----
   Each card's clip autoplays muted + inline when it scrolls into view — this is
   what mobile browsers allow, so no more frozen thumbnails. Only the most-visible
   few play at once (capped), and they pause when they leave the viewport. */
(() => {
  const cards = [...document.querySelectorAll('[data-card]:not([data-sibling])')];
  if (!cards.length || !('IntersectionObserver' in window) || reduceMotion) return;

  // Full-res 1080p previews — cap concurrent playback so decode stays smooth.
  const MAX_PLAYING = finePointer ? 6 : 3;
  const playing = new Set();
  const ratios = new Map();
  let keep = new Set();
  let hovered = null;

  const vid = (card) => card.querySelector('.card__preview');
  const start = (card) => {
    const video = vid(card); if (!video) return;
    if (!video.src) video.src = video.dataset.previewSrc;
    video.play().then(() => card.classList.add('is-previewing')).catch(() => {});
    playing.add(card);
  };
  const stop = (card) => {
    const video = vid(card); if (!video) return;
    card.classList.remove('is-previewing');
    video.pause();
    playing.delete(card);
  };

  const apply = () => {
    keep = new Set(
      [...ratios.entries()]
        .filter(([, r]) => r >= 0.4)
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_PLAYING)
        .map(([c]) => c)
    );
    for (const card of cards) {
      if (keep.has(card)) { if (!playing.has(card)) start(card); }
      else if (playing.has(card) && card !== hovered) stop(card);
    }
  };

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) ratios.set(e.target, e.isIntersecting ? e.intersectionRatio : 0);
    apply();
  }, { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] });
  cards.forEach((c) => io.observe(c));

  // Desktop: hovering any card plays it immediately (even if off the play-list).
  if (finePointer) {
    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => { hovered = card; start(card); });
      card.addEventListener('mouseleave', () => { hovered = null; if (!keep.has(card)) stop(card); });
    });
  }
})();

/* ----------------------------------------------------------------- Filtering */
(() => {
  const chips = document.querySelectorAll('[data-filter]');
  const cards = document.querySelectorAll('[data-card]:not([data-sibling])');
  const empty = document.querySelector('[data-empty]');
  if (!chips.length) return;
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.filter;
      chips.forEach((c) => {
        const on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', String(on));
      });
      let shown = 0;
      cards.forEach((card) => {
        const match = key === 'all' || card.dataset.category === key;
        card.hidden = !match;
        if (match) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    });
  });
})();

/* ------------------------------------------------------------------ Lightbox */
(() => {
  const lb = document.querySelector('[data-lightbox]');
  if (!lb) return;
  const dialog = lb.querySelector('.lb__dialog');
  const stage = lb.querySelector('[data-lb-stage]');
  const elTitle = lb.querySelector('[data-lb-title]');
  const elMeta = lb.querySelector('[data-lb-meta]');
  const elBlurb = lb.querySelector('[data-lb-blurb]');
  const elSeries = lb.querySelector('[data-lb-series]');
  const btnPrev = lb.querySelector('[data-lb-prev]');
  const btnNext = lb.querySelector('[data-lb-next]');
  let lastFocused = null;
  let series = [];      // cards in the current same-shoot group
  let seriesIndex = 0;

  const buildMedia = (d) => {
    const portrait = Number(d.h) > Number(d.w);
    stage.classList.toggle('is-portrait', portrait);
    stage.style.setProperty('--lb-aspect', `${d.w} / ${d.h}`);
    const yt = d.youtube && d.youtube.trim();
    const vm = d.vimeo && d.vimeo.trim();
    if (yt) {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      f.allow = 'autoplay; fullscreen; picture-in-picture';
      f.allowFullscreen = true;
      f.title = d.title;
      return f;
    }
    if (vm) {
      const f = document.createElement('iframe');
      f.src = `https://player.vimeo.com/video/${vm}?autoplay=1&title=0&byline=0&portrait=0`;
      f.allow = 'autoplay; fullscreen; picture-in-picture';
      f.allowFullscreen = true;
      f.title = d.title;
      return f;
    }
    if (d.host === 'local') {
      // Self-hosted optimized MP4 (Pages or CDN). The poster shows instantly so
      // there's never a black frame while the full clip buffers; muted autoplay +
      // playsinline so it starts on mobile; user taps to unmute.
      const v = document.createElement('video');
      v.src = d.src;
      if (d.poster) v.poster = d.poster;
      v.controls = true; v.autoplay = true; v.playsInline = true;
      v.muted = true; v.preload = 'auto'; v.setAttribute('controlslist', 'nodownload');
      return v;
    }
    // No embed id yet and not self-hosted (long-form piece pending upload):
    // show the poster with a tasteful note instead of a broken player.
    const ph = document.createElement('div');
    ph.className = 'lb__placeholder';
    ph.style.backgroundImage = `url("${d.poster}")`;
    ph.innerHTML = '<span class="lb__phnote">Full film available on request</span>';
    return ph;
  };

  // Load a single card's media + caption into the open lightbox.
  const loadCard = (card) => {
    const d = card.dataset;
    const media = buildMedia(d);
    stage.replaceChildren(media);
    if (media.tagName === 'VIDEO' && media.muted) {
      const unmute = document.createElement('button');
      unmute.className = 'lb__unmute';
      unmute.type = 'button';
      unmute.textContent = '🔇  Tap for sound';
      unmute.addEventListener('click', () => { media.muted = false; media.play().catch(() => {}); unmute.remove(); });
      media.addEventListener('volumechange', () => { if (!media.muted) unmute.remove(); }, { once: true });
      stage.appendChild(unmute);
    }
    elTitle.textContent = d.title || '';
    elMeta.textContent = [d.meta, d.role].filter(Boolean).join('  ·  ');
    elBlurb.textContent = d.blurb || '';
    // series counter
    if (series.length > 1) {
      elSeries.textContent = `${seriesIndex + 1} / ${series.length} in this series`;
      elSeries.hidden = false;
      btnPrev.hidden = btnNext.hidden = false;
    } else {
      elSeries.hidden = true;
      btnPrev.hidden = btnNext.hidden = true;
    }
  };

  const navigate = (dir) => {
    if (series.length < 2) return;
    seriesIndex = (seriesIndex + dir + series.length) % series.length;
    loadCard(series[seriesIndex]);
  };

  const open = (card) => {
    lastFocused = card;
    // Build the same-shoot series (group), in DOM order; hero + its siblings.
    const g = card.dataset.group;
    series = g ? [...document.querySelectorAll(`[data-card][data-group="${g}"]`)] : [card];
    seriesIndex = Math.max(0, series.indexOf(card));
    loadCard(card);
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    requestAnimationFrame(() => lb.classList.add('is-open'));
    dialog.focus();
  };

  const close = () => {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
    const finish = () => { lb.hidden = true; stage.replaceChildren(); };
    if (reduceMotion) finish();
    else setTimeout(finish, 300);
    if (lastFocused) lastFocused.focus();
  };

  document.querySelectorAll('[data-card]').forEach((c) =>
    c.addEventListener('click', () => open(c))
  );
  lb.querySelectorAll('[data-lb-close]').forEach((b) => b.addEventListener('click', close));
  btnPrev.addEventListener('click', () => navigate(-1));
  btnNext.addEventListener('click', () => navigate(1));
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
    if (e.key === 'Tab') {
      // simple focus trap within the dialog
      const f = lb.querySelectorAll('button, [href], video, iframe, [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
