import Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReducedMotion } from './gsap.js';

let lenis = null;
let locks = 0;

const headerOffset = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) + 24;

/** Smooth scrolling synced with GSAP's ticker; disabled for reduced motion. */
export function initSmoothScroll() {
  if (prefersReducedMotion()) return null;

  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    anchors: { offset: -headerOffset() },
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export const getLenis = () => lenis;

/** Reference-counted scroll lock used by overlays. */
export function lockScroll() {
  locks += 1;
  lenis?.stop();
  document.documentElement.classList.add('is-locked');
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks) return;
  lenis?.start();
  document.documentElement.classList.remove('is-locked');
}

export function scrollToElement(el) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -headerOffset() });
  else el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
}
