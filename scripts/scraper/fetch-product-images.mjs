#!/usr/bin/env node
/**
 * Извлечение изображений товаров со страниц x-core.by (div.slides)
 * Читает xcore-products.json, для каждого url запрашивает страницу,
 * парсит div.slides ul li -> link[itemprop=image] или a[href] с картинками.
 * Выход: xcore-images.json { products: [{ sku, images: [urls] }] }
 *
 * Использование: node fetch-product-images.mjs [--concurrency=20] [--limit=100] [--slow] [--categories=ram,coolers]
 * --concurrency=N  параллельных запросов (по умолчанию 25)
 * --limit=N        обработать только первые N товаров (для теста)
 * --slow           задержка 500ms между батчами
 * --categories=ram,coolers  только товары этих категорий (результат мержится в xcore-images.json)
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
const categoriesArg = args.find((a) => a.startsWith('--categories='));
const categoriesFilter = categoriesArg ? categoriesArg.split('=')[1].split(',').map((s) => s.trim()) : null;

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
 * Парсит изображения со страницы товара x-core.by.
 * Поддерживает разные структуры:
 * - div.slides ul li (классический слайдер)
 * - div.slides > link[itemprop=image] (прямые дети, RAM/охлаждение)
 * - .gallery-block / .gallery-wrapper a[href*="upload/iblock"]
 * - link[itemprop=image], meta[og:image] как fallback
 */
function parseSlidesImages(html, productName) {
  const $ = load(html);
  const images = [];
  const seen = new Set();

  const add = (url) => {
    const full = ensureAbs(url);
    if (!full || !full.includes('upload') || seen.has(full)) return;
    if (full.includes('/menu_img/') || full.includes('7ed3a254421df44ec')) return;
    seen.add(full);
    images.push(full);
  };

  // 1. div.slides ul li (классический слайдер)
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

  // 2. div.slides > link[itemprop=image] (прямые дети — RAM, охлаждение)
  if (images.length === 0) {
    $('div.slides link[itemprop="image"][href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) add(href);
    });
  }

  // 3. Фотогалерея: a.fancy[href*="upload/iblock"]
  if (images.length === 0) {
    $('.gallery-block a[href*="upload/iblock"], .gallery-wrapper a[href*="upload/iblock"], a.fancy[href*="upload/iblock"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) add(href);
    });
  }

  // 4. Thumbs: img в .thumbs с data-xpreview или src (resize_cache -> iblock)
  if (images.length === 0) {
    $('.item_slider .thumbs img[data-xpreview*="upload"], .item_slider .thumbs img[src*="resize_cache"]').each((_, el) => {
      const src = $(el).attr('data-xpreview') || $(el).attr('src');
      if (src) {
        const fullUrl = src.includes('resize_cache') ? thumbToFullUrl(ensureAbs(src)) : ensureAbs(src);
        add(fullUrl);
      }
    });
  }

  // 5. Fallback: link[itemprop=image], meta[og:image]
  if (images.length === 0) {
    $('link[itemprop="image"][href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) add(href);
    });
    const og = $('meta[property="og:image"][content]').attr('content');
    if (og) add(og);
  }

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
  let products = data.products || [];
  if (categoriesFilter?.length) {
    products = products.filter((p) => p.categorySlug && categoriesFilter.includes(p.categorySlug));
    console.log(`  Категории: ${categoriesFilter.join(', ')} (${products.length} товаров)`);
  }
  const toProcess = limit ? products.slice(0, limit) : products;

  console.log(`Загрузка изображений с x-core.by`);
  console.log(`  Товаров: ${toProcess.length}${limit ? ` (лимит ${limit})` : ''}`);
  console.log(`  Параллельно: ${concurrency}`);
  console.log('');

  const start = Date.now();
  const tasks = toProcess.map((p) => () => processProduct(p));
  const results = [];
  const isTty = process.stdout.isTTY;
  const logEveryBatch = Math.max(1, Math.ceil(tasks.length / concurrency / 20));
  let batchNum = 0;

  for (let i = 0; i < tasks.length; i += concurrency) {
    batchNum++;
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((t) => t()));
    results.push(...batchResults);

    const done = Math.min(i + concurrency, tasks.length);
    const withImages = batchResults.filter((r) => r.images.length > 0).length;
    if (isTty) {
      process.stdout.write(`\r  [${done}/${tasks.length}] +${withImages} с картинками в батче   `);
    } else if (batchNum === 1 || batchNum % logEveryBatch === 0 || done === tasks.length) {
      console.log(
        `  [${done}/${tasks.length}] батч ${batchNum}, в батче с картинками: ${withImages}`
      );
    }

    if (i + concurrency < tasks.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }
  if (isTty) process.stdout.write('\n');

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const withImages = results.filter((r) => r.images.length > 0).length;
  const errors = results.filter((r) => r.error).length;

  console.log(`\n\nГотово за ${elapsed}с. С картинками: ${withImages}, ошибок: ${errors}`);

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  let output;
  if (categoriesFilter?.length && existsSync(OUTPUT_FILE)) {
    const existing = JSON.parse(readFileSync(OUTPUT_FILE, 'utf8'));
    const bySku = new Map((existing.products || []).map((p) => [p.sku, p]));
    for (const r of results) {
      bySku.set(r.sku, { sku: r.sku, images: r.images });
    }
    const merged = Array.from(bySku.values());
    output = {
      ...existing,
      source: 'x-core.by',
      fetchedAt: new Date().toISOString(),
      productCount: merged.length,
      withImagesCount: merged.filter((p) => p.images?.length > 0).length,
      products: merged,
    };
    console.log(`  Обновлено ${results.length} товаров, всего в файле: ${merged.length}`);
  } else {
    output = {
      source: 'x-core.by',
      fetchedAt: new Date().toISOString(),
      productCount: results.length,
      withImagesCount: withImages,
      products: results,
    };
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Сохранено: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
