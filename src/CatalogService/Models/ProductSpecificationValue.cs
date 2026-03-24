namespace CatalogService.Models;

/// <summary>
/// Значение спецификации товара (нормализованное)
/// </summary>
public class ProductSpecificationValue
{
    public Guid Id { get; set; }

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public Guid AttributeId { get; set; }
    public SpecificationAttribute Attribute { get; set; } = null!;

    /// <summary>Для select-атрибутов: ссылка на каноническое значение</summary>
    public Guid? CanonicalValueId { get; set; }
    public SpecificationCanonicalValue? CanonicalValue { get; set; }

    /// <summary>Для range-атрибутов: числовое значение</summary>
    public decimal? ValueNumber { get; set; }
}
