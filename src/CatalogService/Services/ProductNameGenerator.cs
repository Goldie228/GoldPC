using CatalogService.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace CatalogService.Services;

/// <summary>
/// Генератор названий товаров по шаблону "{Manufacturer} {CategoryName} {KeySpecs}"
/// Примеры:
/// - CPU: "Intel Core i7-13700F" (manufacturer=Intel, specs={model: "Core i7-13700F"})
/// - GPU: "NVIDIA Видеокарта Tesla L40 48GB" (manufacturer=NVIDIA, category=gpu, specs={model: "Tesla L40", memory: "48GB"})
/// - RAM: "Kingston FURY Beast DDR5 6000 32GB" (manufacturer=Kingston, specs={model: "FURY Beast", type: "DDR5", speed: "6000", capacity: "32GB"})
/// </summary>
public class ProductNameGenerator : IProductNameGenerator
{
    private readonly ILogger<ProductNameGenerator> _logger;

    // Маппинг slug категории → русское название
    private static readonly Dictionary<string, string> CategoryNames = new(StringComparer.OrdinalIgnoreCase)
    {
        ["cpu"] = "Процессор",
        ["gpu"] = "Видеокарта",
        ["motherboard"] = "Материнская плата",
        ["ram"] = "Оперативная память",
        ["storage"] = "Накопитель",
        ["psu"] = "Блок питания",
        ["case"] = "Корпус",
        ["cooling"] = "Система охлаждения",
        ["monitor"] = "Монитор",
        ["keyboard"] = "Клавиатура",
        ["mouse"] = "Мышь",
        ["headphones"] = "Наушники",
        ["fan"] = "Вентилятор",
    };

    // Ключи для поиска модели в specifications
    private static readonly string[] ModelKeys = ["model", "модель", "модель_процессора", "модель_видеокарты"];

    // Ключи для поиска объёма памяти
    private static readonly string[] MemoryKeys = ["memory", "видеопамять", "объём_памяти", "capacity", "объём"];

    // Ключи для поиска типа памяти
    private static readonly string[] MemoryTypeKeys = ["type", "тип_памяти", "memory_type"];

    // Ключи для поиска скорости памяти
    private static readonly string[] MemorySpeedKeys = ["speed", "скорость", "частота"];

    public ProductNameGenerator(ILogger<ProductNameGenerator> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Сгенерировать название товара по шаблону
    /// </summary>
    public string GenerateName(string? manufacturerName, string? categorySlug, Dictionary<string, object>? specifications, string? existingName = null)
    {
        try
        {
            var parts = new List<string>();

            // 1. Производитель
            if (!string.IsNullOrWhiteSpace(manufacturerName))
            {
                parts.Add(manufacturerName.Trim());
            }

            // 2. Категория (русское название)
            if (!string.IsNullOrWhiteSpace(categorySlug) && CategoryNames.TryGetValue(categorySlug, out var categoryName))
            {
                parts.Add(categoryName);
            }

            // 3. Модель из specifications
            var model = GetSpecValue(specifications, ModelKeys);
            if (!string.IsNullOrWhiteSpace(model))
            {
                parts.Add(model.Trim());
            }

            // 4. Тип памяти (DDR5, DDR4 и т.д.)
            var memoryType = GetSpecValue(specifications, MemoryTypeKeys);
            if (!string.IsNullOrWhiteSpace(memoryType))
            {
                parts.Add(memoryType.Trim());
            }

            // 5. Скорость памяти
            var memorySpeed = GetSpecValue(specifications, MemorySpeedKeys);
            if (!string.IsNullOrWhiteSpace(memorySpeed))
            {
                parts.Add(memorySpeed.Trim());
            }

            // 6. Объём памяти (48GB, 32GB и т.д.)
            var memory = GetSpecValue(specifications, MemoryKeys);
            if (!string.IsNullOrWhiteSpace(memory))
            {
                parts.Add(memory.Trim());
            }

            // Если ничего не удалось сгенерировать — вернуть существующее имя или дефолт
            if (parts.Count == 0)
            {
                _logger.LogWarning("GenerateName: не удалось сгенерировать название (manufacturer={Manufacturer}, category={Category})",
                    manufacturerName, categorySlug);
                return existingName ?? "Без названия";
            }

            var result = string.Join(" ", parts);
            _logger.LogDebug("GenerateName: '{Result}' (manufacturer={Manufacturer}, category={Category})",
                result, manufacturerName, categorySlug);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GenerateName: ошибка генерации названия");
            return existingName ?? "Без названия";
        }
    }

    /// <summary>
    /// Получить значение из specifications по списку возможных ключей
    /// </summary>
    private static string? GetSpecValue(Dictionary<string, object>? specifications, string[] keys)
    {
        if (specifications == null || specifications.Count == 0)
            return null;

        foreach (var key in keys)
        {
            // Точное совпадение
            if (specifications.TryGetValue(key, out var value))
            {
                return value?.ToString();
            }

            // Частичное совпадение (ключ содержит искомую подстроку)
            foreach (var specKey in specifications.Keys)
            {
                if (specKey.Contains(key, StringComparison.OrdinalIgnoreCase))
                {
                    return specifications[specKey]?.ToString();
                }
            }
        }

        return null;
    }
}
