using GoldPC.SharedKernel.Entities;

namespace GoldPC.AuthService.Entities;

/// <summary>
/// Адрес пользователя для доставки
/// </summary>
public class UserAddress : BaseEntity
{
    /// <summary>
    /// ID пользователя
    /// </summary>
    public Guid UserId { get; set; }
    
    /// <summary>
    /// Название адреса (например, "Дом", "Офис")
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Город
    /// </summary>
    public string City { get; set; } = string.Empty;
    
    /// <summary>
    /// Адрес
    /// </summary>
    public string Address { get; set; } = string.Empty;
    
    /// <summary>
    /// Квартира/офис
    /// </summary>
    public string? Apartment { get; set; }
    
    /// <summary>
    /// Почтовый индекс
    /// </summary>
    public string? PostalCode { get; set; }
    
    /// <summary>
    /// Является ли адрес адресом по умолчанию
    /// </summary>
    public bool IsDefault { get; set; }
    
    /// <summary>
    /// Пользователь
    /// </summary>
    public User User { get; set; } = null!;
}
