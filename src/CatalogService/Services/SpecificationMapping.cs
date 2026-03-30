using CatalogService.Models;

namespace CatalogService.Services;

/// <summary>
/// Преобразование между SpecificationValues и Dictionary для API.
/// </summary>
public static class SpecificationMapping
{
    /// <summary>
    /// Собирает Dictionary из SpecificationValues для отдачи в API.
    /// </summary>
    public static Dictionary<string, object> ToSpecificationsDict(
        this ICollection<ProductSpecificationValue> values)
    {
        if (values == null || values.Count == 0)
            return new Dictionary<string, object>();

        var dict = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
        var byKey = values
            .Where(v => v.Attribute != null)
            .GroupBy(v => v.Attribute.Key);

        foreach (var g in byKey)
        {
            var key = g.Key;
            var items = g.ToList();
            if (items.Count == 1)
            {
                var v = items[0];
                dict[key] = v.CanonicalValueId.HasValue && v.CanonicalValue != null
                    ? (object)NormalizeBooleanDisplay(v.CanonicalValue.ValueText)
                    : (v.ValueNumber ?? 0m);
            }
            else
            {
                var texts = items
                    .Where(i => i.CanonicalValue != null)
                    .Select(i => NormalizeBooleanDisplay(i.CanonicalValue!.ValueText))
                    .ToList();
                if (texts.Count > 0)
                    dict[key] = string.Join(", ", texts);
                else if (items.Any(i => i.ValueNumber.HasValue))
                    dict[key] = items.First(i => i.ValueNumber.HasValue).ValueNumber!.Value;
            }
        }
        return dict;
    }

    private static string NormalizeBooleanDisplay(string value)
    {
        return value.Trim().ToLowerInvariant() switch
        {
            "true" or "1" or "yes" => "Да",
            "false" or "0" or "no" => "Нет",
            _ => value
        };
    }
}
