/**
 * Auth Service - API методы для аутентификации
 * Переписан на сгенерированные orval API функции
 */
import { goldpcApi } from './generated/client';
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
import type {
  AuthResponseApiResponse,
  UserDtoApiResponse,
  TwoFactorStatusResponseApiResponse,
  NotificationPreferenceResponseApiResponse,
  LoginHistoryItemPagedResultApiResponse,
  PostApiV1AuthAvatarBody,
} from './generated/client';
import { normalizeUserRoles } from '../utils/roleMapper';

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
  // Orval-generated errors may be plain objects with { status, data } or Error instances with response
  if (error != null && typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    const response = obj.response as { status?: number; data?: { message?: string } } | undefined;
    const status = response?.status ?? (typeof obj.status === 'number' ? obj.status : undefined);
    const serverMessage = response?.data?.message ?? (typeof obj.message === 'string' ? obj.message : undefined);

    if (status != null && AUTH_ERROR_MESSAGES[status]) {
      return serverMessage || AUTH_ERROR_MESSAGES[status];
    }

    if (status != null && status >= 500) {
      return 'Ошибка сервера. Попробуйте через несколько минут.';
    }
  }

  if (error instanceof Error && error.message.includes('Network Error')) {
    return 'Ошибка сети. Проверьте подключение к интернету.';
  }

  return 'Произошла неизвестная ошибка. Попробуйте позже.';
};

/**
 * Сервис аутентификации — все методы для работы с авторизацией
 */
export const authService = {
  /**
   * Вход в систему
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await goldpcApi.postAuthLogin(data);
    const authData = extractData<AuthResponseApiResponse['data']>(response.data);
    return {
      ...authData!,
      user: normalizeUserRoles(authData!.user)!,
    } as AuthResponse;
  },

  /**
   * Регистрация нового пользователя
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await goldpcApi.postAuthRegister(data);
    const authData = extractData<AuthResponseApiResponse['data']>(response.data);
    return {
      ...authData!,
      user: normalizeUserRoles(authData!.user)!,
    } as AuthResponse;
  },

  /**
   * Выход из системы (отзыв токенов на сервере)
   */
  async logout(): Promise<void> {
    try {
      await goldpcApi.postAuthLogout();
    } catch {
      // Игнорируем ошибки при logout - очищаем токены локально в любом случае
    }
  },

  /**
   * Обновление токенов
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await goldpcApi.postAuthRefresh({ refreshToken });
    const data = extractData<AuthResponseApiResponse['data']>(response.data);
    return {
      ...data!,
      user: normalizeUserRoles(data!.user)!,
    } as AuthResponse;
  },

  /**
   * Получение текущего пользователя
   */
  async getCurrentUser(): Promise<AuthResponse['user']> {
    const response = await goldpcApi.getAuthProfile();
    const user = extractData<UserDtoApiResponse['data']>(response.data);
    return normalizeUserRoles(user)!;
  },

  /**
   * Запрос на восстановление пароля (отправляет email со ссылкой)
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await goldpcApi.postAuthForgotPassword(data);
  },

  /**
   * Сброс пароля по токену из email
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await goldpcApi.postAuthResetPassword(data);
  },

  /**
   * Валидация токена сброса пароля (без мутаций).
   * Вызывается при загрузке страницы reset-password, чтобы сразу
   * определить, действителен ли токен, или показывать expired-экран.
   * Бросает ошибку, если токен недействителен — используйте getAuthErrorMessage.
   */
  async validateResetToken(token: string): Promise<void> {
    await goldpcApi.postAuthValidateResetToken({ token });
  },

  /**
   * Отправка письма с подтверждением email (или повторная отправка).
   * Требует авторизации — userId извлекается из JWT на сервере.
   */
  async sendVerificationEmail(): Promise<void> {
    await goldpcApi.postAuthSendVerification();
  },

  /**
   * Подтверждение email по токену из письма.
   * Не требует авторизации — токен одноразовый.
   */
  async verifyEmail(token: string): Promise<void> {
    await goldpcApi.postAuthVerifyEmail({ token });
  },

  /**
   * Смена пароля
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await goldpcApi.postAuthChangePassword(data);
  },

  /**
   * Получение текущих предпочтений уведомлений
   */
  async getNotificationPreferences(): Promise<NotificationPreferenceResponse> {
    const response = await goldpcApi.getAuthNotifications();
    return extractData<NotificationPreferenceResponseApiResponse['data']>(response.data) as NotificationPreferenceResponse;
  },

  /**
   * Обновление предпочтений уведомлений
   */
  async updateNotificationPreferences(
    data: NotificationPreferenceRequest
  ): Promise<NotificationPreferenceResponse> {
    const response = await goldpcApi.putAuthNotifications(data);
    return extractData<NotificationPreferenceResponseApiResponse['data']>(response.data) as NotificationPreferenceResponse;
  },

  /**
   * Включение двухфакторной аутентификации
   */
  async enableTwoFactor(): Promise<TwoFactorStatusResponse> {
    const response = await goldpcApi.postAuthSecurity2faEnable();
    return extractData<TwoFactorStatusResponseApiResponse['data']>(response.data) as TwoFactorStatusResponse;
  },

  /**
   * Подтверждение включения двухфакторной аутентификации
   */
  async verifyTwoFactor(code: string): Promise<TwoFactorStatusResponse> {
    const response = await goldpcApi.postAuthSecurity2faVerify({ totpCode: code });
    return extractData<TwoFactorStatusResponseApiResponse['data']>(response.data) as TwoFactorStatusResponse;
  },

  /**
   * Отключение двухфакторной аутентификации
   */
  async disableTwoFactor(password: string): Promise<void> {
    await goldpcApi.postAuthSecurity2faDisable({ password });
  },

  /**
   * История входов пользователя
   */
  async getLoginHistory(
    page = 1,
    pageSize = 20
  ): Promise<{ items: LoginHistoryItem[]; total: number }> {
    try {
      const response = await goldpcApi.getAuthSecurityLoginHistory({
        pageNumber: page,
        pageSize,
      });
      const data = extractData<LoginHistoryItemPagedResultApiResponse['data']>(response.data);
      return {
        items: (data?.items ?? []) as LoginHistoryItem[],
        total: data?.totalCount ?? 0,
      };
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
    const response = await goldpcApi.putAuthProfile(data);
    const user = extractData<UserDtoApiResponse['data']>(response.data);
    return normalizeUserRoles(user)!;
  },

  /**
   * Загрузить аватар пользователя
   */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const body: PostApiV1AuthAvatarBody = { avatar: file };
    const response = await goldpcApi.postAuthAvatar(body);
    const data = extractData<{ avatarUrl: string }>(response.data);
    return data;
  },

  /**
   * Удалить аватар пользователя
   */
  async deleteAvatar(): Promise<void> {
    await goldpcApi.deleteAuthAvatar();
  },
};
