namespace CatalogService.Models;

/// <summary>
/// Каноническое значение для select-атрибута (AM5, 80+ Gold, DDR5 и т.д.)
/// </summary>
public class SpecificationCanonicalValue
{
    public Guid Id { get; set; }

    public Guid AttributeId { get; set; }
    public SpecificationAttribute Attribute { get; set; } = null!;

    /// <summary>Нормализованное значение для отображения и фильтрации</summary>
    public string ValueText { get; set; } = string.Empty;

    /// <summary>Порядок сортировки в фильтре</summary>
    public int SortOrder { get; set; }

    public ICollection<ProductSpecificationValue> ProductValues { get; set; } = new List<ProductSpecificationValue>();
}
