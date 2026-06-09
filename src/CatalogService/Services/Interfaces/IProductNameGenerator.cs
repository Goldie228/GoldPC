namespace CatalogService.Services.Interfaces;

/// <summary>
/// Генератор названий товаров по шаблону
/// </summary>
public interface IProductNameGenerator
{
    /// <summary>
    /// Сгенерировать название товара по шаблону "{Manufacturer} {CategoryName} {KeySpecs}"
    /// </summary>
    string GenerateName(string? manufacturerName, string? categorySlug, Dictionary<string, object>? specifications, string? existingName = null);
}
