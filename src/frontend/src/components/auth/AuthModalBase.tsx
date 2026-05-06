/**
 * AuthModalBase - Общий базовый компонент для модальных окон аутентификации
 *
 * Устраняет дублирование кода между LoginModal и RegisterModal
 * Предоставляет стандартизированную структуру, стилизацию и поведение
 */

import React from 'react';
import { Modal } from '@/components/ui/Modal';

export interface AuthModalBaseProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Modal content (form) */
  children: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Optional switch link between login/register */
  switchLink?: {
    text: string;
    actionText: string;
    onClick: () => void;
  };
  /** Modal size override */
  size?: 'small' | 'medium' | 'large';
  /** Optional show close button */
  showCloseButton?: boolean;
}

export const AuthModalBase: React.FC<AuthModalBaseProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  switchLink,
  size = 'medium',
  showCloseButton = true
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      showCloseButton={showCloseButton}
    >
      <div className="p-6">
        {children}
      </div>

      {switchLink && (
        <div className="px-6 py-4 border-t border-[var(--color-border)] text-center">
          <span className="text-[14px] text-[var(--color-text-secondary)] mr-1">
            {switchLink.text}
          </span>
          <button
            type="button"
            className="bg-none border-none text-[var(--color-primary)] text-[14px] font-medium cursor-pointer p-0 transition-opacity duration-200 hover:opacity-80 hover:underline"
            onClick={switchLink.onClick}
          >
            {switchLink.actionText}
          </button>
        </div>
      )}

      {footer && (
        <div className="px-6 pt-4 pb-6 border-t border-[var(--color-border)]">
          {footer}
        </div>
      )}
    </Modal>
  );
};

export default AuthModalBase;
