using System.ComponentModel.DataAnnotations;
using GoldPC.SharedKernel.Enums;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO пользователя для обмена между сервисами
/// </summary>
public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

/// <summary>
/// DTO для регистрации пользователя
/// </summary>
public class RegisterRequest
{
    [Required(ErrorMessage = "Email обязателен")]
    [EmailAddress(ErrorMessage = "Некорректный формат email")]
    public string Email { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Пароль обязателен")]
    [MinLength(8, ErrorMessage = "Пароль должен содержать минимум 8 символов")]
    [MaxLength(128, ErrorMessage = "Пароль не должен превышать 128 символов")]
    public string Password { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Имя обязательно")]
    [MinLength(2, ErrorMessage = "Имя должно содержать минимум 2 символа")]
    [MaxLength(50, ErrorMessage = "Имя не должно превышать 50 символов")]
    public string FirstName { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Фамилия обязательна")]
    [MinLength(2, ErrorMessage = "Фамилия должна содержать минимум 2 символа")]
    [MaxLength(50, ErrorMessage = "Фамилия не должна превышать 50 символов")]
    public string LastName { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Телефон обязателен")]
    [RegularExpression(@"^\+375\d{9}$", ErrorMessage = "Телефон должен быть в формате +375XXXXXXXXX")]
    public string Phone { get; set; } = string.Empty;
}

/// <summary>
/// DTO для входа в систему
/// </summary>
public class LoginRequest
{
    [Required(ErrorMessage = "Email обязателен")]
    [EmailAddress(ErrorMessage = "Некорректный формат email")]
    public string Email { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Пароль обязателен")]
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// DTO для ответа аутентификации
/// </summary>
public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public int ExpiresIn { get; set; } = 900; // 15 минут в секундах
    public UserDto User { get; set; } = null!;
}

/// <summary>
/// DTO для обновления токена
/// </summary>
public class RefreshTokenRequest
{
    [Required(ErrorMessage = "Refresh token обязателен")]
    public string RefreshToken { get; set; } = string.Empty;
}