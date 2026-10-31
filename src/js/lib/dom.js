export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
export const isFinePointer = () => finePointerQuery.matches;

export const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

/** Mark images as loaded (fades them in over their blurred placeholder). */
export function revealOnLoad(img) {
  if (!img) return;
  const done = () => img.classList.add('is-loaded');
  if (img.complete && img.naturalWidth) done();
  else {
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  }
}
