/**
 * Modal - Reusable Modal/Dialog Component
 * 
 * Features:
 * - Dark overlay background
 * - Gold borders matching GoldPC design system
 * - Close button (X)
 * - Click outside to close
 * - ESC key to close
 * - Focus trap for accessibility
 */

import { useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export type ModalSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface ModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Optional additional class name */
  className?: string;
  /** Size variant */
  size?: ModalSize;
  /** Show close button */
  showCloseButton?: boolean;
  /** Whether clicking overlay closes modal */
  closeOnOverlayClick?: boolean;
  /** Whether pressing Escape closes modal */
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
  closeOnOverlayClick = true,
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

  // Focus management and focus trapping
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0] as HTMLElement;
      const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

      const trapFocus = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      };

      document.addEventListener('keydown', trapFocus);
      
      // Focus first element or modal itself
      setTimeout(() => {
        if (firstElement) firstElement.focus();
        else modalRef.current?.focus();
      }, 0);

      return () => {
        document.removeEventListener('keydown', trapFocus);
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, handleKeyDown]);

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

        {/* Content */}
        <div className="modal__content">
          {children}
        </div>
      </div>
    </div>
  );
}