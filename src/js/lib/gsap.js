import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.defaults({ ease: 'power3.out', duration: 0.8 });

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

export const prefersReducedMotion = () => reducedQuery.matches;

/** Resolves once web fonts are ready (or after a short timeout) so text can be split accurately. */
export const fontsReady = () =>
  Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((resolve) => setTimeout(resolve, 1500))]);

export { gsap, ScrollTrigger, SplitText };
