import { $, $$ } from '../lib/dom.js';
import { KEYS, storage } from '../lib/storage.js';
import { scrollToElement } from '../lib/scroll.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Newsletter sign-up.
 * Integration point: replace `subscribe()` with a call to your email
 * provider (Brevo, Mailchimp, Klaviyo…). It currently keeps the address
 * on the device so the confirmation persists between visits.
 */
async function subscribe(email) {
  storage.set(KEYS.newsletter, { email, at: new Date().toISOString() });
}

export function initNewsletter() {
  $$('[data-newsletter]').forEach((form) => {
    const input = $('input[type="email"]', form);
    const status = $('[data-newsletter-status]', form);
    const saved = storage.get(KEYS.newsletter);

    const say = (message, isError = false) => {
      status.textContent = message;
      status.classList.toggle('is-error', isError);
      input.setAttribute('aria-invalid', String(isError));
    };

    if (saved?.email) say('You are on our list — thank you. Your next letter arrives with the full moon.');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = input.value.trim();
      if (!EMAIL.test(email)) {
        say('Please enter a valid email address.', true);
        input.focus();
        return;
      }
      await subscribe(email);
      form.reset();
      say('Welcome to the maison. Your first letter arrives with the next full moon.');
    });
  });
}

/* --------------------------------------------------------------------------
   Contact form — composes a WhatsApp or email message from the fields
   -------------------------------------------------------------------------- */
const MESSAGES = {
  name: 'Please tell us your name.',
  contact: 'Please enter an email address or a phone number.',
  subject: 'Please choose a subject.',
  message: 'Please write a short message.',
};
const PHONE = /^\+?[\d\s().-]{8,}$/;

export function initContactForm({ waLink, email }) {
  const form = $('[data-contact-form]');
  if (!form) return;
  const status = $('[data-form-status]', form);

  const fieldOf = (name) => form.elements[name].closest('.field');
  const setError = (name, message) => {
    const field = fieldOf(name);
    const input = form.elements[name];
    const error = $('.field__error', field);
    field.classList.toggle('has-error', Boolean(message));
    input.setAttribute('aria-invalid', String(Boolean(message)));
    if (message) input.setAttribute('aria-describedby', error.id);
    else input.removeAttribute('aria-describedby');
    error.textContent = message || '';
  };

  const validate = () => {
    const values = Object.fromEntries(new FormData(form));
    const errors = {};
    Object.keys(MESSAGES).forEach((key) => {
      if (!String(values[key] || '').trim()) errors[key] = MESSAGES[key];
    });
    const contact = String(values.contact || '').trim();
    if (contact && !EMAIL.test(contact) && !PHONE.test(contact)) errors.contact = MESSAGES.contact;
    Object.keys(MESSAGES).forEach((key) => setError(key, errors[key]));
    return { values, errors };
  };

  $$('.field__input', form).forEach((input) =>
    input.addEventListener('input', () => fieldOf(input.name).classList.contains('has-error') && validate()),
  );

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const { values, errors } = validate();
    const firstError = Object.keys(MESSAGES).find((key) => errors[key]);
    if (firstError) {
      status.classList.add('is-error');
      status.textContent = 'Please complete the highlighted fields.';
      form.elements[firstError].focus({ preventScroll: true });
      scrollToElement(fieldOf(firstError));
      return;
    }

    const body = `${values.message.trim()}\n\n— ${values.name.trim()}\n${values.contact.trim()}`;
    status.classList.remove('is-error');

    if (event.submitter?.value === 'email') {
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(`[Website] ${values.subject}`)}&body=${encodeURIComponent(body)}`;
      status.textContent = 'Your email app is opening with your message — just press send.';
    } else {
      window.open(waLink(`Hello Maison Tiziri — ${values.subject}\n\n${body}`), '_blank', 'noopener');
      status.textContent = 'WhatsApp is opening with your message — just press send. A stylist will reply within the hour.';
    }
  });
}
