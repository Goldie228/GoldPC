import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModalContainer } from './ModalContainer';

vi.mock('@/hooks/useModal', () => ({
  useModal: vi.fn(),
}));

import { useModal } from '@/hooks/useModal';
const mockUseModal = vi.mocked(useModal);

describe('ModalContainer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when modal is closed', () => {
    mockUseModal.mockReturnValue({
      isOpen: false,
      modalContent: null,
      openModal: vi.fn(),
      closeModal: vi.fn(),
      closeAll: vi.fn(),
      toggleModal: vi.fn(),
    });
    const { container } = render(<ModalContainer />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when modalContent is null', () => {
    mockUseModal.mockReturnValue({
      isOpen: true,
      modalContent: null,
      openModal: vi.fn(),
      closeModal: vi.fn(),
      closeAll: vi.fn(),
      toggleModal: vi.fn(),
    });
    const { container } = render(<ModalContainer />);
    expect(container.innerHTML).toBe('');
  });

  it('renders modal when open with content', () => {
    mockUseModal.mockReturnValue({
      isOpen: true,
      modalContent: {
        title: 'Test Title',
        content: <p>Modal Body</p>,
        size: 'default',
      },
      openModal: vi.fn(),
      closeModal: vi.fn(),
      closeAll: vi.fn(),
      toggleModal: vi.fn(),
    });
    render(<ModalContainer />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Modal Body')).toBeInTheDocument();
  });

  it('maps small size correctly', () => {
    mockUseModal.mockReturnValue({
      isOpen: true,
      modalContent: {
        title: 'Small',
        content: <p>Content</p>,
        size: 'small',
      },
      openModal: vi.fn(),
      closeModal: vi.fn(),
      closeAll: vi.fn(),
      toggleModal: vi.fn(),
    });
    render(<ModalContainer />);
    expect(screen.getByText('Small')).toBeInTheDocument();
  });

  it('maps fullWidth to large', () => {
    mockUseModal.mockReturnValue({
      isOpen: true,
      modalContent: {
        title: 'Full',
        content: <p>Content</p>,
        size: 'fullWidth',
      },
      openModal: vi.fn(),
      closeModal: vi.fn(),
      closeAll: vi.fn(),
      toggleModal: vi.fn(),
    });
    render(<ModalContainer />);
    expect(screen.getByText('Full')).toBeInTheDocument();
  });
});
