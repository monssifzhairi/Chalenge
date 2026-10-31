import site from '../../../site.config.js';
import { getProduct } from '../data/products.js';
import { productImage, productUrl } from '../templates/card.js';
import { escapeHtml, formatPrice } from '../lib/format.js';
import { icon } from '../lib/icons.js';
import { KEYS, storage } from '../lib/storage.js';
import { waLink } from '../lib/whatsapp.js';
import { $, $$ } from '../lib/dom.js';
import { gsap, prefersReducedMotion } from '../lib/gsap.js';
import { createDialog } from './dialog.js';

const MAX_QTY = 5;

/* --------------------------------------------------------------------------
   Store — persisted in localStorage, synced across tabs
   -------------------------------------------------------------------------- */
const listeners = new Set();

function sanitize(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => {
      const product = item && getProduct(item.id);
      return product && product.sizes.includes(String(item.size)) && Number.isInteger(item.qty) && item.qty > 0;
    })
    .map((item) => ({ id: item.id, size: String(item.size), qty: Math.min(item.qty, MAX_QTY) }));
}

let items = sanitize(storage.get(KEYS.bag, []));

const find = (id, size) => items.find((item) => item.id === id && item.size === size);
const emit = () => listeners.forEach((fn) => fn());
const commit = () => {
  storage.set(KEYS.bag, items);
  emit();
};

export const bag = {
  get items() {
    return items;
  },
  count: () => items.reduce((total, item) => total + item.qty, 0),
  subtotal: () => items.reduce((total, item) => total + getProduct(item.id).price * item.qty, 0),
  delivery() {
    const subtotal = this.subtotal();
    return subtotal === 0 || subtotal >= site.freeShippingThreshold ? 0 : site.shippingFee;
  },
  add(id, size, qty = 1) {
    const product = getProduct(id);
    if (!product || !product.sizes.includes(size) || product.soldOut.includes(size)) return false;
    const existing = find(id, size);
    if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + qty);
    else items.push({ id, size, qty: Math.min(MAX_QTY, qty) });
    commit();
    return true;
  },
  setQty(id, size, qty) {
    const item = find(id, size);
    if (!item) return;
    if (qty <= 0) items = items.filter((i) => i !== item);
    else item.qty = Math.min(MAX_QTY, qty);
    commit();
  },
  remove(id, size) {
    items = items.filter((item) => !(item.id === id && item.size === size));
    commit();
  },
  clear() {
    items = [];
    commit();
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

window.addEventListener('storage', (event) => {
  if (event.key !== KEYS.bag) return;
  items = sanitize(storage.get(KEYS.bag, []));
  emit();
});

/* --------------------------------------------------------------------------
   WhatsApp order message
   -------------------------------------------------------------------------- */
function orderMessage() {
  const subtotal = bag.subtotal();
  const delivery = bag.delivery();
  const lines = items.map((item, index) => {
    const p = getProduct(item.id);
    return `${index + 1}. ${p.name} (${p.colour}) — size ${item.size} × ${item.qty} — ${formatPrice(p.price * item.qty)}`;
  });
  return [
    'Hello Maison Tiziri, I would like to place an order:',
    '',
    ...lines,
    '',
    `Subtotal: ${formatPrice(subtotal)}`,
    `Delivery in Morocco: ${delivery === 0 ? 'complimentary' : formatPrice(delivery)}`,
    `Total: ${formatPrice(subtotal + delivery)}`,
    '',
    'Payment: on delivery',
    'Full name:',
    'City and delivery address:',
  ].join('\n');
}

/* --------------------------------------------------------------------------
   Drawer UI
   -------------------------------------------------------------------------- */
function itemTemplate(item) {
  const p = getProduct(item.id);
  const img = productImage(p.id);
  const name = escapeHtml(p.name);
  return `<li class="bag-item" data-id="${p.id}" data-size="${item.size}">
    <a class="bag-item__media" href="${productUrl(p.id)}" style="--ph:url(${img.placeholder})" tabindex="-1" aria-hidden="true">
      <img src="${img.thumb}" width="480" height="600" alt="" loading="lazy" decoding="async">
    </a>
    <div class="bag-item__info">
      <div class="bag-item__top">
        <a class="bag-item__name" href="${productUrl(p.id)}">${name}</a>
        <span class="bag-item__price">${formatPrice(p.price * item.qty)}</span>
      </div>
      <p class="bag-item__meta">${escapeHtml(p.colour)} · Size ${item.size}${item.qty > 1 ? ` · ${formatPrice(p.price)} each` : ''}</p>
      <div class="bag-item__bottom">
        <div class="qty" role="group" aria-label="Quantity of ${name}, size ${item.size}">
          <button type="button" data-qty="-1" aria-label="${item.qty === 1 ? 'Remove' : 'Decrease quantity'}">${icon('minus', { size: 14 })}</button>
          <output aria-live="polite">${item.qty}</output>
          <button type="button" data-qty="1" aria-label="Increase quantity"${item.qty >= MAX_QTY ? ' disabled' : ''}>${icon('plus', { size: 14 })}</button>
        </div>
        <button type="button" class="bag-item__remove" data-remove>Remove</button>
      </div>
    </div>
  </li>`;
}

function renderCounts() {
  const count = bag.count();
  $$('[data-bag-count]').forEach((el) => {
    el.textContent = count;
    el.classList.toggle('has-items', count > 0);
  });
  $$('[data-bag-label]').forEach((el) => {
    el.textContent = `Open shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`;
  });
  $$('[data-bag-heading-count]').forEach((el) => {
    el.textContent = count ? `(${count})` : '';
  });
}

function renderDrawer() {
  const list = $('[data-bag-list]');
  if (!list) return;
  const empty = $('[data-bag-empty]');
  const foot = $('[data-bag-foot]');
  const subtotal = bag.subtotal();
  const delivery = bag.delivery();
  const hasItems = items.length > 0;

  list.innerHTML = items.map(itemTemplate).join('');
  empty.hidden = hasItems;
  foot.hidden = !hasItems;

  $('[data-bag-subtotal]').textContent = formatPrice(subtotal);
  $('[data-bag-delivery]').textContent = delivery === 0 ? 'Complimentary' : formatPrice(delivery);
  $('[data-bag-total]').textContent = formatPrice(subtotal + delivery);
  $('[data-bag-checkout]').href = waLink(orderMessage());

  const remaining = site.freeShippingThreshold - subtotal;
  const text = $('[data-bag-shipping-text]');
  if (!hasItems) text.textContent = `Complimentary delivery across Morocco from ${formatPrice(site.freeShippingThreshold)}.`;
  else if (remaining > 0) text.innerHTML = `You are <strong>${formatPrice(remaining)}</strong> away from complimentary delivery.`;
  else text.textContent = 'Your order qualifies for complimentary delivery in Morocco.';
  $('[data-bag-progress]').style.transform = `scaleX(${Math.min(1, subtotal / site.freeShippingThreshold)})`;
}

let bagDialog = null;
export const openBag = (trigger) => bagDialog?.open(trigger);

/* --------------------------------------------------------------------------
   Toast
   -------------------------------------------------------------------------- */
let toastTimer = null;
let toastTween = null;

export function showToast(productId, size) {
  const toast = $('[data-toast]');
  const p = getProduct(productId);
  if (!toast || !p) return;
  const img = productImage(p.id);
  $('[data-toast-media]', toast).innerHTML = `<img src="${img.thumb}" width="480" height="600" alt="">`;
  $('[data-toast-text]', toast).textContent = `${p.name} — size ${size}`;

  clearTimeout(toastTimer);
  toastTween?.kill();
  toast.hidden = false;
  if (!prefersReducedMotion()) {
    toastTween = gsap.fromTo(toast, { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' });
  }
  const hide = () => {
    toastTween?.kill();
    toastTween = gsap.to(toast, {
      autoAlpha: 0,
      y: -10,
      duration: prefersReducedMotion() ? 0 : 0.4,
      ease: 'power2.in',
      onComplete: () => (toast.hidden = true),
    });
  };
  const schedule = () => (toastTimer = setTimeout(hide, 4200));
  toast.onmouseenter = () => clearTimeout(toastTimer);
  toast.onmouseleave = schedule;
  toast.onfocusin = () => clearTimeout(toastTimer);
  schedule();
}

function bumpBagIcon() {
  if (prefersReducedMotion()) return;
  $$('.bag-btn').forEach((btn) =>
    gsap.fromTo(btn, { scale: 1 }, { scale: 1.18, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' }),
  );
}

/* --------------------------------------------------------------------------
   Init
   -------------------------------------------------------------------------- */
export function initBag() {
  const dialog = $('[data-bag]');
  if (!dialog) return;
  const panel = $('.drawer__panel', dialog);

  bagDialog = createDialog(dialog, {
    enter: () =>
      gsap
        .timeline()
        .fromTo(dialog, { backgroundColor: 'rgba(18,23,34,0)' }, { backgroundColor: 'rgba(18,23,34,0.42)', duration: 0.5 }, 0)
        .fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.8, ease: 'expo.out' }, 0)
        .fromTo(
          $$('.bag-item, .bag-empty, .drawer__foot', dialog),
          { autoAlpha: 0, x: 24 },
          { autoAlpha: 1, x: 0, duration: 0.6, stagger: 0.06, clearProps: 'transform' },
          0.18,
        ),
    leave: () =>
      gsap
        .timeline()
        .to(panel, { xPercent: 100, duration: 0.5, ease: 'power3.in' }, 0)
        .to(dialog, { backgroundColor: 'rgba(18,23,34,0)', duration: 0.4 }, 0.1),
    initialFocus: () => $('[data-bag-close]', dialog),
  });

  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-bag-open]');
    if (opener) {
      event.preventDefault();
      $('[data-toast]')?.setAttribute('hidden', '');
      bagDialog.open(opener);
    }
  });
  $('[data-bag-close]', dialog).addEventListener('click', () => bagDialog.close());

  // Quantity & removal (event delegation)
  $('[data-bag-list]', dialog).addEventListener('click', (event) => {
    const row = event.target.closest('.bag-item');
    if (!row) return;
    const { id, size } = row.dataset;
    const item = find(id, size);
    if (!item) return;

    const removeRow = () => {
      if (prefersReducedMotion()) return bag.remove(id, size);
      gsap.to(row, {
        autoAlpha: 0,
        height: 0,
        paddingBlock: 0,
        duration: 0.45,
        ease: 'power3.inOut',
        onComplete: () => bag.remove(id, size),
      });
    };

    if (event.target.closest('[data-remove]')) return removeRow();
    const step = event.target.closest('[data-qty]');
    if (step) {
      const next = item.qty + Number(step.dataset.qty);
      if (next <= 0) return removeRow();
      bag.setQty(id, size, next);
      $(`.bag-item[data-id="${id}"][data-size="${size}"] [data-qty="${step.dataset.qty}"]`, dialog)?.focus();
    }
  });

  let previousCount = bag.count();
  bag.subscribe(() => {
    renderCounts();
    renderDrawer();
    const count = bag.count();
    if (count > previousCount) bumpBagIcon();
    previousCount = count;
  });

  renderCounts();
  renderDrawer();
}
