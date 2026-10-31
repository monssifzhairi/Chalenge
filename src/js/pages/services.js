import { initCommon } from '../main.js';
import { initScrollSpy } from '../components/scrollspy.js';
import { sizeCharts, sizeTable } from '../data/sizes.js';
import { $, $$ } from '../lib/dom.js';

/* Size guides with a cm / in toggle — rendered before scroll triggers are measured. */
const container = $('[data-size-guides]');
const unitButtons = $$('[data-unit]');
let unit = 'cm';

const render = () => {
  container.innerHTML = Object.entries(sizeCharts)
    .map(
      ([key, chart]) => `<div class="size-guide">
        <h3 class="size-guide__title">${chart.title}</h3>
        <div class="table-wrap">${sizeTable(key, unit)}</div>
        <p class="size-guide__note">${chart.note}</p>
      </div>`,
    )
    .join('');
};

unitButtons.forEach((btn) =>
  btn.addEventListener('click', () => {
    unit = btn.dataset.unit;
    unitButtons.forEach((b) => {
      b.classList.toggle('is-active', b.dataset.unit === unit);
      b.setAttribute('aria-pressed', String(b.dataset.unit === unit));
    });
    render();
  }),
);

render();
initCommon();
initScrollSpy();
