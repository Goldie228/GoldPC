/**
 * useAuth - Хук для управления аутентификацией
 * Объединяет API вызовы, хранение токенов и управление состоянием
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import { authService } from '../api/authService';
import type { LoginRequest, RegisterRequest, User } from '../api/types';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isImpersonating: boolean;
  originalUser: User | null;
  login: (credentials: LoginRequest, remember?: boolean) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  startImpersonation: (targetUser: User) => void;
  stopImpersonation: () => void;
}

export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isLoading,
    isImpersonating,
    originalUser,
    setUser,
    setLoading,
    logout: storeLogout,
    startImpersonation: storeStartImpersonation,
    stopImpersonation: storeStopImpersonation
  } = useAuthStore();
  const syncWishlistWithServer = useWishlistStore((state) => state.syncWithServer);

  /**
   * Сохранение токенов в хранилище
   */
  const saveTokens = useCallback((accessToken: string, refreshToken: string, remember: boolean) => {
    // Clear both storage locations first to prevent leftover tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');

    // Save to appropriate storage based on remember flag
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('accessToken', accessToken);
    storage.setItem('refreshToken', refreshToken);
  }, []);

  /**
   * Авторизация
   */
  const login = useCallback(async (credentials: LoginRequest, remember = false) => {
    setLoading(true);
    
    try {
      const response = await authService.login(credentials);
      
      saveTokens(response.accessToken, response.refreshToken, remember);
      setUser(response.user);
      await syncWishlistWithServer();
      
      navigate('/');
    } catch (error) {
      storeLogout();
      throw error;
    }
  }, [setLoading, setUser, storeLogout, saveTokens, navigate, syncWishlistWithServer]);

  /**
   * Регистрация
   */
  const register = useCallback(async (data: RegisterRequest) => {
    setLoading(true);
    
    try {
      const response = await authService.register(data);
      
      // При регистрации всегда сохраняем в localStorage
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      setUser(response.user);
      await syncWishlistWithServer();
      
      navigate('/');
    } catch (error) {
      storeLogout();
      throw error;
    }
  }, [setLoading, setUser, storeLogout, navigate, syncWishlistWithServer]);

  /**
   * Выход из системы
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // Clear tokens from both storage locations
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');

      storeLogout();
      navigate('/login');
    }
  }, [storeLogout, navigate]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isImpersonating,
    originalUser,
    login,
    register,
    logout,
    startImpersonation: storeStartImpersonation,
    stopImpersonation: storeStopImpersonation,
  };
}

export type { LoginRequest, RegisterRequest };