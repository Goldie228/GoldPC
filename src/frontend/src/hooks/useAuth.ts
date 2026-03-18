/**
 * useAuth - Хук для управления аутентификацией
 * Объединяет API вызовы, хранение токенов и управление состоянием
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../api/authService';
import type { LoginRequest, RegisterRequest, User } from '../api/types';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest, remember?: boolean) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout: storeLogout } = useAuthStore();

  /**
   * Сохранение токенов в хранилище
   */
  const saveTokens = useCallback((accessToken: string, refreshToken: string, remember: boolean) => {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('accessToken', accessToken);
    storage.setItem('refreshToken', refreshToken);
    
    // Если "запомнить" - дублируем в localStorage для персистентности
    if (remember) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
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
      
      navigate('/');
    } catch (error) {
      storeLogout();
      throw error;
    }
  }, [setLoading, setUser, storeLogout, saveTokens, navigate]);

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
      
      navigate('/');
    } catch (error) {
      storeLogout();
      throw error;
    }
  }, [setLoading, setUser, storeLogout, navigate]);

  /**
   * Выход из системы
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      storeLogout();
      navigate('/login');
    }
  }, [storeLogout, navigate]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };
}

export type { LoginRequest, RegisterRequest };