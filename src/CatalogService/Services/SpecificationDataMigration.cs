using CatalogService.Data;
using CatalogService.Models;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Services;

/// <summary>
/// Сервис для миграции и исправления существующих данных спецификаций
/// </summary>
public class SpecificationDataMigration
{
    private readonly CatalogDbContext _context;
    private readonly ILogger<SpecificationDataMigration> _logger;

    public SpecificationDataMigration(CatalogDbContext context, ILogger<SpecificationDataMigration> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Исправить выбросы в Range-атрибутах
    /// </summary>
    public async Task<MigrationResult> FixRangeOutliersAsync()
    {
        _logger.LogInformation("Starting range outliers fix migration");

        var result = new MigrationResult();
        var rangeAttributes = await _context.SpecificationAttributes
            .Where(a => a.ValueType == SpecificationAttributeValueType.Range)
            .ToListAsync();

        foreach (var attr in rangeAttributes)
        {
            var values = await _context.ProductSpecificationValues
                .Where(psv => psv.AttributeId == attr.Id && psv.ValueNumber != null)
                .ToListAsync();

            _logger.LogInformation("Processing {Count} values for attribute {Key}", values.Count, attr.Key);

            foreach (var value in values)
            {
                var originalValue = value.ValueNumber!.Value;
                var (isValid, correctedValue, reason) = SpecificationValidation.ValidateNumber(attr.Key, originalValue);

                if (!isValid)
                {
                    // Попытка исправить
                    var fixedValue = TryFixOutlier(attr.Key, originalValue);
                    
                    if (fixedValue.HasValue)
                    {
                        var (isValidFixed, _, _) = SpecificationValidation.ValidateNumber(attr.Key, fixedValue.Value);
                        if (isValidFixed)
                        {
                            value.ValueNumber = fixedValue.Value;
                            result.FixedCount++;
                            _logger.LogInformation(
                                "Fixed outlier for {Key}: {Original} → {Fixed} (Product: {ProductId})",
                                attr.Key, originalValue, fixedValue.Value, value.ProductId);
                        }
                        else
                        {
                            // Не удалось исправить, удаляем
                            _context.ProductSpecificationValues.Remove(value);
                            result.RemovedCount++;
                            _logger.LogWarning(
                                "Removed invalid value for {Key}: {Value} (Product: {ProductId}). Reason: {Reason}",
                                attr.Key, originalValue, value.ProductId, reason);
                        }
                    }
                    else
                    {
                        // Не удалось исправить, удаляем
                        _context.ProductSpecificationValues.Remove(value);
                        result.RemovedCount++;
                        _logger.LogWarning(
                            "Removed invalid value for {Key}: {Value} (Product: {ProductId}). Reason: {Reason}",
                            attr.Key, originalValue, value.ProductId, reason);
                    }
                }
                else
                {
                    result.ValidCount++;
                }
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation(
            "Range outliers fix completed. Valid: {Valid}, Fixed: {Fixed}, Removed: {Removed}",
            result.ValidCount, result.FixedCount, result.RemovedCount);

        return result;
    }

    /// <summary>
    /// Удалить leaked values из Terms-атрибутов
    /// </summary>
    public async Task<MigrationResult> RemoveLeakedValuesAsync()
    {
        _logger.LogInformation("Starting leaked values removal migration");

        var result = new MigrationResult();

        // Список атрибутов и паттернов для удаления leaked values
        var leakageRules = new Dictionary<string, List<string>>
        {
            // Клавиатуры: батарейки и свитчи
            ["type"] = new List<string> 
            { 
                @"(\d+\s*x\s*)?(AA|AAA|Li-\w+)",
                @"(Razer|Kailh|Outemu|Cherry|Bloody|Logitech)\s+(Red|Blue|Green|Brown|Yellow)",
                "Bluetooth", "USB", "радио"
            },
            
            // Форм-фактор корпуса: физические размеры
            ["form_factor"] = new List<string>
            {
                @"\d+[""]?\s*x\s*\d+",
                @"до\s+\d+\s*мм",
                @"\d+x\d+\s*мм"
            }
        };

        foreach (var (attrKey, patterns) in leakageRules)
        {
            var attr = await _context.SpecificationAttributes
                .FirstOrDefaultAsync(a => a.Key == attrKey);
            
            if (attr == null) continue;

            var canonicalValues = await _context.SpecificationCanonicalValues
                .Where(cv => cv.AttributeId == attr.Id)
                .ToListAsync();

            foreach (var canonical in canonicalValues)
            {
                var shouldRemove = patterns.Any(pattern => 
                    System.Text.RegularExpressions.Regex.IsMatch(
                        canonical.ValueText, 
                        pattern, 
                        System.Text.RegularExpressions.RegexOptions.IgnoreCase));

                if (shouldRemove)
                {
                    var linkedValues = await _context.ProductSpecificationValues
                        .Where(psv => psv.CanonicalValueId == canonical.Id)
                        .ToListAsync();

                    _context.ProductSpecificationValues.RemoveRange(linkedValues);
                    _context.SpecificationCanonicalValues.Remove(canonical);
                    
                    result.RemovedCount += linkedValues.Count;
                    _logger.LogInformation(
                        "Removed leaked canonical value '{Value}' for {Key} ({Count} product values)",
                        canonical.ValueText, attrKey, linkedValues.Count);
                }
                else
                {
                    result.ValidCount++;
                }
            }
        }

        // Удалить булевое "false" из типа наушников
        var headphonesTypeAttr = await _context.SpecificationAttributes
            .FirstOrDefaultAsync(a => a.Key == "type");
        
        if (headphonesTypeAttr != null)
        {
            var falseCategorical = await _context.SpecificationCanonicalValues
                .Where(cv => cv.AttributeId == headphonesTypeAttr.Id && cv.ValueText.ToLower() == "false")
                .ToListAsync();

            foreach (var cv in falseCategorical)
            {
                var linkedValues = await _context.ProductSpecificationValues
                    .Where(psv => psv.CanonicalValueId == cv.Id)
                    .ToListAsync();

                _context.ProductSpecificationValues.RemoveRange(linkedValues);
                _context.SpecificationCanonicalValues.Remove(cv);
                result.RemovedCount += linkedValues.Count;
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation(
            "Leaked values removal completed. Valid: {Valid}, Removed: {Removed}",
            result.ValidCount, result.RemovedCount);

        return result;
    }

    /// <summary>
    /// Нормализовать дубликаты в Terms-атрибутах
    /// </summary>
    public async Task<MigrationResult> NormalizeDuplicatesAsync()
    {
        _logger.LogInformation("Starting duplicates normalization migration");

        var result = new MigrationResult();

        // Нормализация форм-факторов материнских плат (Mini-ITX vs miniITX)
        await NormalizeFormFactors(result);

        // Нормализация чипсетов (с префиксом и без)
        await NormalizeChipsets(result);

        // Нормализация поддержки памяти (разный порядок)
        await NormalizeMemorySupport(result);

        // Нормализация интерфейсов накопителей (двойные пробелы)
        await NormalizeStorageInterface(result);

        await _context.SaveChangesAsync();
        _logger.LogInformation(
            "Duplicates normalization completed. Merged: {Fixed}, Valid: {Valid}",
            result.FixedCount, result.ValidCount);

        return result;
    }

    private async Task NormalizeFormFactors(MigrationResult result)
    {
        var attr = await _context.SpecificationAttributes.FirstOrDefaultAsync(a => a.Key == "form_factor");
        if (attr == null) return;

        var canonicalValues = await _context.SpecificationCanonicalValues
            .Where(cv => cv.AttributeId == attr.Id)
            .ToListAsync();

        var normalized = new Dictionary<string, Guid>();
        var toRemove = new List<SpecificationCanonicalValue>();

        foreach (var cv in canonicalValues)
        {
            var normalizedKey = cv.ValueText.ToLowerInvariant().Replace("-", "").Replace("_", "").Replace(" ", "");
            
            if (normalized.TryGetValue(normalizedKey, out var existingId))
            {
                // Это дубликат, перенаправим все значения на существующий canonical
                var linkedValues = await _context.ProductSpecificationValues
                    .Where(psv => psv.CanonicalValueId == cv.Id)
                    .ToListAsync();

                foreach (var psv in linkedValues)
                {
                    psv.CanonicalValueId = existingId;
                }

                toRemove.Add(cv);
                result.FixedCount++;
                _logger.LogInformation("Merged form_factor duplicate: {Old} → existing canonical", cv.ValueText);
            }
            else
            {
                normalized[normalizedKey] = cv.Id;
                result.ValidCount++;
            }
        }

        _context.SpecificationCanonicalValues.RemoveRange(toRemove);
    }

    private async Task NormalizeChipsets(MigrationResult result)
    {
        var attr = await _context.SpecificationAttributes.FirstOrDefaultAsync(a => a.Key == "chipset");
        if (attr == null) return;

        var canonicalValues = await _context.SpecificationCanonicalValues
            .Where(cv => cv.AttributeId == attr.Id)
            .ToListAsync();

        var normalized = new Dictionary<string, Guid>();
        var toRemove = new List<SpecificationCanonicalValue>();

        foreach (var cv in canonicalValues)
        {
            // Убираем префикс AMD/Intel
            var normalizedKey = System.Text.RegularExpressions.Regex.Replace(
                cv.ValueText.ToLowerInvariant(), 
                @"^(amd|intel)\s+", 
                "", 
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            if (normalized.TryGetValue(normalizedKey, out var existingId))
            {
                var linkedValues = await _context.ProductSpecificationValues
                    .Where(psv => psv.CanonicalValueId == cv.Id)
                    .ToListAsync();

                foreach (var psv in linkedValues)
                {
                    psv.CanonicalValueId = existingId;
                }

                toRemove.Add(cv);
                result.FixedCount++;
            }
            else
            {
                normalized[normalizedKey] = cv.Id;
                result.ValidCount++;
            }
        }

        _context.SpecificationCanonicalValues.RemoveRange(toRemove);
    }

    private async Task NormalizeMemorySupport(MigrationResult result)
    {
        var attr = await _context.SpecificationAttributes.FirstOrDefaultAsync(a => a.Key == "memory_support");
        if (attr == null) return;

        var canonicalValues = await _context.SpecificationCanonicalValues
            .Where(cv => cv.AttributeId == attr.Id)
            .ToListAsync();

        var normalized = new Dictionary<string, Guid>();
        var toRemove = new List<SpecificationCanonicalValue>();

        foreach (var cv in canonicalValues)
        {
            // Сортируем части по алфавиту
            var parts = cv.ValueText.Split(',', StringSplitOptions.TrimEntries);
            var normalizedKey = string.Join(", ", parts.OrderBy(p => p)).ToLowerInvariant();

            if (normalized.TryGetValue(normalizedKey, out var existingId))
            {
                var linkedValues = await _context.ProductSpecificationValues
                    .Where(psv => psv.CanonicalValueId == cv.Id)
                    .ToListAsync();

                foreach (var psv in linkedValues)
                {
                    psv.CanonicalValueId = existingId;
                }

                toRemove.Add(cv);
                result.FixedCount++;
            }
            else
            {
                normalized[normalizedKey] = cv.Id;
                result.ValidCount++;
            }
        }

        _context.SpecificationCanonicalValues.RemoveRange(toRemove);
    }

    private async Task NormalizeStorageInterface(MigrationResult result)
    {
        var attr = await _context.SpecificationAttributes.FirstOrDefaultAsync(a => a.Key == "interface");
        if (attr == null) return;

        var canonicalValues = await _context.SpecificationCanonicalValues
            .Where(cv => cv.AttributeId == attr.Id)
            .ToListAsync();

        var normalized = new Dictionary<string, Guid>();
        var toRemove = new List<SpecificationCanonicalValue>();

        foreach (var cv in canonicalValues)
        {
            // Убираем двойные пробелы и оксюмороны (SATA + NVMe)
            var cleaned = System.Text.RegularExpressions.Regex.Replace(cv.ValueText, @"\s+", " ").Trim();
            
            if (cleaned.Contains("SATA", StringComparison.OrdinalIgnoreCase) && 
                cleaned.Contains("NVMe", StringComparison.OrdinalIgnoreCase))
            {
                cleaned = System.Text.RegularExpressions.Regex.Replace(
                    cleaned, 
                    @"\s*\(NVMe[^)]*\)", 
                    "", 
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            }

            var normalizedKey = cleaned.ToLowerInvariant();

            if (normalized.TryGetValue(normalizedKey, out var existingId))
            {
                var linkedValues = await _context.ProductSpecificationValues
                    .Where(psv => psv.CanonicalValueId == cv.Id)
                    .ToListAsync();

                foreach (var psv in linkedValues)
                {
                    psv.CanonicalValueId = existingId;
                }

                toRemove.Add(cv);
                result.FixedCount++;
            }
            else
            {
                normalized[normalizedKey] = cv.Id;
                result.ValidCount++;
            }
        }

        _context.SpecificationCanonicalValues.RemoveRange(toRemove);
    }

    /// <summary>
    /// Пересчитать частоты процессоров из МГц в ГГц
    /// </summary>
    public async Task<MigrationResult> RecalculateProcessorFrequenciesAsync()
    {
        _logger.LogInformation("Starting processor frequencies recalculation migration");

        var result = new MigrationResult();
        
        var freqAttrs = await _context.SpecificationAttributes
            .Where(a => a.Key == "base_freq" || a.Key == "max_freq")
            .ToListAsync();
        
        var attrIds = freqAttrs.Select(a => a.Id).ToList();
        
        var values = await _context.ProductSpecificationValues
            .Where(psv => attrIds.Contains(psv.AttributeId) && psv.ValueNumber.HasValue)
            .ToListAsync();
        
        _logger.LogInformation("Processing {Count} frequency values", values.Count);

        foreach (var psv in values)
        {
            var originalValue = psv.ValueNumber!.Value;
            
            // Если > 100, вероятно МГц → конвертируем в ГГц
            if (originalValue > 100)
            {
                psv.ValueNumber = originalValue / 1000m;
                result.FixedCount++;
                
                _logger.LogInformation(
                    "Recalculated frequency: {Original} МГц → {Fixed} ГГц (Product: {ProductId})",
                    originalValue, psv.ValueNumber, psv.ProductId);
            }
            else
            {
                result.ValidCount++;
            }
        }
        
        await _context.SaveChangesAsync();
        _logger.LogInformation(
            "Processor frequencies recalculation completed. Valid: {Valid}, Fixed: {Fixed}",
            result.ValidCount, result.FixedCount);
        
        return result;
    }

    /// <summary>
    /// Пересчитать видеопамять из ГБ в МБ (базовая единица)
    /// </summary>
    public async Task<MigrationResult> RecalculateVideoMemoryAsync()
    {
        _logger.LogInformation("Starting video memory recalculation migration");

        var result = new MigrationResult();
        
        var vramAttr = await _context.SpecificationAttributes
            .FirstOrDefaultAsync(a => a.Key == "videopamyat");
        
        if (vramAttr == null) 
        {
            _logger.LogWarning("Attribute 'videopamyat' not found, skipping migration");
            return result;
        }
        
        var values = await _context.ProductSpecificationValues
            .Where(psv => psv.AttributeId == vramAttr.Id && psv.ValueNumber.HasValue)
            .ToListAsync();
        
        _logger.LogInformation("Processing {Count} video memory values", values.Count);

        foreach (var psv in values)
        {
            var originalValue = psv.ValueNumber!.Value;
            
            // Если < 128, вероятно ГБ → конвертируем в МБ
            if (originalValue < 128 && originalValue >= 0.5m)
            {
                psv.ValueNumber = originalValue * 1024m;
                result.FixedCount++;
                
                _logger.LogInformation(
                    "Recalculated video memory: {Original} ГБ → {Fixed} МБ (Product: {ProductId})",
                    originalValue, psv.ValueNumber, psv.ProductId);
            }
            else
            {
                result.ValidCount++;
            }
        }
        
        await _context.SaveChangesAsync();
        _logger.LogInformation(
            "Video memory recalculation completed. Valid: {Valid}, Fixed: {Fixed}",
            result.ValidCount, result.FixedCount);
        
        return result;
    }

    /// <summary>
    /// Попытка исправить выброс
    /// </summary>
    private decimal? TryFixOutlier(string attributeKey, decimal value)
    {
        switch (attributeKey.ToLowerInvariant())
        {
            case "max_cooler_height":
            case "max_gpu_length":
                // Возможно потеряна точка: 1805 → 180.5 или 180
                if (value > 1000)
                {
                    var divided = value / 10m;
                    if (divided >= 36 && divided <= 500) return divided;
                }
                return null;

            case "dpi":
                // Склеенные числа: 32003050 → 3200
                if (value > 100000)
                {
                    var str = value.ToString("F0");
                    if (str.Length >= 4)
                    {
                        var firstPart = str.Substring(0, Math.Min(5, str.Length));
                        if (decimal.TryParse(firstPart, out var parsed) && parsed >= 100 && parsed <= 50000)
                        {
                            return parsed;
                        }
                    }
                }
                return null;

            case "brightness":
                // Лишние цифры: 2002 → 200, 10002 → 1000
                if (value > 2000)
                {
                    var str = value.ToString("F0");
                    if (str.Length >= 3)
                    {
                        var firstDigits = str.Substring(0, Math.Min(4, str.Length));
                        if (decimal.TryParse(firstDigits, out var parsed) && parsed >= 50 && parsed <= 2000)
                        {
                            return parsed;
                        }
                    }
                }
                return null;

            default:
                return null;
        }
    }
}

public class MigrationResult
{
    public int ValidCount { get; set; }
    public int FixedCount { get; set; }
    public int RemovedCount { get; set; }
}
