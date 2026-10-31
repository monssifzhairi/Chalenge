import { icon } from '../lib/icons.js';
import { escapeHtml, formatPrice } from '../lib/format.js';
import { placeholders } from '../data/placeholders.js';

/*
 * All URLs are relative: every page lives at the site root, so the same
 * markup works in development, in production and under a sub-path
 * (e.g. GitHub Pages) without any base-path configuration.
 */
export const productUrl = (id) => `product.html?id=${encodeURIComponent(id)}`;

export function productImage(id) {
  const path = (suffix) => `images/products/${id}-${suffix}.webp`;
  return {
    src: path(800),
    srcset: `${path(480)} 480w, ${path(800)} 800w, ${path(1100)} 1100w`,
    thumb: path(480),
    detailSrc: path('detail-640'),
    detailSrcset: `${path('detail-480')} 480w, ${path('detail-640')} 640w`,
    placeholder: placeholders[id] || '',
  };
}

const SIZES = {
  grid: '(min-width: 768px) 32vw, 50vw',
  feature: '(min-width: 1024px) 46vw, 100vw',
  small: '(min-width: 1024px) 23vw, 50vw',
  row: '(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 72vw',
};

/**
 * Product card markup.
 * One real link per card (the title) stretched over the whole card;
 * the quick-add controls sit above it.
 */
export function productCard(p, { variant = '', sizes = 'grid', eager = false, index = 0 } = {}) {
  const img = productImage(p.id);
  const name = escapeHtml(p.name);
  const url = productUrl(p.id);
  const sizesAttr = SIZES[sizes] || sizes;
  const soldOut = new Set(p.soldOut || []);

  const sizeButtons = p.sizes
    .map((s) => {
      const out = soldOut.has(s);
      return `<button type="button" class="card__size" data-size="${s}"${out ? ' disabled' : ''} aria-label="${out ? `Size ${s}, sold out` : `Add size ${s} to bag`}">${s}</button>`;
    })
    .join('');

  return `<article class="card${variant ? ` card--${variant}` : ''}" data-card data-cursor="View" data-id="${p.id}" data-tags="${p.tags.join(' ')}" data-price="${p.price}" data-order="${index}">
  <div class="card__media" style="--ph:url(${img.placeholder})">
    <img class="card__img" src="${img.src}" srcset="${img.srcset}" sizes="${sizesAttr}" width="1100" height="1375" alt="${escapeHtml(p.alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">
    <img class="card__img card__img--alt" data-src="${img.detailSrc}" data-srcset="${img.detailSrcset}" sizes="${sizesAttr}" width="640" height="800" alt="" aria-hidden="true" decoding="async">
    ${p.badge ? `<span class="card__badge">${escapeHtml(p.badge)}</span>` : ''}
    <div class="card__quick" data-quick>
      <button type="button" class="card__quick-toggle" aria-expanded="false" aria-label="Quick add ${name}" data-quick-toggle>${icon('plus', { size: 18 })}</button>
      <div class="card__quick-panel" role="group" aria-label="Choose a size for ${name}">
        <p class="card__quick-title">Quick add <span>— select a size</span></p>
        <div class="card__sizes">${sizeButtons}</div>
      </div>
    </div>
  </div>
  <div class="card__body">
    <h3 class="card__name"><a class="card__link" href="${url}">${name}</a></h3>
    <p class="card__meta"><span class="card__swatch" style="--swatch:${p.swatch}" aria-hidden="true"></span>${escapeHtml(p.colour)}</p>
    <p class="card__price">${formatPrice(p.price)}</p>
  </div>
</article>`;
}

/** Compact horizontal product row used in search results and the bag. */
export function productMini(p) {
  const img = productImage(p.id);
  return `<a class="mini" href="${productUrl(p.id)}">
  <span class="mini__media" style="--ph:url(${img.placeholder})"><img src="${img.thumb}" width="480" height="600" alt="" loading="lazy" decoding="async"></span>
  <span class="mini__body">
    <span class="mini__name">${escapeHtml(p.name)}</span>
    <span class="mini__meta">${escapeHtml(p.colour)}</span>
  </span>
  <span class="mini__price">${formatPrice(p.price)}</span>
</a>`;
}
