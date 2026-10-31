import { Flip } from 'gsap/Flip';
import { initCommon } from '../main.js';
import { categories } from '../data/products.js';
import { $, $$ } from '../lib/dom.js';
import { gsap, prefersReducedMotion } from '../lib/gsap.js';
import { showCards } from '../components/animations.js';

gsap.registerPlugin(Flip);
initCommon();

const grid = $('[data-shop-grid]');
const cards = $$('[data-card]', grid);
const chips = $$('[data-filter]');
const sortSelect = $('[data-sort]');
const densityButtons = $$('.density__btn'); // the grid also carries data-density (for CSS)
const count = $('[data-shop-count]');
const empty = $('[data-shop-empty]');
const title = $('[data-shop-title]');
const intro = $('[data-shop-intro]');
const crumb = $('[data-shop-crumb]');

const SORTS = ['featured', 'price-asc', 'price-desc'];
const IMAGE_SIZES = {
  4: '(min-width: 768px) 32vw, 50vw',
  2: '(min-width: 768px) 48vw, 100vw',
};

const params = new URLSearchParams(window.location.search);
const state = {
  category: categories.some((c) => c.id === params.get('category')) ? params.get('category') : 'all',
  sort: SORTS.includes(params.get('sort')) ? params.get('sort') : 'featured',
  density: '4',
};

function syncUrl() {
  const url = new URL(window.location.href);
  if (state.category === 'all') url.searchParams.delete('category');
  else url.searchParams.set('category', state.category);
  if (state.sort === 'featured') url.searchParams.delete('sort');
  else url.searchParams.set('sort', state.sort);
  history.replaceState(null, '', url);
}

/** Women / Men filters light up their own item in the main navigation. */
function syncNavigation() {
  const current = ['women', 'men'].includes(state.category) ? state.category : 'shop';
  $$('.nav [data-nav]').forEach((link) => {
    if (link.dataset.nav === current) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function updateCopy(animate) {
  const category = categories.find((c) => c.id === state.category);
  const changed = title.textContent !== category.title;
  title.textContent = category.title;
  intro.textContent = category.intro;
  crumb.textContent = category.title;
  document.title = `${category.title} — Maison Tiziri`;
  if (animate && changed) {
    gsap.fromTo([title, intro], { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'expo.out' });
  }
}

function apply({ animate = true } = {}) {
  const useFlip = animate && !prefersReducedMotion();
  if (useFlip) showCards(cards);
  const before = useFlip ? Flip.getState(cards) : null;

  let visible = 0;
  cards.forEach((card) => {
    const match = state.category === 'all' || card.dataset.tags.split(' ').includes(state.category);
    card.classList.toggle('is-filtered', !match);
    if (match) visible += 1;
  });

  [...cards]
    .sort((a, b) => {
      if (state.sort === 'price-asc') return a.dataset.price - b.dataset.price;
      if (state.sort === 'price-desc') return b.dataset.price - a.dataset.price;
      return a.dataset.order - b.dataset.order;
    })
    .forEach((card) => grid.appendChild(card));

  grid.dataset.density = state.density;
  $$('.card__img', grid).forEach((img) => (img.sizes = IMAGE_SIZES[state.density]));

  chips.forEach((chip) => {
    const active = chip.dataset.filter === state.category;
    chip.classList.toggle('is-active', active);
    chip.setAttribute('aria-pressed', String(active));
  });
  densityButtons.forEach((btn) => {
    const active = btn.dataset.density === state.density;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  sortSelect.value = state.sort;
  count.textContent = `${visible} ${visible === 1 ? 'piece' : 'pieces'}`;
  empty.hidden = visible > 0;

  updateCopy(animate);
  syncNavigation();
  syncUrl();

  if (before) {
    Flip.from(before, {
      duration: 0.8,
      ease: 'power3.inOut',
      absolute: true,
      stagger: 0.02,
      onEnter: (els) =>
        gsap.fromTo(els, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.6, delay: 0.25 }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.94, duration: 0.4 }),
    });
  }
}

chips.forEach((chip) =>
  chip.addEventListener('click', () => {
    if (state.category === chip.dataset.filter) return;
    state.category = chip.dataset.filter;
    apply();
  }),
);
sortSelect.addEventListener('change', () => {
  state.sort = sortSelect.value;
  apply();
});
densityButtons.forEach((btn) =>
  btn.addEventListener('click', () => {
    if (state.density === btn.dataset.density) return;
    state.density = btn.dataset.density;
    apply();
  }),
);
$('[data-filter-reset]')?.addEventListener('click', () => {
  state.category = 'all';
  apply();
});

apply({ animate: false });

// Keep the active chip in view on small screens.
const activeChip = $('.filters .is-active');
if (activeChip) activeChip.parentElement.scrollLeft = activeChip.offsetLeft - 24;

if (!prefersReducedMotion()) {
  gsap.from([title, intro, '.breadcrumb'], { autoAlpha: 0, y: 24, duration: 1.1, stagger: 0.08, ease: 'expo.out', delay: 0.1 });
}
