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
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
    const status = axiosError.response?.status;
    const serverMessage = axiosError.response?.data?.message;

    if (status && AUTH_ERROR_MESSAGES[status]) {
      return serverMessage || AUTH_ERROR_MESSAGES[status];
    }

    if (status && status >= 500) {
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
    const response = await goldpcApi.postApiV1AuthLogin(data);
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
    const response = await goldpcApi.postApiV1AuthRegister(data);
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
      await goldpcApi.postApiV1AuthLogout();
    } catch {
      // Игнорируем ошибки при logout - очищаем токены локально в любом случае
    }
  },

  /**
   * Обновление токенов
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await goldpcApi.postApiV1AuthRefresh({ refreshToken });
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
    const response = await goldpcApi.getApiV1AuthProfile();
    const user = extractData<UserDtoApiResponse['data']>(response.data);
    return normalizeUserRoles(user)!;
  },

  /**
   * Запрос на восстановление пароля (отправляет email со ссылкой)
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await goldpcApi.postApiV1AuthForgotPassword(data);
  },

  /**
   * Сброс пароля по токену из email
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await goldpcApi.postApiV1AuthResetPassword(data);
  },

  /**
   * Валидация токена сброса пароля (без мутаций).
   * Вызывается при загрузке страницы reset-password, чтобы сразу
   * определить, действителен ли токен, или показывать expired-экран.
   * Бросает ошибку, если токен недействителен — используйте getAuthErrorMessage.
   */
  async validateResetToken(token: string): Promise<void> {
    await goldpcApi.postApiV1AuthValidateResetToken({ token });
  },

  /**
   * Отправка письма с подтверждением email (или повторная отправка).
   * Требует авторизации — userId извлекается из JWT на сервере.
   */
  async sendVerificationEmail(): Promise<void> {
    await goldpcApi.postApiV1AuthSendVerification();
  },

  /**
   * Подтверждение email по токену из письма.
   * Не требует авторизации — токен одноразовый.
   */
  async verifyEmail(token: string): Promise<void> {
    await goldpcApi.postApiV1AuthVerifyEmail({ token });
  },

  /**
   * Смена пароля
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await goldpcApi.postApiV1AuthChangePassword(data);
  },

  /**
   * Получение текущих предпочтений уведомлений
   */
  async getNotificationPreferences(): Promise<NotificationPreferenceResponse> {
    const response = await goldpcApi.getApiV1AuthNotifications();
    return extractData<NotificationPreferenceResponseApiResponse['data']>(response.data) as NotificationPreferenceResponse;
  },

  /**
   * Обновление предпочтений уведомлений
   */
  async updateNotificationPreferences(
    data: NotificationPreferenceRequest
  ): Promise<NotificationPreferenceResponse> {
    const response = await goldpcApi.putApiV1AuthNotifications(data);
    return extractData<NotificationPreferenceResponseApiResponse['data']>(response.data) as NotificationPreferenceResponse;
  },

  /**
   * Включение двухфакторной аутентификации
   */
  async enableTwoFactor(): Promise<TwoFactorStatusResponse> {
    const response = await goldpcApi.postApiV1AuthSecurity2faEnable();
    return extractData<TwoFactorStatusResponseApiResponse['data']>(response.data) as TwoFactorStatusResponse;
  },

  /**
   * Подтверждение включения двухфакторной аутентификации
   */
  async verifyTwoFactor(code: string): Promise<TwoFactorStatusResponse> {
    const response = await goldpcApi.postApiV1AuthSecurity2faVerify({ totpCode: code });
    return extractData<TwoFactorStatusResponseApiResponse['data']>(response.data) as TwoFactorStatusResponse;
  },

  /**
   * Отключение двухфакторной аутентификации
   */
  async disableTwoFactor(password: string): Promise<void> {
    await goldpcApi.postApiV1AuthSecurity2faDisable({ password });
  },

  /**
   * История входов пользователя
   */
  async getLoginHistory(
    page = 1,
    pageSize = 20
  ): Promise<{ items: LoginHistoryItem[]; total: number }> {
    try {
      const response = await goldpcApi.getApiV1AuthSecurityLoginHistory({
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
    const response = await goldpcApi.putApiV1AuthProfile(data);
    const user = extractData<UserDtoApiResponse['data']>(response.data);
    return normalizeUserRoles(user)!;
  },

  /**
   * Загрузить аватар пользователя
   */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const body: PostApiV1AuthAvatarBody = { avatar: file };
    const response = await goldpcApi.postApiV1AuthAvatar(body);
    const data = extractData<{ avatarUrl: string }>(response.data);
    return data;
  },

  /**
   * Удалить аватар пользователя
   */
  async deleteAvatar(): Promise<void> {
    await goldpcApi.deleteApiV1AuthAvatar();
  },
};
