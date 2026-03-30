using System.Text.RegularExpressions;

namespace CatalogService.Services;

/// <summary>
/// Правила валидации и нормализации значений спецификаций по атрибутам
/// </summary>
public static class SpecificationValidation
{
    private static readonly Dictionary<string, ValidationRule> ValidationRules = new(StringComparer.OrdinalIgnoreCase)
    {
        // Корпуса
        ["max_cooler_height"] = new ValidationRule
        {
            MinValue = 0,
            MaxValue = 300,
            Unit = "мм",
            Reason = "Максимальная высота кулера в реальных корпусах ~250 мм"
        },
        ["max_gpu_length"] = new ValidationRule
        {
            MinValue = 0,
            MaxValue = 600,
            Unit = "мм",
            Reason = "RTX 4090 — 336 мм. Все что выше 600 мм — опечатка"
        },

        // Мыши
        ["dpi"] = new ValidationRule
        {
            MinValue = 100,
            MaxValue = 100000,
            Unit = "DPI",
            Reason = "Максимальный DPI в реальных мышах ~30000-50000"
        },

        // Мониторы
        ["brightness"] = new ValidationRule
        {
            MinValue = 50,
            MaxValue = 2000,
            Unit = "кд/м²",
            Reason = "Профессиональные мониторы до ~1600 кд/м²"
        },
        ["data_vykhoda_na_rynok"] = new ValidationRule
        {
            MinValue = 1990,
            MaxValue = DateTime.UtcNow.Year + 2,
            Unit = "год",
            Reason = "Год выхода на рынок не может быть меньше 1990"
        },

        // Системы охлаждения
        ["fan_size"] = new ValidationRule
        {
            MinValue = 40,
            MaxValue = 200,
            Unit = "мм",
            Reason = "Минимальный размер вентилятора ~40 мм, максимальный ~200 мм"
        },
        ["fan_count"] = new ValidationRule
        {
            MinValue = 0,
            MaxValue = 20,
            Unit = "шт",
            Reason = "Количество вентиляторов не может быть больше 20"
        },

        // Процессоры
        ["base_freq"] = new ValidationRule
        {
            MinValue = 0.5m,
            MaxValue = 6.0m,
            Unit = "ГГц",
            Reason = "Базовая частота процессора в диапазоне 0.5-6.0 ГГц"
        },
        ["max_freq"] = new ValidationRule
        {
            MinValue = 1.0m,
            MaxValue = 6.5m,
            Unit = "ГГц",
            Reason = "Максимальная частота процессора в диапазоне 1.0-6.5 ГГц"
        },

        // Наушники
        ["impedance"] = new ValidationRule
        {
            MinValue = 8,
            MaxValue = 600,
            Unit = "Ом",
            Reason = "Сопротивление наушников обычно 16-600 Ом"
        },
        ["driver_size"] = new ValidationRule
        {
            MinValue = 6,
            MaxValue = 70,
            Unit = "мм",
            Reason = "Диаметр драйвера наушников 6-70 мм"
        },

        // Видеокарты
        ["videopamyat"] = new ValidationRule
        {
            MinValue = 0.001m,
            MaxValue = 128,
            Unit = "ГБ",
            Reason = "Видеопамять от 1 МБ (0.001 ГБ) до 128 ГБ"
        },
        ["dlina_videokarty"] = new ValidationRule
        {
            MinValue = 100,
            MaxValue = 400,
            Unit = "мм",
            Reason = "Длина видеокарты 100-400 мм"
        },
        ["vysota_videokarty"] = new ValidationRule
        {
            MinValue = 50,
            MaxValue = 200,
            Unit = "мм",
            Reason = "Высота видеокарты 50-200 мм"
        },

        // Накопители
        ["read_speed"] = new ValidationRule
        {
            MinValue = 100,
            MaxValue = 30000,
            Unit = "МБ/с",
            Reason = "Скорость чтения SSD до ~30000 МБ/с"
        },
        ["write_speed"] = new ValidationRule
        {
            MinValue = 100,
            MaxValue = 30000,
            Unit = "МБ/с",
            Reason = "Скорость записи SSD до ~30000 МБ/с"
        }
    };

    /// <summary>
    /// Валидирует числовое значение для атрибута
    /// </summary>
    public static (bool IsValid, decimal? NormalizedValue, string? Reason) ValidateNumber(string attributeKey, decimal value)
    {
        if (!ValidationRules.TryGetValue(attributeKey, out var rule))
        {
            return (true, value, null);
        }

        // Проверка базовых границ
        if (value < rule.MinValue || value > rule.MaxValue)
        {
            return (false, null, $"Значение {value} {rule.Unit} выходит за допустимый диапазон {rule.MinValue}-{rule.MaxValue}. {rule.Reason}");
        }

        return (true, value, null);
    }

    /// <summary>
    /// Возвращает допустимые границы значения для range-атрибута.
    /// </summary>
    public static (decimal Min, decimal Max)? GetRangeBounds(string attributeKey)
    {
        if (!ValidationRules.TryGetValue(attributeKey, out var rule))
            return null;

        return (rule.MinValue, rule.MaxValue);
    }

    /// <summary>
    /// Парсит числовое значение с sanitization и валидацией
    /// </summary>
    public static (bool Success, decimal? Value, string? Error) ParseAndValidateNumber(string attributeKey, object rawValue)
    {
        var parsedValue = TryParseNumberSafe(attributeKey, rawValue);
        if (!parsedValue.HasValue)
        {
            return (false, null, "Не удалось распарсить число");
        }

        var (isValid, normalizedValue, reason) = ValidateNumber(attributeKey, parsedValue.Value);
        if (!isValid)
        {
            return (false, null, reason);
        }

        return (true, normalizedValue, null);
    }

    /// <summary>
    /// Безопасный парсинг числа с учетом специфики атрибута
    /// </summary>
    private static decimal? TryParseNumberSafe(string attributeKey, object value)
    {
        if (value is decimal d) return d;
        if (value is int i) return i;
        if (value is long l) return l;
        if (value is double db) return (decimal)db;

        var s = value.ToString()?.Trim() ?? "";
        if (string.IsNullOrEmpty(s)) return null;

        // Специфичная логика для разных атрибутов
        switch (attributeKey.ToLowerInvariant())
        {
            case "fan_size":
                return ParseFanSize(s);
            
            case "dpi":
                return ParseDpi(s);
            
            case "brightness":
                return ParseBrightness(s);
            
            case "base_freq":
            case "max_freq":
                return ParseFrequency(s);
            
            case "videopamyat":
                return ParseVideoMemory(s);
            
            default:
                return ParseGenericNumber(s);
        }
    }

    /// <summary>
    /// Парсинг размера вентилятора. Формат: "120 мм", "1х120", "120x25мм"
    /// </summary>
    private static decimal? ParseFanSize(string value)
    {
        // Если формат "NхM мм", извлекаем только M (диаметр)
        var match = Regex.Match(value, @"(\d+)\s*[xхXХ×]\s*(\d+)", RegexOptions.IgnoreCase);
        if (match.Success && int.TryParse(match.Groups[2].Value, out var fanDiameter))
        {
            return fanDiameter;
        }

        // Обычный парсинг числа
        return ParseGenericNumber(value);
    }

    /// <summary>
    /// Парсинг DPI. Если число больше 100000, вероятно склеено
    /// </summary>
    private static decimal? ParseDpi(string value)
    {
        var num = ParseGenericNumber(value);
        if (!num.HasValue) return null;

        // Если больше 100000, пробуем разбить
        if (num.Value > 100000)
        {
            var str = num.Value.ToString("F0");
            // Пробуем взять первые 4-5 цифр
            if (str.Length >= 4)
            {
                var firstPart = str.Substring(0, Math.Min(5, str.Length));
                if (decimal.TryParse(firstPart, out var parsed) && parsed <= 50000)
                {
                    return parsed;
                }
            }
            // Если не удалось разбить — возвращаем null (невалидное)
            return null;
        }

        return num;
    }

    /// <summary>
    /// Парсинг яркости. Формат: "200 кд/м2", "300 cd/m2", "2002" (ошибка)
    /// </summary>
    private static decimal? ParseBrightness(string value)
    {
        // Берем первое числовое значение, чтобы "200 кд/м2" не превращалось в "2002".
        var match = Regex.Match(value, @"\d+(?:[.,]\d+)?", RegexOptions.IgnoreCase);
        if (!match.Success)
            return null;

        var cleaned = match.Value.Replace(',', '.');
        if (!decimal.TryParse(cleaned, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var num))
            return null;

        // Если получилось число > 2000, вероятно ошибка парсинга (2002 вместо 200, 10002 вместо 1000)
        if (num > 2000)
        {
            // Пробуем разделить на 10 (2002 → 200.2, 10002 → 1000.2)
            var divided = num / 10m;
            if (divided >= 50 && divided <= 2000)
                return divided;
            
            // Пробуем взять первые 3 цифры (как fallback)
            var str = num.ToString("F0");
            if (str.Length >= 3)
            {
                var first3 = str.Substring(0, 3);
                if (decimal.TryParse(first3, out var parsed) && parsed >= 50 && parsed <= 2000)
                    return parsed;
            }
            
            return null; // Невалидное значение
        }

        return num;
    }

    /// <summary>
    /// Парсинг частоты процессора. Если > 100, вероятно МГц, нужно конвертировать в ГГц
    /// </summary>
    private static decimal? ParseFrequency(string value)
    {
        var num = ParseGenericNumber(value);
        if (!num.HasValue) return null;

        var lower = value.ToLowerInvariant();

        // Явные единицы имеют приоритет.
        if (lower.Contains("mhz") || lower.Contains("мгц"))
        {
            return num.Value / 1000m;
        }

        if (lower.Contains("ghz") || lower.Contains("ггц"))
        {
            return num.Value;
        }

        // Без единицы: все, что выглядит как МГц, приводим к ГГц.
        if (num.Value > 100)
            return num.Value / 1000m;

        return num;
    }

    /// <summary>
    /// Парсинг видеопамяти. Конвертация всех значений в МБ (базовая единица).
    /// </summary>
    private static decimal? ParseVideoMemory(string value)
    {
        var num = ParseGenericNumber(value);
        if (!num.HasValue) return null;

        var lower = value.ToLowerInvariant();

        // Явные единицы имеют приоритет.
        if (lower.Contains("mb") || lower.Contains("мб"))
        {
            return num.Value;
        }

        if (lower.Contains("gb") || lower.Contains("гб"))
        {
            return num.Value * 1024m;
        }

        // Без единицы:
        // 1..64 почти всегда указаны в ГБ для VRAM, а не в МБ.
        if (num.Value >= 1m && num.Value <= 64m)
            return num.Value * 1024m;

        // Дробные значения обычно тоже ГБ (0.5, 0.75 и т.д.)
        if (num.Value > 0 && num.Value < 1m)
            return num.Value * 1024m;

        // Иначе предполагаем, что уже МБ.
        return num;
    }

    /// <summary>
    /// Общий парсинг числа
    /// </summary>
    private static decimal? ParseGenericNumber(string value)
    {
        // Убираем все нечисловые символы, кроме точки и запятой
        var digits = new string(value.Where(c => char.IsDigit(c) || c == '.' || c == ',').ToArray()).Replace(',', '.');
        
        if (string.IsNullOrEmpty(digits)) return null;

        if (decimal.TryParse(digits, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var num))
        {
            return num;
        }

        return null;
    }

    public class ValidationRule
    {
        public decimal MinValue { get; init; }
        public decimal MaxValue { get; init; }
        public string Unit { get; init; } = "";
        public string Reason { get; init; } = "";
    }
}
