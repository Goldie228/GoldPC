using CatalogService.Data;
using CatalogService.Models;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Services;

/// <summary>
/// Нормализация сырых значений спецификаций при импорте/создании.
/// Маппинг raw → canonical value id или value_number.
/// </summary>
public class SpecImportNormalizer
{
    private readonly CatalogDbContext _context;
    private readonly ILogger<SpecImportNormalizer> _logger;
    private Dictionary<string, SpecificationAttribute>? _attrCache;
    private Dictionary<(Guid, string), Guid>? _canonicalCache;

    public SpecImportNormalizer(CatalogDbContext context, ILogger<SpecImportNormalizer> logger)
    {
        _context = context;
        _logger = logger;
    }

    private async Task EnsureCacheAsync()
    {
        if (_attrCache != null) return;

        var attrs = await _context.SpecificationAttributes.ToListAsync();
        _attrCache = attrs.ToDictionary(a => a.Key, StringComparer.OrdinalIgnoreCase);

        var canonicals = await _context.SpecificationCanonicalValues
            .Select(c => new { c.AttributeId, c.ValueText, c.Id })
            .ToListAsync();
        _canonicalCache = canonicals.ToDictionary(
            c => (c.AttributeId, c.ValueText.Trim().ToLowerInvariant()),
            c => c.Id);
    }

    /// <summary>
    /// Преобразует Dictionary в список ProductSpecificationValue для товара.
    /// </summary>
    public async Task<List<ProductSpecificationValue>> ToSpecificationValuesAsync(
        Guid productId,
        Dictionary<string, object> specifications)
    {
        if (specifications == null || specifications.Count == 0)
            return new List<ProductSpecificationValue>();

        await EnsureCacheAsync();
        var result = new List<ProductSpecificationValue>();

        foreach (var (key, rawValue) in specifications)
        {
            if (string.IsNullOrWhiteSpace(key) || rawValue == null) continue;
            if (!_attrCache!.TryGetValue(key.Trim(), out var attr)) continue;

            var valueStr = rawValue.ToString()?.Trim() ?? "";
            if (string.IsNullOrEmpty(valueStr)) continue;

            if (attr.ValueType == SpecificationAttributeValueType.Range)
            {
                var (success, validatedValue, error) = SpecificationValidation.ParseAndValidateNumber(key.Trim(), rawValue);
                if (success && validatedValue.HasValue)
                {
                    result.Add(new ProductSpecificationValue
                    {
                        Id = Guid.NewGuid(),
                        ProductId = productId,
                        AttributeId = attr.Id,
                        CanonicalValueId = null,
                        ValueNumber = validatedValue.Value
                    });
                }
                else if (!success)
                {
                    _logger.LogWarning(
                        "Validation failed for attribute {AttributeKey} with value {RawValue} on product {ProductId}: {Error}",
                        key, rawValue, productId, error);
                }
                continue;
            }

            var parts = attr.IsMultiValue
                ? valueStr.Split(',', StringSplitOptions.TrimEntries).Where(s => !string.IsNullOrEmpty(s))
                : new[] { valueStr };

            foreach (var part in parts.Distinct())
            {
                var normalized = NormalizeForLookup(attr.Key, part);
                
                // Пропускаем значения, которые вернули пустую строку (leaked/invalid)
                if (string.IsNullOrEmpty(normalized)) continue;
                
                if (_canonicalCache!.TryGetValue((attr.Id, normalized), out var canonId))
                {
                    result.Add(new ProductSpecificationValue
                    {
                        Id = Guid.NewGuid(),
                        ProductId = productId,
                        AttributeId = attr.Id,
                        CanonicalValueId = canonId,
                        ValueNumber = null
                    });
                }
                else
                {
                    var cv = new SpecificationCanonicalValue
                    {
                        Id = Guid.NewGuid(),
                        AttributeId = attr.Id,
                        ValueText = part,
                        SortOrder = 999
                    };
                    _context.SpecificationCanonicalValues.Add(cv);
                    _canonicalCache[(attr.Id, normalized)] = cv.Id;
                    result.Add(new ProductSpecificationValue
                    {
                        Id = Guid.NewGuid(),
                        ProductId = productId,
                        AttributeId = attr.Id,
                        CanonicalValueId = cv.Id,
                        ValueNumber = null
                    });
                }
            }
        }
        return result;
    }

    private string NormalizeForLookup(string attrKey, string value)
    {
        var v = value.Trim();
        
        // Маршрутизация: фильтрация значений, которые утекли в неправильные поля
        if (ShouldSkipValue(attrKey, v))
        {
            _logger.LogInformation("Skipping leaked value '{Value}' for attribute '{AttributeKey}'", v, attrKey);
            return string.Empty; // Пустая строка означает skip
        }

        var normalized = v.ToLowerInvariant();

        // Нормализация булевых значений
        if (string.Equals(attrKey, "integrated_graphics", StringComparison.OrdinalIgnoreCase))
        {
            if (normalized == "true" || normalized == "1" || normalized == "да" || normalized == "есть" || normalized == "yes") 
                return "есть";
            if (normalized == "false" || normalized == "0" || normalized == "нет" || normalized == "no") 
                return "нет";
            // Если это голое число (частота iGPU), пропускаем
            if (System.Text.RegularExpressions.Regex.IsMatch(v, @"^\d{4}$"))
                return string.Empty;
        }

        // Нормализация модульности БП
        if (string.Equals(attrKey, "modular", StringComparison.OrdinalIgnoreCase))
        {
            // Немодульный
            if (normalized == "false" || normalized == "немодульный" || normalized == "no") 
                return "немодульный (фиксированные кабели)";
            
            // Полностью модульный
            if (normalized == "true" || normalized == "full" || normalized == "модульный" || 
                normalized == "полностью модульное" || normalized.Contains("полностью модульный") ||
                normalized == "yes") 
                return "полностью модульный";
            
            // Полумодульный
            if (normalized == "semi" || normalized.Contains("полумодульн")) 
                return "полумодульный";
        }

        // Нормализация эффективности БП
        if (string.Equals(attrKey, "efficiency", StringComparison.OrdinalIgnoreCase))
        {
            if (normalized == "false") return "без сертификата 80+";
            if (normalized == "true") return "80+ (класс не указан)";
            
            // Базовый (Standard)
            if (normalized.Contains("80+") || normalized.Contains("standard") || normalized == "базовый")
                return "80+ standard";
            
            // Бронзовый (Bronze)
            if (normalized == "бронзовый" || normalized.Contains("bronze"))
                return "80+ bronze";
            
            // Серебряный (Silver)
            if (normalized == "серебряный" || normalized.Contains("silver"))
                return "80+ silver";
            
            // Золотой (Gold)
            if (normalized == "золотой" || normalized.Contains("gold"))
                return "80+ gold";
            
            // Платиновый (Platinum)
            if (normalized == "платиновый" || normalized.Contains("platinum"))
                return "80+ platinum";
            
            // Титановый (Titanium)
            if (normalized == "титановый" || normalized.Contains("titanium"))
                return "80+ titanium";
            
            // Региональные маркеры
            if (normalized.Contains("230v") || normalized.Contains("eu")) 
                return string.Empty; // Skip

            // Значения вида "87%" / "92 %" классифицируем по минимуму эффективности.
            var percentMatch = System.Text.RegularExpressions.Regex.Match(normalized, @"(\d{2,3})(?:[.,]\d+)?\s*%");
            if (percentMatch.Success && int.TryParse(percentMatch.Groups[1].Value, out var percent))
            {
                if (percent >= 96) return "80+ titanium";
                if (percent >= 94) return "80+ platinum";
                if (percent >= 90) return "80+ gold";
                if (percent >= 87) return "80+ silver";
                if (percent >= 85) return "80+ bronze";
                if (percent >= 80) return "80+ standard";
            }
        }

        // Нормализация форм-факторов материнских плат и корпусов
        if (string.Equals(attrKey, "form_factor", StringComparison.OrdinalIgnoreCase))
        {
            var cleaned = normalized.Replace("-", "").Replace("_", "").Replace(" ", "");
            
            // Материнские платы
            if (cleaned == "miniitx") return "mini-itx";
            if (cleaned == "microatx" || cleaned == "matx") return "micro-atx";
            if (cleaned == "atx") return "atx";
            if (cleaned == "eatx") return "e-atx";
            
            // Корпуса / БП
            if (cleaned == "flexatx") return "flex-atx";
            if (cleaned == "sfx") return "sfx";
            if (cleaned == "sfxl") return "sfx-l";
            if (cleaned == "tfx") return "tfx";
        }

        // Нормализация чипсетов (убрать/добавить префикс производителя)
        if (string.Equals(attrKey, "chipset", StringComparison.OrdinalIgnoreCase))
        {
            // Убираем префикс AMD/Intel для унификации
            normalized = System.Text.RegularExpressions.Regex.Replace(normalized, @"^(amd|intel)\s+", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        }

        // Нормализация материалов корпуса: устраняем дубликаты из-за форматирования.
        if (string.Equals(attrKey, "material", StringComparison.OrdinalIgnoreCase))
        {
            var cleaned = normalized
                .Replace("(+", "(+ ")
                .Replace("+пластик", "+ пластик")
                .Replace(" + ", "+")
                .Replace(", ", ",");

            var parts = cleaned
                .Replace("(", "")
                .Replace(")", "")
                .Split(new[] { ',', '+', ';' }, StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .Select(p => p.Trim())
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(p => p)
                .ToList();

            if (parts.Count > 0)
                return string.Join(", ", parts);
        }

        // Нормализация модельных рядов процессоров
        if (string.Equals(attrKey, "model_series", StringComparison.OrdinalIgnoreCase))
        {
            // Всегда добавляем бренд (предполагаем, что он будет добавлен позже через контекст)
            // Пока просто нормализуем
            normalized = v.Trim();
        }

        // Нормализация поддержки памяти процессора (сортировка)
        if (string.Equals(attrKey, "memory_support", StringComparison.OrdinalIgnoreCase))
        {
            var parts = v.Split(',', StringSplitOptions.TrimEntries);
            return string.Join(", ", parts.OrderBy(p => p));
        }

        // Нормализация интерфейса накопителей (убрать двойные пробелы и оксюмороны)
        if (string.Equals(attrKey, "interface", StringComparison.OrdinalIgnoreCase))
        {
            var cleaned = System.Text.RegularExpressions.Regex.Replace(v, @"\s+", " ").Trim();
            // Удалить (NVMe) если есть SATA (оксюморон)
            if (cleaned.Contains("SATA", StringComparison.OrdinalIgnoreCase) && 
                cleaned.Contains("NVMe", StringComparison.OrdinalIgnoreCase))
            {
                cleaned = System.Text.RegularExpressions.Regex.Replace(cleaned, @"\s*\(NVMe[^)]*\)", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            }
            return cleaned.Trim().ToLowerInvariant();
        }

        // Нормализация типа флеш-памяти (убрать протокол)
        if (string.Equals(attrKey, "flash_type", StringComparison.OrdinalIgnoreCase))
        {
            return System.Text.RegularExpressions.Regex.Replace(v, @"\s*\(.*?\)\s*", "").Trim().ToLowerInvariant();
        }

        // Нормализация XMP профилей
        if (string.Equals(attrKey, "xmp", StringComparison.OrdinalIgnoreCase))
        {
            if (normalized == "false") return "не поддерживается";
            if (normalized == "true" || normalized == "2.0" || normalized == "(2.0)" || normalized.Contains("xmp 2.0")) 
                return "xmp 2.0";
            if (normalized == "3.0" || normalized == "(3.0)") 
                return "xmp 3.0";
        }

        return normalized;
    }

    /// <summary>
    /// Проверяет, нужно ли пропустить значение (утекло из другого поля)
    /// </summary>
    private bool ShouldSkipValue(string attrKey, string value)
    {
        var v = value.ToLowerInvariant();

        // Универсальная фильтрация для атрибута "type"
        if (attrKey.Equals("type", StringComparison.OrdinalIgnoreCase))
        {
            // Батарейки (клавиатуры, мыши)
            if (System.Text.RegularExpressions.Regex.IsMatch(v, @"(\d+\s*x\s*)?(aa|aaa|li-\w+|li-ion)", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                return true;
            
            // Свитчи клавиатуры
            if (System.Text.RegularExpressions.Regex.IsMatch(v, @"(razer|kailh|outemu|cherry|bloody|logitech)\s+(red|blue|green|brown|yellow)", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                return true;

            // Форм-факторы клавиатуры (должны быть в отдельном поле)
            if (System.Text.RegularExpressions.Regex.IsMatch(v, @"^\d+%?$|^\d{4}$", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                return true;

            // Интерфейс (для мыши, клавиатуры)
            if (v.Contains("bluetooth") || v.Contains("usb") || v.Contains("радио"))
                return true;

            // Псевдокатегориальные маркетинговые токены, не описывающие тип товара.
            if (v == "gaming" || v == "office" || v == "portable")
                return true;

            // 3D-форматы (мыши - это специфика, не тип)
            if (v.Contains("3d"))
                return true;

            // Длинные описания кнопок (мыши)
            if (value.Length > 50 || v.Contains("нажатием и отклонением"))
                return true;

            // Яркость (для монитора)
            if (System.Text.RegularExpressions.Regex.IsMatch(v, @"\d+\s*(кд/м|cd/m|nits)", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                return true;

            // Крепление микрофона (наушники)
            if (v.Contains("держатель") || v.Contains("встроенный в корпус") || 
                v.Contains("на проводе") || v.Contains("складное оголовье") || 
                v.Contains("поворотные чашки") || v.Contains("съемный"))
                return true;
            
            // Коннекторы питания (системы охлаждения)
            if (System.Text.RegularExpressions.Regex.IsMatch(v, @"\d+\s*pin|molex|sata|usb", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                return true;

            // Организация чипов (оперативная память - должна быть в отдельном поле chip_organization)
            if (System.Text.RegularExpressions.Regex.IsMatch(v, @"\d+(G|M)x\d+", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                return true;

            // Булевы значения
            if (v == "false" || v == "true")
                return true;
        }

        // Форм-фактор корпуса: пропускаем физические размеры и форм-факторы БП
        if (attrKey.Equals("form_factor", StringComparison.OrdinalIgnoreCase))
        {
            // Физические размеры
            if (System.Text.RegularExpressions.Regex.IsMatch(v, @"\d+[""]?\s*x\s*\d+|до\s+\d+\s*мм|\d+x\d+\s*мм", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                return true;

            // Форм-факторы БП (утекли в корпуса - должны быть в psu_form_factor)
            var lowerValue = value.ToLower();
            if (lowerValue == "sfx" || lowerValue == "sfx-l" || lowerValue == "tfx" || lowerValue == "flex atx" || lowerValue == "flexatx")
                return true;
        }

        return false;
    }
}
