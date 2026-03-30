using System;
using System.Text.Json;
using System.Text.Json.Serialization;
using CatalogService.Data;
using CatalogService.Models;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Services;

/// <summary>
/// Синхронизирует атрибуты фильтров из JSON (xcore-filter-attributes.json) в БД.
/// </summary>
public class FilterAttributesSeeder
{
    private readonly CatalogDbContext _context;
    private readonly ILogger<FilterAttributesSeeder> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public FilterAttributesSeeder(CatalogDbContext context, ILogger<FilterAttributesSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<SeedResult> SeedFromFileAsync(string filePath)
    {
        if (!File.Exists(filePath))
            throw new FileNotFoundException($"Файл не найден: {filePath}");

        var json = await File.ReadAllTextAsync(filePath);
        var config = JsonSerializer.Deserialize<Dictionary<string, List<FilterAttrConfig>>>(json, JsonOptions)
            ?? throw new InvalidOperationException("Неверный формат JSON");

        return await SeedAsync(config);
    }

    private async Task<SeedResult> SeedAsync(Dictionary<string, List<FilterAttrConfig>> config)
    {
        var result = new SeedResult();
        var categories = await _context.Categories.ToDictionaryAsync(c => c.Slug, c => c.Id);
        var attributesByKey = await _context.SpecificationAttributes
            .AsNoTracking()
            .ToDictionaryAsync(a => a.Key, a => a.Id);

        foreach (var (slug, attrs) in config)
        {
            if (!categories.TryGetValue(slug, out var categoryId))
            {
                _logger.LogWarning("Категория {Slug} не найдена, пропуск атрибутов", slug);
                result.Skipped += attrs.Count;
                continue;
            }

            var existing = await _context.CategoryFilterAttributes
                .Where(a => a.CategoryId == categoryId)
                .ToListAsync();

            _context.CategoryFilterAttributes.RemoveRange(existing);
            result.Deleted += existing.Count;

            foreach (var a in attrs)
            {
                if (!attributesByKey.TryGetValue(a.AttributeKey, out var attributeId))
                {
                    _logger.LogWarning(
                        "Атрибут спецификации {AttributeKey} для категории {CategorySlug} не найден, пропуск",
                        a.AttributeKey,
                        slug);
                    result.Skipped++;
                    continue;
                }

                _context.CategoryFilterAttributes.Add(new CategoryFilterAttribute
                {
                    Id = Guid.NewGuid(),
                    CategoryId = categoryId,
                    AttributeId = attributeId,
                    AttributeKey = a.AttributeKey,
                    DisplayName = a.DisplayName,
                    FilterType = string.Equals(a.FilterType, "range", StringComparison.OrdinalIgnoreCase) ? FilterAttributeType.Range : FilterAttributeType.Select,
                    SortOrder = a.SortOrder
                });
                result.Added++;
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Filter attributes: {Added} добавлено, {Deleted} удалено, {Skipped} пропущено",
            result.Added, result.Deleted, result.Skipped);
        return result;
    }

    private class FilterAttrConfig
    {
        [JsonPropertyName("attribute_key")]
        public string AttributeKey { get; set; } = string.Empty;

        [JsonPropertyName("display_name")]
        public string DisplayName { get; set; } = string.Empty;

        [JsonPropertyName("filter_type")]
        public string? FilterType { get; set; }

        [JsonPropertyName("sort_order")]
        public int SortOrder { get; set; }
    }

    public class SeedResult
    {
        public int Added { get; set; }
        public int Deleted { get; set; }
        public int Skipped { get; set; }
    }
}
