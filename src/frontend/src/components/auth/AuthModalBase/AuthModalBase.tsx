/**
 * AuthModalBase - Общий базовый компонент для модальных окон аутентификации
 *
 * Устраняет дублирование кода между LoginModal и RegisterModal
 * Предоставляет стандартизированную структуру, стилизацию и поведение
 */

import React from 'react';
import { Modal } from '../../../components/ui/Modal/Modal';
import styles from './AuthModalBase.module.css';

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
      <div className={styles.content}>
        {children}
      </div>

      {switchLink && (
        <div className={styles.switchContainer}>
          <span className={styles.switchText}>
            {switchLink.text}
          </span>
          <button
            type="button"
            className={styles.switchButton}
            onClick={switchLink.onClick}
          >
            {switchLink.actionText}
          </button>
        </div>
      )}

      {footer && (
        <div className={styles.footer}>
          {footer}
        </div>
      )}
    </Modal>
  );
};

export default AuthModalBase;
