using GoldPC.SharedKernel.Entities;
using GoldPC.SharedKernel.Enums;

namespace GoldPC.AuthService.Entities;

/// <summary>
/// Пользователь системы GoldPC
/// </summary>
public class User : BaseEntity
{
    /// <summary>
    /// Email пользователя (логин)
    /// </summary>
    public string Email { get; set; } = string.Empty;
    
    /// <summary>
    /// Хэш пароля (bcrypt)
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;
    
    /// <summary>
    /// Роль пользователя (устарело, используйте Roles для множественных ролей)
    /// </summary>
    [Obsolete("Use Roles collection instead")]
    public UserRole Role
    {
        get => Roles.FirstOrDefault(UserRole.Client);
        set
        {
            Roles.Clear();
            Roles.Add(value);
        }
    }

    /// <summary>
    /// Множественные роли пользователя
    /// </summary>
    public ICollection<UserRole> Roles { get; set; } = new List<UserRole> { UserRole.Client };
    
    /// <summary>
    /// Имя
    /// </summary>
    public string FirstName { get; set; } = string.Empty;
    
    /// <summary>
    /// Фамилия
    /// </summary>
    public string LastName { get; set; } = string.Empty;
    
    /// <summary>
    /// Телефон в формате +375XXXXXXXXX
    /// </summary>
    public string Phone { get; set; } = string.Empty;
    
    /// <summary>
    /// Признак активности учётной записи
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// Количество неудачных попыток входа
    /// </summary>
    public int FailedLoginAttempts { get; set; }
    
    /// <summary>
    /// Время блокировки до
    /// </summary>
    public DateTime? LockedUntil { get; set; }
    
    /// <summary>
    /// Refresh токены пользователя
    /// </summary>
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    /// <summary>
    /// Избранные товары пользователя.
    /// </summary>
    public ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();
    
    /// <summary>
    /// Адреса доставки пользователя
    /// </summary>
    public ICollection<UserAddress> Addresses { get; set; } = new List<UserAddress>();
    
    /// <summary>
    /// Полное имя
    /// </summary>
    public string FullName => $"{FirstName} {LastName}";
}