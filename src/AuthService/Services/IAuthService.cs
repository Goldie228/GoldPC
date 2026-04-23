using GoldPC.SharedKernel.DTOs;

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
}

/// <summary>
/// Запрос на смену пароля
/// </summary>
public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

