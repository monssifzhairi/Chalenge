import { $, $$, isDesktop } from '../lib/dom.js';
import { gsap, prefersReducedMotion } from '../lib/gsap.js';

/* Rotating announcement bar */
function initAnnouncements() {
  const items = $$('.announce__item');
  if (items.length < 2) return;
  let index = 0;
  const reduced = prefersReducedMotion();

  setInterval(() => {
    if (document.hidden) return;
    const current = items[index];
    index = (index + 1) % items.length;
    const next = items[index];
    if (reduced) {
      current.classList.remove('is-active');
      next.classList.add('is-active');
      return;
    }
    gsap
      .timeline()
      .to(current, { autoAlpha: 0, yPercent: -60, duration: 0.5, ease: 'power2.in' })
      .add(() => {
        current.classList.remove('is-active');
        next.classList.add('is-active');
      })
      .fromTo(next, { autoAlpha: 0, yPercent: 60 }, { autoAlpha: 1, yPercent: 0, duration: 0.7, ease: 'expo.out' });
  }, 5000);
}

/* Solid / hidden states while scrolling */
function initScrollStates(header) {
  const root = document.documentElement;
  const hero = $('[data-hero]');
  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const headerHeight = header.offsetHeight;
    const solidAfter = hero ? hero.offsetTop + hero.offsetHeight - headerHeight : 8;
    header.classList.toggle('is-scrolled', y > solidAfter);

    const delta = y - lastY;
    const menuOpen = header.classList.contains('is-mega-open');
    if (!menuOpen && Math.abs(delta) > 4) {
      const hide = delta > 0 && y > headerHeight * 3;
      header.classList.toggle('is-hidden', hide);
      root.classList.toggle('header-hidden', hide);
    }
    if (y <= headerHeight) {
      header.classList.remove('is-hidden');
      root.classList.remove('header-hidden');
    }
    lastY = y;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();

  // Reveal the header whenever keyboard focus moves into it.
  header.addEventListener('focusin', () => {
    header.classList.remove('is-hidden');
    root.classList.remove('header-hidden');
  });
}

/* Mega menu: hover intent on desktop, explicit toggle button for keyboards */
function initMegaMenu(header) {
  const root = $('[data-mega-root]', header);
  const panel = $('[data-mega]', header);
  const toggle = $('[data-mega-toggle]', header);
  if (!root || !panel || !toggle) return;

  let openTimer;
  let closeTimer;
  let tween;

  const open = () => {
    if (!panel.hidden) return;
    clearTimeout(closeTimer);
    panel.hidden = false;
    header.classList.add('is-mega-open');
    header.classList.remove('is-hidden');
    toggle.setAttribute('aria-expanded', 'true');
    tween?.kill();
    if (!prefersReducedMotion()) {
      tween = gsap
        .timeline()
        .fromTo(panel, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'expo.out' })
        .fromTo(
          $$('.mega__col li, .mega__title, .mega__feature', panel),
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.025 },
          0.1,
        );
    }
  };

  const close = () => {
    if (panel.hidden) return;
    toggle.setAttribute('aria-expanded', 'false');
    tween?.kill();
    const finish = () => {
      panel.hidden = true;
      header.classList.remove('is-mega-open');
    };
    if (prefersReducedMotion()) return finish();
    tween = gsap.to(panel, { clipPath: 'inset(0 0 100% 0)', duration: 0.45, ease: 'power3.in', onComplete: finish });
  };

  const scheduleOpen = () => {
    if (!isDesktop()) return;
    clearTimeout(closeTimer);
    openTimer = setTimeout(open, 90);
  };
  const scheduleClose = () => {
    clearTimeout(openTimer);
    closeTimer = setTimeout(close, 220);
  };

  root.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && scheduleOpen());
  root.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && scheduleClose());
  panel.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  panel.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && scheduleClose());

  toggle.addEventListener('click', () => {
    if (panel.hidden) {
      open();
      requestAnimationFrame(() => $('a', panel)?.focus());
    } else close();
  });

  header.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      close();
      toggle.focus();
    }
  });
  header.addEventListener('focusout', (e) => {
    if (!panel.hidden && !root.contains(e.relatedTarget) && !panel.contains(e.relatedTarget)) close();
  });
  window.addEventListener('resize', () => !isDesktop() && close());
}

export function initHeader() {
  const header = $('[data-header]');
  if (!header) return;
  initAnnouncements();
  initScrollStates(header);
  initMegaMenu(header);
}
