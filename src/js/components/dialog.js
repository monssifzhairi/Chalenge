import { prefersReducedMotion } from '../lib/gsap.js';
import { lockScroll, unlockScroll } from '../lib/scroll.js';

/**
 * Animated wrapper around a native <dialog>:
 * modal focus trapping comes from showModal(); this adds GSAP enter/leave
 * timelines, scroll locking, backdrop clicks, Escape and focus restoration.
 *
 * @param {HTMLDialogElement} dialog
 * @param {{
 *   enter?: (dialog: HTMLDialogElement) => gsap.core.Timeline,
 *   leave?: (dialog: HTMLDialogElement) => gsap.core.Timeline,
 *   onOpen?: () => void,
 *   onClose?: () => void,
 *   initialFocus?: () => HTMLElement | null,
 * }} options
 */
export function createDialog(dialog, { enter, leave, onOpen, onClose, initialFocus } = {}) {
  if (!dialog) return null;

  let opener = null;
  let closing = false;
  let timeline = null;
  const triggers = () => document.querySelectorAll(`[aria-controls="${dialog.id}"]`);

  function open(trigger) {
    if (dialog.open) return;
    opener = trigger instanceof HTMLElement ? trigger : document.activeElement;
    dialog.showModal();
    lockScroll();
    triggers().forEach((t) => t.setAttribute('aria-expanded', 'true'));
    timeline?.kill();
    timeline = !prefersReducedMotion() && enter ? enter(dialog) : null;
    onOpen?.();
    const target = initialFocus?.();
    if (target) target.focus({ preventScroll: true });
  }

  function close() {
    if (!dialog.open || closing) return;
    closing = true;
    timeline?.kill();
    if (!prefersReducedMotion() && leave) {
      timeline = leave(dialog);
      timeline.eventCallback('onComplete', () => dialog.close());
    } else {
      dialog.close();
    }
  }

  // Runs for every close path, including the browser's own (e.g. repeated Escape).
  dialog.addEventListener('close', () => {
    closing = false;
    timeline?.kill();
    timeline = null;
    unlockScroll();
    triggers().forEach((t) => t.setAttribute('aria-expanded', 'false'));
    onClose?.();
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  });

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });

  // Clicks on the dimmed area (the dialog element itself) close it.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });

  return {
    el: dialog,
    open,
    close,
    toggle: (trigger) => (dialog.open ? close() : open(trigger)),
    get isOpen() {
      return dialog.open;
    },
  };
}
