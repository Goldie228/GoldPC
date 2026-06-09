using CatalogService.Services.Interfaces;

namespace CatalogService.Services;

/// <summary>
/// Парсер категории товара по названию и характеристикам.
/// Использует правила на основе ключей спецификаций и ключевых слов названия.
/// Идемпотентен — одинаковый вход всегда даёт одинаковый результат.
/// </summary>
public class CategoryParser : ICategoryParser
{
    private readonly ILogger<CategoryParser> _logger;

    public CategoryParser(ILogger<CategoryParser> logger)
    {
        _logger = logger;
    }

    public string? DetectCategory(string name, Dictionary<string, object>? specifications)
    {
        if (string.IsNullOrWhiteSpace(name) && specifications == null)
        {
            return null;
        }

        var nameLower = name?.ToLowerInvariant() ?? string.Empty;
        var specKeys = specifications?.Keys
            .Select(k => k.ToLowerInvariant())
            .ToHashSet(StringComparer.OrdinalIgnoreCase) ?? new HashSet<string>();

        // CPU
        if (HasSpecKey(specKeys, "socket", "сокет", "tdp") ||
            nameLower.Contains("процессор") || nameLower.Contains("core") || nameLower.Contains("ryzen"))
        {
            _logger.LogDebug("Категория определена как 'cpu' по названию '{Name}'", name);
            return "cpu";
        }

        // GPU
        if (HasSpecKey(specKeys, "видеопамять", "gpu", "графический процессор") ||
            nameLower.Contains("видеокарта") || nameLower.Contains("geforce") || nameLower.Contains("radeon"))
        {
            _logger.LogDebug("Категория определена как 'gpu' по названию '{Name}'", name);
            return "gpu";
        }

        // Motherboard
        if (HasSpecKey(specKeys, "чипсет") ||
            (specKeys.Contains("socket") && specKeys.Contains("озу")) ||
            nameLower.Contains("материнская плата"))
        {
            _logger.LogDebug("Категория определена как 'motherboard' по названию '{Name}'", name);
            return "motherboard";
        }

        // RAM
        if (HasSpecKey(specKeys, "тип памяти", "ddr", "оперативная память") ||
            nameLower.Contains("оперативная память") || nameLower.Contains("ram"))
        {
            _logger.LogDebug("Категория определена как 'ram' по названию '{Name}'", name);
            return "ram";
        }

        // Storage
        if (HasSpecKey(specKeys, "объём накопителя", "ssd", "nvme") ||
            nameLower.Contains("ssd") || nameLower.Contains("накопитель"))
        {
            _logger.LogDebug("Категория определена как 'storage' по названию '{Name}'", name);
            return "storage";
        }

        // PSU
        if (HasSpecKey(specKeys, "мощность", "бп") ||
            nameLower.Contains("блок питания"))
        {
            _logger.LogDebug("Категория определена как 'psu' по названию '{Name}'", name);
            return "psu";
        }

        // Case
        if (nameLower.Contains("корпус") || nameLower.Contains("case"))
        {
            _logger.LogDebug("Категория определена как 'case' по названию '{Name}'", name);
            return "case";
        }

        // Cooling
        if (HasSpecKey(specKeys, "тип охлаждения", "кулер") ||
            nameLower.Contains("охлаждение") || nameLower.Contains("кулер"))
        {
            _logger.LogDebug("Категория определена как 'cooling' по названию '{Name}'", name);
            return "cooling";
        }

        // Monitor
        if (nameLower.Contains("монитор") || nameLower.Contains("monitor"))
        {
            _logger.LogDebug("Категория определена как 'monitor' по названию '{Name}'", name);
            return "monitor";
        }

        // Keyboard
        if (nameLower.Contains("клавиатура") || nameLower.Contains("keyboard"))
        {
            _logger.LogDebug("Категория определена как 'keyboard' по названию '{Name}'", name);
            return "keyboard";
        }

        // Mouse
        if (nameLower.Contains("мышь") || nameLower.Contains("mouse"))
        {
            _logger.LogDebug("Категория определена как 'mouse' по названию '{Name}'", name);
            return "mouse";
        }

        // Headphones
        if (nameLower.Contains("наушники") || nameLower.Contains("headphones"))
        {
            _logger.LogDebug("Категория определена как 'headphones' по названию '{Name}'", name);
            return "headphones";
        }

        _logger.LogDebug("Категория не определена для '{Name}'", name);
        return null;
    }

    private static bool HasSpecKey(HashSet<string> specKeys, params string[] keys)
    {
        return keys.Any(k => specKeys.Contains(k));
    }
}
