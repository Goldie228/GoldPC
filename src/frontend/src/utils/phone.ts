export const PHONE_REGEX = /^((\+375|80)(17|25|29|33|44)\d{7})$/;

/**
 * Очищает телефонный номер от всех нечисловых символов
 */
export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Извлекает цифры из любого форматированного номера Беларуси
 * Поддерживает форматы: +375, 80, 375
 */
export function parsePhone(value: string): string {
  const digits = normalizePhone(value);

  if (digits.startsWith('375')) {
    return digits;
  }

  if (digits.startsWith('80')) {
    return '375' + digits.slice(2);
  }

  if (digits.length === 9) {
    return '375' + digits;
  }

  return digits;
}

/**
 * Проверяет что номер полностью введен и валиден
 */
export function isValidPhone(value: string): boolean {
  return PHONE_REGEX.test(parsePhone(value));
}

/**
 * Форматирует чистые цифры номера (9 цифр) в вид: +375 (XX) XXX-XX-XX
 * digits: только цифры номера без кода страны, макс. 9 цифр
 * Пример: "291234567" -> "+375 (29) 123-45-67"
 */
export function formatPhone(digits: string): string {
  const clean = normalizePhone(digits).slice(0, 9);

  // Всегда показываем префикс +375, даже при пустом вводе
  let result = '+375';

  // Показываем скобки с первой цифрой
  if (clean.length >= 1) {
    result += ' (';
    result += clean[0];

    if (clean.length >= 2) {
      result += clean[1];
      result += ') ';
    } else {
      result += ') ';
    }
  }

  // Следующие 3 цифры
  for (let i = 2; i < Math.min(clean.length, 5); i++) {
    result += clean[i];
  }

  // Первый дефис после 3-х цифр номера (позиции 2,3,4)
  if (clean.length >= 5) {
    result += '-';
  }

  // Следующие 2 цифры
  for (let i = 5; i < Math.min(clean.length, 7); i++) {
    result += clean[i];
  }

  // Второй дефис после 5-ти цифр номера
  if (clean.length >= 7) {
    result += '-';
  }

  // Последние 2 цифры
  for (let i = 7; i < clean.length; i++) {
    result += clean[i];
  }

  return result;
}
