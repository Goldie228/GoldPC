using CatalogService.Data;
using CatalogService.DTOs;
using CatalogService.Models;
using CatalogService.Repositories.Interfaces;
using CatalogService.Services;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Repositories;

/// <summary>
/// Внутренний результат пагинации для репозитория
/// </summary>
public class RepositoryPagedResult<T>
{
    public List<T> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
}

/// <summary>
/// Реализация репозитория товаров
/// </summary>
public class ProductRepository : IProductRepository
{
    private readonly CatalogDbContext _context;
    private readonly ILogger<ProductRepository> _logger;

    public ProductRepository(CatalogDbContext context, ILogger<ProductRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Product?> GetByIdAsync(Guid id)
    {
        return await _context.Products
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);
    }

    public async Task<Product?> GetBySkuAsync(string sku)
    {
        return await _context.Products
            .FirstOrDefaultAsync(p => p.Sku == sku);
    }

    public async Task<Product?> GetDetailByIdAsync(Guid id)
    {
        return await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .Include(p => p.Reviews.Where(r => r.IsVerified).OrderByDescending(r => r.CreatedAt))
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);
    }

    public async Task<RepositoryPagedResult<Product>> GetFilteredAsync(ProductFilterDto filter)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .Include(p => p.Images.Where(i => i.IsPrimary))
            .Where(p => p.IsActive && p.Images.Any());

        // Фильтрация по ID категории
        if (filter.CategoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == filter.CategoryId.Value);
        }
        // Фильтрация по slug категории
        else if (!string.IsNullOrWhiteSpace(filter.Category))
        {
            var categorySlug = filter.Category.ToLower();
            query = query.Where(p => p.Category != null && p.Category.Slug.ToLower() == categorySlug);
        }

        // Фильтрация по производителю(ам)
        var manIds = filter.ManufacturerIds?.Where(id => id != Guid.Empty).Distinct().ToList();
        if (manIds != null && manIds.Count > 0)
        {
            query = query.Where(p => p.ManufacturerId.HasValue && manIds.Contains(p.ManufacturerId.Value));
        }
        else if (filter.ManufacturerId.HasValue)
        {
            query = query.Where(p => p.ManufacturerId == filter.ManufacturerId.Value);
        }

        // Фильтрация по цене
        if (filter.MinPrice.HasValue)
        {
            query = query.Where(p => p.Price >= filter.MinPrice.Value);
        }

        if (filter.MaxPrice.HasValue)
        {
            query = query.Where(p => p.Price <= filter.MaxPrice.Value);
        }

        // Фильтрация по наличию
        if (filter.InStock == true)
        {
            query = query.Where(p => p.Stock > 0);
        }
        else if (filter.InStock == false)
        {
            query = query.Where(p => p.Stock <= 0);
        }

        // Фильтрация по рекомендуемым
        if (filter.IsFeatured == true)
        {
            query = query.Where(p => p.IsFeatured);
        }

        // Поиск по названию и описанию
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var searchTerm = filter.Search.ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(searchTerm) ||
                (p.Description != null && p.Description.ToLower().Contains(searchTerm)) ||
                p.Sku.ToLower().Contains(searchTerm));
        }

        // Фильтрация по спецификациям и range — в памяти (надёжный мультивыбор AM4+AM5 и т.п.)
        var hasSpecs = filter.Specifications != null && filter.Specifications.Count > 0;
        var hasRanges = filter.SpecificationRanges != null && filter.SpecificationRanges.Count > 0;
        if (hasSpecs || hasRanges)
        {
            var allFiltered = await query.ToListAsync();

            if (hasSpecs)
            {
                foreach (var (key, value) in filter.Specifications!)
                {
                    if (string.IsNullOrEmpty(key) || string.IsNullOrEmpty(value))
                        continue;
                    var allowedValues = value.Split(',', StringSplitOptions.TrimEntries).Where(s => !string.IsNullOrEmpty(s)).ToList();
                    if (allowedValues.Count == 0) continue;

                    allFiltered = allFiltered.Where(p =>
                    {
                        if (p.Specifications == null || !p.Specifications.TryGetValue(key, out var specVal))
                            return false;
                        if (string.Equals(key, "socket", StringComparison.OrdinalIgnoreCase))
                        {
                            var pv = specVal?.ToString() ?? "";
                            var parts = pv.Split(',', StringSplitOptions.TrimEntries);
                            return allowedValues.Any(allowed =>
                                parts.Any(part => string.Equals(
                                    SpecValueNormalizer.NormalizeForDisplay(key, part.Trim()),
                                    allowed,
                                    StringComparison.OrdinalIgnoreCase)));
                        }
                        if (SpecValueNormalizer.IsNormalizedAttribute(key))
                        {
                            return allowedValues.Any(allowed =>
                                SpecValueNormalizer.MatchesFilter(key, specVal, allowed));
                        }
                        if (string.Equals(key, "memory_type", StringComparison.OrdinalIgnoreCase) && (specVal?.ToString() ?? "").Contains(","))
                            return allowedValues.Any(allowed => SpecValueNormalizer.MotherboardMemoryTypeMatches(specVal?.ToString(), allowed));
                        if (SpecValueNormalizer.ShouldExpandMultiValue(key))
                        {
                            var pv = specVal?.ToString() ?? "";
                            if (string.Equals(key, "form_factor", StringComparison.OrdinalIgnoreCase))
                                pv = SpecValueNormalizer.NormalizeFormFactorForDisplay(pv);
                            return allowedValues.Any(allowed =>
                                SpecValueNormalizer.MultiValueContains(pv, allowed));
                        }
                        if (specVal == null) return false;
                        var specStr = SpecValueNormalizer.CollapseWhitespace(specVal.ToString() ?? "");
                        return allowedValues.Any(allowed =>
                        {
                            if (int.TryParse(allowed, out var intAllowed) && int.TryParse(specStr, out var intSpec))
                                return intAllowed == intSpec;
                            if (double.TryParse(allowed, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var dblAllowed) &&
                                double.TryParse(specStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var dblSpec))
                                return Math.Abs(dblAllowed - dblSpec) < 0.001;
                            return string.Equals(specStr, allowed, StringComparison.OrdinalIgnoreCase);
                        });
                    }).ToList();
                }
            }

            if (hasRanges)
            {
                foreach (var (key, rangeStr) in filter.SpecificationRanges!)
                {
                    if (string.IsNullOrEmpty(key)) continue;
                    var parts = rangeStr.Split(',', StringSplitOptions.TrimEntries);
                    decimal? min = parts.Length > 0 && decimal.TryParse(parts[0], out var m) ? m : null;
                    decimal? max = parts.Length > 1 && decimal.TryParse(parts[1], out var x) ? x : null;
                    if (!min.HasValue && !max.HasValue) continue;

                    allFiltered = allFiltered.Where(p =>
                        p.Specifications != null &&
                        p.Specifications.TryGetValue(key, out var val) &&
                        val != null &&
                        TryParseSpecNumber(val, out var num) &&
                        (!min.HasValue || num >= min.Value) &&
                        (!max.HasValue || num <= max.Value)).ToList();
                }
            }

            var specTotal = allFiltered.Count;
            var specSortDesc = filter.SortOrder?.ToLower() == "desc";
            var specSorted = ApplySorting(allFiltered.AsQueryable(), filter.SortBy, specSortDesc);
            var specItems = specSorted
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToList();

            return new RepositoryPagedResult<Product>
            {
                Items = specItems,
                TotalCount = specTotal,
                Page = filter.Page,
                PageSize = filter.PageSize
            };
        }

        // Подсчёт и пагинация (без спецификаций)
        var totalCount = await query.CountAsync();

        var sortDesc = filter.SortOrder?.ToLower() == "desc";
        query = ApplySorting(query, filter.SortBy, sortDesc);

        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new RepositoryPagedResult<Product>
        {
            Items = items,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    private static bool TryParseSpecNumber(object? val, out decimal num)
    {
        num = 0;
        if (val == null) return false;
        if (val is int i) { num = i; return true; }
        if (val is long l) { num = l; return true; }
        if (val is decimal d) { num = d; return true; }
        if (val is double db) { num = (decimal)db; return true; }
        if (val is float f) { num = (decimal)f; return true; }
        if (val is string s && decimal.TryParse(s.Replace(" ", "").Replace(",", "."), out var parsed)) { num = parsed; return true; }
        return false;
    }

    private static IQueryable<Product> ApplySorting(IQueryable<Product> query, string sortBy, bool sortDesc)
    {
        return sortBy.ToLower() switch
        {
            "price" => sortDesc ? query.OrderByDescending(p => p.Price) : query.OrderBy(p => p.Price),
            "rating" => sortDesc ? query.OrderByDescending(p => p.Rating) : query.OrderBy(p => p.Rating),
            "createdat" or "created" => sortDesc ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            "name" => sortDesc ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
            "stock" => sortDesc ? query.OrderByDescending(p => p.Stock) : query.OrderBy(p => p.Stock),
            _ => sortDesc ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt)
        };
    }

    public async Task<IEnumerable<Product>> GetByIdsAsync(IEnumerable<Guid> ids)
    {
        return await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .Where(p => ids.Contains(p.Id) && p.IsActive)
            .ToListAsync();
    }

    public async Task<IEnumerable<Product>> GetByCategoryAsync(Guid categoryId)
    {
        return await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .Where(p => p.CategoryId == categoryId && p.IsActive && p.Images.Any())
            .ToListAsync();
    }

    public async Task<IEnumerable<Guid>> GetManufacturerIdsByCategoryAsync(Guid categoryId)
    {
        return await _context.Products
            .Where(p => p.CategoryId == categoryId && p.IsActive && p.ManufacturerId.HasValue)
            .Select(p => p.ManufacturerId!.Value)
            .Distinct()
            .ToListAsync();
    }

    public async Task<Dictionary<string, List<string>>> GetDistinctSpecificationValuesAsync(Guid categoryId, IEnumerable<string> attributeKeys, ProductFilterDto? filterContext = null)
    {
        var keys = attributeKeys.Where(k => !string.IsNullOrEmpty(k)).Distinct().ToList();
        if (keys.Count == 0)
            return new Dictionary<string, List<string>>();

        var productsQuery = _context.Products
            .Where(p => p.CategoryId == categoryId && p.IsActive && p.Specifications != null);

        if (filterContext != null)
        {
            var manIds = filterContext.ManufacturerIds?.Where(id => id != Guid.Empty).Distinct().ToList();
            if (manIds != null && manIds.Count > 0)
                productsQuery = productsQuery.Where(p => p.ManufacturerId.HasValue && manIds.Contains(p.ManufacturerId.Value));
        }

        var allProducts = await productsQuery.Select(p => new { p.Id, p.Specifications }).ToListAsync();

        var result = new Dictionary<string, List<string>>();
        foreach (var key in keys)
        {
            var filteredForKey = allProducts.AsEnumerable();
            var specsExcludingKey = filterContext?.Specifications?.Where(kv => kv.Key != key).ToDictionary(kv => kv.Key, kv => kv.Value);
            if (specsExcludingKey != null && specsExcludingKey.Count > 0)
            {
                foreach (var (specKey, value) in specsExcludingKey)
                {
                    if (string.IsNullOrEmpty(specKey) || string.IsNullOrEmpty(value)) continue;
                    var allowed = value.Split(',', StringSplitOptions.TrimEntries).Where(s => !string.IsNullOrEmpty(s)).ToList();
                    if (allowed.Count == 0) continue;
                    filteredForKey = filteredForKey.Where(p =>
                    {
                        if (p.Specifications == null || !p.Specifications.TryGetValue(specKey, out var v)) return false;
                        if (string.Equals(specKey, "socket", StringComparison.OrdinalIgnoreCase))
                        {
                            var pv = v?.ToString() ?? "";
                            var parts = pv.Split(',', StringSplitOptions.TrimEntries);
                            return allowed.Any(a => parts.Any(part => string.Equals(
                                SpecValueNormalizer.NormalizeForDisplay(specKey, part.Trim()), a, StringComparison.OrdinalIgnoreCase)));
                        }
                        if (SpecValueNormalizer.IsNormalizedAttribute(specKey))
                            return allowed.Any(a => SpecValueNormalizer.MatchesFilter(specKey, v, a));
                        if (string.Equals(specKey, "memory_type", StringComparison.OrdinalIgnoreCase) && (v?.ToString() ?? "").Contains(","))
                            return allowed.Any(a => SpecValueNormalizer.MotherboardMemoryTypeMatches(v?.ToString(), a));
                        if (SpecValueNormalizer.ShouldExpandMultiValue(specKey))
                        {
                            var pv = v?.ToString() ?? "";
                            if (string.Equals(specKey, "form_factor", StringComparison.OrdinalIgnoreCase))
                                pv = SpecValueNormalizer.NormalizeFormFactorForDisplay(pv);
                            return allowed.Any(a => SpecValueNormalizer.MultiValueContains(pv, a));
                        }
                        if (v == null) return false;
                        return allowed.Any(a => string.Equals((v?.ToString() ?? ""), a, StringComparison.OrdinalIgnoreCase));
                    });
                }
            }
            if (filterContext?.SpecificationRanges != null && filterContext.SpecificationRanges.Count > 0)
            {
                foreach (var (rangeKey, rangeStr) in filterContext.SpecificationRanges)
                {
                    if (string.IsNullOrEmpty(rangeKey)) continue;
                    var parts = rangeStr.Split(',', StringSplitOptions.TrimEntries);
                    decimal? min = parts.Length > 0 && decimal.TryParse(parts[0], out var m) ? m : null;
                    decimal? max = parts.Length > 1 && decimal.TryParse(parts[1], out var x) ? x : null;
                    if (!min.HasValue && !max.HasValue) continue;
                    filteredForKey = filteredForKey.Where(p => p.Specifications != null && p.Specifications.TryGetValue(rangeKey, out var val) && val != null &&
                        TryParseSpecNumber(val, out var num) &&
                        (!min.HasValue || num >= min.Value) &&
                        (!max.HasValue || num <= max.Value));
                }
            }
            var values = filteredForKey
                .Where(p => p.Specifications != null && p.Specifications.ContainsKey(key) && p.Specifications[key] != null)
                .Select(p => p.Specifications![key]?.ToString() ?? string.Empty)
                .Where(v => !string.IsNullOrEmpty(v))
                .Distinct()
                .OrderBy(v => v)
                .ToList();
            if (values.Count > 0)
                result[key] = values;
        }
        return result;
    }

    public async Task<(decimal? Min, decimal? Max)> GetSpecificationRangeAsync(Guid categoryId, string attributeKey, ProductFilterDto? filterContext = null)
    {
        var productsQuery = _context.Products
            .Where(p => p.CategoryId == categoryId && p.IsActive && p.Specifications != null);

        if (filterContext != null)
        {
            var manIds = filterContext.ManufacturerIds?.Where(id => id != Guid.Empty).Distinct().ToList();
            if (manIds != null && manIds.Count > 0)
                productsQuery = productsQuery.Where(p => p.ManufacturerId.HasValue && manIds.Contains(p.ManufacturerId.Value));
        }

        var products = await productsQuery.Select(p => p.Specifications).ToListAsync();

        if (filterContext?.Specifications != null && filterContext.Specifications.Count > 0 ||
            filterContext?.SpecificationRanges != null && filterContext.SpecificationRanges.Count > 0)
        {
            var allProductsWithId = await productsQuery.Select(p => new { p.Id, p.Specifications }).ToListAsync();
            var filtered = allProductsWithId.AsEnumerable();
            if (filterContext.Specifications != null)
            {
                foreach (var (specKey, value) in filterContext.Specifications)
                {
                    if (string.IsNullOrEmpty(specKey) || string.IsNullOrEmpty(value)) continue;
                    var allowed = value.Split(',', StringSplitOptions.TrimEntries).Where(s => !string.IsNullOrEmpty(s)).ToList();
                    if (allowed.Count == 0) continue;
                    filtered = filtered.Where(p =>
                    {
                        if (p.Specifications == null || !p.Specifications.TryGetValue(specKey, out var v)) return false;
                        if (string.Equals(specKey, "socket", StringComparison.OrdinalIgnoreCase))
                        {
                            var pv = v?.ToString() ?? "";
                            var parts = pv.Split(',', StringSplitOptions.TrimEntries);
                            return allowed.Any(a => parts.Any(part => string.Equals(
                                SpecValueNormalizer.NormalizeForDisplay(specKey, part.Trim()), a, StringComparison.OrdinalIgnoreCase)));
                        }
                        if (SpecValueNormalizer.IsNormalizedAttribute(specKey))
                            return allowed.Any(a => SpecValueNormalizer.MatchesFilter(specKey, v, a));
                        if (string.Equals(specKey, "memory_type", StringComparison.OrdinalIgnoreCase) && (v?.ToString() ?? "").Contains(","))
                            return allowed.Any(a => SpecValueNormalizer.MotherboardMemoryTypeMatches(v?.ToString(), a));
                        if (SpecValueNormalizer.ShouldExpandMultiValue(specKey))
                        {
                            var pv = v?.ToString() ?? "";
                            if (string.Equals(specKey, "form_factor", StringComparison.OrdinalIgnoreCase))
                                pv = SpecValueNormalizer.NormalizeFormFactorForDisplay(pv);
                            return allowed.Any(a => SpecValueNormalizer.MultiValueContains(pv, a));
                        }
                        if (v == null) return false;
                        return allowed.Any(a => string.Equals((v?.ToString() ?? ""), a, StringComparison.OrdinalIgnoreCase));
                    });
                }
            }
            if (filterContext.SpecificationRanges != null)
            {
                foreach (var (rangeKey, rangeStr) in filterContext.SpecificationRanges)
                {
                    if (string.IsNullOrEmpty(rangeKey)) continue;
                    var parts = rangeStr.Split(',', StringSplitOptions.TrimEntries);
                    decimal? min = parts.Length > 0 && decimal.TryParse(parts[0], out var m) ? m : null;
                    decimal? max = parts.Length > 1 && decimal.TryParse(parts[1], out var x) ? x : null;
                    if (!min.HasValue && !max.HasValue) continue;
                    filtered = filtered.Where(p => p.Specifications != null && p.Specifications.TryGetValue(rangeKey, out var val) && val != null &&
                        TryParseSpecNumber(val, out var num) &&
                        (!min.HasValue || num >= min.Value) &&
                        (!max.HasValue || num <= max.Value));
                }
            }
            products = filtered.Select(p => p.Specifications).ToList();
        }

        decimal? minVal = null;
        decimal? maxVal = null;
        foreach (var specs in products)
        {
            if (specs == null || !specs.TryGetValue(attributeKey, out var val) || val == null) continue;
            if (!TryParseSpecNumber(val, out var num)) continue;
            if (!minVal.HasValue || num < minVal) minVal = num;
            if (!maxVal.HasValue || num > maxVal) maxVal = num;
        }
        return (minVal, maxVal);
    }

    public async Task<Dictionary<Guid, int>> GetProductCountsByCategoryAsync()
    {
        return await _context.Products
            .Where(p => p.IsActive && p.Images.Any())
            .GroupBy(p => p.CategoryId)
            .Select(g => new { CategoryId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CategoryId, x => x.Count);
    }

    public async Task<Product> CreateAsync(Product product)
    {
        product.CreatedAt = DateTime.UtcNow;
        product.Id = Guid.NewGuid();
        
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Created product {ProductId} with SKU {Sku}", product.Id, product.Sku);
        
        return product;
    }

    public async Task<Product> UpdateAsync(Product product)
    {
        product.UpdatedAt = DateTime.UtcNow;
        
        _context.Products.Update(product);
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Updated product {ProductId}", product.Id);
        
        return product;
    }

    public async Task DeleteAsync(Guid id)
    {
        var product = await GetByIdAsync(id);
        if (product != null)
        {
            product.IsActive = false;
            product.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Soft deleted product {ProductId}", id);
        }
    }

    public async Task<bool> ExistsAsync(Guid id)
    {
        return await _context.Products.AnyAsync(p => p.Id == id && p.IsActive);
    }

    public async Task<bool> SkuExistsAsync(string sku, Guid? excludeId = null)
    {
        var query = _context.Products.Where(p => p.Sku == sku);
        
        if (excludeId.HasValue)
        {
            query = query.Where(p => p.Id != excludeId.Value);
        }
        
        return await query.AnyAsync();
    }

    public async Task UpdateStockAsync(Guid id, int quantity)
    {
        var product = await GetByIdAsync(id);
        if (product != null)
        {
            product.Stock = Math.Max(0, product.Stock + quantity);
            product.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Updated stock for product {ProductId} by {Quantity}. New stock: {Stock}", 
                id, quantity, product.Stock);
        }
    }
}
