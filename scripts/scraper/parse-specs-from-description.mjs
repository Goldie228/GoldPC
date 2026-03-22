#!/usr/bin/env node

/**
 * Парсит характеристики из поля description в xcore-products.json
 * и записывает их в product.specifications.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_PATH = join(__dirname, 'data', 'xcore-products.json');

// Маппинг для GPU (categorySlug gpu)
// Порядок важен: более специфичные паттерны — выше
const GPU_MAPPING = [
  ['Дата выхода чипа', 'data_vykhoda_na_rynok_2'],
  ['Дата выхода на рынок', 'data_vykhoda_na_rynok_2'],
  ['Производитель графического процессора', 'proizvoditel_graficheskogo_protsessora'],
  ['Графический процессор', 'graficheskiy_protsessor'],
  ['Видеопамять', 'videopamyat'],
  ['Тип видеопамяти', 'tip_videopamyati'],
  ['Ширина шины памяти', 'shirina_shiny_pamyati'],
  ['Охлаждение', 'okhlazhdenie_1'],
  ['Разъёмы питания', 'razyemy_pitaniya'],
  ['Интерфейс', 'interfeys_1'],
  ['Рекомендуемый блок питания', 'rekomenduemyy_blok_pitaniya'],
  ['Длина видеокарты', 'dlina_videokarty'],
  ['Высота видеокарты', 'vysota_videokarty'],
];

// Маппинг для processors
const PROCESSORS_MAPPING = [
  ['Сокет', 'socket'],
  ['Количество ядер', 'cores'],
  ['Максимальное количество потоков', 'threads'],
  ['Расчетная тепловая мощность (TDP)', 'tdp'],
  ['Базовая расчетная тепловая мощность (TDP)', 'tdp'],
  ['Расчетная базовая тепловая мощность (TDP)', 'tdp'],
  ['Дата выхода на рынок', 'data_vykhoda_na_rynok'],
];

/**
 * Парсит description по regex: "Название: Значение" или "-\s*Название: Значение"
 */
function parseDescription(description) {
  if (!description || typeof description !== 'string') return [];
  const pairs = [];
  const re = /(?:^|\n)\s*-?\s*([^:\n]+):\s*(.+?)(?=(?:\n\s*-?\s*[^:\n]+:)|$)/gs;
  let m;
  const seen = new Set();
  while ((m = re.exec(description)) !== null) {
    const name = m[1].trim();
    const value = m[2].trim();
    if (name && value && !seen.has(name)) {
      seen.add(name);
      pairs.push([name, value]);
    }
  }
  return pairs;
}

/**
 * Находит attribute_key по имени (частичное совпадение).
 */
function resolveAttributeKey(name, mapping) {
  const nameLower = name.toLowerCase();
  for (const [pattern, key] of mapping) {
    if (nameLower.includes(pattern.toLowerCase())) return key;
  }
  return null;
}

/**
 * Нормализация значений.
 */
function normalizeValue(value, attributeKey) {
  if (value === undefined || value === null) return value;
  const str = String(value).trim();
  if (!str) return value;

  // Да/Нет → true/false
  const lower = str.toLowerCase();
  if (lower === 'да') return 'true';
  if (lower === 'нет') return 'false';

  // data_vykhoda_na_rynok: "2019 г." → 2019
  if (attributeKey === 'data_vykhoda_na_rynok' || attributeKey === 'data_vykhoda_na_rynok_2') {
    const yearMatch = str.match(/\d{4}/);
    if (yearMatch) return parseInt(yearMatch[0], 10);
  }

  // Число + ГБ (8 ГБ → 8)
  const gbMatch = str.match(/^(\d[\d\s]*)\s*ГБ$/i);
  if (gbMatch) {
    const num = gbMatch[1].replace(/\s/g, '');
    return parseInt(num, 10);
  }

  // Число + МГц (2 280 МГц или 2280 МГц → 2280)
  const mhzMatch = str.match(/(\d[\d\s]*)\s*МГц/i);
  if (mhzMatch) {
    const num = mhzMatch[1].replace(/\s/g, '');
    return parseInt(num, 10);
  }

  // Число + бит (128 бит → 128)
  const bitMatch = str.match(/^(\d[\d\s]*)\s*бит/i);
  if (bitMatch) {
    const num = bitMatch[1].replace(/\s/g, '');
    return parseInt(num, 10);
  }

  // Число + Вт (500 Вт → 500)
  const wattMatch = str.match(/^(\d[\d\s]*)\s*Вт$/i);
  if (wattMatch) {
    const num = wattMatch[1].replace(/\s/g, '');
    return parseInt(num, 10);
  }

  // Число + мм (281 мм → 281)
  const mmMatch = str.match(/^(\d[\d\s.,]*)\s*мм/i);
  if (mmMatch) {
    const num = mmMatch[1].replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(num);
    return Number.isInteger(parsed) ? parsed : parsed;
  }

  // Чистое целое число
  const cleanNum = str.replace(/\s/g, '');
  if (/^\d+$/.test(cleanNum)) return parseInt(cleanNum, 10);

  return str;
}

/**
 * Возвращает маппинг для категории.
 */
function getMapping(categorySlug) {
  if (categorySlug === 'gpu') return GPU_MAPPING;
  if (categorySlug === 'processors') return PROCESSORS_MAPPING;
  return [];
}

function main() {
  const data = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  const products = data.products || [];
  let updatedCount = 0;

  for (const product of products) {
    const description = product.description;
    const categorySlug = product.categorySlug;
    const mapping = getMapping(categorySlug);
    if (mapping.length === 0) continue;

    const pairs = parseDescription(description);
    if (pairs.length === 0) continue;

    const specs = { ...(product.specifications || {}) };
    let hasNew = false;

    for (const [name, value] of pairs) {
      const key = resolveAttributeKey(name, mapping);
      if (!key) continue;

      const normalized = normalizeValue(value, key);
      if (normalized !== undefined && normalized !== null) {
        specs[key] = normalized;
        hasNew = true;
      }
    }

    if (hasNew) {
      product.specifications = specs;
      updatedCount++;
    }
  }

  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Обновлено товаров: ${updatedCount}`);
}

main();
