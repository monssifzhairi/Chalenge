/**
 * Size guides. Body measurements in centimetres; the UI converts
 * to inches on demand. Ranges are written as [min, max].
 */
export const sizeCharts = {
  women: {
    title: 'Women — kaftans, takchitas & djellabas',
    note: 'Kaftans and djellabas are cut with ease. If you are between sizes, choose the smaller for kaftans and the larger for takchitas worn with a belt.',
    columns: ['Size', 'FR', 'Bust', 'Waist', 'Hips'],
    units: [null, null, 'length', 'length', 'length'],
    rows: [
      ['XS', '34', [80, 84], [62, 66], [88, 92]],
      ['S', '36', [84, 88], [66, 70], [92, 96]],
      ['M', '38', [88, 92], [70, 74], [96, 100]],
      ['L', '40', [92, 98], [74, 80], [100, 106]],
      ['XL', '42', [98, 104], [80, 86], [106, 112]],
    ],
  },
  men: {
    title: 'Men — djellabas, gandouras & jabadors',
    note: 'Our men’s pieces are cut generously through the body. Height determines the length: choose by chest first, then check your height.',
    columns: ['Size', 'Chest', 'Waist', 'Height'],
    units: [null, 'length', 'length', 'length'],
    rows: [
      ['S', [88, 94], [76, 82], [165, 172]],
      ['M', [94, 100], [82, 88], [170, 177]],
      ['L', [100, 106], [88, 94], [175, 182]],
      ['XL', [106, 112], [94, 100], [178, 186]],
      ['XXL', [112, 120], [100, 108], [182, 190]],
    ],
  },
  babouches: {
    title: 'Babouches — unisex',
    note: 'Lambskin relaxes and moulds to the foot within a few days. If you are between sizes, take the smaller.',
    columns: ['EU', 'UK', 'Foot length'],
    units: [null, null, 'length'],
    rows: [
      ['36', '3.5', 23],
      ['37', '4', 23.5],
      ['38', '5', 24],
      ['39', '6', 25],
      ['40', '6.5', 25.5],
      ['41', '7.5', 26],
      ['42', '8', 26.5],
      ['43', '9', 27.5],
      ['44', '9.5', 28],
      ['45', '10.5', 29],
    ],
  },
};

const toInches = (cm) => Math.round((cm / 2.54) * 10) / 10;

function formatCell(value, unit, system) {
  if (unit !== 'length') return value;
  const convert = (v) => (system === 'in' ? toInches(v) : v);
  return Array.isArray(value) ? `${convert(value[0])}–${convert(value[1])}` : `${convert(value)}`;
}

/** Render a size chart as an accessible HTML table. */
export function sizeTable(key, system = 'cm') {
  const chart = sizeCharts[key];
  if (!chart) return '';
  const unitLabel = system === 'in' ? 'in' : 'cm';
  const head = chart.columns
    .map((col, i) => `<th scope="col">${col}${chart.units[i] === 'length' ? ` <span>(${unitLabel})</span>` : ''}</th>`)
    .join('');
  const body = chart.rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell, i) =>
            i === 0 ? `<th scope="row">${cell}</th>` : `<td>${formatCell(cell, chart.units[i], system)}</td>`,
          )
          .join('')}</tr>`,
    )
    .join('');
  return `<table class="size-table"><caption class="sr-only">${chart.title}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}
