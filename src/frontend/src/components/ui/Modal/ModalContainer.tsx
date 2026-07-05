import type { ReactElement } from 'react';
import { useModal } from '@/hooks/useModal';
import { Modal, type ModalSize } from './Modal';

function mapStoreSize(size: 'small' | 'default' | 'large' | 'fullWidth' | undefined): ModalSize {
  switch (size) {
    case 'small':
      return 'small';
    case 'large':
      return 'large';
    case 'fullWidth':
      // In this project Модальное окно doesn't have a dedicated fullscreen размер,
      // so we map to large and rely on className overrides.
      return 'large';
    case 'default':
    default:
      return 'medium';
  }
}

export function ModalContainer(): ReactElement | null {
  const { isOpen, modalContent, closeModal } = useModal();

  if (!isOpen || !modalContent) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={modalContent.title ?? ''}
      size={mapStoreSize(modalContent.size)}
      className={modalContent.data?.className ? String(modalContent.data.className) : ''}
      showCloseButton={modalContent.data?.showCloseButton !== false}
      closeOnOverlayClick={modalContent.data?.closeOnOverlayClick !== false}
      closeOnEscape={modalContent.data?.closeOnEscape !== false}
    >
      {modalContent.content}
    </Modal>
  );
}

