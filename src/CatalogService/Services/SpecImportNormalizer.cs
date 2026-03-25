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
    private Dictionary<string, SpecificationAttribute>? _attrCache;
    private Dictionary<(Guid, string), Guid>? _canonicalCache;

    public SpecImportNormalizer(CatalogDbContext context)
    {
        _context = context;
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
                if (TryParseNumber(rawValue, out var num))
                {
                    result.Add(new ProductSpecificationValue
                    {
                        Id = Guid.NewGuid(),
                        ProductId = productId,
                        AttributeId = attr.Id,
                        CanonicalValueId = null,
                        ValueNumber = num
                    });
                }
                continue;
            }

            var parts = attr.IsMultiValue
                ? valueStr.Split(',', StringSplitOptions.TrimEntries).Where(s => !string.IsNullOrEmpty(s))
                : new[] { valueStr };

            foreach (var part in parts.Distinct())
            {
                var normalized = NormalizeForLookup(attr.Key, part);
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

    private static string NormalizeForLookup(string attrKey, string value)
    {
        var v = value.Trim().ToLowerInvariant();
        if (string.Equals(attrKey, "integrated_graphics", StringComparison.OrdinalIgnoreCase))
        {
            if (v == "true" || v == "1" || v == "да" || v == "есть" || v == "yes") return "есть";
            if (v == "false" || v == "0" || v == "нет" || v == "no") return "нет";
        }
        if (string.Equals(attrKey, "modular", StringComparison.OrdinalIgnoreCase))
        {
            if (v == "full" || v == "полностью" || v == "fully") return "full";
            if (v == "semi" || v == "полу" || v == "полумодульный") return "semi";
        }
        return v;
    }

    private static bool TryParseNumber(object value, out decimal num)
    {
        num = 0;
        if (value is decimal d) { num = d; return true; }
        if (value is int i) { num = i; return true; }
        if (value is long l) { num = l; return true; }
        if (value is double db) { num = (decimal)db; return true; }
        var s = value.ToString() ?? "";
        var digits = new string(s.Where(c => char.IsDigit(c) || c == '.' || c == ',').ToArray()).Replace(',', '.');
        return decimal.TryParse(digits, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out num);
    }
}
