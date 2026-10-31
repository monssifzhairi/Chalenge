import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import site from './site.config.js';
import { icon } from './src/js/lib/icons.js';
import { blocks } from './src/js/templates/static-blocks.js';

const root = dirname(fileURLToPath(import.meta.url));
const pages = ['index', 'shop', 'product', 'maison', 'contact', 'services', 'legal', '404'];

const escapeHtml = (value) =>
  String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/**
 * Lightweight static-site templating for plain HTML pages:
 *
 *   <!-- @include header -->   → contents of partials/header.html (nestable)
 *   <!-- @render shop-grid --> → HTML from src/js/templates/static-blocks.js
 *   <!-- @icon bag -->         → inline SVG icon
 *   {{whatsapp}}               → value from site.config.js
 *
 * It also marks the current page's navigation links with aria-current,
 * based on <body data-page="…"> and data-nav="…" attributes.
 */
function staticTemplating() {
  const INCLUDE = /<!--\s*@include\s+([\w-]+)\s*-->/g;
  const RENDER = /<!--\s*@render\s+([\w-]+)\s*-->/g;
  const ICON = /<!--\s*@icon\s+([\w-]+)(?:\s+(\d+))?\s*-->/g;
  const TOKEN = /\{\{\s*(\w+)\s*\}\}/g;

  const partial = (name) => readFileSync(resolve(root, 'partials', `${name}.html`), 'utf8');
  const expand = (html, depth = 0) =>
    depth > 5 ? html : html.replace(INCLUDE, (_, name) => expand(partial(name), depth + 1));

  return {
    name: 'tiziri-static-templating',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        let out = expand(html)
          .replace(RENDER, (match, name) => (blocks[name] ? blocks[name]() : match))
          .replace(ICON, (_, name, size) => icon(name, { size: size ? Number(size) : undefined }))
          .replace(TOKEN, (match, key) => (key in site ? escapeHtml(site[key]) : match));

        const page = out.match(/<body[^>]*\sdata-page="([\w-]+)"/)?.[1];
        if (page) out = out.replaceAll(`data-nav="${page}"`, `data-nav="${page}" aria-current="page"`);
        return out;
      },
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(resolve(root, 'partials'))) server.ws.send({ type: 'full-reload' });
    },
  };
}

export default defineConfig({
  base: './',
  appType: 'mpa',
  plugins: [staticTemplating()],
  build: {
    target: 'es2020',
    modulePreload: { polyfill: false },
    rolldownOptions: {
      input: Object.fromEntries(pages.map((page) => [page, resolve(root, `${page}.html`)])),
    },
  },
});
