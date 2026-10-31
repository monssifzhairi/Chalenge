import { $$, isFinePointer, revealOnLoad } from '../lib/dom.js';
import { bag, showToast } from './bag.js';

/** Load the close-up image only when a mouse user first hovers a card. */
function loadDetail(card) {
  const alt = card.querySelector('.card__img--alt[data-src]');
  if (!alt) return;
  alt.srcset = alt.dataset.srcset;
  alt.src = alt.dataset.src;
  alt.removeAttribute('data-src');
  revealOnLoad(alt);
}

/** Hydrate cards inside `root` (safe to call again for newly rendered cards). */
export function hydrateCards(root = document) {
  $$('.card__img:not(.card__img--alt)', root).forEach(revealOnLoad);
  $$('.mini img, .bag-item__media img', root).forEach(revealOnLoad);
  if (!isFinePointer()) return;
  $$('[data-card]', root).forEach((card) => {
    if (card.dataset.hydrated) return;
    card.dataset.hydrated = 'true';
    card.addEventListener('pointerenter', () => loadDetail(card), { once: true });
  });
}

function closeQuickPanels(except) {
  $$('[data-quick].is-open').forEach((quick) => {
    if (quick === except) return;
    quick.classList.remove('is-open');
    quick.querySelector('[data-quick-toggle]')?.setAttribute('aria-expanded', 'false');
  });
}

/** Quick add — one delegated listener for every card on the page. */
export function initQuickAdd() {
  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-quick-toggle]');
    if (toggle) {
      const quick = toggle.closest('[data-quick]');
      const open = !quick.classList.contains('is-open');
      closeQuickPanels(quick);
      quick.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      return;
    }

    const sizeButton = event.target.closest('.card__size');
    if (sizeButton && !sizeButton.disabled) {
      const card = sizeButton.closest('[data-card]');
      if (bag.add(card.dataset.id, sizeButton.dataset.size)) {
        sizeButton.classList.add('is-added');
        setTimeout(() => sizeButton.classList.remove('is-added'), 1400);
        showToast(card.dataset.id, sizeButton.dataset.size);
        if (!isFinePointer()) closeQuickPanels();
      }
      return;
    }

    if (!event.target.closest('[data-quick]')) closeQuickPanels();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeQuickPanels();
  });
}
