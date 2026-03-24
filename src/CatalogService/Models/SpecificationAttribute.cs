namespace CatalogService.Models;

/// <summary>
/// Тип значения атрибута спецификации
/// </summary>
public enum SpecificationAttributeValueType
{
    Select = 0,
    Range = 1
}

/// <summary>
/// Глобальное определение атрибута спецификации (socket, efficiency, vram и т.д.)
/// </summary>
public class SpecificationAttribute
{
    public Guid Id { get; set; }

    /// <summary>Ключ атрибута (socket, efficiency, vram...)</summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>Отображаемое имя по умолчанию</summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>Тип: select (чекбоксы) или range (диапазон)</summary>
    public SpecificationAttributeValueType ValueType { get; set; }

    /// <summary>Может ли товар иметь несколько значений (socket: AM4,AM5)</summary>
    public bool IsMultiValue { get; set; }

    public ICollection<SpecificationCanonicalValue> CanonicalValues { get; set; } = new List<SpecificationCanonicalValue>();
    public ICollection<CategoryFilterAttribute> CategoryFilterAttributes { get; set; } = new List<CategoryFilterAttribute>();
    public ICollection<ProductSpecificationValue> ProductValues { get; set; } = new List<ProductSpecificationValue>();
}
