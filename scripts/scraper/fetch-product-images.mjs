#!/usr/bin/env node
/**
 * Извлечение изображений товаров со страниц x-core.by (div.slides)
 * Читает xcore-products.json, для каждого url запрашивает страницу,
 * парсит div.slides ul li -> link[itemprop=image] или a[href] с картинками.
 * Выход: xcore-images.json { products: [{ sku, images: [urls] }] }
 *
 * Использование: node fetch-product-images.mjs [--concurrency=20] [--limit=100] [--slow]
 * --concurrency=N  параллельных запросов (по умолчанию 25)
 * --limit=N        обработать только первые N товаров (для теста)
 * --slow           задержка 500ms между батчами
 */

import { load } from 'cheerio';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BASE_URL } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const INPUT_FILE = join(DATA_DIR, 'xcore-products.json');
const OUTPUT_FILE = join(DATA_DIR, 'xcore-images.json');

const args = process.argv.slice(2);
const concurrency = parseInt(args.find((a) => a.startsWith('--concurrency='))?.split('=')[1] || '25', 10);
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;
const slowMode = args.includes('--slow');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const BATCH_DELAY_MS = slowMode ? 500 : 80;
const REQUEST_TIMEOUT_MS = 20000;

let sessionCookies = '';

async function fetchHtml(url) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers = { 'User-Agent': USER_AGENT, Accept: 'text/html' };
  if (sessionCookies) headers['Cookie'] = sessionCookies;
  try {
    const res = await fetch(url, { headers, signal: controller.signal, redirect: 'follow' });
    const setCookies = res.headers.getSetCookie?.() || [];
    if (setCookies.length > 0) {
      sessionCookies = setCookies
        .map((c) => (typeof c === 'string' ? c : `${c.name}=${c.value}`).split(';')[0].trim())
        .join('; ');
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(to);
  }
}

function ensureAbs(href) {
  if (!href || href.startsWith('http')) return href;
  return `${BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`;
}

/** Преобразует resize_cache URL в полный iblock URL */
function thumbToFullUrl(thumbUrl) {
  if (!thumbUrl) return thumbUrl;
  const m = thumbUrl.match(/resize_cache\/iblock\/([^/]+)\/[^/]+\/([^?&]+)/);
  if (m) return `${BASE_URL}/upload/iblock/${m[1]}/${m[2]}`;
  return thumbUrl.replace(/\?.*$/, '');
}

/**
 * Парсит изображения из div.slides
 * Структура: div.slides > ul > li > (link[itemprop=image] или a.popup_link > img)
 */
function parseSlidesImages(html, productName) {
  const $ = load(html);
  const images = [];
  const seen = new Set();

  const add = (url) => {
    const full = ensureAbs(url);
    if (!full || !full.includes('upload') || seen.has(full)) return;
    seen.add(full);
    images.push(full);
  };

  $('div.slides ul li').each((_, li) => {
    const $li = $(li);
    const link = $li.find('link[itemprop="image"][href]').attr('href');
    if (link) {
      add(link);
      return;
    }
    const aHref = $li.find('a.popup_link.fancy[href], a[href*="upload/iblock"], a[href*="upload/resize_cache"]').attr('href');
    if (aHref) {
      add(aHref);
      return;
    }
    const imgSrc = $li.find('img[src*="upload"], img[src*="resize_cache"]').attr('src');
    if (imgSrc) {
      const fullUrl = imgSrc.includes('resize_cache') ? thumbToFullUrl(ensureAbs(imgSrc)) : ensureAbs(imgSrc);
      add(fullUrl);
    }
  });

  return images;
}

async function processProduct(product) {
  const { url, sku, name } = product;
  if (!url) return { sku, images: [], error: 'no url' };
  try {
    const html = await fetchHtml(url);
    const images = parseSlidesImages(html, name);
    return { sku: sku || `XCORE-${product.externalId}`, images };
  } catch (e) {
    return { sku: sku || product.externalId, images: [], error: e.message };
  }
}

/** Выполняет задачи с ограничением параллелизма */
async function runWithConcurrency(tasks, concurrencyLimit) {
  const results = [];
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      const task = tasks[i];
      const result = await task();
      results[i] = result;
    }
  }

  const workers = Array.from({ length: Math.min(concurrencyLimit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!existsSync(INPUT_FILE)) {
    console.error(`Файл не найден: ${INPUT_FILE}`);
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(INPUT_FILE, 'utf8'));
  const products = data.products || [];
  const toProcess = limit ? products.slice(0, limit) : products;

  console.log(`Загрузка изображений с x-core.by`);
  console.log(`  Товаров: ${toProcess.length}${limit ? ` (лимит ${limit})` : ''}`);
  console.log(`  Параллельно: ${concurrency}`);
  console.log('');

  const start = Date.now();
  const tasks = toProcess.map((p) => () => processProduct(p));
  const results = [];

  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((t) => t()));
    results.push(...batchResults);

    const done = Math.min(i + concurrency, tasks.length);
    const withImages = batchResults.filter((r) => r.images.length > 0).length;
    process.stdout.write(`\r  [${done}/${tasks.length}] +${withImages} с картинками`);

    if (i + concurrency < tasks.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const withImages = results.filter((r) => r.images.length > 0).length;
  const errors = results.filter((r) => r.error).length;

  console.log(`\n\nГотово за ${elapsed}с. С картинками: ${withImages}, ошибок: ${errors}`);

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  const output = {
    source: 'x-core.by',
    fetchedAt: new Date().toISOString(),
    productCount: results.length,
    withImagesCount: withImages,
    products: results,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Сохранено: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
