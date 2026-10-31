import { $, $$, isFinePointer } from '../lib/dom.js';
import { gsap, prefersReducedMotion } from '../lib/gsap.js';

/** A soft "View" label that follows the pointer over product imagery. */
export function initCursor() {
  const cursor = $('[data-cursor-el]');
  const label = $('[data-cursor-label]');
  if (!cursor || !isFinePointer() || prefersReducedMotion()) return;

  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.5, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.5, ease: 'power3' });
  let active = false;

  const setActive = (text) => {
    if (text) label.textContent = text;
    if (Boolean(text) === active) return;
    active = Boolean(text);
    gsap.to(cursor, { autoAlpha: active ? 1 : 0, scale: active ? 1 : 0.2, duration: 0.45, ease: 'expo.out', overwrite: 'auto' });
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    },
    { passive: true },
  );
  document.addEventListener('pointerover', (e) => {
    const zone = e.target.closest('[data-cursor]');
    const blocked = e.target.closest('[data-quick], button, .card__badge');
    setActive(zone && !blocked ? zone.dataset.cursor : null);
  });
  document.documentElement.addEventListener('pointerleave', () => setActive(null));
  window.addEventListener('scroll', () => active && setActive(null), { passive: true });
}

/** Buttons that lean towards the pointer. */
export function initMagnetic() {
  if (!isFinePointer() || prefersReducedMotion()) return;
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.45)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.45)' });
    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      xTo((e.clientX - (rect.left + rect.width / 2)) * 0.25);
      yTo((e.clientY - (rect.top + rect.height / 2)) * 0.35);
    });
    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

/** Native <details> accordions with smooth height animation. */
export function initAccordions(root = document) {
  $$('[data-accordion] details', root).forEach((details) => {
    const summary = $('summary', details);
    const content = $('.accordion__content', details);
    if (!summary || !content || details.dataset.enhanced) return;
    details.dataset.enhanced = 'true';

    summary.addEventListener('click', (event) => {
      if (prefersReducedMotion()) return;
      event.preventDefault();
      gsap.killTweensOf(content);

      if (details.open && !details.classList.contains('is-closing')) {
        details.classList.add('is-closing');
        gsap.to(content, {
          height: 0,
          paddingBottom: 0,
          opacity: 0,
          overflow: 'hidden',
          duration: 0.45,
          ease: 'power3.inOut',
          onComplete: () => {
            details.open = false;
            details.classList.remove('is-closing');
            gsap.set(content, { clearProps: 'all' });
          },
        });
      } else {
        details.classList.remove('is-closing');
        gsap.set(content, { clearProps: 'all' });
        details.open = true;
        const paddingBottom = getComputedStyle(content).paddingBottom;
        gsap.fromTo(
          content,
          { height: 0, paddingBottom: 0, opacity: 0, overflow: 'hidden' },
          {
            height: 'auto',
            paddingBottom,
            opacity: 1,
            duration: 0.6,
            ease: 'power3.out',
            onComplete: () => gsap.set(content, { clearProps: 'all' }),
          },
        );
      }
    });
  });
}
