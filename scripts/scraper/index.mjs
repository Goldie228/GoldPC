#!/usr/bin/env node
/**
 * Парсер товаров с X-Core.by для GoldPC (fetch + cheerio, без браузера)
 * Использование: node index.mjs [--all] [--slow]
 * --all  — парсить все категории, иначе только videokarty, protsessory, materinskie_platy
 * --slow — увеличенные таймауты для медленного интернета
 *
 * Выход: scripts/scraper/data/xcore-products.json
 */

import { load } from 'cheerio';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_CATEGORIES, FULL_CATEGORIES, BASE_URL, DELAY_MS, MAX_PRODUCTS_PER_CATEGORY, PAGE_LOAD_TIMEOUT_MS, PRODUCT_PAGE_TIMEOUT_MS } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'data');
const OUTPUT_FILE = join(OUTPUT_DIR, 'xcore-products.json');

const parseAll = process.argv.includes('--all');
const slowMode = process.argv.includes('--slow');
const categoriesArg = process.argv.find((a) => a.startsWith('--categories='));
const categoriesFilter = categoriesArg ? categoriesArg.split('=')[1].split(',').map((s) => s.trim()) : null;

let categoriesToScrape = parseAll ? FULL_CATEGORIES : INITIAL_CATEGORIES;
if (categoriesFilter?.length) {
  categoriesToScrape = FULL_CATEGORIES.filter((c) => categoriesFilter.includes(c.slug));
  if (categoriesToScrape.length === 0) {
    console.error('Неизвестные категории:', categoriesFilter.join(', '));
    process.exit(1);
  }
}

const PAGE_TIMEOUT = slowMode ? 60000 : PAGE_LOAD_TIMEOUT_MS;
const productPageTimeout = slowMode ? 35000 : PRODUCT_PAGE_TIMEOUT_MS;
const delayMs = slowMode ? 800 : DELAY_MS;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Сохраняет текущий список товаров в файл */
function saveProducts(products) {
  const output = {
    source: 'x-core.by',
    scrapedAt: new Date().toISOString(),
    productCount: products.length,
    products: products,
  };
  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Хранилище cookies между запросами (сайт требует сессию) */
let sessionCookies = '';

/** Загружает HTML по URL через fetch */
async function fetchHtml(url, timeout = PAGE_TIMEOUT) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeout);
  const headers = { 'User-Agent': USER_AGENT, Accept: 'text/html' };
  if (sessionCookies) headers['Cookie'] = sessionCookies;
  try {
    const res = await fetch(url, { headers, signal: controller.signal, redirect: 'follow' });
    const setCookies = res.headers.getSetCookie?.() || [];
    if (setCookies.length > 0) {
      sessionCookies = setCookies.map((c) => {
        const s = typeof c === 'string' ? c : `${c.name}=${c.value}`;
        return s.split(';')[0].trim();
      }).join('; ');
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(to);
  }
}

/** Парсит цену из строки "1 382.70 руб." -> 1382.70 */
function parsePrice(text) {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.replace(/\s/g, '').replace(/[^\d.,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/** Извлекает SKU/артикул из URL */
function extractExternalId(url) {
  const match = url.match(/\/([a-z0-9_]+)\/?$/i);
  return match ? match[1] : null;
}

/** Преобразует resize_cache URL в полный (iblock) URL */
function thumbToFullUrl(thumbUrl) {
  if (!thumbUrl) return thumbUrl;
  const m = thumbUrl.match(/resize_cache\/iblock\/([^/]+)\/[^/]+\/([^?&]+)/);
  if (m) {
    try {
      const u = new URL(thumbUrl);
      return `${u.origin}/upload/iblock/${m[1]}/${m[2]}`;
    } catch {
      return `https://x-core.by/upload/iblock/${m[1]}/${m[2]}`;
    }
  }
  return thumbUrl.replace(/\?.*$/, '');
}

function ensureAbs(url, base = BASE_URL) {
  if (!url) return url;
  if (url.startsWith('http')) return url;
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Проверяет, что slug — товар, а не подкатегория */
function isProductSlug(slug, categoryPath) {
  if (!slug || typeof slug !== 'string') return false;
  const s = slug.toLowerCase();
  const path = categoryPath.toLowerCase();
  if (/^geforce_rtx_\d+[a-z]*$/.test(s) || /^radeon_rx_\d+/.test(s)) return false;
  if (path.includes('videokarty')) return s.startsWith('videokarta_');
  if (path.includes('protsessory')) return s.startsWith('processor_') || s.startsWith('protsessor_');
  if (path.includes('materinskie_platy')) return s.startsWith('materinskaya_plata_') || s.startsWith('materinskaya-plata-');
  if (path.includes('operativnaya_pamyat')) return s.startsWith('operativnaya_pamyat') || s.startsWith('pamyat_') || s.startsWith('ozu_');
  if (path.includes('nakopiteli') || path.includes('zhestkie_diski')) return s.startsWith('ssd_') || s.startsWith('hdd_') || s.startsWith('nakopitel_') || /^\w+_\d+/.test(s);
  if (path.includes('bloki_pitaniya')) return s.includes('blok_pitaniya') || s.includes('bp_');
  if (path.includes('korpusa')) return s.startsWith('korpus_') || s.startsWith('case_');
  if (path.includes('sistemy_okhlazhdeniya')) return s.startsWith('sistema_okhlazhdeniya') || s.startsWith('kuler_') || s.startsWith('cooler_') || s.startsWith('termopasta_') || s.startsWith('ventilyator_') || s.startsWith('zhidkostnoe_') || s.startsWith('komplekt_ventilyatorov') || s.startsWith('sistema_zhidkostnogo');
  if (path.includes('monitory')) return s.startsWith('monitor_') || (s.includes('monitor') && s.length > 10);
  if (path.includes('myshi') || path.includes('klaviatury') || path.includes('naushniki')) return slug.includes('_') && slug.length > 8;
  return slug.includes('_') && slug.length > 6;
}

/** Извлекает максимальный номер страницы из пагинации */
function getMaxPageNum($) {
  const nums = [];
  $('a[href*="PAGEN_1="]').each((_, el) => {
    const m = $(el).attr('href')?.match(/PAGEN_1=(\d+)/);
    if (m) nums.push(parseInt(m[1], 10));
  });
  return nums.length > 0 ? Math.max(...nums) : 1;
}

/** Парсит список товаров на странице каталога (fetch + cheerio) */
async function parseCategoryListing(categoryPath, categorySlug) {
  const allUrls = new Set();
  const url1 = `${BASE_URL}/${categoryPath}/`;

  console.log(`  Загрузка первой страницы...`);
  let html;
  try {
    html = await fetchHtml(url1, PAGE_TIMEOUT);
  } catch (e) {
    console.warn(`  Ошибка загрузки каталога: ${e.message}`);
    return [];
  }
  await sleep(delayMs);

  let $ = load(html);
  const maxPage = getMaxPageNum($);
  console.log(`  Найдено страниц пагинации: ${maxPage}`);

  for (let pageNum = 1; pageNum <= maxPage; pageNum++) {
    const url = pageNum === 1 ? url1 : `${BASE_URL}/${categoryPath}/?PAGEN_1=${pageNum}`;
    if (pageNum > 1) {
      console.log(`  Страница ${pageNum}/${maxPage}: ${url}`);
      try {
        html = await fetchHtml(url, PAGE_TIMEOUT);
      } catch (e) {
        console.warn(`  Пропуск страницы ${pageNum}: ${e.message}`);
        await sleep(delayMs);
        continue;
      }
      await sleep(delayMs);
    }
    const $page = load(html);

    let added = 0;
    $page('a[href*="/catalog/"]').each((_, el) => {
      const href = $page(el).attr('href');
      if (!href) return;
      try {
        const u = new URL(href, BASE_URL);
        if (u.search || u.hash) return;
        const path = u.pathname;
        const segs = path.split('/').filter(Boolean);
        if (segs.length !== 4 || !path.startsWith('/' + categoryPath)) return;
        const slug = (path.match(/\/([^/]+)\/?$/) || [])[1];
        if (slug && isProductSlug(slug, categoryPath) && !allUrls.has(u.href)) {
          allUrls.add(u.href);
          added++;
        }
      } catch {}
    });

    console.log(`  Собрано ссылок: +${added}, всего: ${allUrls.size}`);

    if (allUrls.size >= MAX_PRODUCTS_PER_CATEGORY) break;
  }

  return [...allUrls].slice(0, MAX_PRODUCTS_PER_CATEGORY).map((href) => ({
    url: href,
    externalId: extractExternalId(href),
    categorySlug,
    categoryPath,
  }));
}

/** Парсит страницу товара (fetch + cheerio) */
async function parseProductDetail(item) {
  let html;
  try {
    html = await fetchHtml(item.url, productPageTimeout);
  } catch (e) {
    console.warn(`  Ошибка загрузки ${item.url}: ${e.message}`);
    return null;
  }
  await sleep(300);

  const $ = load(html);

  let name = $('h1').first().text()?.trim();
  if (!name) name = $('.item-title, .product-title, .detail_name').first().text()?.trim();
  if (!name) name = null;
  if (!name) return null;

  const priceEl = $('.price, .item-price .value, [data-value]').first();
  const priceText = priceEl.text() || null;
  const price = parsePrice(priceText);

  const oldPriceEl = $('.old-price, .item-price .old, .discount-price').first();
  const oldPriceText = oldPriceEl.text() || null;
  const oldPrice = parsePrice(oldPriceText);

  const bodyText = $('body').text() || '';
  const inStock = !/под заказ|нет в наличии|ожидается/i.test(bodyText) || /в наличии/i.test(bodyText);

  const descEl = $('.item-desc, .product-description, .detail_text').first();
  const description = descEl.text()?.trim() || null;

  const thumbImages = [];
  $('.catalog-detail .item_slider img, .bx-catalog-element-shot img, .detail_img img, img[src*="upload"], img[src*="resize_cache"]').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (!src || thumbImages.includes(src)) return;
    if (src.includes('upload') || src.includes('resize_cache')) {
      thumbImages.push(ensureAbs(src));
    }
  });
  const images = thumbImages.slice(0, 5).map((t) => thumbToFullUrl(t) || t);

  const specs = {};
  $('table.detail tr, .props-list tr, .characteristics tr, .bx_characteristics tr, .item_properties tr').each((_, row) => {
    const cells = $(row).find('td, th, span').map((__, el) => $(el).text()?.trim()).get();
    if (cells.length >= 2) {
      const key = (cells[0]?.replace(/[:\s]+$/, '') || `prop_${cells.length}`).toLowerCase().replace(/\s+/g, '_');
      const value = cells[1] || cells[0];
      if (key && value) specs[key] = value;
    }
  });

  const warrantyMatch = bodyText.match(/(\d+)\s*мес/i);
  const warrantyMonths = warrantyMatch ? parseInt(warrantyMatch[1], 10) : 12;

  const manufacturerMatch = name?.match(/\b(MSI|ASUS|Gigabyte|Palit|AMD|Intel|NVIDIA|G\.Skill|Kingston|Corsair|Samsung|WD|Western Digital|be quiet!|Seasonic|Fractal|NZXT|ASRock|EVGA|Sapphire|PowerColor|XFX|Inno3D|Zotac|KFA2|Aorus|ROG|TUF|Lenovo|Acer|Dell|HP|BenQ|LG|Xiaomi|Realme)\b/i);
  const manufacturer = manufacturerMatch ? manufacturerMatch[1] : null;

  return {
    ...item,
    name,
    price: price || 0,
    oldPrice: oldPrice || null,
    stock: inStock ? 5 : 0,
    description: description || name,
    specifications: specs,
    warrantyMonths,
    manufacturer,
    images: images.length > 0 ? images : [],
  };
}

async function main() {
  console.log('Парсер X-Core.by для GoldPC (fetch, без браузера)');
  console.log('Категории:', categoriesToScrape.map((c) => c.slug).join(', '));
  if (slowMode) console.log('Режим --slow: увеличенные таймауты');
  console.log('');

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let allProducts = [];
  if (categoriesFilter?.length && existsSync(OUTPUT_FILE)) {
    const existing = JSON.parse(readFileSync(OUTPUT_FILE, 'utf8'));
    allProducts = (existing.products || []).filter((p) => !categoriesFilter.includes(p.categorySlug));
    console.log(`Загружено ${allProducts.length} товаров (без ${categoriesFilter.join(', ')})`);
  }

  const handleInterrupt = () => {
    if (allProducts.length > 0) {
      saveProducts(allProducts);
      console.log(`\nСохранено ${allProducts.length} товаров (прервано)`);
    }
    process.exit(0);
  };
  process.on('SIGINT', handleInterrupt);
  process.on('SIGTERM', handleInterrupt);

  try {
    for (const cat of categoriesToScrape) {
      console.log(`Категория: ${cat.slug} (${cat.path})`);
      const items = await parseCategoryListing(cat.path, cat.slug);
      console.log(`  Найдено ссылок: ${items.length}`);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        process.stdout.write(`  [${i + 1}/${items.length}] ${item.externalId || item.url.slice(-50)}\r`);
        const product = await parseProductDetail(item);
        if (product && product.price > 0) {
          product.sku = `XCORE-${product.externalId || product.name?.slice(0, 20).replace(/\W/g, '') || Date.now()}`;
          allProducts.push(product);
          saveProducts(allProducts);
        }
        await sleep(delayMs);
      }
      console.log(`  Импортировано: ${allProducts.filter((p) => p.categorySlug === cat.slug).length}`);
    }
  } finally {
    process.off('SIGINT', handleInterrupt);
    process.off('SIGTERM', handleInterrupt);
  }

  saveProducts(allProducts);
  console.log(`\nГотово. Сохранено ${allProducts.length} товаров в ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
