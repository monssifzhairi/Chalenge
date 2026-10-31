const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** 6900 → "6,900 MAD" (non-breaking space keeps the currency attached). */
export const formatPrice = (amount) => `${number.format(amount)}\u00A0MAD`;

/** Escape text for safe interpolation into HTML strings. */
export const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
