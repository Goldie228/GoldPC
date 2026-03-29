import {
  getCanonicalSpecKeyForComparison,
  getComparisonRule,
  hasExplicitCategoryRuleForCanonicalKey,
  normalizeCategory,
  normalizeSpecKey,
  type ComparisonMode,
  type ComparisonRule,
} from './comparisonRules';

export type CompatibilityState = 'allMatch' | 'mixed' | 'allDifferent';

export interface ComparisonEvaluation {
  mode: ComparisonMode;
  bestIndices: Set<number>;
  compatibilityState: CompatibilityState | null;
}

/**
 * Пробелы как разделитель тысяч («4 608»), неразрывные пробелы; снятие типовых единиц с конца строки.
 */
export function preprocessForNumericExtraction(raw: string): string {
  let s = raw.trim();
  if (s === '' || s === '—') return '';
  s = s.replace(/[\s\u00a0\u202f]+/g, '');
  s = s.replace(
    /(?:гб\/с|гб\/сек|gb\/s|g\/s|mb\/s|мб\/с|мгц|mhz|гц|ghz|ггц|вт|w|кд\/м²|кд\/м2|cd\/m²|cd\/m2|дб|db|cfm|об\/мин|об\/min|rpm)/gi,
    ''
  );
  return s;
}

function extractNumeric(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (value == null) return null;
  const source = preprocessForNumericExtraction(String(value));
  if (source === '') return null;
  const strict = source.match(/^[+-]?\d+(?:[.,]\d+)?/);
  if (strict) {
    const parsed = Number(strict[0].replace(',', '.'));
    return Number.isNaN(parsed) ? null : parsed;
  }
  // «100 дБ», «до 30 ч», «20 – 20000 Гц» — первое число в строке
  const loose = source.match(/[+-]?\d+(?:[.,]\d+)?/);
  if (!loose) return null;
  const parsed = Number(loose[0].replace(',', '.'));
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
  // БП и др.: «модульный» в данных как текст, не как boolean
  if (normalized === 'немодульный') return false;
  if (normalized === 'модульный' || normalized === 'полумодульный') return true;
  return null;
}

/**
 * Для преимущества «есть фича»: «—», пусто и нераспознанное — как «нет»,
 * чтобы «Да» выигрывал у прочерков в одной строке (трассировка лучей и т.д.).
 */
function parseBooleanForFeatureAdvantage(value: unknown): boolean {
  if (value === true) return true;
  if (value === false) return false;
  if (value == null) return false;
  const t = String(value).trim();
  if (t === '' || t === '—' || t === '–' || t === '−' || /^n\/a$/i.test(t)) return false;
  const b = parseBooleanValue(value);
  if (b !== null) return b;
  return false;
}

/** Для характеристик «наличие = плюс»: подсвечиваем только значения true. Ничья «все Да» / «все Нет» — без подсветки. */
function evaluateBooleanMax(values: (string | number | boolean | undefined)[]): Set<number> {
  const resolved = values.map((value, index) => ({
    index,
    bool: parseBooleanForFeatureAdvantage(value),
  }));
  if (resolved.length < 2) return new Set();
  const trueCount = resolved.filter((entry) => entry.bool).length;
  if (trueCount === 0 || trueCount === resolved.length) return new Set();
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
  const first = numerics[0].numeric;
  if (numerics.every((e) => e.numeric === first)) return new Set();
  const target =
    mode === 'min'
      ? numerics.reduce((acc, entry) => (entry.numeric < acc ? entry.numeric : acc), numerics[0].numeric)
      : numerics.reduce((acc, entry) => (entry.numeric > acc ? entry.numeric : acc), numerics[0].numeric);
  return new Set(numerics.filter((entry) => entry.numeric === target).map((entry) => entry.index));
}

/** Пустые ячейки и «Нет» при сравнении чисел в ряду с прочерками. */
function isAbsentOrNoForNumericLeader(value: unknown): boolean {
  if (value == null) return true;
  const t = String(value).trim();
  if (t === '' || t === '—' || t === '–' || t === '−') return true;
  if (/^нет$/i.test(t)) return true;
  return false;
}

/**
 * Max: если ровно одно значение > 0, остальные пустые/«Нет» — подсветка этого столбца (напр. пропускная способность памяти GPU).
 * Иначе обычное max-сравнение по всем распарсенным числам (≥2 чисел).
 */
function evaluateNumericMaxSinglePositiveVsAbsent(
  values: (string | number | boolean | undefined)[]
): Set<number> {
  const withNum = values
    .map((value, index) => ({ index, numeric: extractNumeric(value) }))
    .filter((entry): entry is { index: number; numeric: number } => entry.numeric != null);
  if (withNum.length === 1 && withNum[0].numeric > 0) {
    const i = withNum[0].index;
    if (values.every((v, j) => j === i || isAbsentOrNoForNumericLeader(v))) {
      return new Set([i]);
    }
  }
  return evaluateNumeric('max', values);
}

/**
 * Ёмкость накопителя в ГБ для сравнения max (ТБ × 1000 ГБ, по маркетинговой шкале).
 * «Голые» числа без единицы считаем ГБ (частый формат в данных).
 */
export function parseStorageCapacityToGb(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const raw = String(value).trim();
  if (raw === '') return null;
  // Не полагаться на \b после кириллицы: в JS \w только [A-Za-z0-9_].
  const s = raw.toLowerCase().replace(/[\s\u00a0\u202f]+/g, ' ');

  const tb = s.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(?:тб|tb)(?:\s|$)/i);
  if (tb) {
    const n = Number(tb[1].replace(',', '.'));
    return Number.isNaN(n) ? null : n * 1000;
  }
  const gb = s.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(?:гб|gb|гиг)(?:\s|$)/i);
  if (gb) {
    const n = Number(gb[1].replace(',', '.'));
    return Number.isNaN(n) ? null : n;
  }
  const mb = s.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(?:мб|mb)(?:\s|$)/i);
  if (mb) {
    const n = Number(mb[1].replace(',', '.'));
    return Number.isNaN(n) ? null : n / 1000;
  }
  const bare = s.match(/^([0-9]+(?:[.,][0-9]+)?)$/);
  if (bare) {
    const n = Number(bare[1].replace(',', '.'));
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function evaluateStorageCapacityMax(values: (string | number | boolean | undefined)[]): Set<number> {
  const numerics = values
    .map((value, index) => ({ index, numeric: parseStorageCapacityToGb(value) }))
    .filter((entry): entry is { index: number; numeric: number } => entry.numeric != null);
  if (numerics.length < 2) return new Set();
  const first = numerics[0].numeric;
  if (numerics.every((e) => e.numeric === first)) return new Set();
  const target = numerics.reduce(
    (acc, entry) => (entry.numeric > acc ? entry.numeric : acc),
    numerics[0].numeric
  );
  return new Set(numerics.filter((entry) => entry.numeric === target).map((entry) => entry.index));
}

/** Разрешение «WxH» → число пикселей (для сравнения max). */
export function parseResolutionPixels(value: unknown): number | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (s === '' || s === '—') return null;
  const compact = s.replace(/[\s\u00a0\u202f]+/g, '');
  const m = compact.match(/(\d{2,5})\s*[xх×]\s*(\d{2,5})/i);
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (Number.isNaN(w) || Number.isNaN(h)) return null;
  return w * h;
}

function parseEfficiencyPercent(value: unknown): number | null {
  if (value == null) return null;
  const pre = preprocessForNumericExtraction(String(value));
  if (pre === '') return null;
  const loose = pre.match(/[+-]?\d+(?:[.,]\d+)?/);
  if (!loose) return null;
  const n = Number(loose[0].replace(',', '.'));
  return Number.isNaN(n) ? null : n;
}

function parsePfcRank(value: unknown): number | null {
  if (value == null) return null;
  const n = String(value).trim().toLowerCase();
  if (n === '' || n === '—') return null;
  if (n.includes('актив')) return 2;
  if (n.includes('пассив')) return 1;
  if (n === 'нет' || n === 'no' || n === 'false') return 0;
  return null;
}

/** 5.1 / 7.1 и т.п. — сравнение как десятичное число. */
function parseSoundChannelScore(value: unknown): number | null {
  if (value == null) return null;
  const pre = preprocessForNumericExtraction(String(value));
  const m = pre.match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const n = Number(m[1].replace(',', '.'));
  return Number.isNaN(n) ? null : n;
}

/** МТБФ в млн часов: «2 млн», «2.5 млн», «1.6 млн». */
function parseMtbfMillions(value: unknown): number | null {
  if (value == null) return null;
  const pre = preprocessForNumericExtraction(String(value)).toLowerCase();
  if (pre === '') return null;
  const n = pre.match(/([+-]?\d+(?:[.,]\d+)?)/);
  if (!n) return null;
  const base = Number(n[1].replace(',', '.'));
  if (Number.isNaN(base)) return null;
  if (pre.includes('млн') || pre.includes('mln') || pre.includes('million')) return base;
  if (pre.includes('тыс') || pre.includes('k')) return base / 1000;
  return base;
}

/** «Да» / «Нет» / версия (5.3) — больше = лучше при наличии функции. */
function parsePresenceOrVersionScore(value: unknown): number | null {
  if (value == null) return null;
  const raw = String(value).trim();
  if (raw === '' || raw === '—') return null;
  const lower = raw.toLowerCase();
  if (lower === 'нет' || lower === 'no' || lower === 'false') return 0;
  const num = raw.match(/(\d+(?:\.\d+)?)/);
  if (num) return Number(num[1].replace(',', '.'));
  if (lower === 'да' || lower === 'yes' || lower === 'true') return 1;
  return 1;
}

/** IP54 и т.п.; «Нет» = 0. */
function parseIpIngressRank(value: unknown): number | null {
  if (value == null) return null;
  const raw = String(value).trim();
  if (raw === '' || raw === '—') return null;
  if (/^нет$/i.test(raw) || /^no$/i.test(raw)) return 0;
  const upper = raw.toUpperCase().replace(/\s/g, '');
  const m = upper.match(/^IP(\d)(\d)$/i);
  if (m) return Number(m[1]) * 10 + Number(m[2]);
  const loose = upper.match(/IP(\d)(\d)/i);
  if (loose) return Number(loose[1]) * 10 + Number(loose[2]);
  return null;
}

function evaluateNumericCustom(
  mode: ComparisonMode,
  values: (string | number | boolean | undefined)[],
  extract: (value: unknown) => number | null
): Set<number> {
  const numerics = values
    .map((value, index) => ({ index, numeric: extract(value) }))
    .filter((entry): entry is { index: number; numeric: number } => entry.numeric != null);
  if (numerics.length < 2) return new Set();
  const first = numerics[0].numeric;
  if (numerics.every((e) => e.numeric === first)) return new Set();
  const target =
    mode === 'min'
      ? numerics.reduce((acc, entry) => (entry.numeric < acc ? entry.numeric : acc), numerics[0].numeric)
      : numerics.reduce((acc, entry) => (entry.numeric > acc ? entry.numeric : acc), numerics[0].numeric);
  return new Set(numerics.filter((entry) => entry.numeric === target).map((entry) => entry.index));
}

/** В БД иногда лежат true/false вместо Гц — сравнение вводит в заблуждение. */
function isMonitorRefreshRateBooleanGarbage(
  values: (string | number | boolean | undefined)[]
): boolean {
  const present = values.filter((v) => v != null && v !== '');
  if (present.length < 2) return false;
  return present.every((v) => {
    const s = String(v).trim().toLowerCase();
    return s === 'true' || s === 'false';
  });
}

/**
 * Категории, где в описание мержится много кириллических пар «функция — Да/Нет» без явного правила в comparisonRules.
 * Если все непустые значения строки распознаются как boolean, считаем строку «преимуществом» (max boolean).
 */
const BOOLEAN_FEATURE_FALLBACK_CATEGORIES = new Set(['headphones', 'keyboard', 'mouse']);

/** Строка «1»/«0» без контекста — счётчик или кодировка; не считаем чисто цифровые строки булевыми для fallback. */
function isDigitsOnlyString(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const t = value.trim();
  return t !== '' && /^-?\d+$/.test(t);
}

function allNonEmptyValuesAreBooleanLike(
  values: (string | number | boolean | undefined)[]
): boolean {
  const present = values.filter((v) => v != null && String(v).trim() !== '');
  if (present.length < 2) return false;
  return present.every((v) => !isDigitsOnlyString(v) && parseBooleanValue(v) !== null);
}

function applyBooleanFeatureFallback(
  normalizedCategory: string,
  rule: ComparisonRule,
  values: (string | number | boolean | undefined)[],
  hasExplicitCategoryRule: boolean
): ComparisonRule {
  if (rule.mode !== 'none') return rule;
  // Явное правило категории (в т.ч. mode none) не перекрываем fallback'ом «Да/Нет».
  if (hasExplicitCategoryRule) return rule;
  if (!BOOLEAN_FEATURE_FALLBACK_CATEGORIES.has(normalizedCategory)) return rule;
  if (!allNonEmptyValuesAreBooleanLike(values)) return rule;
  return { mode: 'max', valueType: 'boolean' };
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
  const normalizedCategory = normalizeCategory(category);
  if (normalizedCategory === 'monitor' && normalizedKey === 'refresh_rate' && isMonitorRefreshRateBooleanGarbage(values)) {
    return {
      mode: 'none',
      bestIndices: new Set(),
      compatibilityState: null,
    };
  }
  const rule = getComparisonRule(category, key);
  const canonicalForRule = getCanonicalSpecKeyForComparison(category, key);
  const hasExplicit = hasExplicitCategoryRuleForCanonicalKey(category, canonicalForRule);
  const effectiveRule = applyBooleanFeatureFallback(normalizedCategory, rule, values, hasExplicit);
  if (effectiveRule.mode === 'max' && effectiveRule.valueType === 'boolean') {
    return {
      mode: 'max',
      bestIndices: evaluateBooleanMax(values),
      compatibilityState: null,
    };
  }
  if (
    normalizedCategory === 'storage' &&
    canonicalForRule === 'capacity' &&
    effectiveRule.mode === 'max' &&
    effectiveRule.valueType === 'number'
  ) {
    return {
      mode: 'max',
      bestIndices: evaluateStorageCapacityMax(values),
      compatibilityState: null,
    };
  }
  if (effectiveRule.mode === 'min' || effectiveRule.mode === 'max') {
    const mode = effectiveRule.mode;
    if (normalizedCategory === 'monitor' && canonicalForRule === 'resolution') {
      return {
        mode,
        bestIndices: evaluateNumericCustom(mode, values, parseResolutionPixels),
        compatibilityState: null,
      };
    }
    if (normalizedCategory === 'psu' && canonicalForRule === 'efficiency_percent') {
      return {
        mode: 'max',
        bestIndices: evaluateNumericCustom('max', values, parseEfficiencyPercent),
        compatibilityState: null,
      };
    }
    if (normalizedCategory === 'psu' && canonicalForRule === 'pfc_type') {
      return {
        mode: 'max',
        bestIndices: evaluateNumericCustom('max', values, parsePfcRank),
        compatibilityState: null,
      };
    }
    if (normalizedCategory === 'motherboard' && canonicalForRule === 'sound_channels') {
      return {
        mode: 'max',
        bestIndices: evaluateNumericCustom('max', values, parseSoundChannelScore),
        compatibilityState: null,
      };
    }
    if (
      normalizedCategory === 'motherboard' &&
      (canonicalForRule === 'wifi' || canonicalForRule === 'bluetooth')
    ) {
      return {
        mode: 'max',
        bestIndices: evaluateNumericCustom('max', values, parsePresenceOrVersionScore),
        compatibilityState: null,
      };
    }
    if (normalizedCategory === 'headphones' && canonicalForRule === 'ingress_protection') {
      return {
        mode: 'max',
        bestIndices: evaluateNumericCustom('max', values, parseIpIngressRank),
        compatibilityState: null,
      };
    }
    if (normalizedCategory === 'storage' && canonicalForRule === 'mtbf_millions') {
      return {
        mode: 'max',
        bestIndices: evaluateNumericCustom('max', values, parseMtbfMillions),
        compatibilityState: null,
      };
    }
    if (normalizedCategory === 'gpu' && canonicalForRule === 'memory_bandwidth' && mode === 'max') {
      return {
        mode: 'max',
        bestIndices: evaluateNumericMaxSinglePositiveVsAbsent(values),
        compatibilityState: null,
      };
    }
    return {
      mode: effectiveRule.mode,
      bestIndices: evaluateNumeric(effectiveRule.mode, values),
      compatibilityState: null,
    };
  }
  if (effectiveRule.mode === 'compatibility') {
    return {
      mode: 'compatibility',
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

