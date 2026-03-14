using GoldPC.AuthService.Entities;
using GoldPC.SharedKernel.Enums;

namespace GoldPC.AuthService.Services;

/// <summary>
/// Интерфейс сервиса JWT токенов
/// </summary>
public interface IJwtService
{
    /// <summary>
    /// Генерация access токена
    /// </summary>
    string GenerateAccessToken(User user);
    
    /// <summary>
    /// Генерация refresh токена
    /// </summary>
    string GenerateRefreshToken();
    
    /// <summary>
    /// Получение ID пользователя из токена
    /// </summary>
    Guid? GetUserIdFromToken(string token);
    
    /// <summary>
    /// Валидация токена
    /// </summary>
    bool ValidateToken(string token);
}