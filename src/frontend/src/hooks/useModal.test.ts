import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockOpenModal = vi.fn();
const mockCloseModal = vi.fn();
const mockCloseAll = vi.fn();

vi.mock('../store/modalStore', () => ({
  useModalStore: vi.fn((selector: any) => {
    const state = {
      isOpen: false,
      modalContent: null,
      openModal: mockOpenModal,
      closeModal: mockCloseModal,
      closeAll: mockCloseAll,
    };
    return selector(state);
  }),
}));

import { useModal } from './useModal';

describe('hooks/useModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default state from store', () => {
    const { result } = renderHook(() => useModal());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.modalContent).toBeNull();
  });

  it('openModal delegates to store', () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.openModal({ title: 'Test', content: null });
    });

    expect(mockOpenModal).toHaveBeenCalledWith({ title: 'Test', content: null });
  });

  it('closeModal delegates to store', () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.closeModal();
    });

    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('closeAll delegates to store', () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.closeAll();
    });

    expect(mockCloseAll).toHaveBeenCalled();
  });

  it('toggleModal opens when not open', () => {
    const { result } = renderHook(() => useModal());
    const content = { title: 'Toggle', content: null };

    act(() => {
      result.current.toggleModal(content);
    });

    expect(mockOpenModal).toHaveBeenCalledWith(content);
  });
});
