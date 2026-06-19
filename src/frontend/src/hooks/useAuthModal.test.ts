import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockStore = {
  activeModal: null as string | null,
  openLoginModal: vi.fn(),
  openRegisterModal: vi.fn(),
  closeAuthModal: vi.fn(),
  switchAuthModal: vi.fn(),
};

vi.mock('../store/authModalStore', () => ({
  useAuthModalStore: vi.fn((selector: any) => selector(mockStore)),
}));

import { useAuthModal } from './useAuthModal';

describe('hooks/useAuthModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.activeModal = null;
  });

  it('returns activeModal as null by default', () => {
    const { result } = renderHook(() => useAuthModal());
    expect(result.current.activeModal).toBeNull();
  });

  it('openLoginModal calls store.openLoginModal', () => {
    const { result } = renderHook(() => useAuthModal());
    act(() => result.current.openLoginModal());
    expect(mockStore.openLoginModal).toHaveBeenCalled();
  });

  it('openRegisterModal calls store.openRegisterModal', () => {
    const { result } = renderHook(() => useAuthModal());
    act(() => result.current.openRegisterModal());
    expect(mockStore.openRegisterModal).toHaveBeenCalled();
  });

  it('closeAuthModal calls store.closeAuthModal', () => {
    const { result } = renderHook(() => useAuthModal());
    act(() => result.current.closeAuthModal());
    expect(mockStore.closeAuthModal).toHaveBeenCalled();
  });

  it('switchAuthModal calls store.switchAuthModal with modal type', () => {
    const { result } = renderHook(() => useAuthModal());
    act(() => result.current.switchAuthModal('login'));
    expect(mockStore.switchAuthModal).toHaveBeenCalledWith('login');
  });
});
