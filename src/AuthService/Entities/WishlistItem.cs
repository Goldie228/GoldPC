using GoldPC.SharedKernel.Entities;

namespace GoldPC.AuthService.Entities;

/// <summary>
/// Товар в избранном пользователя.
/// </summary>
public class WishlistItem : BaseEntity
{
    /// <summary>
    /// Владелец избранного.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Пользователь.
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// Идентификатор товара из каталога.
    /// </summary>
    public Guid ProductId { get; set; }
}
