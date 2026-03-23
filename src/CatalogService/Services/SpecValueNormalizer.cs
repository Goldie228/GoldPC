namespace CatalogService.Services;

/// <summary>
/// Нормализует сырые значения спецификаций для фильтров.
/// Устраняет мусор: true/false, 1400, нечитаемые строки в пользу понятных человеку значений.
/// </summary>
public static class SpecValueNormalizer
{
    /// <summary>Атрибуты с семантикой «есть/нет» — нормализуем к «Есть» / «Нет».</summary>
    private static readonly HashSet<string> BooleanLikeKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "integrated_graphics",
        "cooling_included",
        "multithreading",
    };

    /// <summary>Атрибуты с семантикой «да/нет» — нормализуем к «Да» / «Нет».</summary>
    private static readonly HashSet<string> YesNoKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "ecc",
        "expo",
        "xmp",
    };

    /// <summary>Атрибуты с pattern-based нормализацией (regex, сортировка и т.п.).</summary>
    private static readonly HashSet<string> CanonicalKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "model_series",
        "codename",
        "memory_support",
        "chipset",
        "flash_type",
        "interface",
        "resolution",
    };

    /// <summary>Атрибуты с явными значениями — (attr, raw) → display.</summary>
    private static readonly Dictionary<(string Key, string Raw), string> ValueMappings = new()
    {
        // Процессоры
        { ("socket", "LGA1151 v2"), "LGA1151-2" },
        { ("socket", "SP3 (1P/2P)"), "SP3" },
        { ("delivery_type", "OEM (без коробки, без кулера)"), "OEM" },
        { ("codename", "Raphael (Zen 4)"), "Raphael" },
        { ("codename", "Cezanne (Zen 3)"), "Cezanne" },
        { ("codename", "Granite Ridge (Zen 5)"), "Granite Ridge" },
        // Видеокарты
        { ("okhlazhdenie_1", "воздушное"), "активное" },
        { ("razyemy_pitaniya", "16 pin (12V-2x6)"), "16 pin (12VHPWR)" },
        { ("razyemy_pitaniya", "16 pin (12VHPWR)"), "16 pin (12VHPWR)" },
        { ("razyemy_pitaniya", "16 pin (PCIe Gen5)"), "16 pin (12VHPWR)" },
        { ("razyemy_pitaniya", "false"), "Не требуется" },
        // PSU
        { ("modular", "Модульный"), "Полумодульный" },
        { ("modular", "false"), "Нет" },
        { ("modular", "true"), "Полумодульный" },
        { ("modular", "Full"), "Полностью модульный" },
        { ("modular", "Semi"), "Полумодульный" },
        { ("modular", "полностью модульное"), "Полностью модульный" },
        { ("modular", "полумодульное"), "Полумодульный" },
        { ("modular", "модульный"), "Модульный" },
        { ("modular", "(полностью модульный)"), "Полностью модульный" },
        { ("efficiency", "базовый"), "80+" },
        { ("efficiency", "бронзовый"), "80+ Bronze" },
        { ("efficiency", "серебряный"), "80+ Silver" },
        { ("efficiency", "золотой"), "80+ Gold" },
        { ("efficiency", "платиновый"), "80+ Platinum" },
        { ("efficiency", "титановый"), "80+ Titanium" },
        { ("efficiency", "false"), "Без сертификата" },
        { ("efficiency", "true"), "Сертифицирован" },
        { ("xmp", "true"), "Да" },
        { ("xmp", "false"), "Нет" },
        { ("xmp", "Да"), "Да" },
        { ("xmp", "Нет"), "Нет" },
        { ("xmp", "Поддерживается"), "Да" },
        { ("xmp", "Не поддерживается"), "Нет" },
        { ("xmp", "2.0"), "Да" },
        { ("xmp", "3.0"), "Да" },
        { ("xmp", "XMP"), "Да" },
        { ("xmp", "XMP 2.0"), "Да" },
        { ("xmp", "XMP 3.0"), "Да" },
                                    // Мониторы: изогнутый экран
        { ("curved", "Да"), "Изогнутый" },
        { ("curved", "Нет"), "Плоский" },
        { ("curved", "true"), "Изогнутый" },
        { ("curved", "false"), "Плоский" },
                                    // Корпуса: боковая панель
        { ("window", "Да"), "Стекло" },
        { ("window", "Нет"), "Нет" },
        { ("window", "true"), "Стекло" },
        { ("window", "false"), "Нет" },
    };

    /// <summary>Маппинг для form_factor — «до 280 мм», Mini-ITX варианты, micro-ATX и т.п.</summary>
    private static readonly Dictionary<string, string> FormFactorMappings = new(StringComparer.OrdinalIgnoreCase)
    {
        { "до 280 мм", "eATX (до 280 мм)" },
        { "шириной до 280 мм", "eATX (до 280 мм)" },
        { "ширина: до 280 мм", "eATX (до 280 мм)" },
        { "до 280 мм шириной", "eATX (до 280 мм)" },
        { "miniitx", "Mini-ITX" },
        { "mini-itx", "Mini-ITX" },
        { "micro-atx", "mATX" },
        { "microatx", "mATX" },
        { "flexatx", "Flex ATX" },
        { "m.2 (nvme 1.3)", "M.2" },
        { "m.2 (nvme 1.4)", "M.2" },
        { "m.2 (nvme 2.0)", "M.2" },
        { "m.2 (nvme)", "M.2" },
    };

    /// <summary>Pattern-based нормализация для CanonicalKeys.</summary>
    private static string NormalizeCanonical(string attributeKey, string str)
    {
        var s = CollapseWhitespace(str);
        if (string.IsNullOrEmpty(s)) return s;

        if (string.Equals(attributeKey, "model_series", StringComparison.OrdinalIgnoreCase))
        {
            return System.Text.RegularExpressions.Regex.Replace(s, @"^(Intel|AMD)\s+", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim();
        }

        if (string.Equals(attributeKey, "codename", StringComparison.OrdinalIgnoreCase))
        {
            return System.Text.RegularExpressions.Regex.Replace(s, @"\s*\([^)]*\)\s*$", "").Trim();
        }

        if (string.Equals(attributeKey, "memory_support", StringComparison.OrdinalIgnoreCase))
        {
            var parts = s.Split(',', StringSplitOptions.TrimEntries).Where(p => !string.IsNullOrEmpty(p)).ToList();
            if (parts.Count <= 1) return s;
            var ordered = parts.OrderBy(p => p, StringComparer.OrdinalIgnoreCase).ToList();
            return string.Join(", ", ordered);
        }

        if (string.Equals(attributeKey, "chipset", StringComparison.OrdinalIgnoreCase))
        {
            return System.Text.RegularExpressions.Regex.Replace(s, @"^(AMD|Intel)\s+", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim();
        }

        if (string.Equals(attributeKey, "flash_type", StringComparison.OrdinalIgnoreCase))
        {
            return System.Text.RegularExpressions.Regex.Replace(s, @"\s*\([^)]*\)\s*$", "").Trim();
        }

        if (string.Equals(attributeKey, "interface", StringComparison.OrdinalIgnoreCase))
        {
            return System.Text.RegularExpressions.Regex.Replace(s, @"\s*\([^)]*\)\s*$", "").Trim();
        }

        if (string.Equals(attributeKey, "resolution", StringComparison.OrdinalIgnoreCase))
        {
            return System.Text.RegularExpressions.Regex.Replace(s, @"\s*\(при\s+\d+\s*Гц\)\s*$", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim();
        }

        return s;
    }

    /// <summary>Нормализует значение form_factor для cases (до 280 мм и т.п.).</summary>
    public static string NormalizeFormFactorForDisplay(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue)) return rawValue ?? "";
        var collapsed = CollapseWhitespace(rawValue);
        return FormFactorMappings.TryGetValue(collapsed, out var mapped) ? mapped : collapsed;
    }

    /// <summary>Проверяет, выглядит ли значение как тип микросхем (2Gx8, 512Mx8 и т.п.) — не для фильтра «Тип памяти».</summary>
    public static bool IsChipTypeValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        var v = value.Trim();
        // 2Gx8, 512Mx8, 1Gx8, 512Mx16
        return System.Text.RegularExpressions.Regex.IsMatch(v, @"^\d+[MG]?x\d+$", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
    }

    /// <summary>Нужно ли исключать chip-type значения из фильтра «Тип памяти» (только для ram).</summary>
    public static bool ShouldExcludeFromRamTypeFilter(string? value) => IsChipTypeValue(value);

    /// <summary>Исключать ли значение efficiency (обрезки, КПД %, Сертифицирован).</summary>
    public static bool ShouldExcludeEfficiencyValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return true;
        if (System.Text.RegularExpressions.Regex.IsMatch(value, @"^\(\d+V\s+[A-Z]+\)$", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
            return true;
        if (System.Text.RegularExpressions.Regex.IsMatch(value, @"^КПД\s+\d+\s*%", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
            return true;
        if (System.Text.RegularExpressions.Regex.IsMatch(value, @"^\d+\s*%$", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
            return true;
        if (string.Equals(value.Trim(), "Сертифицирован", StringComparison.OrdinalIgnoreCase))
            return true;
        if (string.Equals(value.Trim(), "true", StringComparison.OrdinalIgnoreCase))
            return true;
        return false;
    }

    /// <summary>Убирает переносы строк и лишние пробелы — для отображения и сопоставления.</summary>
    public static string CollapseWhitespace(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return value ?? "";
        return System.Text.RegularExpressions.Regex.Replace(value.Trim(), @"\s+", " ");
    }

    /// <summary>Нормализует сырое значение для отображения в фильтре.</summary>
    public static string NormalizeForDisplay(string attributeKey, object? rawValue)
    {
        if (rawValue == null || (rawValue is string s && string.IsNullOrWhiteSpace(s)))
            return YesNoKeys.Contains(attributeKey) ? "Нет" : "Нет";

        var str = rawValue.ToString()?.Trim() ?? "";
        if (string.IsNullOrEmpty(str))
            return YesNoKeys.Contains(attributeKey) ? "Нет" : "Нет";

        // Для маппингов: нормализуем пробелы (Raphael\n \n  (Zen 4) → Raphael (Zen 4))
        var strForMapping = CollapseWhitespace(str);

        // 1. Явные маппинги (сравнение без учёта регистра)
        foreach (var kv in ValueMappings)
        {
            if (string.Equals(kv.Key.Key, attributeKey, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(kv.Key.Raw, strForMapping, StringComparison.OrdinalIgnoreCase))
                return kv.Value;
        }

        // 2. Canonical (pattern-based: regex, сортировка)
        if (CanonicalKeys.Contains(attributeKey))
            return NormalizeCanonical(attributeKey, str);

        // 3. Boolean-like (Есть/Нет)
        if (BooleanLikeKeys.Contains(attributeKey))
            return IsYesValue(str) ? "Есть" : "Нет";

        // 3. Yes/No (Да/Нет)
        if (YesNoKeys.Contains(attributeKey))
            return IsYesValue(str) ? "Да" : "Нет";

        // 4. PSU efficiency: проценты (72 %, 94 %) → «КПД 72 %»
        if (string.Equals(attributeKey, "efficiency", StringComparison.OrdinalIgnoreCase))
        {
            var pctMatch = System.Text.RegularExpressions.Regex.Match(str, @"^(\d+)\s*%");
            if (pctMatch.Success)
                return $"КПД {pctMatch.Groups[1].Value} %";
        }

        return str;
    }

    /// <summary>Проверяет, совпадает ли сырое значение продукта с выбранным в фильтре.</summary>
    public static bool MatchesFilter(string attributeKey, object? rawValue, string selectedDisplayValue)
    {
        if (!IsNormalizedAttribute(attributeKey))
            return false;

        var normalized = NormalizeForDisplay(attributeKey, rawValue);
        return string.Equals(normalized, selectedDisplayValue, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>Атрибуты, где значение — список через запятую (ATX, micro-ATX). При отображении разворачиваем в отдельные опции.</summary>
    private static readonly HashSet<string> MultiValueExpandKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "form_factor",
        "socket",
    };

    /// <summary>Разворачивает значения «A, B, C» в отдельные опции, убирает дубли и пустоты.</summary>
    public static IReadOnlyList<string> ExpandMultiValue(IEnumerable<string> rawValues)
    {
        var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var v in rawValues)
        {
            if (string.IsNullOrWhiteSpace(v)) continue;
            foreach (var part in v.Split(',', StringSplitOptions.TrimEntries))
            {
                var collapsed = CollapseWhitespace(part);
                if (string.IsNullOrEmpty(collapsed)) continue;
                set.Add(collapsed);
            }
        }
        return set.OrderBy(x => x).ToList();
    }

    /// <summary>Нужно ли разворачивать многострочные значения для этого атрибута.</summary>
    public static bool ShouldExpandMultiValue(string attributeKey) => MultiValueExpandKeys.Contains(attributeKey);

    /// <summary>Разворачивает memory_type материнских плат: «DDR5, DDR4» → [DDR5, DDR4], «DDR4 SO-DIMM» → [DDR4].</summary>
    public static IReadOnlyList<string> ExpandMotherboardMemoryType(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return Array.Empty<string>();
        var s = CollapseWhitespace(value);
        var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var part in s.Split(',', StringSplitOptions.TrimEntries))
        {
            var p = CollapseWhitespace(part);
            if (string.IsNullOrEmpty(p)) continue;
            // DDR4 SO-DIMM → оставляем DDR4
            if (p.Contains("SO-DIMM", StringComparison.OrdinalIgnoreCase))
                p = System.Text.RegularExpressions.Regex.Replace(p, @"\s*SO-DIMM\s*", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim();
            if (System.Text.RegularExpressions.Regex.IsMatch(p, @"^DDR\d+", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
                set.Add(p);
        }
        return set.Count > 0 ? set.OrderBy(x => x).ToList() : new List<string> { s };
    }

    /// <summary>Проверяет, содержит ли memory_type продукта выбранное значение (для материнских плат).</summary>
    public static bool MotherboardMemoryTypeMatches(string? productValue, string selectedValue)
    {
        if (string.IsNullOrWhiteSpace(productValue)) return false;
        var expanded = ExpandMotherboardMemoryType(productValue);
        return expanded.Any(e => string.Equals(e, selectedValue, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>Проверяет совпадение для multi-value: продукт «ATX, micro-ATX» матчится с выбранным «ATX».</summary>
    public static bool MultiValueContains(string? productValue, string selectedValue)
    {
        if (string.IsNullOrWhiteSpace(productValue)) return false;
        var parts = CollapseWhitespace(productValue).Split(',', StringSplitOptions.TrimEntries);
        return parts.Any(p => string.Equals(CollapseWhitespace(p), selectedValue, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>Нужна ли нормализация для этого атрибута.</summary>
    public static bool IsNormalizedAttribute(string attributeKey)
    {
        if (BooleanLikeKeys.Contains(attributeKey)) return true;
        if (YesNoKeys.Contains(attributeKey)) return true;
        if (CanonicalKeys.Contains(attributeKey)) return true;
        if (ValueMappings.Keys.Any(k => string.Equals(k.Key, attributeKey, StringComparison.OrdinalIgnoreCase)))
            return true;
        return false;
    }

    private static bool IsYesValue(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;

        var v = value.Trim();
        if (v.Equals("Нет", StringComparison.OrdinalIgnoreCase)) return false;
        if (v.Equals("No", StringComparison.OrdinalIgnoreCase)) return false;
        if (v.Equals("false", StringComparison.OrdinalIgnoreCase)) return false;
        if (v.Equals("False", StringComparison.OrdinalIgnoreCase)) return false;
        if (v.Equals("0")) return false;

        if (v.Equals("Да", StringComparison.OrdinalIgnoreCase)) return true;
        if (v.Equals("Yes", StringComparison.OrdinalIgnoreCase)) return true;
        if (v.Equals("true", StringComparison.OrdinalIgnoreCase)) return true;
        if (v.Equals("True", StringComparison.OrdinalIgnoreCase)) return true;

        if (long.TryParse(v, out _)) return true;

        if (v.Contains("Graphics", StringComparison.OrdinalIgnoreCase)) return true;
        if (v.Contains("Radeon", StringComparison.OrdinalIgnoreCase)) return true;
        if (v.Contains("UHD", StringComparison.OrdinalIgnoreCase)) return true;
        if (v.Contains("Vega", StringComparison.OrdinalIgnoreCase)) return true;
        if (v.Contains("Xe", StringComparison.OrdinalIgnoreCase)) return true;

        return true;
    }
}
