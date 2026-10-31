import { $, $$ } from '../lib/dom.js';
import { ScrollTrigger } from '../lib/gsap.js';

/** Highlights the in-page navigation link of the section being read. */
export function initScrollSpy() {
  const nav = $('[data-scrollspy]');
  if (!nav) return;
  const links = $$('a[href^="#"]', nav);

  const setActive = (id) => {
    links.forEach((link) => {
      const active = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', active);
      if (active) {
        link.setAttribute('aria-current', 'location');
        // Keep the active chip visible in the horizontal mobile list.
        if (nav.scrollWidth > nav.clientWidth) {
          nav.scrollTo({ left: link.offsetLeft - 24, behavior: 'smooth' });
        }
      } else link.removeAttribute('aria-current');
    });
  };

  links.forEach((link) => {
    const section = document.getElementById(link.getAttribute('href').slice(1));
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: (self) => self.isActive && setActive(section.id),
    });
  });

  setActive(location.hash ? location.hash.slice(1) : links[0]?.getAttribute('href').slice(1));
}
