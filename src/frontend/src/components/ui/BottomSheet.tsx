/**
 * BottomSheet — выезжающая панель снизу (mobile‑first)
 * Анимация translateY + бэкдроп, клик по бэкдропу/Escape → закрыть.
 * Используется в ComponentPickerModal для предпросмотра товара на мобилке.
 */

import { useEffect, useCallback, useRef } from 'react';
import './BottomSheet.css';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Закрытие по Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Закрытие по клику на бэкдроп
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!isOpen) return null;

  return (
    <div className="bottom-sheet-overlay" onClick={handleBackdropClick}>
      <div className="bottom-sheet" ref={sheetRef}>
        {/* Визуальный хэндл для свайпа */}
        <div className="bottom-sheet__handle" />
        <div className="bottom-sheet__content">{children}</div>
      </div>
    </div>
  );
}
