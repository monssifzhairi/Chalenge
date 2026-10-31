import { initCommon } from '../main.js';
import { $, $$, isDesktop } from '../lib/dom.js';
import { gsap, ScrollTrigger, SplitText, fontsReady, prefersReducedMotion } from '../lib/gsap.js';
import { scrollToElement } from '../lib/scroll.js';

initCommon();

const reduced = prefersReducedMotion();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const decoded = (img) => (img?.decode ? img.decode().catch(() => {}) : Promise.resolve());

/* --------------------------------------------------------------------------
   Hero — cinematic intro, then a slow parallax drift on scroll
   -------------------------------------------------------------------------- */
function initHero() {
  const hero = $('[data-hero]');
  if (!hero) return;
  const media = $('[data-hero-media]', hero);
  const title = $('[data-hero-title]', hero);
  const fades = $$('[data-hero-fade]', hero);

  if (reduced) {
    gsap.set(title, { visibility: 'visible' });
    gsap.set(fades, { autoAlpha: 1 });
    return;
  }

  const playIntro = () => {
    // The <h1> carries the accessible name; the decorative lines are split silently.
    const chars = $$('.hero__line', title).flatMap(
      (line) => SplitText.create(line, { type: 'chars', tag: 'span', aria: 'none' }).chars,
    );
    gsap.set(title, { visibility: 'visible' });
    gsap
      .timeline({ defaults: { ease: 'expo.out' } })
      .to(media, { scale: 1, duration: 2.8, ease: 'power3.out' }, 0)
      .from(chars, { yPercent: 118, duration: 1.6, stagger: 0.045 }, 0.2)
      .fromTo(fades, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 1.3, stagger: 0.1 }, 0.75);
  };

  // Start once fonts and the hero image are ready — but never keep visitors waiting.
  Promise.race([Promise.all([fontsReady(), decoded($('.hero__img', hero))]), wait(1200)]).then(playIntro);

  gsap.to(media, {
    yPercent: 14,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to($('.hero__inner', hero), {
    yPercent: -16,
    opacity: 0.2,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 25%', scrub: true },
  });
}

/* --------------------------------------------------------------------------
   Marquee — endless loop that accelerates with scroll velocity
   -------------------------------------------------------------------------- */
function initMarquee() {
  const track = $('[data-marquee-track]');
  if (!track || reduced) return;
  const group = track.firstElementChild;
  let loop;

  const build = () => {
    const progress = loop ? loop.progress() : 0;
    loop?.kill();
    gsap.set(track, { x: 0 });
    while (track.scrollWidth < window.innerWidth + group.offsetWidth * 2) {
      const clone = group.cloneNode(true);
      track.appendChild(clone);
    }
    loop = gsap.to(track, { x: -group.offsetWidth, duration: group.offsetWidth / 55, ease: 'none', repeat: -1 });
    loop.progress(progress);
  };
  build();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  });

  ScrollTrigger.create({
    trigger: track,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate(self) {
      const boost = gsap.utils.clamp(1, 5, 1 + Math.abs(self.getVelocity()) / 600);
      gsap.to(loop, { timeScale: boost, duration: 0.2, overwrite: true });
      gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.25 });
    },
    onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
  });
}

/* --------------------------------------------------------------------------
   Manifesto — words darken as you read. The starting tone keeps a 3:1
   contrast (large text), so the paragraph is legible at every moment.
   -------------------------------------------------------------------------- */
const MANIFESTO_START = '#8a7f75';

function initManifesto() {
  const text = $('[data-scrub-words]');
  if (!text || reduced) return;
  fontsReady().then(() => {
    SplitText.create(text, {
      type: 'words',
      tag: 'span',
      aria: 'none',
      autoSplit: true,
      onSplit(self) {
        const colors = self.words.map((word) => getComputedStyle(word).color);
        return gsap.fromTo(
          self.words,
          { color: MANIFESTO_START },
          {
            color: (i) => colors[i],
            stagger: 0.1,
            ease: 'none',
            scrollTrigger: { trigger: text, start: 'top 80%', end: 'bottom 48%', scrub: 0.5 },
          },
        );
      },
    });
  });
}

/* --------------------------------------------------------------------------
   Anatomy of a takchita — hotspots synced with the text
   -------------------------------------------------------------------------- */
function initAnatomy() {
  const section = $('[data-anatomy]');
  if (!section) return;
  const items = $$('[data-anatomy-item]', section);
  const spots = $$('[data-hotspot]', section);
  let current = -1;

  const setActive = (index) => {
    if (index === current) return;
    current = index;
    items.forEach((item, i) => item.classList.toggle('is-active', i === index));
    spots.forEach((spot, i) => {
      spot.classList.toggle('is-active', i === index);
      spot.setAttribute('aria-pressed', String(i === index));
    });
  };
  setActive(0);

  items.forEach((item, i) => {
    ScrollTrigger.create({
      trigger: item,
      start: 'top 62%',
      end: 'bottom 62%',
      onToggle: (self) => self.isActive && setActive(i),
    });
    item.addEventListener('click', () => setActive(i));
  });

  spots.forEach((spot, i) =>
    spot.addEventListener('click', () => {
      setActive(i);
      if (!isDesktop()) scrollToElement(items[i]);
    }),
  );
}

/* --------------------------------------------------------------------------
   Testimonials — autoplay with progress, pauses on hover / focus / offscreen
   -------------------------------------------------------------------------- */
function initVoices() {
  const stage = $('[data-voices]');
  if (!stage) return;
  const slides = $$('.voice', stage);
  const counter = $('[data-voices-current]');
  const progress = $('[data-voices-progress]');
  const DURATION = 7;
  let index = 0;
  let progressTween;
  let hovering = false;
  let visible = false;

  const syncPlayback = () => {
    if (!progressTween) return;
    hovering || !visible ? progressTween.pause() : progressTween.play();
  };

  const restartProgress = () => {
    progressTween?.kill();
    if (reduced) return;
    progressTween = gsap.fromTo(
      progress,
      { scaleX: 0 },
      { scaleX: 1, duration: DURATION, ease: 'none', onComplete: () => go(index + 1, 1) },
    );
    syncPlayback();
  };

  function go(next, direction = 1) {
    const previous = slides[index];
    index = (next + slides.length) % slides.length;
    const slide = slides[index];
    counter.textContent = String(index + 1).padStart(2, '0');

    if (previous !== slide) {
      if (reduced) {
        previous.classList.remove('is-active');
        slide.classList.add('is-active');
      } else {
        gsap.to(previous, {
          autoAlpha: 0,
          x: -30 * direction,
          duration: 0.45,
          ease: 'power2.in',
          onComplete: () => previous.classList.remove('is-active'),
        });
        slide.classList.add('is-active');
        gsap.set(slide, { autoAlpha: 1, x: 0 });
        gsap.fromTo(
          $$('.voice__quote, .voice__meta', slide),
          { autoAlpha: 0, x: 50 * direction },
          { autoAlpha: 1, x: 0, duration: 1.1, stagger: 0.1, delay: 0.3, ease: 'expo.out' },
        );
      }
    }
    restartProgress();
  }

  $('[data-voices-next]').addEventListener('click', () => go(index + 1, 1));
  $('[data-voices-prev]').addEventListener('click', () => go(index - 1, -1));

  const region = stage.closest('.voices__grid');
  region.addEventListener('pointerenter', () => ((hovering = true), syncPlayback()));
  region.addEventListener('pointerleave', () => ((hovering = false), syncPlayback()));
  region.addEventListener('focusin', () => ((hovering = true), syncPlayback()));
  region.addEventListener('focusout', (e) => !region.contains(e.relatedTarget) && ((hovering = false), syncPlayback()));

  // Swipe on touch screens
  let startX = null;
  stage.addEventListener('pointerdown', (e) => (startX = e.clientX));
  stage.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    startX = null;
  });

  ScrollTrigger.create({
    trigger: stage,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => ((visible = self.isActive), syncPlayback()),
  });

  restartProgress();
}

initHero();
initMarquee();
initManifesto();
initAnatomy();
initVoices();
