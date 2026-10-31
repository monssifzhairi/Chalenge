/**
 * Maison Tiziri — store configuration
 * ---------------------------------------------------------------
 * Single source of truth for contact details and commerce rules.
 * Values are injected into the HTML at build time ({{key}} tokens,
 * see vite.config.js) and imported by the JavaScript at runtime.
 *
 * ▸ Before going live, replace `whatsapp` / `phoneDisplay` with the
 *   client's WhatsApp Business number (international format, digits
 *   only for `whatsapp`).
 */
export default {
  name: 'Maison Tiziri',
  tagline: 'Moroccan couture, embroidered by hand in Fès since 2009.',

  // Contact
  whatsapp: '212600000000',
  phoneDisplay: '+212 6 00 00 00 00',
  email: 'concierge@maisontiziri.ma',

  // Commerce (amounts in Moroccan dirham)
  currency: 'MAD',
  freeShippingThreshold: 1500,
  shippingFee: 45,

  // Build-time values
  year: new Date().getFullYear(),
};
