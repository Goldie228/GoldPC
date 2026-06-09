namespace CatalogService.Services.Interfaces;

/// <summary>
/// Интерфейс парсера категории товара по названию и характеристикам
/// </summary>
public interface ICategoryParser
{
    /// <summary>
    /// Определяет slug категории товара на основе названия и характеристик.
    /// Возвращает null, если категория не может быть определена.
    /// </summary>
    string? DetectCategory(string name, Dictionary<string, object>? specifications);
}
