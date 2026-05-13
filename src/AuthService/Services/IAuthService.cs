using GoldPC.SharedKernel.DTOs;
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
    Task<(AuthResponse? Response, string? Error)> LoginAsync(LoginRequest request, string ipAddress);
    
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
}

/// <summary>
/// Запрос на сброс пароля (forgot password)
/// </summary>
public class ForgotPasswordRequest
{
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// Запрос на установку нового пароля (reset password)
/// </summary>
public class ResetPasswordRequest
{
    public string Token { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// Запрос на смену пароля
/// </summary>
public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
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

