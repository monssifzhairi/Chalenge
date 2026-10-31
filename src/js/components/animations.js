import { $, $$ } from '../lib/dom.js';
import { gsap, ScrollTrigger, SplitText, fontsReady } from '../lib/gsap.js';

/* Headings: lines rise from behind a mask */
function splitHeadings() {
  $$('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      tag: 'span',
      linesClass: 'split-line',
      autoSplit: true,
      onSplit(self) {
        gsap.set(el, { visibility: 'visible' });
        return gsap.from(self.lines, {
          yPercent: 115,
          duration: 1.25,
          ease: 'expo.out',
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      },
    });
  });
}

/* Generic fade-up reveals, batched so siblings stagger naturally */
function reveals() {
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%',
    once: true,
    onEnter: (elements) =>
      gsap.fromTo(
        elements,
        { autoAlpha: 0, y: 34 },
        { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out', overwrite: true },
      ),
  });
}

/* Product grids: cards rise in sequence */
function cardGrids() {
  $$('[data-card-grid]').forEach((grid) => {
    const cards = Array.from(grid.children).filter((c) => !c.dataset.revealed);
    if (!cards.length) return;
    ScrollTrigger.batch(cards, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => {
        const pending = batch.filter((c) => !c.dataset.revealed);
        pending.forEach((c) => (c.dataset.revealed = 'true'));
        gsap.fromTo(
          pending,
          { autoAlpha: 0, y: 60 },
          { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1, ease: 'power3.out', clearProps: 'transform' },
        );
      },
    });
  });
}

/** Reveal cards immediately (used before filtering, or for cards rendered later). */
export function showCards(cards, { animate = false } = {}) {
  const pending = cards.filter((c) => !c.dataset.revealed);
  pending.forEach((c) => (c.dataset.revealed = 'true'));
  if (!pending.length) return;
  if (animate) {
    gsap.fromTo(
      pending,
      { autoAlpha: 0, y: 40 },
      { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: 'power3.out', clearProps: 'transform' },
    );
  } else {
    gsap.set(pending, { autoAlpha: 1, y: 0, clearProps: 'transform' });
  }
}

/* Images unveil upwards inside their frame */
function mediaReveals() {
  $$('[data-media-reveal]').forEach((frame) => {
    const img = $('img', frame);
    const tl = gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 86%', once: true } });
    tl.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' });
    if (img && !img.hasAttribute('data-parallax')) {
      tl.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 2, ease: 'expo.out' }, 0.1);
    }
  });
}

/* Subtle parallax for editorial images (they are oversized in CSS) */
function parallax() {
  $$('[data-parallax]').forEach((img) => {
    gsap.fromTo(
      img,
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}

/* Numbers count up when they enter the viewport */
function counters() {
  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const value = { n: 0 };
    el.textContent = '0';
    gsap.to(value, {
      n: end,
      duration: 2.2,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: () => (el.textContent = Math.round(value.n)),
    });
  });
}

/* The oversized footer wordmark rises as the page ends */
function footerWordmark() {
  const word = $('[data-footer-wordmark]');
  if (!word) return;
  gsap.fromTo(
    word,
    { yPercent: 55 },
    {
      yPercent: 0,
      ease: 'none',
      scrollTrigger: { trigger: word.parentElement, start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
    },
  );
}

export function initAnimations() {
  const root = document.documentElement;
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    reveals();
    cardGrids();
    mediaReveals();
    parallax();
    counters();
    footerWordmark();
    fontsReady().then(() => {
      splitHeadings();
      ScrollTrigger.refresh();
    });
  });

  mm.add('(prefers-reduced-motion: reduce)', () => {
    gsap.set('[data-split]', { visibility: 'visible' });
    $$('[data-card-grid] > *').forEach((c) => (c.dataset.revealed = 'true'));
  });

  root.classList.add('gsap-ready');

  // Images and fonts change layout: keep trigger positions accurate.
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
