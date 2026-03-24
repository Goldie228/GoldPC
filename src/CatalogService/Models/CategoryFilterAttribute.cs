namespace CatalogService.Models;

/// <summary>
/// Тип фильтра по характеристикам
/// </summary>
public enum FilterAttributeType
{
    Select = 0,  // Чекбоксы/выбор значений
    Range = 1    // Диапазон (min-max)
}

/// <summary>
/// Атрибут фильтрации для категории (VRAM, socket, chipset и т.д.)
/// </summary>
public class CategoryFilterAttribute
{
    public Guid Id { get; set; }

    /// <summary>ID категории</summary>
    public Guid CategoryId { get; set; }

    /// <summary>Категория</summary>
    public Category Category { get; set; } = null!;

    /// <summary>ID глобального атрибута спецификации</summary>
    public Guid AttributeId { get; set; }

    /// <summary>Атрибут спецификации</summary>
    public SpecificationAttribute Attribute { get; set; } = null!;

    /// <summary>Ключ атрибута (денормализация Attribute.Key для запросов)</summary>
    public string AttributeKey { get; set; } = string.Empty;

    /// <summary>Отображаемое имя для фильтра ("Объём видеопамяти", "Чипсет")</summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>Тип фильтра: select или range</summary>
    public FilterAttributeType FilterType { get; set; }

    /// <summary>Порядок отображения в сайдбаре</summary>
    public int SortOrder { get; set; }
}
