#!/usr/bin/env node
/**
 * Параллельный скрапер XCore.by для GoldPC
 * Запускает все категории параллельно (до CONCURRENCY штук одновременно).
 * Каждая категория пишет в свой файл, потом всё объединяется.
 *
 * Использование:
 *   node scrape-parallel.mjs                 # все категории
 *   node scrape-parallel.mjs --slow          # увеличенные таймауты
 *   node scrape-parallel.mjs --conc=2        # макс. 2 параллельных процесса
 *   node scrape-parallel.mjs --categories=gpu,processors  # только эти
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { FULL_CATEGORIES } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'data');
const FINAL_OUTPUT = join(OUTPUT_DIR, 'xcore-products.json');

const slowMode = process.argv.includes('--slow');
const concArg = process.argv.find((a) => a.startsWith('--conc='));
const MAX_CONCURRENCY = concArg ? parseInt(concArg.split('=')[1], 10) : 4;
const categoriesArg = process.argv.find((a) => a.startsWith('--categories='));
const categoriesFilter = categoriesArg
  ? categoriesArg.split('=')[1].split(',').map((s) => s.trim())
  : null;

const categories = categoriesFilter
  ? FULL_CATEGORIES.filter((c) => categoriesFilter.includes(c.slug))
  : FULL_CATEGORIES;

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

function log(msg) {
  const t = new Date().toLocaleTimeString('ru-RU', { hour12: false });
  console.log(`[${t}] ${msg}`);
}

/** Запуск скрапера для одной категории в дочернем процессе */
function scrapeCategory(cat) {
  return new Promise((resolve) => {
    const outFile = join(OUTPUT_DIR, `xcore-products-${cat.slug}.json`);
    const scriptArgs = [`--categories=${cat.slug}`, `--output=${outFile}`];
    if (slowMode) scriptArgs.push('--slow');
    // -- нужен чтобы Node не интерпретировал --output как свой флаг
    const args = ['--', 'index.mjs', ...scriptArgs];

    log(`▶ ${cat.slug}: запуск`);
    const child = spawn('node', args, {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Прокидываем stdout/stderr с префиксом категории
    child.stdout.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) process.stdout.write(`  [${cat.slug}] ${line}\n`);
      }
    });
    child.stderr.on('data', (chunk) => {
      process.stderr.write(`  [${cat.slug}] ${chunk}`);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        log(`✗ ${cat.slug}: завершился с кодом ${code}`);
        resolve({ slug: cat.slug, file: outFile, ok: false });
        return;
      }

      if (existsSync(outFile)) {
        try {
          const data = JSON.parse(readFileSync(outFile, 'utf8'));
          const count = data.products?.length || 0;
          log(`✓ ${cat.slug}: ${count} товаров`);
          resolve({ slug: cat.slug, file: outFile, ok: true, count });
        } catch (e) {
          log(`✗ ${cat.slug}: ошибка чтения — ${e.message}`);
          resolve({ slug: cat.slug, file: outFile, ok: false });
        }
      } else {
        log(`✗ ${cat.slug}: файл не создан`);
        resolve({ slug: cat.slug, file: outFile, ok: false });
      }
    });

    child.on('error', (err) => {
      log(`✗ ${cat.slug}: ошибка запуска — ${err.message}`);
      resolve({ slug: cat.slug, file: outFile, ok: false });
    });
  });
}

/** Объединение всех файлов категорий в один */
function mergeResults(categoryResults) {
  const allProducts = [];
  const mergedSlugs = new Set();

  for (const result of categoryResults) {
    if (!result.ok || !existsSync(result.file)) continue;
    try {
      const data = JSON.parse(readFileSync(result.file, 'utf8'));
      const products = data.products || [];
      for (const p of products) {
        if (!mergedSlugs.has(p.sku)) {
          mergedSlugs.add(p.sku);
          allProducts.push(p);
        }
      }
    } catch {}
  }

  const output = {
    source: 'x-core.by',
    scrapedAt: new Date().toISOString(),
    productCount: allProducts.length,
    products: allProducts,
  };

  writeFileSync(FINAL_OUTPUT, JSON.stringify(output, null, 2), 'utf8');
  return allProducts.length;
}

async function main() {
  log(`Параллельный скрапер (конкурентность: ${MAX_CONCURRENCY})`);
  log(`Категории: ${categories.map((c) => c.slug).join(', ')}`);
  if (slowMode) log('Режим --slow');
  log('');

  // Пул с ограничением конкурентности
  const results = [];
  const queue = [...categories];
  const running = new Set();

  async function runNext() {
    if (queue.length === 0) return;
    const cat = queue.shift();
    const promise = scrapeCategory(cat).then((result) => {
      running.delete(promise);
      results.push(result);
      return runNext();
    });
    running.add(promise);
  }

  // Запускаем первые N задач
  const initialBatch = Math.min(MAX_CONCURRENCY, categories.length);
  for (let i = 0; i < initialBatch; i++) {
    runNext();
  }

  // Ждём завершения всех
  await Promise.all([...running]);

  log('');
  log('Объединение результатов...');
  const total = mergeResults(results);

  const ok = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;

  log('');
  log(`═══════════════════════════════════════`);
  log(`  Готово! ${total} товаров из ${ok}/${results.length} категорий`);
  if (fail > 0) log(`  Ошибки: ${fail} категорий`);
  log(`  Файл: ${FINAL_OUTPUT}`);
  log(`═══════════════════════════════════════`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
