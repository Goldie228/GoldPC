// CA1724: Имя класса User конфликтует с System.Security.Principal.User и Twilio.User.
// Это основная сущность пользователя в домене AuthService, переименование нецелесообразно.
#pragma warning disable CA1724

using GoldPC.SharedKernel.Entities;
using GoldPC.SharedKernel.Enums;

namespace GoldPC.AuthService.Entities;

/// <summary>
/// Пользователь системы GoldPC
/// </summary>
public class User : BaseEntity
{
    /// <summary>
    /// Email пользователя (логин). Зашифрован AES-256-GCM если включено шифрование.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// SHA256-хеш email (в открытом виде) для поиска и логина.
    /// </summary>
    public string? EmailHash { get; set; }

    /// <summary>
    /// Хэш пароля (bcrypt)
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// Роль пользователя. Резерв для множественных ролей через Roles.
    /// </summary>
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
    public List<UserRole> Roles { get; set; } = new List<UserRole> { UserRole.Client };

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
    /// URL аватара пользователя
    /// </summary>
    public string? AvatarUrl { get; set; }

    /// <summary>
    /// Дата рождения
    /// </summary>
    public DateTime? BirthDate { get; set; }

    /// <summary>
    /// Компания
    /// </summary>
    public string? Company { get; set; }

    /// <summary>
    /// Признак активности учётной записи
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Подтверждён ли email пользователя
    /// </summary>
    public bool IsEmailVerified { get; set; }

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
    /// Токены сброса пароля
    /// </summary>
    public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();

    /// <summary>
    /// Токены подтверждения email
    /// </summary>
    public ICollection<EmailVerificationToken> EmailVerificationTokens { get; set; } = new List<EmailVerificationToken>();

    /// <summary>
    /// Полное имя
    /// </summary>
    public string FullName => $"{FirstName} {LastName}";
}