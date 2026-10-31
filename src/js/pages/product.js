import site from '../../../site.config.js';
import { initCommon } from '../main.js';
import { categories, getProduct, products } from '../data/products.js';
import { sizeCharts, sizeTable } from '../data/sizes.js';
import { productCard, productImage } from '../templates/card.js';
import { escapeHtml, formatPrice } from '../lib/format.js';
import { $, $$, isDesktop, isFinePointer, revealOnLoad } from '../lib/dom.js';
import { gsap, prefersReducedMotion } from '../lib/gsap.js';
import { scrollToElement } from '../lib/scroll.js';
import { waLink } from '../lib/whatsapp.js';
import { bag, openBag } from '../components/bag.js';
import { createDialog } from '../components/dialog.js';
import { setWhatsAppContext } from '../components/overlays.js';

const product = getProduct(new URLSearchParams(window.location.search).get('id'));
const reduced = prefersReducedMotion();

function setMeta(name, content, attribute = 'name') {
  let tag = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

const primaryCategory = (p) =>
  categories.find((c) => c.id === (p.tags.includes('babouches') ? 'babouches' : p.tags[0]));

/* --------------------------------------------------------------------------
   Render
   -------------------------------------------------------------------------- */
function renderProduct(p) {
  const img = productImage(p.id);
  const category = primaryCategory(p);
  const soldOut = new Set(p.soldOut);
  const lowStock = new Set(p.lowStock);

  document.title = `${p.name} — ${p.colour} — Maison Tiziri`;
  setMeta('description', `${p.summary} ${formatPrice(p.price)} — made by hand in Fès, delivered across Morocco.`);
  setMeta('og:title', `${p.name} — Maison Tiziri`, 'property');
  setMeta('og:description', p.summary, 'property');

  const crumbCategory = $('[data-pdp-crumb-cat]');
  crumbCategory.textContent = category.title;
  crumbCategory.href = `shop.html?category=${category.id}`;
  $('[data-pdp-crumb-name]').textContent = p.name;

  // Gallery
  const main = $('[data-pdp-main]');
  main.sizes = '(min-width: 1024px) 55vw, 100vw';
  main.srcset = img.srcset;
  main.src = img.src;
  main.alt = p.alt;
  const detail = $('[data-pdp-detail]');
  detail.sizes = '(min-width: 1024px) 55vw, 100vw';
  detail.srcset = img.detailSrcset;
  detail.src = img.detailSrc;
  detail.alt = p.detailAlt;
  $$('.pdp__shot').forEach((shot) => shot.style.setProperty('--ph', `url(${img.placeholder})`));
  [main, detail].forEach(revealOnLoad);

  // Information
  $('[data-pdp-eyebrow]').textContent = `${p.type} · Made by hand in Fès`;
  $('[data-pdp-name]').textContent = p.name;
  $('[data-pdp-price]').textContent = formatPrice(p.price);
  $('[data-pdp-summary]').textContent = p.summary;
  if (p.madeToOrder) {
    const mto = $('[data-pdp-mto]');
    $('span', mto).textContent = p.madeToOrder;
    mto.hidden = false;
  }
  $('[data-pdp-colour]').textContent = p.colour;
  $('[data-pdp-swatch]').style.setProperty('--swatch', p.swatch);

  $('[data-pdp-sizes]').innerHTML = p.sizes
    .map((size) => {
      const out = soldOut.has(size);
      const low = lowStock.has(size);
      const note = out ? 'sold out' : low ? 'only a few left' : '';
      return `<label class="size-option${low ? ' is-low' : ''}">
        <input type="radio" name="size" value="${size}"${out ? ' disabled' : ''}>
        <span aria-hidden="true">${size}</span>
        <span class="sr-only">Size ${size}${note ? `, ${note}` : ''}</span>
      </label>`;
    })
    .join('');

  $('[data-pdp-description]').textContent = p.description;
  $('[data-pdp-details]').innerHTML = p.details.map((d) => `<li>${escapeHtml(d)}</li>`).join('');
  $('[data-pdp-hours]').textContent = `Around ${p.hours} hours of handwork go into each piece.`;
  $('[data-pdp-composition]').textContent = p.composition;
  $('[data-pdp-care]').textContent = p.care;
  $('[data-pdp-shipping]').textContent =
    p.price >= site.freeShippingThreshold
      ? 'complimentary'
      : `${formatPrice(site.shippingFee)}, complimentary from ${formatPrice(site.freeShippingThreshold)}`;

  $('[data-pdp-bar-name]').textContent = p.name;
  $('[data-pdp-bar-price]').textContent = formatPrice(p.price);

  // Related pieces: same department first
  const related = [
    ...products.filter((x) => x.id !== p.id && x.tags.includes(category.id)),
    ...products.filter((x) => x.id !== p.id && !x.tags.includes(category.id)),
  ].slice(0, 4);
  $('[data-related-grid]').innerHTML = related
    .map((x, index) => productCard(x, { sizes: '(min-width: 1024px) 24vw, 50vw', index }))
    .join('');

  // Structured data for search engines
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    sku: p.id,
    color: p.colour,
    material: p.composition,
    image: [new URL(img.src, window.location.href).href, new URL(img.detailSrc, window.location.href).href],
    brand: { '@type': 'Brand', name: site.name },
    offers: {
      '@type': 'Offer',
      url: window.location.href,
      priceCurrency: 'MAD',
      price: p.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: p.madeToOrder ? 'https://schema.org/MadeToOrder' : 'https://schema.org/InStock',
    },
  });
  document.head.appendChild(ld);

  $('[data-pdp]').setAttribute('aria-busy', 'false');
}

function renderMissing() {
  document.title = 'Piece not found — Maison Tiziri';
  setMeta('robots', 'noindex');
  $('[data-pdp]').hidden = true;
  $('[data-related]').hidden = true;
  $('[data-pdp-bar]').hidden = true;
  $('[data-pdp-missing]').hidden = false;
  $('[data-pdp-crumb-name]').textContent = 'Piece not found';
}

/* --------------------------------------------------------------------------
   Behaviour
   -------------------------------------------------------------------------- */
function initPurchase(p) {
  const field = $('[data-pdp-size-field]');
  const stock = $('[data-pdp-stock]');
  const addButton = $('[data-add-to-bag]');
  const addLabel = $('span', addButton);
  const waButton = $('[data-pdp-wa]');
  const selectedSize = () => $('input[name="size"]:checked', field)?.value;

  const updateWhatsApp = () => {
    const size = selectedSize();
    const message = size
      ? `Hello Maison Tiziri, I would like to order the ${p.name} (${p.colour}) in size ${size} — ${formatPrice(p.price)}.\n${window.location.href}`
      : `Hello Maison Tiziri, I would like to order the ${p.name} (${p.colour}) — ${formatPrice(p.price)}. Could you help me choose my size?\n${window.location.href}`;
    waButton.href = waLink(message);
  };

  field.addEventListener('change', () => {
    const size = selectedSize();
    field.classList.remove('has-error');
    stock.className = 'pdp__stock';
    if (p.lowStock.includes(size)) {
      stock.textContent = `Only a few pieces left in size ${size}.`;
      stock.classList.add('is-low');
    } else if (p.madeToOrder) {
      stock.textContent = `Made to order in size ${size} — ready in 3 weeks.`;
    } else {
      stock.textContent = `In stock in size ${size} — leaves our atelier within 24 hours.`;
    }
    updateWhatsApp();
  });
  updateWhatsApp();

  const requireSize = () => {
    field.classList.add('has-error');
    stock.className = 'pdp__stock is-error';
    stock.textContent = 'Please choose your size.';
    if (!reduced) gsap.fromTo('.size-options', { x: -10 }, { x: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
    $('input[name="size"]:not(:disabled)', field)?.focus({ preventScroll: true });
  };

  let labelTimer;
  const add = (trigger) => {
    const size = selectedSize();
    if (!size) {
      if (trigger !== addButton) scrollToElement(field);
      requireSize();
      return;
    }
    bag.add(p.id, size);
    addLabel.textContent = 'Added to your bag';
    clearTimeout(labelTimer);
    labelTimer = setTimeout(() => (addLabel.textContent = 'Add to bag'), 2400);
    openBag(trigger);
  };

  addButton.addEventListener('click', () => add(addButton));
  $('[data-pdp-bar-add]').addEventListener('click', (e) => add(e.currentTarget));
}

function initGallery() {
  const track = $('[data-gallery-track]');
  const dots = $$('[data-gallery-dots] span');
  track.addEventListener(
    'scroll',
    () => {
      const index = Math.round(track.scrollLeft / track.clientWidth);
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    },
    { passive: true },
  );

  // Hover zoom on desktop: the image follows the pointer at 2×.
  const shot = $('[data-zoom]');
  if (!isFinePointer()) return;
  let frame;
  shot.addEventListener('pointerenter', () => isDesktop() && shot.classList.add('is-zooming'));
  shot.addEventListener('pointerleave', () => shot.classList.remove('is-zooming'));
  shot.addEventListener('pointermove', (e) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const rect = shot.getBoundingClientRect();
      const img = $('img', shot);
      img.style.setProperty('--zx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
      img.style.setProperty('--zy', `${((e.clientY - rect.top) / rect.height) * 100}%`);
    });
  });
}

function initSizeGuide(p) {
  const dialog = $('[data-size-guide]');
  const panel = $('.modal__panel', dialog);
  const chart = sizeCharts[p.sizeChart];
  const table = $('[data-size-guide-table]', dialog);
  const buttons = $$('[data-unit]', dialog);
  let unit = 'cm';

  $('[data-size-guide-subtitle]', dialog).textContent = chart.title;
  $('[data-size-guide-note]', dialog).textContent = chart.note;
  const render = () => (table.innerHTML = sizeTable(p.sizeChart, unit));
  render();

  buttons.forEach((btn) =>
    btn.addEventListener('click', () => {
      unit = btn.dataset.unit;
      buttons.forEach((b) => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      render();
    }),
  );

  const guide = createDialog(dialog, {
    enter: () =>
      gsap
        .timeline()
        .fromTo(dialog, { backgroundColor: 'rgba(18,23,34,0)' }, { backgroundColor: 'rgba(18,23,34,0.42)', duration: 0.4 }, 0)
        .fromTo(
          panel,
          isDesktop() ? { autoAlpha: 0, y: 40 } : { yPercent: 100 },
          isDesktop() ? { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' } : { yPercent: 0, duration: 0.7, ease: 'expo.out' },
          0,
        ),
    leave: () =>
      gsap
        .timeline()
        .to(panel, isDesktop() ? { autoAlpha: 0, y: 30, duration: 0.35 } : { yPercent: 100, duration: 0.45, ease: 'power3.in' }, 0)
        .to(dialog, { backgroundColor: 'rgba(18,23,34,0)', duration: 0.35 }, 0.05),
    initialFocus: () => $('[data-size-guide-close]', dialog),
  });

  $('[data-size-guide-open]').addEventListener('click', (e) => guide.open(e.currentTarget));
  $('[data-size-guide-close]', dialog).addEventListener('click', () => guide.close());
}

/** Compact purchase bar on phones once the main button has scrolled away. */
function initStickyBar() {
  const bar = $('[data-pdp-bar]');
  const actions = $('.pdp__actions');
  const footer = $('.footer');
  const root = document.documentElement;
  let visible = null;
  let ticking = false;

  const setVisible = (show) => {
    if (show === visible) return;
    visible = show;
    bar.classList.toggle('is-visible', show);
    bar.inert = !show;
    root.classList.toggle('has-pdp-bar', show);
  };

  // A scroll check (rather than IntersectionObserver) also catches fast flings and jumps.
  const update = () => {
    ticking = false;
    const pastActions = actions.getBoundingClientRect().bottom < 0;
    const footerInView = footer && footer.getBoundingClientRect().top < window.innerHeight;
    setVisible(!isDesktop() && pastActions && !footerInView);
  };
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  root.style.setProperty('--pdp-bar-h', `${bar.offsetHeight}px`);
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();
}

function animateIn() {
  if (reduced) return;
  gsap.from('.pdp__panel > *', { autoAlpha: 0, y: 26, duration: 1.1, stagger: 0.05, ease: 'expo.out', delay: 0.1 });
  gsap.from('.pdp__shot', { autoAlpha: 0, y: 40, duration: 1.3, stagger: 0.12, ease: 'expo.out' });
}

/* --------------------------------------------------------------------------
   Boot — render first so shared modules can hydrate the new markup
   -------------------------------------------------------------------------- */
if (product) renderProduct(product);
else renderMissing();

initCommon();

if (product) {
  initPurchase(product);
  initGallery();
  initSizeGuide(product);
  initStickyBar();
  setWhatsAppContext({
    label: `Ask about ${product.name}`,
    message: `Hello Maison Tiziri, I have a question about the ${product.name} (${formatPrice(product.price)}).\n${window.location.href}`,
  });
  animateIn();
}
