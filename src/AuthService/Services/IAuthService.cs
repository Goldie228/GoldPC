using GoldPC.SharedKernel.DTOs;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace GoldPC.AuthService.Services;

/// <summary>
/// Интерфейс сервиса аутентификации
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Регистрация нового пользователя
    /// </summary>
    Task<(AuthResponse? Response, string? Error)> RegisterAsync(RegisterRequest request);

    /// <summary>
    /// Вход в систему
    /// </summary>
    Task<(AuthResponse? Response, string? Error)> LoginAsync(LoginRequest request, string ipAddress, string userAgent);

    /// <summary>
    /// Обновление токена
    /// </summary>
    Task<(AuthResponse? Response, string? Error)> RefreshTokenAsync(string token, string ipAddress);

    /// <summary>
    /// Выход из системы
    /// </summary>
    Task LogoutAsync(Guid userId, string token, string ipAddress);

    /// <summary>
    /// Получение пользователя по ID
    /// </summary>
    Task<UserDto?> GetUserByIdAsync(Guid id);

    /// <summary>
    /// Получение пользователя по email
    /// </summary>
    Task<UserDto?> GetUserByEmailAsync(string email);

    /// <summary>
    /// Обновление пользователя
    /// </summary>
    Task<(UserDto? User, string? Error)> UpdateUserAsync(Guid id, UpdateUserRequest request);

    /// <summary>
    /// Смена пароля
    /// </summary>
    Task<(bool Success, string? Error)> ChangePasswordAsync(Guid id, ChangePasswordRequest request);

    /// <summary>
    /// Запрос на сброс пароля (отправляет email со ссылкой)
    /// </summary>
    Task<(bool Success, string? Error)> ForgotPasswordAsync(string email, string requestScheme, string requestHost);

    /// <summary>
    /// Сброс пароля по токену
    /// </summary>
    Task<(bool Success, string? Error)> ResetPasswordAsync(string token, string newPassword, string ipAddress);

    /// <summary>
    /// Проверка валидности токена сброса пароля (без мутаций).
    /// Используется фронтендом при загрузке страницы, чтобы сразу показать
    /// expired-экран, не дожидаясь заполнения формы.
    /// </summary>
    Task<(bool Valid, string? Error)> ValidateResetTokenAsync(string token);

    /// <summary>
    /// Отправка письма с подтверждением email (или повторная отправка).
    /// </summary>
    Task<(bool Success, string? Error)> SendVerificationEmailAsync(Guid userId, string requestScheme, string requestHost);

    /// <summary>
    /// Подтверждение email по токену из письма.
    /// </summary>
    Task<(bool Success, string? Error)> VerifyEmailAsync(string token, string ipAddress);

    /// <summary>
    /// Получение истории входов пользователя
    /// </summary>
    Task<(List<LoginHistoryItem>? Items, int TotalCount, string? Error)> GetLoginHistoryAsync(Guid userId, int page = 1, int pageSize = 20);

    /// <summary>
    /// Получение предпочтений уведомлений пользователя
    /// </summary>
    Task<(NotificationPreferenceResponse? Response, string? Error)> GetNotificationPreferencesAsync(Guid userId);

    /// <summary>
    /// Обновление предпочтений уведомлений пользователя
    /// </summary>
    Task<(NotificationPreferenceResponse? Response, string? Error)> UpdateNotificationPreferencesAsync(Guid userId, NotificationPreferenceRequest request);

    /// <summary>
    /// Включение двухфакторной аутентификации (генерация TOTP-секрета и QR-кода)
    /// </summary>
    Task<(TwoFactorStatusResponse? Response, string? Error)> EnableTwoFactorAsync(Guid userId);

    /// <summary>
    /// Подтверждение включения двухфакторной аутентификации (верификация TOTP-кода)
    /// </summary>
    Task<(TwoFactorStatusResponse? Response, string? Error)> VerifyTwoFactorAsync(Guid userId, TwoFactorVerifyRequest request);

    /// <summary>
    /// Отключение двухфакторной аутентификации
    /// </summary>
    Task<(bool Success, string? Error)> DisableTwoFactorAsync(Guid userId, TwoFactorDisableRequest request);

    /// <summary>
    /// Верификация TOTP-кода при входе с обязательной 2FA (Force2FA).
    /// После успешной проверки выдаёт полноценный JWT и refresh-токен.
    /// </summary>
    Task<(AuthResponse? Response, string? Error)> VerifyTwoFactorLoginAsync(
        string twoFactorToken, string totpCode, string ipAddress, string userAgent);

    /// <summary>
    /// Загрузка аватара пользователя
    /// </summary>
    Task<(string? AvatarUrl, string? Error)> UploadAvatarAsync(Guid userId, IFormFile file);

    /// <summary>
    /// Удаление аватара пользователя
    /// </summary>
    Task<(bool Success, string? Error)> DeleteAvatarAsync(Guid userId);
}

/// <summary>
/// Запрос на сброс пароля (forgot password)
/// </summary>
public class ForgotPasswordRequest
{
    [Required(ErrorMessage = "Email обязателен")]
    [EmailAddress(ErrorMessage = "Некорректный формат email")]
    [StringLength(255, ErrorMessage = "Email не может превышать 255 символов")]
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// Запрос на установку нового пароля (reset password)
/// </summary>
public class ResetPasswordRequest
{
    [Required(ErrorMessage = "Токен обязателен")]
    public string Token { get; set; } = string.Empty;

    [Required(ErrorMessage = "Новый пароль обязателен")]
    [MinLength(8, ErrorMessage = "Пароль должен содержать минимум 8 символов")]
    [StringLength(128, ErrorMessage = "Пароль не может превышать 128 символов")]
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// Запрос на смену пароля
/// </summary>
public class ChangePasswordRequest
{
    [Required(ErrorMessage = "Текущий пароль обязателен")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Новый пароль обязателен")]
    [MinLength(8, ErrorMessage = "Пароль должен содержать минимум 8 символов")]
    [StringLength(128, ErrorMessage = "Пароль не может превышать 128 символов")]
    public string NewPassword { get; set; } = string.Empty;
}

/// <summary>
/// Запрос на валидацию токена сброса пароля
/// </summary>
public class ValidateResetTokenRequest
{
    public string Token { get; set; } = string.Empty;
}

/// <summary>
/// Запрос на подтверждение email
/// </summary>
public class VerifyEmailRequest
{
    public string Token { get; set; } = string.Empty;
}

