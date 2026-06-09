namespace CatalogService.Models;

/// <summary>
/// Запись об изменении цены товара
/// </summary>
public class PriceHistory
{
    public Guid Id { get; set; }

    /// <summary>ID товара</summary>
    public Guid ProductId { get; set; }

    /// <summary>Товар</summary>
    public Product Product { get; set; } = null!;

    /// <summary>Новая цена</summary>
    public decimal Price { get; set; }

    /// <summary>Старая цена (null при первом создании)</summary>
    public decimal? OldPrice { get; set; }

    /// <summary>Дата изменения</summary>
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    /// <summary>ID администратора, выполнившего изменение</summary>
    public string? ChangedBy { get; set; }
}
