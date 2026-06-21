#!/usr/bin/env node
/**
 * Парсит характеристики товаров, загружая HTML страницы x-core.by.
 * Использует fetch (без браузера/рендеринга) + cheerio для парсинга.
 * Извлекает данные из div.detail_text (ul/li) и div.description-prod__lists-item.
 *
 * Использование: node parse-specs-from-html.mjs [--test] [--category=gpu,processors] [--limit=50] [--workers=8] [--slow] [--only-empty]
 * --test       — по 2–3 товара на категорию
 * --category   — только указанные категории
 * --limit      — макс. общее число товаров
 * --workers    — кол-во параллельных запросов (по умолчанию 8)
 * --slow       — задержка 2с между батчами, workers=2
 * --only-empty — только товары с пустыми specifications (для retry упавших)
 */

import { load } from 'cheerio';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, 'data', 'xcore-products.json');
const MAPPINGS_PATH = join(__dirname, 'config', 'xcore-spec-mappings.json');
const SAVE_INTERVAL = 100;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const FETCH_TIMEOUT_MS = 20000;
const MAX_RETRIES = 3;

let sessionCookies = '';

const testMode = process.argv.includes('--test');
const slowMode = process.argv.includes('--slow');
const onlyEmpty = process.argv.includes('--only-empty');
const categoryArg = process.argv.find((a) => a.startsWith('--category='));
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const workersArg = process.argv.find((a) => a.startsWith('--workers='));

const categoryFilter = categoryArg ? categoryArg.split('=')[1].split(',').map((s) => s.trim()) : null;
const limitTotal = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;
const concurrency = workersArg ? Math.max(1, parseInt(workersArg.split('=')[1], 10)) : (slowMode ? 2 : 8);
const delayMs = slowMode ? 2000 : 50;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const headers = { 'User-Agent': USER_AGENT, Accept: 'text/html' };
  if (sessionCookies) headers['Cookie'] = sessionCookies;
  const res = await fetch(url, { headers, signal: controller.signal, redirect: 'follow' });
  clearTimeout(to);

  const setCookies = res.headers.getSetCookie?.() || [];
  if (setCookies.length > 0) {
    sessionCookies = setCookies
      .map((c) => {
        const s = typeof c === 'string' ? c : `${c.name}=${c.value}`;
        return s.split(';')[0].trim();
      })
      .join('; ');
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

/**
 * Находит attribute_key по имени (частичное совпадение).
 */
function resolveAttributeKey(name, mapping) {
  if (!mapping || mapping.length === 0) return null;
  const nameLower = name.toLowerCase();
  for (const [pattern, key] of mapping) {
    if (nameLower.includes(pattern.toLowerCase())) return key;
  }
  return null;
}

/**
 * Нормализация значений (из parse-specs-from-description.mjs).
 */
function normalizeValue(value, attributeKey) {
  if (value === undefined || value === null) return value;
  let str = String(value).trim();
  if (!str) return value;

  // Санитизация HTML-мусора (теги, обрезки вроде /LI>)
  str = str.replace(/<[^>]+>/g, '').replace(/\/[a-zA-Z]+>/gi, '').replace(/[<>]/g, '').trim();
  if (!str) return value;

  const lower = str.toLowerCase();
  const selectYesNo = ['integrated_graphics', 'cooling_included', 'multithreading'];
  if (selectYesNo.includes(attributeKey) && (lower === 'да' || lower === 'нет')) {
    return str;
  }
  if (lower === 'да') return 'true';
  if (lower === 'нет') return 'false';

  if (attributeKey === 'data_vykhoda_na_rynok' || attributeKey === 'data_vykhoda_na_rynok_2' || attributeKey === 'release_year') {
    const yearMatch = str.match(/\d{4}/);
    if (yearMatch) return parseInt(yearMatch[0], 10);
  }

  const gbMatch = str.match(/^(\d[\d\s.,]*)\s*ГБ$/i);
  if (gbMatch) return parseInt(gbMatch[1].replace(/\s/g, '').replace(',', '.'), 10) || parseFloat(gbMatch[1].replace(/\s/g, '').replace(',', '.'));

  const tbMatch = str.match(/^(\d[\d\s.,]*)\s*ТБ$/i);
  if (tbMatch) return Math.round(parseFloat(tbMatch[1].replace(/\s/g, '').replace(',', '.')) * 1024) || str;

  const mhzMatch = str.match(/(\d[\d\s]*)\s*МГц/i);
  if (mhzMatch) return parseInt(mhzMatch[1].replace(/\s/g, ''), 10);

  const ghzMatch = str.match(/(\d[\d\s.,]*)\s*ГГц/i);
  if (ghzMatch && (attributeKey === 'base_freq' || attributeKey === 'max_freq')) {
    const num = parseFloat(ghzMatch[1].replace(/\s/g, '').replace(',', '.'));
    return Number.isNaN(num) ? str : num;
  }

  const mbMatch = str.match(/(\d[\d\s.,]*)\s*МБ/i);
  if (mbMatch && (attributeKey === 'cache_l2' || attributeKey === 'cache_l3')) {
    const num = parseFloat(mbMatch[1].replace(/\s/g, '').replace(',', '.'));
    return Number.isNaN(num) ? str : num;
  }

  const nmMatch = str.match(/(\d[\d\s.,]*)\s*нм/i);
  if (nmMatch && attributeKey === 'process_nm') {
    const num = parseInt(nmMatch[1].replace(/\s/g, ''), 10);
    return Number.isNaN(num) ? str : num;
  }

  const bitMatch = str.match(/^(\d[\d\s]*)\s*бит/i);
  if (bitMatch) return parseInt(bitMatch[1].replace(/\s/g, ''), 10);

  const wattMatch = str.match(/^(\d[\d\s]*)\s*Вт$/i);
  if (wattMatch) return parseInt(wattMatch[1].replace(/\s/g, ''), 10);

  const voltMatch = str.match(/^(\d[\d.,]*)\s*В$/i);
  if (voltMatch && attributeKey === 'voltage') {
    return parseFloat(voltMatch[1].replace(',', '.')) || str;
  }

  const mmMatch = str.match(/^(\d[\d\s.,]*)\s*мм/i);
  if (mmMatch) {
    const num = mmMatch[1].replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(num);
    return Number.isInteger(parsed) ? parsed : parsed;
  }

  const inchMatch = str.match(/^(\d[\d.,]*)\s*["']?/i);
  if (attributeKey === 'diagonal' && inchMatch) {
    return parseFloat(inchMatch[1].replace(',', '.')) || str;
  }

  const cleanNum = str.replace(/\s/g, '');
  if (/^\d+$/.test(cleanNum)) return parseInt(cleanNum, 10);

  // "1 модуль", "2 модуля" -> 1, 2
  const kitMatch = str.match(/^(\d+)\s*модул/i);
  if (kitMatch && attributeKey === 'kit_modules') {
    return parseInt(kitMatch[1], 10);
  }

  return str;
}

/**
 * Извлекает пары "Название: Значение" из div.detail_text (ul > li).
 */
function extractFromDetailText($) {
  const pairs = [];
  $('.detail_text ul li').each((_, el) => {
    const text = $(el).text()?.trim();
    if (!text) return;
    const colonIdx = text.indexOf(':');
    if (colonIdx < 0) return;
    const name = text.slice(0, colonIdx).trim();
    const value = text.slice(colonIdx + 1).trim();
    if (name && value) pairs.push([name, value]);
  });
  return pairs;
}

/**
 * Извлекает пары из div.description-prod__lists-item (Гарантия и др.).
 */
function extractFromDescLists($) {
  const pairs = [];
  $('.description-prod__lists-item').each((_, el) => {
    const nameEl = $(el).find('.description-prod__name');
    const valEl = $(el).find('.description-prod__val');
    const name = nameEl.text()?.trim()?.replace(/:\s*$/, '');
    const value = valEl.text()?.trim();
    if (name && value) pairs.push([name, value]);
  });
  return pairs;
}

/**
 * Извлекает пары «Ключ: значение» из plain text (например description).
 * Строки вида "Конструкция: накладные", "Интерфейс: 3.5 мм".
 */
function extractFromDescription(description, categorySlug, mappings) {
  if (!description || typeof description !== 'string') return {};
  const mapping = mappings[categorySlug];
  if (!mapping || mapping.length === 0) return {};

  const text = description
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  const lines = text.split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean);

  const specs = {};
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) continue;
    const name = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (!name || !value) continue;
    const key = resolveAttributeKey(name, mapping);
    if (!key) continue;
    const normalized = normalizeValue(value, key);
    if (normalized !== undefined && normalized !== null) {
      specs[key] = normalized;
    }
  }
  return specs;
}

/**
 * Парсит HTML страницы и возвращает объект specifications.
 * Использует cheerio без рендеринга (только парсинг DOM).
 */
function parseSpecsFromHtml(html, categorySlug, mappings) {
  const $ = load(html);
  const pairs = [
    ...extractFromDetailText($),
    ...extractFromDescLists($),
  ];

  const mapping = mappings[categorySlug];
  if (!mapping || mapping.length === 0) return {};

  const specs = {};
  for (const [name, value] of pairs) {
    const key = resolveAttributeKey(name, mapping);
    if (!key) continue;
    const normalized = normalizeValue(value, key);
    if (normalized !== undefined && normalized !== null) {
      specs[key] = normalized;
    }
  }
  return specs;
}

function saveData(data) {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

async function main() {
  if (!existsSync(DATA_PATH)) {
    console.error('Файл не найден:', DATA_PATH);
    process.exit(1);
  }
  if (!existsSync(MAPPINGS_PATH)) {
    console.error('Конфиг не найден:', MAPPINGS_PATH);
    process.exit(1);
  }

  const mappings = JSON.parse(readFileSync(MAPPINGS_PATH, 'utf8'));
  const data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  let products = data.products || [];

  if (categoryFilter?.length) {
    products = products.filter((p) => categoryFilter.includes(p.categorySlug));
  }

  if (testMode) {
    const perCategory = 3;
    const byCategory = {};
    for (const p of products) {
      const slug = p.categorySlug;
      if (!byCategory[slug]) byCategory[slug] = [];
      if (byCategory[slug].length < perCategory) byCategory[slug].push(p);
    }
    products = Object.values(byCategory).flat();
  }

  if (limitTotal != null && limitTotal > 0) {
    products = products.slice(0, limitTotal);
  }

  if (onlyEmpty) {
    products = products.filter((p) => !p.specifications || Object.keys(p.specifications || {}).length === 0);
    console.log(`Режим --only-empty: ${products.length} товаров без specifications`);
  }

  const total = products.length;
  console.log(`Парсинг характеристик: ${total} товаров`);
  if (testMode) console.log('Режим --test');
  if (categoryFilter?.length) console.log('Категории:', categoryFilter.join(', '));
  if (limitTotal) console.log('Лимит:', limitTotal);
  console.log(`Параллельных запросов: ${concurrency}`);
  console.log(`Пауза между батчами: ${delayMs} мс`);
  console.log('');

  const stats = { updated: 0, failed: 0, skipped: 0, byCategory: {} };
  let completed = 0;
  let lastSave = 0;

  const handleInterrupt = () => {
    saveData(data);
    console.log('\nСохранено (прервано)');
    process.exit(0);
  };
  process.on('SIGINT', handleInterrupt);
  process.on('SIGTERM', handleInterrupt);

  async function processOne(product, index) {
    const slug = product.categorySlug;
    const shortName = product.externalId || product.name?.slice(0, 40) || product.url?.slice(-40) || '?';
    let html = null;
    let lastErr = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        html = await fetchHtml(product.url);
        break;
      } catch (e) {
        lastErr = e;
        if (attempt < MAX_RETRIES - 1) await sleep(Math.pow(2, attempt) * 500);
      }
    }
    if (!html) {
      stats.failed++;
      if (!stats.byCategory[slug]) stats.byCategory[slug] = { ok: 0, fail: 0 };
      stats.byCategory[slug].fail++;
      return { ok: false, msg: `FAIL: ${lastErr?.message || 'unknown'}` };
    }
    let specs = parseSpecsFromHtml(html, slug, mappings);
    if (Object.keys(specs).length === 0 && product.description) {
      specs = extractFromDescription(product.description, slug, mappings);
    }
    if (Object.keys(specs).length === 0 && (!mappings[slug] || mappings[slug].length === 0)) {
      stats.skipped++;
      if (!stats.byCategory[slug]) stats.byCategory[slug] = { ok: 0, fail: 0 };
      return { ok: false, skip: true };
    }
    product.specifications = { ...(product.specifications || {}), ...specs };
    stats.updated++;
    if (!stats.byCategory[slug]) stats.byCategory[slug] = { ok: 0, fail: 0 };
    stats.byCategory[slug].ok++;
    return { ok: true, count: Object.keys(specs).length };
  }

  async function runWithConcurrency(items, concurrencyLimit) {
    const executing = new Set();
    for (let i = 0; i < items.length; i++) {
      const product = items[i];
      const index = i;
      const p = processOne(product, index).then((r) => {
        completed++;
        const slug = product.categorySlug;
        const shortName = product.externalId || product.name?.slice(0, 40) || '?';
        if (r.msg) process.stdout.write(`[${completed}/${total}] ${slug}: ${shortName} — ${r.msg}\n`);
        else if (r.skip) process.stdout.write(`[${completed}/${total}] ${slug}: ${shortName} — SKIP (no mapping)\r`);
        else process.stdout.write(`[${completed}/${total}] ${slug}: ${shortName} — OK (${r.count} specs)\r`);
        if (completed - lastSave >= SAVE_INTERVAL) {
          lastSave = completed;
          saveData(data);
          process.stdout.write(` [saved]\n`);
        }
        return r;
      });
      executing.add(p);
      p.finally(() => executing.delete(p));
      if (executing.size >= concurrencyLimit) {
        await Promise.race(executing);
        if (delayMs > 0 && concurrencyLimit <= 4) await sleep(delayMs);
      }
    }
    await Promise.all(executing);
  }

  await runWithConcurrency(products, concurrency);

  process.off('SIGINT', handleInterrupt);
  process.off('SIGTERM', handleInterrupt);

  saveData(data);

  console.log('\n');
  console.log('Готово.');
  console.log(`Обновлено: ${stats.updated}`);
  console.log(`Ошибок: ${stats.failed}`);
  console.log(`Пропущено (нет маппинга): ${stats.skipped}`);
  if (Object.keys(stats.byCategory).length > 0) {
    console.log('По категориям:');
    for (const [cat, s] of Object.entries(stats.byCategory)) {
      console.log(`  ${cat}: ok=${s.ok}, fail=${s.fail}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
