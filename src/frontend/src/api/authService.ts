/**
 * Auth Service - API методы для аутентификации
 */
import apiClient from './client';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  TwoFactorStatusResponse,
  NotificationPreferenceRequest,
  NotificationPreferenceResponse,
  LoginHistoryItem,
} from './types';
import { AxiosError } from 'axios';
import { normalizeUserRoles } from '../utils/roleMapper';

const AUTH_BASE_URL = '/auth';

/**
 * Извлекает полезные данные из обёрнутого ответа ApiResponse<T>
 * Безопасно: если данных нет, возвращает undefined
 */
function extractData<T>(payload: unknown): T {
  if (payload != null && typeof payload === 'object' && 'data' in payload) {
    const wrapped = payload as { data?: T; success?: boolean; message?: string };
    if (wrapped.data !== undefined) return wrapped.data;
  }
  throw new Error('Unable to extract data from API response: data is undefined');
}

/**
 * Стандартизированные сообщения об ошибках аутентификации
 * Маппинг HTTP статус кодов на понятные пользователю сообщения
 */
const AUTH_ERROR_MESSAGES: Record<number, string> = {
  400: 'Некорректный запрос. Проверьте введенные данные.',
  401: 'Неверный email или пароль.',
  403: 'Этот аккаунт заблокирован. Обратитесь в поддержку.',
  404: 'Пользователь с таким email не найден.',
  409: 'Пользователь с таким email уже зарегистрирован.',
  422: 'Ошибка валидации данных. Проверьте введенные значения.',
  429: 'Слишком много попыток входа. Попробуйте позже.',
  500: 'Ошибка сервера. Попробуйте через несколько минут.',
  503: 'Сервис временно недоступен. Попробуйте позже.'
};

/**
 * Обработка ошибок API запросов аутентификации
 * Возвращает понятное пользователю сообщение об ошибке
 */
export const getAuthErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError && error.response) {
    const status = error.response.status;
    // Пробуем достать сообщение из тела ответа (ApiResponse.message)
    const body = error.response.data as { message?: string } | undefined;
    if (body?.message != null && body.message !== '') {
      return body.message;
    }
    // Если тела нет — используем стандартное сообщение для статуса
    return AUTH_ERROR_MESSAGES[status] || 'Произошла ошибка. Попробуйте еще раз.';
  }
  return 'Проблема с подключением. Проверьте интернет соединение.';
};

export const authService = {
  /**
   * Авторизация пользователя
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post(`${AUTH_BASE_URL}/login`, credentials);
    const data = extractData<AuthResponse>(response.data);
    // Нормализуем роли: бэкенд возвращает числа (0=Client), фронтенд ожидает строки
    return {
      ...data,
      user: normalizeUserRoles(data.user)!,
    };
  },

  /**
   * Регистрация нового пользователя
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post(`${AUTH_BASE_URL}/register`, data);
    const authData = extractData<AuthResponse>(response.data);
    return {
      ...authData,
      user: normalizeUserRoles(authData.user)!,
    };
  },

  /**
   * Выход из системы (отзыв токенов на сервере)
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(`${AUTH_BASE_URL}/logout`);
    } catch {
      // Игнорируем ошибки при logout - очищаем токены локально в любом случае
    }
  },

  /**
   * Обновление токенов
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post(`${AUTH_BASE_URL}/refresh`, { refreshToken });
    const data = extractData<AuthResponse>(response.data);
    return {
      ...data,
      user: normalizeUserRoles(data.user)!,
    };
  },

  /**
   * Получение текущего пользователя
   */
  async getCurrentUser(): Promise<AuthResponse['user']> {
    const response = await apiClient.get(`${AUTH_BASE_URL}/profile`);
    const user = extractData<AuthResponse['user']>(response.data);
    return normalizeUserRoles(user)!;
  },

  /**
   * Запрос на восстановление пароля (отправляет email со ссылкой)
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await apiClient.post(`${AUTH_BASE_URL}/forgot-password`, data);
  },

  /**
   * Сброс пароля по токену из email
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await apiClient.post(`${AUTH_BASE_URL}/reset-password`, data);
  },

  /**
   * Валидация токена сброса пароля (без мутаций).
   * Вызывается при загрузке страницы reset-password, чтобы сразу
   * определить, действителен ли токен, или показывать expired-экран.
   * Бросает ошибку, если токен недействителен — используйте getAuthErrorMessage.
   */
  async validateResetToken(token: string): Promise<void> {
    await apiClient.post(`${AUTH_BASE_URL}/validate-reset-token`, { token });
  },

/**
   * Отправка письма с подтверждением email (или повторная отправка).
   * Требует авторизации — userId извлекается из JWT на сервере.
   */
  async sendVerificationEmail(): Promise<void> {
    await apiClient.post(`${AUTH_BASE_URL}/send-verification`);
  },

  /**
   * Подтверждение email по токену из письма.
   * Не требует авторизации — токен одноразовый.
   */
  async verifyEmail(token: string): Promise<void> {
    await apiClient.post(`${AUTH_BASE_URL}/verify-email`, { token });
  },

  /**
   * Смена пароля
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.post(`${AUTH_BASE_URL}/change-password`, data);
  },

  /**
   * Получение текущих предпочтений уведомлений
   */
  async getNotificationPreferences(): Promise<NotificationPreferenceResponse> {
    const response = await apiClient.get(`${AUTH_BASE_URL}/notification-preferences`);
    return extractData<NotificationPreferenceResponse>(response.data);
  },

  /**
   * Обновление предпочтений уведомлений
   */
  async updateNotificationPreferences(
    data: NotificationPreferenceRequest
  ): Promise<NotificationPreferenceResponse> {
    const response = await apiClient.put(`${AUTH_BASE_URL}/notification-preferences`, data);
    return extractData<NotificationPreferenceResponse>(response.data);
  },

  /**
   * Включение двухфакторной аутентификации
   */
  async enableTwoFactor(): Promise<TwoFactorStatusResponse> {
    const response = await apiClient.post(`${AUTH_BASE_URL}/security/2fa/enable`);
    return extractData<TwoFactorStatusResponse>(response.data);
  },

  /**
   * Подтверждение включения двухфакторной аутентификации
   */
  async verifyTwoFactor(code: string): Promise<TwoFactorStatusResponse> {
    const response = await apiClient.post(`${AUTH_BASE_URL}/security/2fa/verify`, { totpCode: code });
    return extractData<TwoFactorStatusResponse>(response.data);
  },

  /**
   * Отключение двухфакторной аутентификации
   */
  async disableTwoFactor(password: string): Promise<void> {
    await apiClient.post(`${AUTH_BASE_URL}/security/2fa/disable`, { password });
  },

  /**
   * История входов пользователя
   */
  async getLoginHistory(
    page = 1,
    pageSize = 20
  ): Promise<{ items: LoginHistoryItem[]; total: number }> {
    try {
      const response = await apiClient.get(`${AUTH_BASE_URL}/login-history`, {
        params: { page, pageSize },
      });
      const data = extractData<{ items: LoginHistoryItem[]; total: number }>(response.data);
      return data;
    } catch {
      // Endpoint not implemented on backend yet — return empty gracefully
      return { items: [], total: 0 };
    }
  },

  /**
   * Обновление профиля пользователя
   */
  async updateProfile(data: {
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<AuthResponse['user']> {
    const response = await apiClient.put(`${AUTH_BASE_URL}/profile`, data);
    const user = extractData<AuthResponse['user']>(response.data);
    return normalizeUserRoles(user)!;
  },

  /**
   * Загрузить аватар пользователя
   */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post(`${AUTH_BASE_URL}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = extractData<{ avatarUrl: string }>(response.data);
    return data;
  },

  /**
   * Удалить аватар пользователя
   */
  async deleteAvatar(): Promise<void> {
    await apiClient.delete(`${AUTH_BASE_URL}/avatar`);
  },
};