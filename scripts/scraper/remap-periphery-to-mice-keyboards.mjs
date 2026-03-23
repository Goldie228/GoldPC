#!/usr/bin/env node
/**
 * Переприсваивает categorySlug для товаров с periphery по categoryPath:
 * - /myshi   -> mice
 * - /klaviatury -> keyboards
 *
 * Использование: node remap-periphery-to-mice-keyboards.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const PRODUCTS_FILE = join(DATA_DIR, 'xcore-products.json');

function main() {
  const data = JSON.parse(readFileSync(PRODUCTS_FILE, 'utf8'));
  const products = data.products || [];

  let miceCount = 0;
  let keyboardsCount = 0;
  let unknownCount = 0;

  for (const p of products) {
    if (p.categorySlug !== 'periphery') continue;

    const path = p.categoryPath || '';
    if (path.includes('/myshi')) {
      p.categorySlug = 'mice';
      miceCount++;
    } else if (path.includes('/klaviatury')) {
      p.categorySlug = 'keyboards';
      keyboardsCount++;
    } else {
      unknownCount++;
    }
  }

  writeFileSync(PRODUCTS_FILE, JSON.stringify({ ...data, products }, null, 2), 'utf8');

  console.log(`Remap periphery -> mice:      ${miceCount}`);
  console.log(`Remap periphery -> keyboards: ${keyboardsCount}`);
  if (unknownCount > 0) {
    console.log(`Unmapped periphery:            ${unknownCount}`);
  }
  console.log(`Saved to ${PRODUCTS_FILE}`);
}

main();
