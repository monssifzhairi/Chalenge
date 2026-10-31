/**
 * Shared bootstrap for every page:
 * smooth scrolling, header, overlays, bag, cards and scroll animations.
 * Page modules import `initCommon()` and add their own behaviour.
 */
import { initSmoothScroll } from './lib/scroll.js';
import { enhanceWaLinks } from './lib/whatsapp.js';
import { initHeader } from './components/header.js';
import { initBag } from './components/bag.js';
import { hydrateCards, initQuickAdd } from './components/cards.js';
import { initMobileMenu, initSearch, initWhatsAppWidget } from './components/overlays.js';
import { initAnimations } from './components/animations.js';
import { initAccordions, initCursor, initMagnetic } from './components/interactions.js';
import { initNewsletter } from './components/forms.js';

export function initCommon({ animations = true } = {}) {
  initSmoothScroll();
  enhanceWaLinks();
  initHeader();
  initBag();
  initMobileMenu();
  initSearch();
  initWhatsAppWidget();
  initQuickAdd();
  hydrateCards();
  initAccordions();
  initNewsletter();
  initCursor();
  initMagnetic();
  if (animations) initAnimations();
}
