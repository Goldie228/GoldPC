import { getComparisonRule, normalizeSpecKey, type ComparisonMode } from './comparisonRules';

export type CompatibilityState = 'allMatch' | 'mixed' | 'allDifferent';

export interface ComparisonEvaluation {
  mode: ComparisonMode;
  bestIndices: Set<number>;
  compatibilityState: CompatibilityState | null;
}

function extractNumeric(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (value == null) return null;
  const source = String(value).trim();
  const match = source.match(/^[+-]?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0].replace(',', '.'));
  return Number.isNaN(parsed) ? null : parsed;
}

/** Распознаёт boolean из API (строки «Да»/«Нет», числа 0/1). */
function parseBooleanValue(value: unknown): boolean | null {
  if (value === true || value === false) return value;
  if (value == null || value === '') return null;
  if (typeof value === 'number' && !Number.isNaN(value)) {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'да', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'нет', 'no', 'n'].includes(normalized)) return false;
  return null;
}

/** Для характеристик «наличие = плюс»: подсвечиваем только значения true. */
function evaluateBooleanMax(values: (string | number | boolean | undefined)[]): Set<number> {
  const resolved = values
    .map((value, index) => ({ index, bool: parseBooleanValue(value) }))
    .filter((entry): entry is { index: number; bool: boolean } => entry.bool !== null);
  if (resolved.length < 2) return new Set();
  const trueIndices = resolved.filter((entry) => entry.bool).map((entry) => entry.index);
  return new Set(trueIndices);
}

function normalizeCompatibilityValue(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function evaluateNumeric(mode: ComparisonMode, values: (string | number | boolean | undefined)[]): Set<number> {
  const numerics = values
    .map((value, index) => ({ index, numeric: extractNumeric(value) }))
    .filter((entry): entry is { index: number; numeric: number } => entry.numeric != null);
  if (numerics.length < 2) return new Set();
  const target =
    mode === 'min'
      ? numerics.reduce((acc, entry) => (entry.numeric < acc ? entry.numeric : acc), numerics[0].numeric)
      : numerics.reduce((acc, entry) => (entry.numeric > acc ? entry.numeric : acc), numerics[0].numeric);
  return new Set(numerics.filter((entry) => entry.numeric === target).map((entry) => entry.index));
}

function evaluateCompatibility(values: (string | number | boolean | undefined)[]): CompatibilityState | null {
  const normalized = values.map(normalizeCompatibilityValue).filter((value): value is string => value != null && value !== '');
  if (normalized.length < 2) return null;
  const unique = new Set(normalized);
  if (unique.size === 1) return 'allMatch';
  if (unique.size === normalized.length) return 'allDifferent';
  return 'mixed';
}

export function evaluateComparison(
  category: string,
  key: string,
  values: (string | number | boolean | undefined)[]
): ComparisonEvaluation {
  const normalizedKey = normalizeSpecKey(key);
  const rule = getComparisonRule(category, normalizedKey);
  if (rule.mode === 'max' && rule.valueType === 'boolean') {
    return {
      mode: 'max',
      bestIndices: evaluateBooleanMax(values),
      compatibilityState: null,
    };
  }
  if (rule.mode === 'min' || rule.mode === 'max') {
    return {
      mode: rule.mode,
      bestIndices: evaluateNumeric(rule.mode, values),
      compatibilityState: null,
    };
  }
  if (rule.mode === 'compatibility') {
    return {
      mode: rule.mode,
      bestIndices: new Set(),
      compatibilityState: evaluateCompatibility(values),
    };
  }
  return {
    mode: 'none',
    bestIndices: new Set(),
    compatibilityState: null,
  };
}

