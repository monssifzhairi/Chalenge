import site from '../../../site.config.js';

/** Build a wa.me deep link with an optional pre-filled message. */
export const waLink = (message = '') =>
  `https://wa.me/${site.whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

/** Upgrade every <a data-wa="message"> with its pre-filled message. */
export function enhanceWaLinks(root = document) {
  root.querySelectorAll('a[data-wa]').forEach((link) => {
    link.href = waLink(link.dataset.wa);
  });
}
