#!/usr/bin/env node
/**
 * Проверка: сколько product_images с path, сколько файлов в uploads/products,
 * для выборки — совпадение ожидаемого SHA256-пути с файлами на диске.
 */
import { createHash } from 'crypto';
import { existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const UPLOADS = join(REPO_ROOT, 'src', 'CatalogService', 'uploads');

/** Строка подключения как у CatalogService (Npgsql в env или переменные из .env). */
function resolveCatalogDbUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const cs = process.env.ConnectionStrings__PostgreSQL;
  if (cs && cs.includes('Host=')) {
    const host = cs.match(/Host=([^;]+)/i)?.[1]?.trim() ?? 'localhost';
    const port = cs.match(/Port=(\d+)/i)?.[1] ?? '5432';
    const database = cs.match(/Database=([^;]+)/i)?.[1]?.trim() ?? 'goldpc_catalog';
    const user = cs.match(/Username=([^;]+)/i)?.[1]?.trim() ?? 'postgres';
    const password = cs.match(/Password=([^;]+)/i)?.[1] ?? '';
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }
  const host = process.env.DATABASE_HOST ?? 'localhost';
  const port = process.env.DATABASE_PORT ?? '5434';
  const database = process.env.DATABASE_NAME ?? 'goldpc_catalog';
  const user = process.env.DATABASE_USER ?? process.env.DB_USER ?? 'postgres';
  const password = process.env.DATABASE_PASSWORD ?? process.env.DB_PASSWORD ?? 'admin';
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

const dbUrl = resolveCatalogDbUrl();

function urlToHash(url) {
  return createHash('sha256').update(url, 'utf8').digest('hex');
}

function countFilesRecursive(dir) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) n += countFilesRecursive(p);
    else n++;
  }
  return n;
}

async function main() {
  const pg = await import('pg');
  const pool = new pg.default.Pool({ connectionString: dbUrl, max: 2 });
  try {
    const allRows = await pool.query(`SELECT count(*)::int AS c FROM product_images`);
    const total = await pool.query(
      `SELECT count(*)::int AS c FROM product_images WHERE url IS NOT NULL AND url != '' AND url NOT LIKE '%/upload/CNext/%'`
    );
    const withPath = await pool.query(
      `SELECT count(*)::int AS c FROM product_images WHERE path IS NOT NULL AND trim(path) != ''`
    );
    const nullPath = await pool.query(
      `SELECT count(*)::int AS c FROM product_images WHERE (path IS NULL OR trim(path) = '') AND url IS NOT NULL AND url != '' AND url NOT LIKE '%/upload/CNext/%'`
    );

    const sample = await pool.query(
      `SELECT id, url, path FROM product_images WHERE url IS NOT NULL AND url != '' ORDER BY id LIMIT 8`
    );

    const filesUnderProducts = countFilesRecursive(join(UPLOADS, 'products'));

    console.log('--- verify-local-images ---');
    console.log('DB:', dbUrl.replace(/:[^:@]+@/, ':****@'));
    console.log('Uploads:', UPLOADS);
    console.log('');
    console.log('Всего строк в product_images:', allRows.rows[0]?.c);
    console.log('Строк в БД (url не placeholder):', total.rows[0]?.c);
    console.log('  path заполнен:', withPath.rows[0]?.c);
    console.log('  path ещё пустой:', nullPath.rows[0]?.c);
    console.log('Файлов на диске в uploads/products:', filesUnderProducts);
    console.log('');
    console.log('Выборка: для каждой строки — есть ли файл products/{aa}/{hash}.*');
    for (const row of sample.rows) {
      const h = urlToHash(row.url);
      const prefix = h.slice(0, 2);
      const dir = join(UPLOADS, 'products', prefix);
      let onDisk = false;
      if (existsSync(dir)) {
        onDisk = readdirSync(dir).some((f) => f.startsWith(h + '.'));
      }
      const pathOk = row.path && String(row.path).trim() !== '';
      console.log(
        `  id=${row.id} db_path=${pathOk ? 'yes' : 'NO'} expected_file_on_disk=${onDisk ? 'yes' : 'no'} | ${String(row.url).slice(0, 72)}`
      );
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
