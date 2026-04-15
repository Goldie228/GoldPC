/**
 * Modal - Reusable Modal/Dialog Component
 */

import { useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export type ModalSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = false,
  closeOnEscape = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle Escape key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  }, [onClose, closeOnEscape]);

  // Handle overlay click
  const handleOverlayClick = useCallback(() => {
    if (closeOnOverlayClick) {
      onClose();
    }
  }, [onClose, closeOnOverlayClick]);

  // Handle modal content click (prevent propagation)
  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`modal modal--${size} ${className}`}
        onClick={handleModalClick}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="modal__header">
          <h3 id="modal-title" className="modal__title">{title}</h3>
        </div>

        {/* Content */}
        <div className="modal__content">
          {children}
        </div>

        {/* Close button at END of DOM to prevent autofocus */}
        {showCloseButton && (
          <button
            className="modal__close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X size={24} />
          </button>
        )}
      </div>
    </div>
  );
}
