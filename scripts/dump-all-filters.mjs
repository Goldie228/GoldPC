#!/usr/bin/env node
/**
 * Сбор всех фильтров из всех категорий в один файл для аудита.
 *
 * Использование:
 *   node scripts/dump-all-filters.mjs [--url BASE_URL] [--out FILE]
 *
 * Требует запущенный dev-сервер (backend на :5000 или frontend на :5173 с proxy).
 * По умолчанию: url=http://localhost:5000, out=scripts/scraper/data/all-filters-dump.json
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

const BACKEND_SLUGS = [
  'processors',
  'gpu',
  'motherboards',
  'ram',
  'storage',
  'psu',
  'cases',
  'coolers',
  'monitors',
  'keyboards',
  'mice',
  'headphones',
];

const CATEGORY_NAMES = {
  processors: 'Процессоры',
  gpu: 'Видеокарты',
  motherboards: 'Материнские платы',
  ram: 'ОЗУ',
  storage: 'Накопители',
  psu: 'Блоки питания',
  cases: 'Корпуса',
  coolers: 'Охлаждение',
  monitors: 'Мониторы',
  keyboards: 'Клавиатуры',
  mice: 'Мыши',
  headphones: 'Наушники',
};

async function fetchFilterAttributes(baseUrl, slug) {
  const url = `${baseUrl}/api/v1/catalog/categories/${slug}/filter-attributes`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${url}`);
  }
  const json = await res.json();
  return json?.data ?? json ?? [];
}

async function tryFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const args = process.argv.slice(2);
  let baseUrl = null;
  let outFile = join(PROJECT_ROOT, 'scripts/scraper/data/all-filters-dump.json');

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      baseUrl = args[i + 1].replace(/\/$/, '');
      i++;
    } else if (args[i] === '--out' && args[i + 1]) {
      outFile = args[i + 1];
      i++;
    }
  }

  if (!baseUrl) {
    const urls = ['http://localhost:5000', 'http://localhost:5173'];
    for (const u of urls) {
      try {
        await tryFetch(`${u}/api/v1/catalog/categories`);
        baseUrl = u;
        console.log(`Используется API: ${baseUrl}`);
        break;
      } catch {
        // try next
      }
    }
    if (!baseUrl) {
      console.error('Не удалось подключиться к API. Запусти dev: ./scripts/dev-local.sh');
      process.exit(1);
    }
  }

  console.log(`Fetching filters from ${baseUrl}...`);
  const result = { baseUrl, fetchedAt: new Date().toISOString(), categories: {} };

  for (const slug of BACKEND_SLUGS) {
    try {
      const attrs = await fetchFilterAttributes(baseUrl, slug);
      const name = CATEGORY_NAMES[slug] ?? slug;
      result.categories[slug] = { displayName: name, attributes: attrs };
      console.log(`  ${slug}: ${attrs.length} атрибутов`);
    } catch (err) {
      console.error(`  ${slug}: ОШИБКА ${err.message}`);
      result.categories[slug] = { error: err.message };
    }
  }

  writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\nЗаписано в ${outFile}`);

  // Генерируем Markdown-отчёт для быстрого аудита
  const mdFile = outFile.replace(/\.json$/i, '.md');
  const md = buildMarkdownReport(result);
  writeFileSync(mdFile, md, 'utf-8');
  console.log(`Отчёт: ${mdFile}`);
}

/** Эвристики "плохих" значений для аудита */
function isSuspiciousValue(val) {
  if (!val || typeof val !== 'string') return false;
  const s = val.trim();
  // Слишком длинные
  if (s.length > 80) return true;
  // Много запятых — несколько значений в одном (списки сокетов, интерфейсов и т.п.)
  if ((s.match(/,/g) || []).length >= 3) return true;
  // Сырые булевы (true/false) — должны быть "Да"/"Нет"
  if (/^(true|false)$/i.test(s)) return true;
  // Переносы строк / лишние пробелы в значении
  if (/\n|\r/.test(s) || /\s{3,}/.test(s)) return true;
  return false;
}

function buildMarkdownReport(result) {
  const lines = [
    '# Аудит фильтров каталога',
    '',
    `Дата: ${result.fetchedAt}`,
    `API: ${result.baseUrl}`,
    '',
    '---',
  ];
  for (const [slug, data] of Object.entries(result.categories)) {
    if (data.error) {
      lines.push(`## ${slug}`);
      lines.push('');
      lines.push(`⚠️ Ошибка: ${data.error}`);
      lines.push('');
      continue;
    }
    const name = data.displayName ?? slug;
    lines.push(`## ${name} (\`${slug}\`)`);
    lines.push('');
    for (const attr of data.attributes || []) {
      const key = attr.key ?? '?';
      const display = attr.displayName ?? key;
      const type = attr.filterType ?? '?';
      lines.push(`### ${display} (\`${key}\`) — ${type}`);
      lines.push('');
      if (attr.values && attr.values.length > 0) {
        const bad = attr.values.filter(isSuspiciousValue);
        if (bad.length > 0) {
          lines.push('**⚠️ Подозрительные значения:**');
          bad.forEach((v) => lines.push(`- \`${v}\``));
          lines.push('');
        }
        lines.push(`Всего значений: ${attr.values.length}`);
        lines.push('');
        lines.push('```');
        attr.values.slice(0, 50).forEach((v) => lines.push(v));
        if (attr.values.length > 50) lines.push(`... и ещё ${attr.values.length - 50}`);
        lines.push('```');
      } else if (attr.minValue != null && attr.maxValue != null) {
        lines.push(`Диапазон: ${attr.minValue} — ${attr.maxValue}`);
      }
      lines.push('');
    }
  }
  return lines.join('\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
