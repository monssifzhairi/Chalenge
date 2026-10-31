# Maison Tiziri — Moroccan couture, embroidered by hand in Fès

A premium, editorial e-commerce website for **Maison Tiziri**, a (fictional) Moroccan couture house: kaftans, takchitas, djellabas, gandouras and babouches, priced in MAD, with WhatsApp ordering and payment on delivery — the way luxury retail works in Morocco.

Built with **Vite 8**, vanilla JavaScript modules, **GSAP 3** (ScrollTrigger, SplitText, Flip) and **Lenis**. No framework, no backend — a fast static site you can host anywhere.

| Lighthouse (desktop) | Performance | Accessibility | Best practices | SEO |
| --- | :-: | :-: | :-: | :-: |
| Home | 99 | 100 | 100 | 100 |
| Shop | 97 | 100 | 100 | 100 |
| Product | 100 | 100 | 100 | 100 |

On mobile (Lighthouse's simulated slow 4G), every page scores 100 for accessibility and best practices — and 100 for SEO on every indexable page — with 0 ms total blocking time and a layout shift of 0.04 or less.

---

## Pages

| Page | What's on it |
| --- | --- |
| `index.html` | Cinematic "Clair de Lune" campaign hero, manifesto, the new-season edit, an interactive *Anatomy of a takchita* (hotspots synced to scroll), the men's wardrobe, services, testimonials, boutiques |
| `shop.html` | Filterable, sortable catalogue (`?category=women`, `&sort=price-asc`), animated with GSAP Flip, grid density toggle |
| `product.html?id=…` | Gallery with hover zoom (swipe on mobile), sizes with sold-out / low-stock states, size guide (cm / in), add to bag, order on WhatsApp, details accordions, related pieces, sticky mobile buy bar, Product JSON-LD |
| `maison.html` | Brand story, savoir-faire (sfifa, aakad, mjboud…), milestones, values, made-to-measure process |
| `contact.html` | WhatsApp / phone / email, a contact form that composes a WhatsApp message or an email, the four addresses with directions |
| `services.html` | Delivery rates, payment methods, 14-day exchanges, size guides, garment care, FAQ |
| `legal.html` | Privacy (law 09-08 / CNDP), terms of sale (law 31-08), cookies & storage |
| `404.html` | "Lost in the medina" |

**Everywhere:** announcement bar, mega menu, full-screen mobile menu, instant search (`/` shortcut), shopping bag drawer with free-delivery progress, add-to-bag toast, WhatsApp concierge widget, newsletter, page transitions.

## Getting started

Requires Node.js 18+.

```bash
npm install
npm run dev       # development server at http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the production build locally
```

## Making it yours

### Contact details & commerce rules — `site.config.js`

One file holds the WhatsApp number, displayed phone number, email address, free-delivery threshold and delivery fee. Values are injected into every page at build time and used by the scripts at runtime.

> The phone number and email shipped with the demo are **examples** — replace them with the client's WhatsApp Business number and address before going live.

### Products — `src/js/data/products.js`

Each product has an `id`, name, type, category `tags`, `price` (MAD), colour and swatch, `sizes`, `soldOut` / `lowStock` sizes, optional `badge` and `madeToOrder` note, descriptions, details, composition, care, and image alt texts. Category filters and their copy live in the same file; size charts live in `src/js/data/sizes.js`.

To add a product: add its entry, add its photography to `source-images/`, register it in `scripts/optimize-images.mjs` and run `npm run images`.

### Pages & shared markup

Pages are plain HTML. A small Vite plugin (in `vite.config.js`) adds just enough templating:

| Syntax | Result |
| --- | --- |
| `<!-- @include header -->` | Inserts `partials/header.html` (also `head`, `footer`, `overlays`) |
| `<!-- @render shop-grid -->` | Renders a block from `src/js/templates/static-blocks.js` (product grids are rendered at build time for SEO and speed) |
| `<!-- @icon bag 20 -->` | Inlines an SVG icon from `src/js/lib/icons.js` |
| `{{whatsapp}}` | Inserts a value from `site.config.js` |

Navigation highlighting is automatic: `<body data-page="maison">` marks every link with `data-nav="maison"` as current.

## Images

The `public/images/` folder contains optimised WebP renditions (480–1400 px, about 1.7 MB in total) plus blurred placeholders embedded in `src/js/data/placeholders.js`.

They are generated from high-resolution masters by `npm run images` (`scripts/optimize-images.mjs`, using sharp). The masters go in `source-images/`, which is intentionally **not committed** (see `.gitignore`); only the optimised output is versioned. The script normalises framing to 4:5, creates the close-up crops used on hover and in the gallery, and the hero and editorial crops.

All photography is AI-generated for this fictional brand.

## Project structure

```
├── index.html, shop.html, product.html, …   pages
├── partials/                                 header, footer, overlays, <head>
├── site.config.js                            contact details & commerce rules
├── vite.config.js                            multi-page build + templating plugin
├── public/
│   ├── images/                               optimised WebP photography
│   └── fonts/                                self-hosted variable fonts (+ OFL licence)
├── scripts/optimize-images.mjs               image pipeline
└── src/
    ├── styles/                               base · layout · components · pages
    └── js/
        ├── main.js                           shared bootstrap
        ├── pages/                            one entry per page
        ├── components/                       bag, header, overlays, animations, forms…
        ├── templates/                        product card & build-time blocks
        ├── data/                             products, sizes, placeholders
        └── lib/                              gsap, scroll, dom, format, icons, storage
```

## Under the hood

- **Animation:** GSAP timelines for the hero intro, SplitText line and character reveals (re-split automatically on resize and font load), ScrollTrigger reveals and parallax, Flip for catalogue filtering, a velocity-reactive marquee, magnetic buttons and a "View" cursor on product imagery. Lenis provides smooth scrolling and is paused under overlays.
- **Accessibility:** native `<dialog>` overlays (focus trap, Escape, focus restored), skip link, keyboard-operable mega menu, accessible size radios, live regions for the bag, search and forms, visible focus states, colour contrast checked to WCAG AA. With `prefers-reduced-motion`, animations and smooth scrolling are switched off. Without JavaScript, all content stays visible.
- **Performance:** responsive `srcset`/`sizes` everywhere, blurred placeholders, close-up images loaded only on first hover, preloaded variable fonts (the Tifinagh font is subset to 3 KB), product grids rendered at build time, no layout shift, about 71 KB of gzipped JavaScript shared by all pages.
- **SEO:** unique titles and descriptions, Open Graph tags, `ClothingStore` and `Product` structured data, semantic headings, `robots.txt`.
- **Portability:** all URLs are relative, so the build works at a domain root or in a sub-folder (for example GitHub Pages) with no configuration.

## Deployment

Any static host works: Netlify, Vercel, Cloudflare Pages, GitHub Pages or an S3 bucket.

- **Build command:** `npm run build`
- **Output directory:** `dist`
- `404.html` is picked up automatically by most hosts.

## Before launch

- Replace the example phone number and email in `site.config.js`.
- Connect the newsletter: `subscribe()` in `src/js/components/forms.js` is the single integration point for Brevo, Mailchimp, Klaviyo and similar. It currently keeps the address on the device.
- Add the client's company details (RC, ICE) to the terms of sale, and update the cookie section if analytics are added — the site currently uses no cookies or tracking.
- Optional: online card payment (CMI) can be added alongside the WhatsApp checkout.

## Credits & licences

- [GSAP](https://gsap.com) — standard no-charge licence, free for commercial use, including SplitText and Flip
- [Lenis](https://github.com/darkroomengineering/lenis) — MIT
- Fonts: Cormorant, Jost and Noto Sans Tifinagh — SIL Open Font License (see `public/fonts/OFL.txt`)
- Icons: [Lucide](https://lucide.dev) (ISC) and [Simple Icons](https://simpleicons.org) (CC0)

Maison Tiziri, its collection, people, addresses and testimonials are fictional and were created for this project.
