using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using CatalogService.Data;
using CatalogService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;

namespace CatalogService.Services;

/// <summary>
/// Импортёр товаров из JSON, полученного парсером X-Core.by
/// </summary>
public class XCoreImporter
{
    private readonly CatalogDbContext _context;
    private readonly SpecImportNormalizer _specNormalizer;
    private readonly ILogger<XCoreImporter> _logger;
    private readonly string _uploadsFullPath;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public XCoreImporter(
        CatalogDbContext context,
        SpecImportNormalizer specNormalizer,
        ILogger<XCoreImporter> logger,
        IHostEnvironment hostEnv,
        IConfiguration configuration)
    {
        _context = context;
        _specNormalizer = specNormalizer;
        _logger = logger;
        var uploadsPath = configuration["CatalogService:UploadsPath"] ?? "uploads";
        _uploadsFullPath = Path.Combine(hostEnv.ContentRootPath, uploadsPath);
    }

    private static string TruncateSku(string s) => s.Length > 50 ? s[..50] : s;
    private static string? Truncate(string? s, int max) => s?.Length > max ? s[..max] : s;
    private static readonly Random SkuRandom = new();

    private static string BuildSlug(string? raw, string? fallback)
    {
        var source = !string.IsNullOrWhiteSpace(raw) ? raw! : (fallback ?? string.Empty);
        source = source.Trim().ToLowerInvariant();
        source = Regex.Replace(source, @"[^a-z0-9]+", "_");
        source = Regex.Replace(source, @"_+", "_").Trim('_');
        if (string.IsNullOrWhiteSpace(source))
            source = $"product_{Guid.NewGuid():N}";
        return source.Length > 220 ? source[..220].TrimEnd('_') : source;
    }

    private static string EnsureUniqueSlug(
        string baseSlug,
        HashSet<string> occupiedSlugs,
        Dictionary<string, Guid> productsBySlug,
        Guid? keepId = null)
    {
        var slug = baseSlug;
        var i = 2;
        while (true)
        {
            var existsInDb = productsBySlug.TryGetValue(slug, out var id) && (!keepId.HasValue || id != keepId.Value);
            var existsInBatch = occupiedSlugs.Contains(slug);
            if (!existsInDb && !existsInBatch)
                return slug;
            slug = $"{baseSlug}_{i}";
            i++;
        }
    }

    private static string GenerateNumericSku(HashSet<string> occupiedSkus)
    {
        while (true)
        {
            // Use a higher range to avoid overlap with migration-generated SKUs (around 1B)
            var value = SkuRandom.NextInt64(2_000_000_000L, 9_999_999_999L).ToString();
            if (occupiedSkus.Add(value))
                return value;
        }
    }

    private static string? TryExtractExternalIdFromXcoreSku(string? sku)
    {
        if (string.IsNullOrWhiteSpace(sku))
            return null;

        const string prefix = "XCORE-";
        if (!sku.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            return null;

        var externalId = sku[prefix.Length..].Trim();
        if (string.IsNullOrWhiteSpace(externalId))
            return null;

        return Truncate(externalId, 100);
    }

    /// <summary>URL placeholder'а X-Core.by (логотип "X-core") — не сохраняем.</summary>
    private static bool IsXCorePlaceholderUrl(string? url) =>
        !string.IsNullOrEmpty(url) && url.Contains("/upload/CNext/", StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Вычисляет локальный путь по URL (алгоритм как в download-images.mjs: SHA256 + products/{prefix}/{hash}.{ext}).
    /// </summary>
    private static (string RelPath, string Ext) ComputeLocalPathFromUrl(string url)
    {
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(url));
        var hash = Convert.ToHexString(hashBytes).ToLowerInvariant();
        var extMatch = Regex.Match(url, @"\.(jpe?g|png|gif|webp)(?:\?|$)", RegexOptions.IgnoreCase);
        var ext = extMatch.Success
            ? extMatch.Groups[1].Value.ToLowerInvariant().Replace("jpeg", "jpg")
            : "jpg";
        var prefix = hash.Length >= 2 ? hash[..2] : hash;
        var relPath = $"products/{prefix}/{hash}.{ext}";
        return (relPath, ext);
    }

    /// <summary>
    /// Если локальный файл уже существует (после download-images.mjs), возвращает Path для DTO.
    /// </summary>
    private string? TryGetExistingLocalPath(string url)
    {
        var (relPath, _) = ComputeLocalPathFromUrl(url);
        var fullPath = Path.Combine(_uploadsFullPath, relPath);
        return File.Exists(fullPath) ? $"/uploads/{relPath}" : null;
    }

    public async Task<ImportResult> ImportFromFileAsync(string filePath)
    {
        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException($"Файл не найден: {filePath}");
        }

        var json = await File.ReadAllTextAsync(filePath);
        var data = JsonSerializer.Deserialize<XCoreImportData>(json, JsonOptions)
            ?? throw new InvalidOperationException("Неверный формат JSON");

        return await ImportAsync(data);
    }

    public async Task<ImportResult> ImportAsync(XCoreImportData data)
    {
        var result = new ImportResult { Total = data.Products?.Count ?? 0 };
        if (data.Products == null || data.Products.Count == 0)
        {
            return result;
        }

        var categories = await _context.Categories.ToDictionaryAsync(c => c.Slug, c => c.Id);
        var manufacturersCache = new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);
        var existingManufacturers = await _context.Manufacturers.ToListAsync();
        foreach (var m in existingManufacturers)
        {
            manufacturersCache[m.Name] = m.Id;
        }

        var productsBySku = await _context.Products.ToDictionaryAsync(x => x.Sku!, x => x.Id);
        var productsBySlug = await _context.Products
            .Where(x => !string.IsNullOrEmpty(x.Slug))
            .ToDictionaryAsync(x => x.Slug!, x => x.Id);
        var productsByExternalId = await _context.Products
            .Where(x => x.ExternalId != null)
            .ToDictionaryAsync(x => x.ExternalId!, x => x.Id);
        var occupiedSkus = new HashSet<string>(productsBySku.Keys, StringComparer.OrdinalIgnoreCase);
        var occupiedSlugs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var batchSize = 100;
        var count = 0;

        foreach (var p in data.Products)
        {
            count++;
            try
            {
                if (!categories.TryGetValue(p.CategorySlug, out var categoryId))
                {
                    _logger.LogWarning("Категория {Slug} не найдена, пропуск товара {Name}", p.CategorySlug, p.Name);
                    result.Skipped++;
                    continue;
                }

                var baseSlug = BuildSlug(p.Sku ?? p.ExternalId, p.Name);

                Guid? existingId = null;
                if (!string.IsNullOrEmpty(p.ExternalId))
                {
                    var extId = Truncate(p.ExternalId, 100)!;
                    if (productsByExternalId.TryGetValue(extId, out var id1))
                        existingId = id1;
                }
                
                if (existingId == null && productsBySlug.TryGetValue(baseSlug, out var id2))
                    existingId = id2;

                var existing = existingId.HasValue 
                    ? await _context.Products.FindAsync(existingId.Value) 
                    : null;

                Manufacturer? manufacturer = null;
                if (!string.IsNullOrEmpty(p.Manufacturer))
                {
                    var mName = Truncate(p.Manufacturer, 100)!;
                    if (manufacturersCache.TryGetValue(mName, out var manId))
                    {
                        manufacturer = _context.Manufacturers.Local.FirstOrDefault(m => m.Id == manId) 
                                       ?? await _context.Manufacturers.FindAsync(manId);
                    }
                    else
                    {
                        manufacturer = new Manufacturer
                        {
                            Id = Guid.NewGuid(),
                            Name = mName,
                            Country = null,
                        };
                        _context.Manufacturers.Add(manufacturer);
                        manufacturersCache[mName] = manufacturer.Id;
                    }
                }

                var specs = new Dictionary<string, object>();
                if (p.Specifications != null)
                {
                    foreach (var kv in p.Specifications)
                    {
                        if (kv.Value == null) continue;
                        var v = kv.Value;
                        specs[kv.Key] = v switch
                        {
                            JsonElement je when je.ValueKind == JsonValueKind.Number => je.TryGetInt64(out var n) ? n : je.GetDecimal(),
                            JsonElement je when je.ValueKind == JsonValueKind.True => true,
                            JsonElement je when je.ValueKind == JsonValueKind.False => false,
                            JsonElement je => je.GetString() ?? "",
                            _ => v
                        };
                    }
                }

                // ... [GPU, CPU, MB, etc logic remains same] ...
                // GPU: миграция data_vykhoda_na_rynok_2 → release_year
                if (string.Equals(p.CategorySlug, "gpu", StringComparison.OrdinalIgnoreCase) &&
                    specs.TryGetValue("data_vykhoda_na_rynok_2", out var oldVal) && oldVal != null)
                {
                    specs["release_year"] = oldVal;
                    specs.Remove("data_vykhoda_na_rynok_2");
                }

                // Процессоры: derive architecture из codename, если architecture не задан
                if (string.Equals(p.CategorySlug, "processors", StringComparison.OrdinalIgnoreCase) &&
                    !specs.ContainsKey("architecture") &&
                    specs.TryGetValue("codename", out var codenameObj) && codenameObj != null)
                {
                    var codenameStr = codenameObj.ToString()?.Replace("\n", " ").Replace("\r", "").Trim() ?? "";
                    var arch = DeriveArchitectureFromCodename(codenameStr);
                    if (!string.IsNullOrEmpty(arch))
                        specs["architecture"] = arch;
                }

                // Материнские платы: разбор memory_type → memory_mixed_slots, memory_cudimm
                if (string.Equals(p.CategorySlug, "motherboards", StringComparison.OrdinalIgnoreCase) &&
                    specs.TryGetValue("memory_type", out var memTypeObj) && memTypeObj != null)
                {
                    var memStr = memTypeObj.ToString()?.Trim() ?? "";
                    if (memStr.Contains("CUDIMM", StringComparison.OrdinalIgnoreCase))
                    {
                        specs["memory_cudimm"] = "Да";
                        specs["memory_type"] = System.Text.RegularExpressions.Regex.Replace(memStr, @",?\s*DDR\d+\s*CUDIMM", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim().TrimEnd(',').Trim();
                    }
                    else
                        specs["memory_cudimm"] = "Нет";

                    if ((memStr.Contains("DDR4", StringComparison.OrdinalIgnoreCase) && memStr.Contains("DDR5", StringComparison.OrdinalIgnoreCase)) ||
                        (memStr.Contains("DDR5", StringComparison.OrdinalIgnoreCase) && memStr.Contains("DDR4", StringComparison.OrdinalIgnoreCase)))
                        specs["memory_mixed_slots"] = "Да";
                    else
                        specs["memory_mixed_slots"] = "Нет";
                }

                // Клавиатуры и мыши: derive connection_type и wireless_protocols из interface
                if ((string.Equals(p.CategorySlug, "keyboards", StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(p.CategorySlug, "mice", StringComparison.OrdinalIgnoreCase)) &&
                    specs.TryGetValue("interface", out var ifaceForDerive) && ifaceForDerive != null)
                {
                    var ifStr = ifaceForDerive.ToString()?.ToLowerInvariant() ?? "";
                    var hasWired = ifStr.Contains("usb") || ifStr.Contains("проводн");
                    var hasBluetooth = ifStr.Contains("bluetooth");
                    var hasRadio = ifStr.Contains("радио") || ifStr.Contains("2.4");
                    if (!specs.ContainsKey("connection_type"))
                    {
                        if (hasWired && (hasBluetooth || hasRadio))
                            specs["connection_type"] = "проводная и беспроводная";
                        else if (hasBluetooth || hasRadio)
                            specs["connection_type"] = "беспроводная";
                        else if (hasWired)
                            specs["connection_type"] = "проводная";
                    }
                    if (!specs.ContainsKey("wireless_protocols") && (hasBluetooth || hasRadio))
                    {
                        var protocols = new List<string>();
                        if (hasBluetooth) protocols.Add("Bluetooth");
                        if (hasRadio) protocols.Add("2.4 GHz");
                        specs["wireless_protocols"] = string.Join(", ", protocols);
                    }
                }

                // Наушники: derive form_factor из type
                if (string.Equals(p.CategorySlug, "headphones", StringComparison.OrdinalIgnoreCase) &&
                    !specs.ContainsKey("form_factor") &&
                    specs.TryGetValue("type", out var typeObj) && typeObj != null)
                {
                    var typeStr = typeObj.ToString()?.ToLowerInvariant() ?? "";
                    if (typeStr.Contains("полноразмерн") || typeStr.Contains("охватывающ"))
                        specs["form_factor"] = "полноразмерные";
                    else if (typeStr.Contains("накладн"))
                        specs["form_factor"] = "накладные";
                    else if (typeStr.Contains("внутриканал") || typeStr.Contains("вкладыш"))
                        specs["form_factor"] = typeStr.Contains("внутриканал") ? "внутриканальные" : "вкладыши";
                }

                // Накопители: derive protocol из interface, если protocol не задан
                if (string.Equals(p.CategorySlug, "storage", StringComparison.OrdinalIgnoreCase) &&
                    !specs.ContainsKey("protocol") &&
                    specs.TryGetValue("interface", out var ifaceObj) && ifaceObj != null)
                {
                    var ifaceStr = ifaceObj.ToString()?.ToUpperInvariant() ?? "";
                    if (ifaceStr.Contains("PCI") || ifaceStr.Contains("U.2"))
                        specs["protocol"] = "NVMe";
                    else if (ifaceStr.Contains("SAS"))
                        specs["protocol"] = "SAS";
                    else if (ifaceStr.Contains("SATA"))
                        specs["protocol"] = "SATA";
                }

                if (existing != null)
                {
                    var normalizedSlug = EnsureUniqueSlug(baseSlug, occupiedSlugs, productsBySlug, existing.Id);
                    occupiedSlugs.Add(normalizedSlug);

                    existing.Name = p.Name ?? existing.Name;
                    existing.Slug = normalizedSlug;
                    existing.Description = p.Description;
                    existing.Price = (decimal)p.Price;
                    existing.OldPrice = p.OldPrice.HasValue ? (decimal)p.OldPrice.Value : null;
                    existing.Stock = p.Stock;
                    existing.WarrantyMonths = p.WarrantyMonths;
                    existing.UpdatedAt = DateTime.UtcNow;
                    existing.SourceUrl = p.Url;
                    existing.CategoryId = categoryId;

                    if (p.LegalInfo != null)
                    {
                        existing.ManufacturerAddress = p.LegalInfo.ManufacturerAddress;
                        existing.ProductionAddress = p.LegalInfo.ProductionAddress;
                        existing.Importer = p.LegalInfo.Importer;
                        existing.ServiceSupport = p.LegalInfo.ServiceSupport;

                        if (p.LegalInfo.WarrantyMonths.HasValue && p.LegalInfo.WarrantyMonths.Value > 0)
                            existing.WarrantyMonths = p.LegalInfo.WarrantyMonths.Value;
                    }
                    
                    await _context.ProductSpecificationValues
                        .Where(v => v.ProductId == existing.Id)
                        .ExecuteDeleteAsync();

                    var specValues = await _specNormalizer.ToSpecificationValuesAsync(existing.Id, specs);
                    foreach (var sv in specValues)
                        _context.ProductSpecificationValues.Add(sv);
                    
                    _logger.LogDebug("Обновлён товар {Sku}", existing.Sku);
                    result.Updated++;
                }
                else
                {
                    var normalizedSlug = EnsureUniqueSlug(baseSlug, occupiedSlugs, productsBySlug);
                    occupiedSlugs.Add(normalizedSlug);
                    var sku = GenerateNumericSku(occupiedSkus);

                    var product = new Product
                    {
                        Id = Guid.NewGuid(),
                        Name = p.Name,
                        Sku = sku,
                        Slug = normalizedSlug,
                        Description = p.Description,
                        ManufacturerAddress = p.LegalInfo?.ManufacturerAddress,
                        ProductionAddress = p.LegalInfo?.ProductionAddress,
                        Importer = p.LegalInfo?.Importer,
                        ServiceSupport = p.LegalInfo?.ServiceSupport,
                        CategoryId = categoryId,
                        ManufacturerId = manufacturer?.Id,
                        Price = (decimal)p.Price,
                        OldPrice = p.OldPrice.HasValue ? (decimal)p.OldPrice.Value : null,
                        Stock = p.Stock,
                        WarrantyMonths = p.LegalInfo?.WarrantyMonths is > 0 ? p.LegalInfo.WarrantyMonths.Value : p.WarrantyMonths,
                        SourceUrl = p.Url,
                        ExternalId = Truncate(p.ExternalId, 100),
                        IsActive = true,
                        IsFeatured = false,
                        CreatedAt = DateTime.UtcNow,
                    };

                    _context.Products.Add(product);
                    productsBySlug[normalizedSlug] = product.Id;
                    if (product.ExternalId != null)
                        productsByExternalId[product.ExternalId] = product.Id;
                    if (product.Sku != null)
                        occupiedSkus.Add(product.Sku);
                    var specValues = await _specNormalizer.ToSpecificationValuesAsync(product.Id, specs);
                    foreach (var sv in specValues)
                        _context.ProductSpecificationValues.Add(sv);

                    if (p.Images != null && p.Images.Count > 0)
                    {
                        for (var i = 0; i < p.Images.Count; i++)
                        {
                            var raw = p.Images[i];
                            var imgUrl = raw is JsonElement je ? je.GetString() : raw?.ToString();
                            if (!string.IsNullOrEmpty(imgUrl) && !IsXCorePlaceholderUrl(imgUrl))
                            {
                                var urlTruncated = imgUrl.Length > 500 ? imgUrl[..500] : imgUrl;
                                var existingPath = TryGetExistingLocalPath(imgUrl);
                                _context.ProductImages.Add(new ProductImage
                                {
                                    Id = Guid.NewGuid(),
                                    ProductId = product.Id,
                                    Url = urlTruncated,
                                    Path = existingPath,
                                    AltText = product.Name,
                                    IsPrimary = i == 0,
                                    SortOrder = i,
                                });
                            }
                        }
                    }

                    result.Imported++;
                }

                if (count % batchSize == 0)
                {
                    try
                    {
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Обработано товаров: {Count}/{Total}", count, result.Total);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Ошибка при сохранении пачки товаров (около {Count})", count);
                        // Ошибки в пачке считаем как ошибки товаров
                        result.Errors += batchSize;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка импорта товара {Name}", p.Name);
                result.Errors++;
            }
        }

        await _context.SaveChangesAsync();
        return result;
    }

    /// <summary>
    /// Извлекает архитектуру из codename процессора (Zen 3, Zen 4, Raptor Lake и т.д.).
    /// </summary>
    private static string? DeriveArchitectureFromCodename(string codename)
    {
        if (string.IsNullOrWhiteSpace(codename)) return null;
        var s = codename.Replace("\n", " ").Replace("\r", "").Trim();

        // Извлечь (Zen 3), (Zen 4), (Zen 5) из скобок
        var zenMatch = System.Text.RegularExpressions.Regex.Match(s, @"\(Zen\s*(\d+)\)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (zenMatch.Success)
            return $"Zen {zenMatch.Groups[1].Value}";

        // AMD codename → architecture lookup (без Zen в скобках)
        var codenameBase = System.Text.RegularExpressions.Regex.Replace(s, @"\s*\([^)]*\)\s*$", "").Trim();
        var amdZen3 = new[] { "Cezanne", "Vermeer", "Matisse", "Lucienne", "Barcelo" };
        var amdZen4 = new[] { "Raphael", "Phoenix", "Dragon Range" };
        var amdZen5 = new[] { "Granite Ridge", "Strix Point" };
        if (amdZen3.Any(c => codenameBase.Contains(c, StringComparison.OrdinalIgnoreCase))) return "Zen 3";
        if (amdZen4.Any(c => codenameBase.Contains(c, StringComparison.OrdinalIgnoreCase))) return "Zen 4";
        if (amdZen5.Any(c => codenameBase.Contains(c, StringComparison.OrdinalIgnoreCase))) return "Zen 5";

        // Zen 3 как standalone (Threadripper)
        if (string.Equals(codenameBase, "Zen 3", StringComparison.OrdinalIgnoreCase)) return "Zen 3";

        // Intel: codename = architecture (Alder Lake, Raptor Lake и т.д.)
        var intelCodenames = new[] { "Alder Lake", "Arrow Lake", "Raptor Lake", "Raptor Lake-R", "Rocket Lake",
            "Comet Lake", "Ice Lake", "Skylake", "Coffee Lake", "Cascade Lake", "Sapphire Rapids",
            "Emerald Rapids", "Genoa", "Milan", "Rome" };
        var match = intelCodenames.FirstOrDefault(c => codenameBase.Contains(c, StringComparison.OrdinalIgnoreCase));
        return match;
    }

    /// <summary>
    /// Удаляет все товары X-Core (SKU начинается с "XCORE-"). Изображения и отзывы удаляются каскадно.
    /// </summary>
    public async Task<int> DeleteXCoreProductsAsync()
    {
        var toDelete = await _context.Products
            .Where(p => p.Sku != null && EF.Functions.Like(p.Sku, "XCORE-%"))
            .ToListAsync();

        _context.Products.RemoveRange(toDelete);
        await _context.SaveChangesAsync();
        return toDelete.Count;
    }

    /// <summary>
    /// Обновляет изображения товаров из JSON (вывод fetch-product-images.mjs).
    /// Формат: { "products": [ { "sku": "...", "images": ["url1", "url2"] } ] }
    /// </summary>
    public async Task<UpdateImagesResult> UpdateProductImagesFromFileAsync(string filePath)
    {
        if (!File.Exists(filePath))
            throw new FileNotFoundException($"Файл не найден: {filePath}");

        var json = await File.ReadAllTextAsync(filePath);
        var data = JsonSerializer.Deserialize<XCoreImagesData>(json, JsonOptions)
            ?? throw new InvalidOperationException("Неверный формат JSON");

        var result = new UpdateImagesResult();
        if (data.Products == null || data.Products.Count == 0)
            return result;

        var processedProductIds = new HashSet<Guid>();
        var matchedProductIds = new HashSet<Guid>();

        foreach (var item in data.Products)
        {
            if (string.IsNullOrEmpty(item.Sku))
                continue;

            var skuNormalized = TruncateSku(item.Sku);
            var externalId = TryExtractExternalIdFromXcoreSku(item.Sku);

            try
            {
                var product = await _context.Products
                    .Include(p => p.Images)
                    .FirstOrDefaultAsync(p =>
                        p.Sku == skuNormalized ||
                        (externalId != null && p.ExternalId == externalId));

                if (product == null)
                {
                    result.NotFound++;
                    continue;
                }

                matchedProductIds.Add(product.Id);

                // Один товар мог встретиться в файле несколько раз (по разным идентификаторам)
                if (processedProductIds.Contains(product.Id))
                    continue;

                processedProductIds.Add(product.Id);

                _context.ProductImages.RemoveRange(product.Images.ToList());

                var imageUrls = item.Images ?? new List<string>();
                for (var i = 0; i < imageUrls.Count; i++)
                {
                    var url = imageUrls[i]?.ToString();
                    if (string.IsNullOrEmpty(url) || IsXCorePlaceholderUrl(url)) continue;

                    var urlTruncated = url.Length > 500 ? url[..500] : url;
                    var existingPath = TryGetExistingLocalPath(url);

                    _context.ProductImages.Add(new ProductImage
                    {
                        Id = Guid.NewGuid(),
                        ProductId = product.Id,
                        Url = urlTruncated,
                        Path = existingPath,
                        AltText = product.Name,
                        IsPrimary = i == 0,
                        SortOrder = i,
                    });
                }

                result.Updated++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка обновления изображений для SKU {Sku}", item.Sku);
                result.Errors++;
            }
        }

        // Удаляем изображения только у X-Core товаров, отсутствующих в файле.
        // Важно: если не сопоставили ни одного товара, удаление отключаем (защита от массовой потери изображений).
        if (matchedProductIds.Count > 0)
        {
            var productsWithImagesNotInFile = await _context.Products
                .Include(p => p.Images)
                .Where(p => p.ExternalId != null && p.Images.Count > 0 && !matchedProductIds.Contains(p.Id))
                .ToListAsync();

            foreach (var product in productsWithImagesNotInFile)
            {
                _context.ProductImages.RemoveRange(product.Images.ToList());
                result.Deleted++;
            }
        }
        else
        {
            _logger.LogWarning(
                "seed-xcore-images: не удалось сопоставить ни одного товара с файлом {FilePath}; удаление изображений пропущено",
                filePath);
        }

        await _context.SaveChangesAsync();
        return result;
    }
}

public class UpdateImagesResult
{
    public int Updated { get; set; }
    public int NotFound { get; set; }
    public int Errors { get; set; }
    /// <summary>Количество товаров, у которых удалены изображения (SKU не найден в файле)</summary>
    public int Deleted { get; set; }
}

public class XCoreImagesData
{
    public List<XCoreImageItem>? Products { get; set; }
}

public class XCoreImageItem
{
    public string? Sku { get; set; }
    public List<string>? Images { get; set; }
}

public class ImportResult
{
    public int Total { get; set; }
    public int Imported { get; set; }
    public int Updated { get; set; }
    public int Skipped { get; set; }
    public int Errors { get; set; }
}

public class XCoreImportData
{
    public string? Source { get; set; }
    public string? ScrapedAt { get; set; }
    public int ProductCount { get; set; }
    public List<XCoreProductDto>? Products { get; set; }
}

public class XCoreProductDto
{
    public string? Url { get; set; }
    public string? ExternalId { get; set; }
    public string? CategorySlug { get; set; }
    public string? CategoryPath { get; set; }
    public string? Name { get; set; }
    public double Price { get; set; }
    public double? OldPrice { get; set; }
    public int Stock { get; set; }
    public string? Description { get; set; }
    public Dictionary<string, object?>? Specifications { get; set; }
    public int WarrantyMonths { get; set; }
    public string? Manufacturer { get; set; }
    public List<object>? Images { get; set; }
    public string? Sku { get; set; }
    public XCoreLegalInfoDto? LegalInfo { get; set; }
}

public class XCoreLegalInfoDto
{
    public int? WarrantyMonths { get; set; }
    public string? WarrantyText { get; set; }
    public string? ManufacturerAddress { get; set; }
    public string? ProductionAddress { get; set; }
    public string? Importer { get; set; }
    public string? ServiceSupport { get; set; }
}
