#!/usr/bin/env node
/**
 * Скачивает изображения товаров и логотипов производителей с внешних URL,
 * сохраняет в uploads/products и uploads/manufacturers, обновляет path в БД.
 *
 * Использование: node download-images.mjs [--concurrency=15] [--limit=100] [--uploads-dir=path]
 * --concurrency=N  параллельных загрузок (по умолчанию 15)
 * --limit=N        обработать только первые N записей (для теста)
 * --uploads-dir=   путь к папке uploads (по умолчанию ../../src/CatalogService/uploads)
 * --db-url=        PostgreSQL connection string (или DATABASE_URL)
 *
 * Требует: npm install pg
 */

import { createHash } from 'crypto';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const DEFAULT_UPLOADS = join(REPO_ROOT, 'src', 'CatalogService', 'uploads');

const args = process.argv.slice(2);
const concurrency = parseInt(args.find((a) => a.startsWith('--concurrency='))?.split('=')[1] || '15', 10);
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;
const uploadsDirArg = args.find((a) => a.startsWith('--uploads-dir='));
const uploadsDir = uploadsDirArg ? uploadsDirArg.split('=')[1] : DEFAULT_UPLOADS;
const dbUrlArg = args.find((a) => a.startsWith('--db-url='));
const dbUrl = dbUrlArg
  ? dbUrlArg.split('=').slice(1).join('=')
  : process.env.DATABASE_URL || process.env.ConnectionStrings__PostgreSQL || 'postgresql://postgres:admin@localhost:5434/goldpc_catalog';

const USER_AGENT = 'Mozilla/5.0 (GoldPC/1.0; +https://goldpc.by)';
const REQUEST_TIMEOUT_MS = 25000;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

const XCORE_PLACEHOLDER = '/upload/CNext/';
function isPlaceholder(url) {
  return !url || url.includes(XCORE_PLACEHOLDER);
}

function urlToExt(url) {
  const match = url.match(/\.(jpe?g|png|gif|webp)(?:\?|$)/i);
  return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

function urlToHash(url) {
  return createHash('sha256').update(url).digest('hex');
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

async function fetchWithRetry(url) {
  let lastErr;
  for (let i = 0; i < RETRY_ATTEMPTS; i++) {
    try {
      const controller = new AbortController();
      const to = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'image/*' },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(to);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get('content-type') || '';
      let ext = urlToExt(url);
      if (ct.includes('png')) ext = 'png';
      else if (ct.includes('gif')) ext = 'gif';
      else if (ct.includes('webp')) ext = 'webp';
      return { buf, ext };
    } catch (e) {
      lastErr = e;
      if (i < RETRY_ATTEMPTS - 1) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (i + 1)));
    }
  }
  throw lastErr;
}

async function withPool(fn) {
  const pg = await import('pg');
  const pool = new pg.default.Pool({ connectionString: dbUrl, max: 5 });
  try {
    return await fn(pool);
  } finally {
    await pool.end();
  }
}

async function downloadProductImages(pool, uploadsBase) {
  const productsDir = join(uploadsBase, 'products');
  ensureDir(productsDir);

  const res = await pool.query(
    `SELECT id, url FROM product_images WHERE path IS NULL AND url IS NOT NULL AND url != '' AND url NOT LIKE $1`,
    ['%' + XCORE_PLACEHOLDER + '%']
  );
  let rows = res.rows;
  if (limit) rows = rows.slice(0, limit);

  let downloaded = 0;
  let errors = 0;
  const updatePath = async (id, path) => {
    await pool.query('UPDATE product_images SET path = $1 WHERE id = $2', [path, id]);
  };

  const processOne = async (row) => {
    if (isPlaceholder(row.url)) return;
    const hash = urlToHash(row.url);
    const prefix = hash.slice(0, 2);
    const ext = urlToExt(row.url);
    const relPath = `products/${prefix}/${hash}.${ext}`;
    const fullPath = join(uploadsBase, relPath);
    const pathValue = `/uploads/${relPath}`;

    if (existsSync(fullPath)) {
      await updatePath(row.id, pathValue);
      downloaded++;
      return;
    }
    try {
      const { buf } = await fetchWithRetry(row.url);
      const dir = join(uploadsBase, 'products', prefix);
      ensureDir(dir);
      writeFileSync(fullPath, buf);
      await updatePath(row.id, pathValue);
      downloaded++;
    } catch (e) {
      console.error(`  [ERROR] ${row.url}: ${e.message}`);
      errors++;
    }
  };

  for (let i = 0; i < rows.length; i += concurrency) {
    const batch = rows.slice(i, i + concurrency);
    await Promise.all(batch.map(processOne));
    if ((i + concurrency) % 100 === 0 || i + concurrency >= rows.length) {
      console.log(`  Product images: ${downloaded} downloaded, ${errors} errors (${i + batch.length}/${rows.length})`);
    }
  }
  return { downloaded, errors, total: rows.length };
}

async function downloadManufacturerLogos(pool, uploadsBase) {
  const manufacturersDir = join(uploadsBase, 'manufacturers');
  ensureDir(manufacturersDir);

  const res = await pool.query(
    `SELECT id, logo_url FROM manufacturers WHERE logo_path IS NULL AND logo_url IS NOT NULL AND logo_url != '' AND logo_url NOT LIKE $1`,
    ['%' + XCORE_PLACEHOLDER + '%']
  );
  let rows = res.rows;
  if (limit) rows = rows.slice(0, limit);

  let downloaded = 0;
  let errors = 0;
  const updatePath = async (id, path) => {
    await pool.query('UPDATE manufacturers SET logo_path = $1 WHERE id = $2', [path, id]);
  };

  const processOne = async (row) => {
    const url = row.logo_url;
    if (isPlaceholder(url)) return;
    const hash = urlToHash(url);
    const ext = urlToExt(url);
    const dir = join(uploadsBase, 'manufacturers', row.id);
    ensureDir(dir);
    const relPath = `manufacturers/${row.id}/${hash}.${ext}`;
    const fullPath = join(uploadsBase, relPath);
    const pathValue = `/uploads/${relPath}`;

    if (existsSync(fullPath)) {
      await updatePath(row.id, pathValue);
      downloaded++;
      return;
    }
    try {
      const { buf } = await fetchWithRetry(url);
      writeFileSync(fullPath, buf);
      await updatePath(row.id, pathValue);
      downloaded++;
    } catch (e) {
      console.error(`  [ERROR] manufacturer ${row.id} ${url}: ${e.message}`);
      errors++;
    }
  };

  await Promise.all(rows.map(processOne));
  console.log(`  Manufacturer logos: ${downloaded} downloaded, ${errors} errors (${rows.length} total)`);
  return { downloaded, errors, total: rows.length };
}

async function main() {
  console.log('Download images -> local uploads, update DB path');
  console.log('  DB:', dbUrl.replace(/:[^:@]+@/, ':****@'));
  console.log('  Uploads:', uploadsDir);
  console.log('  Concurrency:', concurrency);
  if (limit) console.log('  Limit:', limit);

  ensureDir(uploadsDir);

  await withPool(async (pool) => {
    console.log('\n--- Product images ---');
    const prodResult = await downloadProductImages(pool, uploadsDir);
    console.log('\n--- Manufacturer logos ---');
    const mfrResult = await downloadManufacturerLogos(pool, uploadsDir);

    console.log('\n--- Summary ---');
    console.log(`  Product images: ${prodResult.downloaded} done, ${prodResult.errors} errors`);
    console.log(`  Manufacturer logos: ${mfrResult.downloaded} done, ${mfrResult.errors} errors`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
