import type { ReactElement } from 'react';
import { useModalStore } from '../../../store/modalStore';
import { Modal, type ModalSize } from './Modal';

function mapStoreSize(size: 'small' | 'default' | 'large' | 'fullWidth' | undefined): ModalSize {
  switch (size) {
    case 'small':
      return 'small';
    case 'large':
      return 'large';
    case 'fullWidth':
      // In this project Modal doesn't have a dedicated fullscreen size,
      // so we map to large and rely on className overrides.
      return 'large';
    case 'default':
    default:
      return 'medium';
  }
}

export function ModalContainer(): ReactElement | null {
  const isOpen = useModalStore((s) => s.isOpen);
  const modalContent = useModalStore((s) => s.modalContent);
  const closeModal = useModalStore((s) => s.closeModal);

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

