#!/usr/bin/env node
/**
 * Оставляет в xcore-products.json и xcore-images.json только товары с хотя бы одной
 * картинкой в xcore-images.json. В товарах поле images перезаписывается из xcore-images.json.
 *
 * Использование: node sync-products-with-images.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const PRODUCTS_FILE = join(DATA_DIR, 'xcore-products.json');
const IMAGES_FILE = join(DATA_DIR, 'xcore-images.json');

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];
  return images.map((u) => (typeof u === 'string' ? u.trim() : '')).filter(Boolean);
}

function main() {
  const imagesData = JSON.parse(readFileSync(IMAGES_FILE, 'utf8'));
  const imageRows = imagesData.products || [];

  /** @type {Map<string, string[]>} */
  const skuToImages = new Map();
  for (const row of imageRows) {
    const sku = row.sku;
    if (!sku) continue;
    const urls = normalizeImages(row.images);
    if (urls.length === 0) continue;
    skuToImages.set(sku, urls);
  }

  const productsData = JSON.parse(readFileSync(PRODUCTS_FILE, 'utf8'));
  const products = productsData.products || [];

  const kept = [];
  for (const p of products) {
    const sku = p.sku;
    if (!sku) continue;
    const urls = skuToImages.get(sku);
    if (!urls || urls.length === 0) continue;
    kept.push({ ...p, images: urls });
  }

  const syncedImageProducts = kept.map((p) => ({
    sku: p.sku,
    images: skuToImages.get(p.sku),
  }));

  const now = new Date().toISOString();

  writeFileSync(
    PRODUCTS_FILE,
    JSON.stringify(
      {
        source: productsData.source || 'x-core.by',
        scrapedAt: productsData.scrapedAt || now,
        syncedImagesAt: now,
        productCount: kept.length,
        products: kept,
      },
      null,
      2
    ),
    'utf8'
  );

  writeFileSync(
    IMAGES_FILE,
    JSON.stringify(
      {
        source: imagesData.source || 'x-core.by',
        fetchedAt: imagesData.fetchedAt || now,
        syncedAt: now,
        productCount: syncedImageProducts.length,
        withImagesCount: syncedImageProducts.length,
        products: syncedImageProducts,
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(`Было товаров (products): ${products.length}`);
  console.log(`Было записей (images):   ${imageRows.length}`);
  console.log(`SKU с картинками:        ${skuToImages.size}`);
  console.log(`Осталось в обоих файлах: ${kept.length}`);
  console.log(`Отфильтровано (нет фото в images.json): ${products.length - kept.length}`);
}

main();
