/**
 * Image pipeline — Maison Tiziri
 * ---------------------------------------------------------------
 * Turns the high-resolution master photography in /source-images
 * into responsive, compressed WebP derivatives in /public/images,
 * and writes tiny blurred placeholders (LQIP) to
 * src/js/data/placeholders.js.
 *
 *   npm run images
 *
 * Masters are intentionally not committed (see .gitignore); the
 * optimised output is. Re-run this script whenever a master changes.
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'source-images');
const OUT = join(root, 'public', 'images');
const PLACEHOLDERS = join(root, 'src', 'js', 'data', 'placeholders.js');

/* Uniform masters so every product shares identical srcset widths. */
const PRODUCT_MASTER = { width: 1100, height: 1375 }; // 4:5
const DETAIL_MASTER = { width: 640, height: 800 }; // 4:5
const PRODUCT_WIDTHS = [480, 800, 1100];
const DETAIL_WIDTHS = [480, 640];

/**
 * Product photography.
 *  - frame:  optional crop (fractions of the source) to normalise framing
 *  - pad:    'mirror-x' extends a too-narrow seamless backdrop to 4:5
 *  - detail: top-left corner (fractions) of a 50% × 50% close-up window
 */
const products = [
  { id: 'kaftan-yasmine', src: 'yasmine.png', pad: 'mirror-x', detail: { x: 0.265, y: 0.13 } },
  { id: 'takchita-lalla-noor', src: 'lallanoor.png', detail: { x: 0.25, y: 0.16 } },
  {
    id: 'kaftan-layl',
    src: 'layl.png',
    frame: { left: 49 / 928, top: 81 / 1152, width: 848 / 928, height: 1060 / 1152 },
    detail: { x: 0.25, y: 0.14 },
  },
  { id: 'djellaba-safran', src: 'safran.png', detail: { x: 0.24, y: 0.13 } },
  { id: 'kaftan-ocre', src: 'ocre.png', detail: { x: 0.25, y: 0.13 } },
  { id: 'djellaba-fassi', src: 'fassi.png', detail: { x: 0.25, y: 0.12 } },
  { id: 'gandoura-medina', src: 'medina.png', detail: { x: 0.24, y: 0.14 } },
  { id: 'jabador-sidi', src: 'sidi.png', detail: { x: 0.25, y: 0.15 } },
  { id: 'babouches-fes', src: 'babouches.png', detail: { x: 0.33, y: 0.4 } },
];

/** Editorial derivatives cut from the campaign master. */
const editorial = [
  { out: 'hero/hero', src: 'hero.png', widths: [960, 1400], quality: 76, lqip: 'hero' },
  {
    out: 'hero/hero-portrait',
    src: 'hero.png',
    extract: { left: 0.26, top: 0, width: 0.48, height: 1 },
    widths: [480, 672],
    quality: 76,
  },
  {
    out: 'editorial/riad-arches',
    src: 'hero.png',
    extract: { left: 0, top: 0, width: 0.32, height: 0.6 },
    widths: [448],
    quality: 80,
    lqip: 'riad-arches',
  },
  {
    out: 'editorial/riad-fountain',
    src: 'hero.png',
    extract: { left: 0.67, top: 0.22, width: 0.33, height: 0.619 },
    widths: [462],
    quality: 80,
    lqip: 'riad-fountain',
  },
];

/* ---------------------------------------------------------------- */

const exists = (p) => access(p).then(() => true, () => false);
const ensureDir = (file) => mkdir(dirname(file), { recursive: true });

function toPixels(region, meta) {
  return {
    left: Math.round(region.left * meta.width),
    top: Math.round(region.top * meta.height),
    width: Math.round(region.width * meta.width),
    height: Math.round(region.height * meta.height),
  };
}

async function writeWebp(buffer, file, width, quality = 80) {
  await ensureDir(file);
  const info = await sharp(buffer)
    .resize({ width, withoutEnlargement: false, kernel: 'lanczos3' })
    .sharpen({ sigma: 0.45 })
    .webp({ quality, effort: 6, smartSubsample: true })
    .toFile(file);
  return info.size;
}

async function lqip(buffer) {
  const tiny = await sharp(buffer).resize({ width: 20 }).blur(0.6).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${tiny.toString('base64')}`;
}

/** Extend a seamless studio backdrop horizontally by mirroring its edges. */
async function mirrorPadTo45(input) {
  const img = sharp(input);
  const { width, height } = await img.metadata();
  const target = Math.round(height * 0.8);
  if (target <= width) return img.toBuffer();
  const pad = Math.ceil((target - width) / 2);
  const left = await sharp(input).extract({ left: 0, top: 0, width: pad, height }).flop().toBuffer();
  const right = await sharp(input).extract({ left: width - pad, top: 0, width: pad, height }).flop().toBuffer();
  return sharp({ create: { width: width + pad * 2, height, channels: 3, background: '#cbb59a' } })
    .composite([
      { input: left, left: 0, top: 0 },
      { input: await img.toBuffer(), left: pad, top: 0 },
      { input: right, left: pad + width, top: 0 },
    ])
    .png()
    .toBuffer();
}

async function processProduct(p, placeholders) {
  const srcPath = join(SRC, p.src);
  let master = await sharp(srcPath).toBuffer();

  if (p.pad === 'mirror-x') master = await mirrorPadTo45(master);
  if (p.frame) {
    const meta = await sharp(master).metadata();
    master = await sharp(master).extract(toPixels(p.frame, meta)).toBuffer();
  }

  // Normalise to the 4:5 product master.
  master = await sharp(master)
    .resize({ ...PRODUCT_MASTER, fit: 'cover', position: 'centre', kernel: 'lanczos3' })
    .png()
    .toBuffer();

  let bytes = 0;
  for (const w of PRODUCT_WIDTHS) {
    bytes += await writeWebp(master, join(OUT, 'products', `${p.id}-${w}.webp`), w, 80);
  }

  // Close-up: a 50% × 50% window → twice the magnification, still 4:5.
  const region = {
    left: Math.round(p.detail.x * PRODUCT_MASTER.width),
    top: Math.round(p.detail.y * PRODUCT_MASTER.height),
    width: Math.round(PRODUCT_MASTER.width / 2),
    height: Math.round(PRODUCT_MASTER.height / 2),
  };
  const detail = await sharp(master)
    .extract(region)
    .resize({ ...DETAIL_MASTER, kernel: 'lanczos3' })
    .png()
    .toBuffer();
  for (const w of DETAIL_WIDTHS) {
    bytes += await writeWebp(detail, join(OUT, 'products', `${p.id}-detail-${w}.webp`), w, 82);
  }

  placeholders[p.id] = await lqip(master);
  return bytes;
}

async function processEditorial(e, placeholders) {
  const srcPath = join(SRC, e.src);
  let buffer = await sharp(srcPath).toBuffer();
  if (e.extract) {
    const meta = await sharp(buffer).metadata();
    buffer = await sharp(buffer).extract(toPixels(e.extract, meta)).png().toBuffer();
  }
  let bytes = 0;
  for (const w of e.widths) {
    bytes += await writeWebp(buffer, join(OUT, `${e.out}-${w}.webp`), w, e.quality);
  }
  if (e.lqip) placeholders[e.lqip] = await lqip(buffer);
  return bytes;
}

async function main() {
  if (!(await exists(SRC))) {
    console.log('No /source-images folder found — optimised images in public/images are already up to date.');
    return;
  }
  const placeholders = {};
  let total = 0;

  for (const e of editorial) {
    total += await processEditorial(e, placeholders);
    console.log(`✓ ${e.out}`);
  }
  for (const p of products) {
    total += await processProduct(p, placeholders);
    console.log(`✓ products/${p.id}`);
  }

  const body =
    '/* Auto-generated by scripts/optimize-images.mjs — do not edit by hand. */\n' +
    '/* Tiny blurred previews shown while full-resolution images load. */\n' +
    `export const placeholders = ${JSON.stringify(placeholders, null, 2)};\n`;
  await ensureDir(PLACEHOLDERS);
  await writeFile(PLACEHOLDERS, body);

  console.log(`\nDone — ${(total / 1024 / 1024).toFixed(2)} MB of WebP written to public/images.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
