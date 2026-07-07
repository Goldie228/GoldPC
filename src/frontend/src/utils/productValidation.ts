/**
 * Валидация полей товара в админке.
 * Используется на фронте для UI-проверок и на бэкенде для защиты.
 */

/** Минимально допустимая цена (включительно) */
export const MIN_PRICE = 0;

/** Максимально допустимая цена (защита от переполнения decimal) */
export const MAX_PRICE = 999_999_999.99;

/** Минимально допустимое количество товара */
export const MIN_STOCK = 0;

/** Максимально допустимое количество товара */
export const MAX_STOCK = 1_000_000;

/**
 * Проверяет, что строка представляет валидную цену:
 * - не пустая (для required)
 * - парсится в число
 * - не отрицательная
 * - не превышает MAX_PRICE
 */
export function isValidPrice(value: string, { required = true }: { required?: boolean } = {}): boolean {
  if (value == null || value.trim() === '') return !required;
  const n = Number(value);
  if (!Number.isFinite(n)) return false;
  if (n < MIN_PRICE) return false;
  if (n > MAX_PRICE) return false;
  return true;
}

/**
 * Проверяет, что строка представляет валидное количество.
 */
export function isValidStock(value: string, { required = false }: { required?: boolean } = {}): boolean {
  if (value == null || value.trim() === '') return !required;
  const n = Number(value);
  if (!Number.isFinite(n)) return false;
  if (!Number.isInteger(n)) return false;
  if (n < MIN_STOCK) return false;
  if (n > MAX_STOCK) return false;
  return true;
}

/**
 * Безопасно парсит строку в цену, ограниченную диапазоном [MIN_PRICE, MAX_PRICE].
 * Невалидные значения возвращают MIN_PRICE.
 */
export function parsePriceSafe(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return MIN_PRICE;
  if (n < MIN_PRICE) return MIN_PRICE;
  if (n > MAX_PRICE) return MAX_PRICE;
  return Math.round(n * 100) / 100;
}

/**
 * Безопасно парсит строку в количество, ограниченное [MIN_STOCK, MAX_STOCK].
 */
export function parseStockSafe(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return MIN_STOCK;
  if (n < MIN_STOCK) return MIN_STOCK;
  if (n > MAX_STOCK) return MAX_STOCK;
  return Math.floor(n);
}

/**
 * Возвращает текст ошибки валидации цены (или null если валидно).
 */
export function getPriceError(value: string, { required = true }: { required?: boolean } = {}): string | null {
  if (value == null || value.trim() === '') {
    return required ? 'Введите цену' : null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) return 'Цена должна быть числом';
  if (n < MIN_PRICE) return `Цена не может быть отрицательной (минимум ${MIN_PRICE})`;
  if (n > MAX_PRICE) return `Цена слишком большая (максимум ${MAX_PRICE})`;
  return null;
}

/**
 * Возвращает текст ошибки валидации количества.
 */
export function getStockError(value: string, { required = false }: { required?: boolean } = {}): string | null {
  if (value == null || value.trim() === '') {
    return required ? 'Введите количество' : null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) return 'Количество должно быть числом';
  if (!Number.isInteger(n)) return 'Количество должно быть целым';
  if (n < MIN_STOCK) return `Количество не может быть отрицательным (минимум ${MIN_STOCK})`;
  if (n > MAX_STOCK) return `Количество слишком большое (максимум ${MAX_STOCK})`;
  return null;
}
