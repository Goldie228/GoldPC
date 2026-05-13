#pragma warning disable SA1616
using System.Text.Encodings.Web;
using System.Text.RegularExpressions;

namespace GoldPC.SharedKernel.Utilities;

/// <summary>
/// Утилиты для очистки строк от потенциально опасного содержимого (XSS и др.).
/// </summary>
public static class StringSanitizer
{
    private static readonly Regex HtmlTagsRegex = new Regex("<.*?>", RegexOptions.Compiled);

    /// <summary>
    /// Полностью удаляет HTML-теги из строки.
    /// </summary>
    /// <returns></returns>
    public static string? StripHtml(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return input;
        }

        return HtmlTagsRegex.Replace(input, string.Empty);
    }

    /// <summary>
    /// Кодирует HTML-сущности для безопасного отображения.
    /// </summary>
    /// <returns></returns>
    public static string? HtmlEncode(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return input;
        }

        return HtmlEncoder.Default.Encode(input);
    }

    /// <summary>
    /// Комбинированная очистка для обычного текста (комментарии, отзывы).
    /// Удаляет HTML-теги, но НЕ кодирует Unicode-символы (кириллицу и др.)
    /// в HTML-сущности, чтобы данные хранились в читаемом виде.
    /// Экранирование происходит на уровне представления (Handlebars, React).
    /// </summary>
    /// <returns></returns>
    public static string? SanitizeText(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return input;
        }

        // Удаляем теги, остальное оставляем как есть.
        // XSS-защита: теги удалены, а экранирование — задача представления.
        return StripHtml(input);
    }
}
#pragma warning restore SA1616
