/**
 * Валидация номера банковской карты по алгоритму Luhn
 */
export function validateCardNumberLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\s/g, '');
  
  // Проверка длины (13-19 цифр для стандартных карт)
  if (!/^\d{13,19}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  // Проход справа налево
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Определение типа карты по номеру
 */
export function getCardType(cardNumber: string): 'visa' | 'mastercard' | 'maestro' | 'mir' | 'unknown' {
  const digits = cardNumber.replace(/\s/g, '');

  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
  if (/^(5[06-8]|6\d)/.test(digits)) return 'maestro';
  if (/^220[0-4]/.test(digits)) return 'mir';

  return 'unknown';
}

/**
 * Форматирование номера карты (добавление пробелов)
 */
export function formatCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  const groups = digits.match(/.{1,4}/g) || [];
  return groups.join(' ');
}

/**
 * Валидация срока действия карты (MM/YY)
 */
export function validateCardExpiry(expiry: string): boolean {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const month = parseInt(match[1], 10);
  const year = parseInt('20' + match[2], 10);

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
}

/**
 * Форматирование срока действия (добавление слэша)
 */
export function formatCardExpiry(expiry: string): string {
  const digits = expiry.replace(/\D/g, '');
  if (digits.length >= 2) {
    return digits.slice(0, 2) + '/' + digits.slice(2, 4);
  }
  return digits;
}

/**
 * Валидация CVV кода
 */
export function validateCVV(cvv: string, cardType: string = 'unknown'): boolean {
  // American Express требует 4 цифры, остальные - 3
  const requiredLength = cardType === 'amex' ? 4 : 3;
  return new RegExp(`^\\d{${requiredLength}}$`).test(cvv);
}

/**
 * Валидация имени держателя карты
 */
export function validateCardHolder(name: string): boolean {
  // Минимум 2 символа, только буквы и пробелы
  return /^[A-Za-zА-Яа-яЁё\s]{2,}$/.test(name.trim());
}

/**
 * Маскирование номера карты (показываем только последние 4 цифры)
 */
export function maskCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 4) return cardNumber;
  
  return '**** **** **** ' + digits.slice(-4);
}
