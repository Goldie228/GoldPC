using System.Text.RegularExpressions;

namespace CatalogService.Services;

/// <summary>
/// Сервис для автоматического определения производителя товара на основе его названия.
/// </summary>
public class ManufacturerDetector
{
    private static readonly HashSet<string> NonManufacturerTokens = new(StringComparer.OrdinalIgnoreCase)
    {
        "DDR3", "DDR4", "DDR5", "GDDR6", "GDDR6X", "USB", "USB-C", "TYPE-C", "RGB",
        "ARGB", "LED", "PCI", "PCIE", "NVME", "SSD", "HDD", "M2", "ATX", "MATX", "MITX",
        "RTX", "GTX", "RX", "WIFI", "BLUETOOTH", "IPS", "VA", "TN", "FULLHD", "UHD", "QHD"
    };

    /// <summary>
    /// Определяет название производителя из названия товара.
    /// Правило: первые слова на русском (тип товара), первое английское слово — это производитель.
    /// </summary>
    /// <param name="productName">Полное название товара</param>
    /// <param name="knownManufacturers">Список известных имен производителей из БД</param>
    /// <returns>Название производителя или null</returns>
    public string? Detect(string productName, IEnumerable<string> knownManufacturers)
    {
        if (string.IsNullOrWhiteSpace(productName)) return null;

        // 1. Приоритет: ищем полное совпадение с известными производителями (для случаев с пробелами, типа "Fractal Design" или "be quiet!")
        var sortedKnown = knownManufacturers
            .Where(m => !string.IsNullOrWhiteSpace(m))
            .OrderByDescending(m => m.Length)
            .ToList();

        foreach (var manufacturer in sortedKnown)
        {
            // Ищем производителя как отдельное слово (или в начале английской части)
            var pattern = $@"\b{Regex.Escape(manufacturer)}\b";
            if (Regex.IsMatch(productName, pattern, RegexOptions.IgnoreCase))
            {
                return manufacturer;
            }
        }

        // 2. Правило пользователя: первое слово с латинскими буквами
        // Пропускаем всё до первого вхождения латиницы
        var matches = Regex.Matches(productName, @"[A-Za-z][A-Za-z0-9\.\!\-]*");
        foreach (Match match in matches)
        {
            var detected = match.Value;

            // Минимальная длина 2 символа (или HP)
            var isValidLength = detected.Length > 1 || string.Equals(detected, "HP", StringComparison.OrdinalIgnoreCase);
            if (!isValidLength)
                continue;

            // Отсеиваем очевидные служебные/модельные токены
            if (NonManufacturerTokens.Contains(detected))
                continue;

            return detected;
        }

        return null;
    }
}
