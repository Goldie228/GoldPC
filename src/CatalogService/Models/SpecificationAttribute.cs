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

    /// <summary>Единица измерения (МГц, ГБ, мм, Ом, Вт...)</summary>
    public string? Unit { get; set; }

    /// <summary>Группа для группировки в админке ("Основные", "Память", "Питание"...)</summary>
    public string? GroupName { get; set; }

    /// <summary>Порядок сортировки в админке</summary>
    public int SortOrder { get; set; }

    /// <summary>Минимальное значение (для числовых)</summary>
    public decimal? ValidationMin { get; set; }

    /// <summary>Максимальное значение (для числовых)</summary>
    public decimal? ValidationMax { get; set; }

    /// <summary>Шаг изменения (для числовых)</summary>
    public decimal? ValidationStep { get; set; }

    /// <summary>Обязательное поле</summary>
    public bool IsRequired { get; set; }

    public ICollection<SpecificationCanonicalValue> CanonicalValues { get; set; } = new List<SpecificationCanonicalValue>();
    public ICollection<CategoryFilterAttribute> CategoryFilterAttributes { get; set; } = new List<CategoryFilterAttribute>();
    public ICollection<ProductSpecificationValue> ProductValues { get; set; } = new List<ProductSpecificationValue>();
}
