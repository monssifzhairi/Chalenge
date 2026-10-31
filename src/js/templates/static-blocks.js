/**
 * Build-time HTML blocks, injected into pages with <!-- @render name -->.
 * Rendering product grids into the static HTML keeps them crawlable,
 * paints images without waiting for JavaScript and avoids layout shift.
 */
import site from '../../../site.config.js';
import { categories, getProduct, products, productsByTag } from '../data/products.js';
import { productCard, productMini } from './card.js';

const pick = (ids) => ids.map(getProduct);

export const blocks = {
  'home-edit': () => {
    const [feature, ...rest] = pick([
      'kaftan-yasmine',
      'kaftan-layl',
      'takchita-lalla-noor',
      'djellaba-safran',
      'kaftan-ocre',
    ]);
    return [
      productCard(feature, { variant: 'feature', sizes: 'feature' }),
      ...rest.map((p) => productCard(p, { sizes: 'small' })),
    ].join('\n');
  },

  'home-men': () =>
    pick(['djellaba-fassi', 'jabador-sidi', 'gandoura-medina', 'babouches-fes'])
      .map((p) => productCard(p, { sizes: 'row' }))
      .join('\n'),

  'shop-grid': () => products.map((p, index) => productCard(p, { index, eager: index < 4 })).join('\n'),

  'shop-filters': () =>
    categories
      .map(
        (c) =>
          `<button type="button" class="chip${c.id === 'all' ? ' is-active' : ''}" data-filter="${c.id}" aria-pressed="${c.id === 'all'}">${c.label}<span class="chip__count">${productsByTag(c.id).length}</span></button>`,
      )
      .join(''),

  'search-popular': () =>
    pick(['kaftan-layl', 'takchita-lalla-noor', 'djellaba-fassi', 'babouches-fes'])
      .map((p) => productMini(p))
      .join(''),

  'ld-store': () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'ClothingStore',
      name: site.name,
      description: site.tagline,
      telephone: site.phoneDisplay.replace(/\s/g, ''),
      email: site.email,
      priceRange: '850–14,500 MAD',
      currenciesAccepted: 'MAD',
      paymentAccepted: 'Cash, Credit Card',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '54, Rue de la Liberté, Guéliz',
        addressLocality: 'Marrakech',
        postalCode: '40000',
        addressCountry: 'MA',
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          opens: '10:00',
          closes: '20:00',
        },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Sunday', opens: '11:00', closes: '19:00' },
      ],
    };
    return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
  },
};
