import { products } from '../data/products.js';
import { productMini } from '../templates/card.js';
import { escapeHtml } from '../lib/format.js';
import { waLink } from '../lib/whatsapp.js';
import { $, $$, isDesktop } from '../lib/dom.js';
import { gsap } from '../lib/gsap.js';
import { createDialog } from './dialog.js';
import { hydrateCards } from './cards.js';

/* --------------------------------------------------------------------------
   Mobile menu
   -------------------------------------------------------------------------- */
export function initMobileMenu() {
  const dialog = $('[data-menu]');
  if (!dialog) return;
  const panel = $('.menu__panel', dialog);

  const menu = createDialog(dialog, {
    enter: () =>
      gsap
        .timeline()
        .fromTo(panel, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'expo.inOut' })
        .fromTo(
          $$('.menu__list li', dialog),
          { autoAlpha: 0, y: 40 },
          { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out' },
          0.35,
        )
        .fromTo(
          $$('.menu__secondary, .menu__foot', dialog),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.6, stagger: 0.1 },
          0.6,
        ),
    leave: () =>
      gsap.timeline().to(panel, { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'expo.inOut' }),
    initialFocus: () => $('[data-menu-close]', dialog),
  });

  $$('[data-menu-open]').forEach((btn) => btn.addEventListener('click', () => menu.open(btn)));
  $('[data-menu-close]', dialog).addEventListener('click', () => menu.close());
  window.addEventListener('resize', () => isDesktop() && menu.isOpen && menu.close());
}

/* --------------------------------------------------------------------------
   Search
   -------------------------------------------------------------------------- */
const SYNONYMS = {
  caftan: 'kaftan',
  qaftan: 'kaftan',
  takshita: 'takchita',
  tekchita: 'takchita',
  jellaba: 'djellaba',
  jelaba: 'djellaba',
  djelaba: 'djellaba',
  gandora: 'gandoura',
  jabadour: 'jabador',
  babouche: 'babouches',
  slippers: 'babouches',
  shoes: 'babouches',
  homme: 'men',
  man: 'men',
  femme: 'women',
  woman: 'women',
};

const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const searchIndex = products.map((p) => ({
  product: p,
  text: normalize([p.name, p.type, p.colour, p.tags.join(' '), p.summary, p.composition, p.details.join(' ')].join(' ')),
}));

export function searchProducts(query) {
  const terms = normalize(query)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((term) => SYNONYMS[term] || term);
  if (!terms.length) return [];
  const matchers = terms.map((term) => new RegExp(`\\b${term}`));
  return searchIndex.filter(({ text }) => matchers.every((re) => re.test(text))).map(({ product }) => product);
}

export function initSearch() {
  const dialog = $('[data-search]');
  if (!dialog) return;
  const panel = $('.search__panel', dialog);
  const input = $('[data-search-input]', dialog);
  const suggest = $('[data-search-suggest]', dialog);
  const results = $('[data-search-results]', dialog);
  const list = $('[data-search-list]', dialog);
  const count = $('[data-search-count]', dialog);

  const search = createDialog(dialog, {
    enter: () =>
      gsap
        .timeline()
        .fromTo(dialog, { backgroundColor: 'rgba(18,23,34,0)' }, { backgroundColor: 'rgba(18,23,34,0.42)', duration: 0.5 }, 0)
        .fromTo(panel, { yPercent: -100 }, { yPercent: 0, duration: 0.75, ease: 'expo.out' }, 0)
        .fromTo($('.search__body', dialog), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.25),
    leave: () =>
      gsap
        .timeline()
        .to(panel, { yPercent: -100, duration: 0.5, ease: 'power3.in' }, 0)
        .to(dialog, { backgroundColor: 'rgba(18,23,34,0)', duration: 0.4 }, 0.1),
    initialFocus: () => input,
    onClose: () => {
      input.value = '';
      render('');
    },
  });

  function render(query) {
    const q = query.trim();
    suggest.hidden = Boolean(q);
    results.hidden = !q;
    if (!q) return;
    const found = searchProducts(q);
    const safe = escapeHtml(q);
    if (found.length) {
      count.textContent = `${found.length} ${found.length === 1 ? 'piece' : 'pieces'} for “${q}”`;
      list.innerHTML = found.map((p) => productMini(p)).join('');
      hydrateCards(list);
    } else {
      count.innerHTML = `No pieces match “${safe}”. Try kaftan, djellaba or babouches — or <a href="${waLink(
        `Hello Maison Tiziri, I am looking for: ${q}`,
      )}" target="_blank" rel="noopener">ask a stylist on WhatsApp</a>.`;
      list.innerHTML = '';
    }
  }

  input.addEventListener('input', () => render(input.value));
  input.addEventListener('keydown', (event) => {
    // In a search field Escape would only clear the text — close the overlay instead.
    if (event.key === 'Escape') {
      event.preventDefault();
      search.close();
      return;
    }
    if (event.key === 'Enter') {
      const first = $('a.mini', list);
      if (first && !results.hidden) window.location.href = first.href;
    }
  });
  $$('[data-term]', dialog).forEach((btn) =>
    btn.addEventListener('click', () => {
      input.value = btn.dataset.term;
      render(input.value);
      input.focus();
    }),
  );
  $$('[data-search-open]').forEach((btn) => btn.addEventListener('click', () => search.open(btn)));
  $('[data-search-close]', dialog).addEventListener('click', () => search.close());

  // "/" opens search from anywhere (except while typing in a field).
  document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.target.closest('input, textarea, select, [contenteditable]')) return;
    if (document.querySelector('dialog[open]')) return;
    event.preventDefault();
    search.open();
  });
}

/* --------------------------------------------------------------------------
   WhatsApp concierge widget
   -------------------------------------------------------------------------- */
let setWidgetContext = () => {};

/** Lets a page (e.g. a product) add a contextual quick reply. */
export const setWhatsAppContext = (context) => setWidgetContext(context);

export function initWhatsAppWidget() {
  const widget = $('[data-wa-widget]');
  if (!widget) return;
  const panel = $('[data-wa-panel]', widget);
  const toggle = $('[data-wa-toggle]', widget);
  let tween;

  const open = () => {
    panel.hidden = false;
    widget.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    tween?.kill();
    tween = gsap.fromTo(
      panel,
      { autoAlpha: 0, scale: 0.92, y: 12 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)' },
    );
    $('a', panel)?.focus({ preventScroll: true });
  };
  const close = ({ restoreFocus = false } = {}) => {
    if (panel.hidden) return;
    widget.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    tween?.kill();
    tween = gsap.to(panel, {
      autoAlpha: 0,
      scale: 0.95,
      y: 8,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => (panel.hidden = true),
    });
    if (restoreFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => (panel.hidden ? open() : close()));
  $('[data-wa-close]', widget).addEventListener('click', () => close({ restoreFocus: true }));
  document.addEventListener('click', (e) => !widget.contains(e.target) && close());
  widget.addEventListener('keydown', (e) => e.key === 'Escape' && close({ restoreFocus: true }));

  setWidgetContext = ({ label, message }) => {
    const chips = $('[data-wa-chips]', widget);
    const link = document.createElement('a');
    link.href = waLink(message);
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = label;
    chips.prepend(link);
    $('[data-wa-start]', widget).href = waLink(message);
  };
}
