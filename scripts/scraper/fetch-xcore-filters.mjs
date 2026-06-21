#!/usr/bin/env node
/**
 * Аудит фильтров x-core.by — извлекает блок фильтров со страниц каталога
 * для сравнения с xcore-filter-attributes.json.
 *
 * Использование: node fetch-xcore-filters.mjs [--category=gpu] [--output=report.json]
 * --category  — одна категория (gpu, processors, ram, ...) или "all"
 * --output    — путь к JSON-отчёту (по умолчанию stdout)
 */

import { load } from 'cheerio';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { FULL_CATEGORIES, BASE_URL } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILTER_ATTRS_PATH = join(__dirname, 'config', 'xcore-filter-attributes.json');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const FETCH_TIMEOUT_MS = 15000;

let sessionCookies = '';

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
 * Извлекает элементы, похожие на фильтры, со страницы каталога x-core.by.
 * 1C-Битрикс: фильтры могут быть в .bx-filter, ссылках с arrFilter_, блоках "Показать все".
 */
function extractFilterCandidates($) {
  const candidates = [];

  // Ссылки-чипы фильтров (типа "Видеокарты GeForce RTX 5060")
  $('a[href*="videokarty/"]:not([href*="?"]), a[href*="protsessory/"]:not([href*="?"]), a[href*="operativnaya_pamyat"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text()?.trim();
    if (text && text.length > 2 && text.length < 80 && !/^(Показать все|Сравнение|Отложенные|Корзина)/i.test(text)) {
      candidates.push({ type: 'filter_chip', text, href: href.slice(0, 80) });
    }
  });

  // Блок bx-filter (если есть)
  $('.bx-filter-parameters-box-title').each((_, el) => {
    const title = $(el).text()?.trim();
    if (title) candidates.push({ type: 'filter_group', text: title });
  });

  // Чекбоксы/радио с data-атрибутами фильтра
  $('[data-filter], [name^="arrFilter"]').each((_, el) => {
    const name = $(el).attr('name') || $(el).attr('data-filter') || '';
    const label = $(el).closest('label').find('span').first().text()?.trim() || $(el).attr('title') || '';
    if (name || label) candidates.push({ type: 'filter_control', name, label });
  });

  return candidates;
}

async function main() {
  const categoryArg = process.argv.find((a) => a.startsWith('--category='));
  const outputArg = process.argv.find((a) => a.startsWith('--output='));
  const slugFilter = categoryArg ? categoryArg.split('=')[1].trim() : 'all';
  const outputPath = outputArg ? outputArg.split('=')[1].trim() : null;

  const categories =
    slugFilter === 'all'
      ? FULL_CATEGORIES
      : FULL_CATEGORIES.filter((c) => c.slug === slugFilter);

  if (categories.length === 0) {
    console.error('Неизвестная категория:', slugFilter);
    process.exit(1);
  }

  const report = { fetchedAt: new Date().toISOString(), categories: {} };
  let ourConfig = {};
  try {
    ourConfig = JSON.parse(readFileSync(FILTER_ATTRS_PATH, 'utf8'));
  } catch {}

  for (const cat of categories) {
    const url = `${BASE_URL}/${cat.path}/`;
    process.stdout.write(`Fetching ${cat.slug} (${url})... `);
    try {
      const html = await fetchHtml(url);
      const $ = load(html);
      const candidates = extractFilterCandidates($);
      const unique = [...new Map(candidates.map((c) => [c.text || c.name || c.label || JSON.stringify(c), c])).values()];
      report.categories[cat.slug] = {
        url,
        candidatesCount: unique.length,
        candidates: unique.slice(0, 50),
        ourAttributes: ourConfig[cat.slug]?.map((a) => a.attribute_key || a.display_name) ?? [],
      };
      console.log(`${unique.length} candidates`);
    } catch (err) {
      if (!report.categories[cat.slug] || report.categories[cat.slug].error) {
        report.categories[cat.slug] = { url, error: err.message };
      }
      console.log('FAIL:', err.message);
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  const out = JSON.stringify(report, null, 2);
  if (outputPath) {
    writeFileSync(outputPath, out, 'utf8');
    console.log('\nReport written to', outputPath);
  } else {
    console.log('\n--- Report ---\n');
    console.log(out);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
