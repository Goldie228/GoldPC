/**
 * Разбор структурированного описания товара (секции, пары «ключ — значение»).
 * Общий модуль для ProductPage и страницы сравнения (гибрид specifications + description).
 */

import type { ProductSpecifications } from '../api/types';
import { normalizeSpecKey } from './comparison/comparisonRules';

export const DESCRIPTION_SECTIONS = [
  'Общая информация',
  'Основные',
  'Технические характеристики',
  'Технические характеристики и функциональность',
  'Функциональные особенности',
  'Звук',
  'Микрофон',
  'Интерфейс',
  'Интерфейсы',
  'Питание',
  'Корпус',
  'Аккумулятор и время работы',
  'Габариты',
  'Комплектация',
  'Особенности конструкции',
  'Кабель',
  'Метки',
] as const;

export type DescriptionBlock = { title?: string; body: string };

export function normalizeDescriptionPreserveLines(input: string): string {
  const text = (input ?? '').replace(/\r/g, '');
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function splitDescriptionByHeadings(description: string): DescriptionBlock[] {
  const text = normalizeDescriptionPreserveLines(description);
  if (!text) return [];

  const known = new Set<string>(DESCRIPTION_SECTIONS);
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const blocks: DescriptionBlock[] = [];
  let current: DescriptionBlock | null = null;

  for (const line of lines) {
    if (known.has(line)) {
      if (current && (current.title || current.body.trim())) blocks.push(current);
      current = { title: line, body: '' };
      continue;
    }
    if (!current) current = { body: '' };
    current.body = current.body ? `${current.body}\n${line}` : line;
  }

  if (current && (current.title || current.body.trim())) blocks.push(current);
  return blocks;
}

export function trimDescriptionBeforeMain(description: string | undefined): string | undefined {
  const raw = normalizeDescriptionPreserveLines(description ?? '');
  if (!raw) return undefined;

  const blocks = splitDescriptionByHeadings(raw);
  if (blocks.length === 0) return raw;

  const mainIdx = blocks.findIndex((b) => (b.title ?? '').trim() === 'Основные');
  if (mainIdx <= 0) return raw;

  const kept = blocks.slice(mainIdx);
  const rebuilt = kept
    .map((b) => {
      const title = (b.title ?? '').trim();
      const body = (b.body ?? '').trim();
      if (title && body) return `${title}\n${body}`;
      if (title) return title;
      return body;
    })
    .filter(Boolean)
    .join('\n');

  return normalizeDescriptionPreserveLines(rebuilt);
}

export function extractKeyValueFromLine(line: string): Array<{ key: string; value: string }> {
  const s = line.trim();
  if (!s) return [];

  const out: Array<{ key: string; value: string }> = [];

  const multiRe =
    /([А-ЯЁA-Za-z0-9().,\-+/%\s]{2,60}?)\s*(?:—|:)\s*([^—:]+?)(?=\s+[А-ЯЁA-Za-z0-9().,\-+/%\s]{2,60}?\s*(?:—|:)\s*|$)/g;
  const multiMatches = Array.from(s.matchAll(multiRe));
  if (multiMatches.length >= 2) {
    for (const m of multiMatches) {
      const key = (m[1] ?? '').trim();
      const value = (m[2] ?? '').trim();
      if (key && value) out.push({ key, value });
    }
    return out;
  }

  const colonIdx = s.indexOf(':');
  if (colonIdx > 0) {
    const key = s.slice(0, colonIdx).trim();
    const value = s.slice(colonIdx + 1).trim();
    if (key && value) return [{ key, value }];
  }

  const dashIdx = s.indexOf('—');
  if (dashIdx > 0) {
    const key = s.slice(0, dashIdx).trim();
    const value = s.slice(dashIdx + 1).trim();
    if (key && value) return [{ key, value }];
  }

  return [];
}

export function extractKeyValueItemsFromBody(body: string): { items: Array<{ key: string; value: string }>; rest: string } {
  const text = normalizeDescriptionPreserveLines(body);
  if (!text) return { items: [], rest: '' };

  const items: Array<{ key: string; value: string }> = [];
  const restLines: string[] = [];

  const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    if ((line === '—' || line === '-' || line === '–') && i > 0 && i + 1 < rawLines.length) {
      const prev = rawLines[i - 1];
      const next = rawLines[i + 1];
      const merged = `${prev} — ${next}`;
      const pairs = extractKeyValueFromLine(merged);
      if (pairs.length > 0) {
        if (restLines.length > 0 && restLines[restLines.length - 1] === prev) {
          restLines.pop();
        }
        items.push(...pairs);
        i++;
        continue;
      }
    }

    const pairs = extractKeyValueFromLine(line);
    if (pairs.length > 0) items.push(...pairs);
    else restLines.push(line);
  }

  return { items, rest: restLines.join('\n').trim() };
}

/**
 * Ключ для слияния с `specifications`: латинские ключи как в API, кириллица — в нижний регистр с подчёркиваниями.
 */
export function normalizeMergedSpecKey(rawKey: string): string {
  const t = rawKey.trim();
  if (!t) return '';
  if (/[a-z][a-zA-Z0-9]*[A-Z]/.test(t)) {
    return normalizeSpecKey(t);
  }
  if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(t)) {
    return normalizeSpecKey(t);
  }
  return t
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-zа-яё0-9_]/gi, '');
}

/**
 * Все пары «ключ — значение», извлечённые из описания (как на странице товара).
 */
export function collectKeyValuePairsFromDescription(description: string | undefined): Array<{ key: string; value: string }> {
  const raw = trimDescriptionBeforeMain(description);
  if (!raw) return [];

  const blocks = splitDescriptionByHeadings(raw);
  if (blocks.length === 0) {
    const { items } = extractKeyValueItemsFromBody(raw);
    return items;
  }

  const all: Array<{ key: string; value: string }> = [];
  for (const block of blocks) {
    const { items } = extractKeyValueItemsFromBody(block.body);
    all.push(...items);
  }
  return all;
}

/**
 * Гибрид: поля из API (`specifications`) имеют приоритет; из описания подставляются только пустые ключи.
 */
export function mergeDescriptionIntoSpecifications(
  specs: ProductSpecifications | undefined | null,
  description: string | undefined
): ProductSpecifications {
  const base = (specs && typeof specs === 'object' ? { ...specs } : {}) as Record<string, string | number | boolean | undefined | null>;
  const pairs = collectKeyValuePairsFromDescription(description);
  for (const { key, value } of pairs) {
    const nk = normalizeMergedSpecKey(key);
    if (!nk) continue;
    const current = base[nk];
    if (current !== undefined && current !== null && String(current).trim() !== '') {
      continue;
    }
    base[nk] = value;
  }
  return base as ProductSpecifications;
}

/**
 * Для сравнения и карточки: всегда гибрид — поля из API не перезаписываются,
 * из описания добавляются только отсутствующие ключи.
 */
export function specificationsWithDescriptionFallback(
  specs: ProductSpecifications | undefined | null,
  description: string | undefined
): ProductSpecifications {
  return mergeDescriptionIntoSpecifications(specs, description);
}
