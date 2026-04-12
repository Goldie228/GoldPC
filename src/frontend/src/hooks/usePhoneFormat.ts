import { useRef, useCallback } from 'react';
import { formatPhone, parsePhone, normalizePhone } from '../utils/phone';

const COUNTRY_CODE = '375';
const MAX_NUMBER_DIGITS = 9;
const PREFIX = '+375';

interface UsePhoneFormatOptions {
  value?: string;
  onChange?: (value: string) => void;
}

interface UsePhoneFormatResult {
  displayValue: string;
  inputRef: React.RefObject<HTMLInputElement>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
  handleFocus: () => void;
}

/**
 * Хук маски телефона Беларуси: +375 (XX) XXX-XX-XX
 */
export function usePhoneFormat({ value, onChange }: UsePhoneFormatOptions = {}): UsePhoneFormatResult {
  const inputRef = useRef<HTMLInputElement>(null);

  // Извлекаем цифры номера (без кода страны 375)
  const fullNumber = value ? parsePhone(value) : '';
  const numberDigits = fullNumber.startsWith(COUNTRY_CODE)
    ? fullNumber.slice(3, 3 + MAX_NUMBER_DIGITS)
    : fullNumber.slice(0, MAX_NUMBER_DIGITS);

  const displayValue = formatPhone(numberDigits);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Извлекаем все цифры из текущего ввода
    const allDigits = normalizePhone(inputValue);

    // Получаем только цифры номера (без кода страны)
    let newNumberDigits: string;
    if (allDigits.startsWith(COUNTRY_CODE)) {
      newNumberDigits = allDigits.slice(3, 3 + MAX_NUMBER_DIGITS);
    } else {
      newNumberDigits = allDigits.slice(0, MAX_NUMBER_DIGITS);
    }

    // Вызываем onChange с полным номером
    const fullNumberResult = COUNTRY_CODE + newNumberDigits;
    onChange?.(fullNumberResult);
  }, [onChange]);

  /**
   * Находит позицию предыдущей цифры (пропускает форматирующие символы)
   */
  function findPrevDigitPosition(pos: number, formatted: string): number {
    for (let i = pos - 1; i >= PREFIX.length; i--) {
      if (/\d/.test(formatted[i])) {
        return i + 1; // ставим курсор ПОСЛЕ этой цифры
      }
    }
    return PREFIX.length;
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const cursorPos = e.target.selectionStart || 0;

    // Блокируем удаление префикса +375
    if (e.key === 'Backspace' && cursorPos <= PREFIX.length) {
      e.preventDefault();
      return;
    }

    // При Backspace если перед курсором форматирующий символ — перемещаем курсор за него
    // НЕ блокируем событие, чтобы браузер удалил цифру
    if (e.key === 'Backspace' && cursorPos > PREFIX.length) {
      const charBeforeCursor = displayValue[cursorPos - 1];
      if (charBeforeCursor && !/\d/.test(charBeforeCursor)) {
        // Перемещаем курсор влево за форматирующий символ
        const newPos = findPrevDigitPosition(cursorPos, displayValue);
        inputRef.current.setSelectionRange(newPos, newPos);
        // НЕ вызываем e.preventDefault() — даём браузеру обработать Backspace
        return;
      }
    }

    // Перепрыгиваем форматирующие символы стрелками влево
    if (e.key === 'ArrowLeft' && cursorPos > PREFIX.length) {
      const prevChar = displayValue[cursorPos - 1];
      if (prevChar && !/\d/.test(prevChar)) {
        e.preventDefault();
        const newPos = Math.max(PREFIX.length, cursorPos - 1);
        setTimeout(() => inputRef.current?.setSelectionRange(newPos, newPos), 0);
      }
    }

    // Перепрыгиваем форматирующие символы стрелками вправо
    if (e.key === 'ArrowRight' && cursorPos < displayValue.length) {
      const nextChar = displayValue[cursorPos];
      if (nextChar && !/\d/.test(nextChar)) {
        e.preventDefault();
        const newPos = Math.min(displayValue.length, cursorPos + 1);
        setTimeout(() => inputRef.current?.setSelectionRange(newPos, newPos), 0);
      }
    }
  }, [displayValue]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const pasted = e.clipboardData.getData('text');
    const parsed = parsePhone(pasted);

    const newNumberDigits = parsed.slice(-MAX_NUMBER_DIGITS).slice(0, MAX_NUMBER_DIGITS);
    const fullNumberResult = COUNTRY_CODE + newNumberDigits;

    onChange?.(fullNumberResult);

    // При вставке ставим курсор в конец
    setTimeout(() => {
      const newFormatted = formatPhone(newNumberDigits);
      inputRef.current?.setSelectionRange(newFormatted.length, newFormatted.length);
    }, 0);
  }, [onChange]);

  const handleFocus = useCallback(() => {
    // При фокусе на пустое поле ставим курсор после префикса
    if (numberDigits.length === 0) {
      setTimeout(() => {
        inputRef.current?.setSelectionRange(PREFIX.length, PREFIX.length);
      }, 0);
    }
  }, [numberDigits.length]);

  const handleBlur = useCallback(() => {}, []);

  return {
    displayValue,
    inputRef,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleBlur,
    handleFocus,
  };
}
