import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthModalStore } from './authModalStore';

describe('authModalStore', () => {
  beforeEach(() => {
    useAuthModalStore.setState({ activeModal: null });
  });

  describe('Начальное состояние', () => {
    it('activeModal === null', () => {
      expect(useAuthModalStore.getState().activeModal).toBeNull();
    });
  });

  describe('openLoginModal', () => {
    it('устанавливает activeModal = login', () => {
      useAuthModalStore.getState().openLoginModal();
      expect(useAuthModalStore.getState().activeModal).toBe('login');
    });
  });

  describe('openRegisterModal', () => {
    it('устанавливает activeModal = register', () => {
      useAuthModalStore.getState().openRegisterModal();
      expect(useAuthModalStore.getState().activeModal).toBe('register');
    });
  });

  describe('closeAuthModal', () => {
    it('закрывает модальное окно', () => {
      useAuthModalStore.getState().openLoginModal();
      useAuthModalStore.getState().closeAuthModal();
      expect(useAuthModalStore.getState().activeModal).toBeNull();
    });

    it('ничего не меняет если окно уже закрыто', () => {
      useAuthModalStore.getState().closeAuthModal();
      expect(useAuthModalStore.getState().activeModal).toBeNull();
    });
  });

  describe('switchAuthModal', () => {
    it('переключает с login на register', () => {
      useAuthModalStore.getState().openLoginModal();
      useAuthModalStore.getState().switchAuthModal('register');
      expect(useAuthModalStore.getState().activeModal).toBe('register');
    });

    it('переключает с register на login', () => {
      useAuthModalStore.getState().openRegisterModal();
      useAuthModalStore.getState().switchAuthModal('login');
      expect(useAuthModalStore.getState().activeModal).toBe('login');
    });

    it('устанавливает null через switchAuthModal', () => {
      useAuthModalStore.getState().openLoginModal();
      useAuthModalStore.getState().switchAuthModal(null);
      expect(useAuthModalStore.getState().activeModal).toBeNull();
    });
  });
});
