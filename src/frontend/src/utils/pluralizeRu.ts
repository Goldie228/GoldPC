/**
 * Склонение существительных для русского языка по числу.
 * @param n — целое число (допускается отрицательное, берётся по модулю)
 * @param forms — [один, два–четыре, пять и более] — например ['товар', 'товара', 'товаров']
 */
export function pluralizeRu(
  n: number,
  forms: readonly [string, string, string]
): string {
  const abs = Math.abs(Math.trunc(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

/** Число + правильная форма: «5 товаров» */
export function formatCountRu(
  n: number,
  forms: readonly [string, string, string]
): string {
  return `${n} ${pluralizeRu(n, forms)}`;
}

/** Частые формы для подстановки в фразы */
export const RU_FORMS = {
  tovar: ['товар', 'товара', 'товаров'] as const,
} as const;
