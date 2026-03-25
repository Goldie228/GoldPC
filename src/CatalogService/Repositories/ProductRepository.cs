using CatalogService.Data;
using GoldPC.SharedKernel.DTOs;
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
    private readonly ReadOnlyCatalogDbContext _readContext;
    private readonly SpecImportNormalizer _specNormalizer;
    private readonly ILogger<ProductRepository> _logger;

    public ProductRepository(
        CatalogDbContext context, 
        ReadOnlyCatalogDbContext readContext,
        SpecImportNormalizer specNormalizer, 
        ILogger<ProductRepository> logger)
    {
        _context = context;
        _readContext = readContext;
        _specNormalizer = specNormalizer;
        _logger = logger;
    }

    public async Task<Product?> GetByIdAsync(Guid id)
    {
        return await _readContext.Products
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);
    }

    public async Task<Product?> GetBySkuAsync(string sku)
    {
        return await _readContext.Products
            .FirstOrDefaultAsync(p => p.Sku == sku);
    }

    public async Task<Product?> GetDetailByIdAsync(Guid id)
    {
        return await _readContext.Products
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .Include(p => p.SpecificationValues)
                .ThenInclude(s => s.Attribute)
            .Include(p => p.SpecificationValues)
                .ThenInclude(s => s.CanonicalValue)
            .Include(p => p.Reviews.Where(r => r.IsVerified).OrderByDescending(r => r.CreatedAt))
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);
    }

    public async Task<RepositoryPagedResult<Product>> GetFilteredAsync(ProductFilterDto filter)
    {
        var query = _readContext.Products
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

        // Фильтрация по спецификациям (SQL)
        var hasSpecs = filter.Specifications != null && filter.Specifications.Count > 0;
        var hasRanges = filter.SpecificationRanges != null && filter.SpecificationRanges.Count > 0;
        if (hasSpecs)
        {
            foreach (var (key, value) in filter.Specifications!)
            {
                if (string.IsNullOrEmpty(key) || string.IsNullOrEmpty(value)) continue;
                var allowedTexts = value.Split(',', StringSplitOptions.TrimEntries).Where(s => !string.IsNullOrEmpty(s)).ToList();
                if (allowedTexts.Count == 0) continue;

                var attr = await _readContext.SpecificationAttributes.FirstOrDefaultAsync(a => a.Key == key);
                if (attr == null) continue;

                var canonicalIds = await _readContext.SpecificationCanonicalValues
                    .Where(cv => cv.AttributeId == attr.Id && allowedTexts.Contains(cv.ValueText))
                    .Select(cv => cv.Id)
                    .ToListAsync();
                if (canonicalIds.Count == 0) continue;

                query = query.Where(p => _readContext.ProductSpecificationValues
                    .Any(psv => psv.ProductId == p.Id && psv.AttributeId == attr.Id && psv.CanonicalValueId != null && canonicalIds.Contains(psv.CanonicalValueId!.Value)));
            }
        }
        if (hasRanges)
        {
            foreach (var (key, rangeStr) in filter.SpecificationRanges!)
            {
                if (string.IsNullOrEmpty(key)) continue;
                var parts = rangeStr.Split(',', StringSplitOptions.TrimEntries);
                var min = parts.Length > 0 && decimal.TryParse(parts[0], System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var m) ? m : (decimal?)null;
                var max = parts.Length > 1 && decimal.TryParse(parts[1], System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var x) ? x : (decimal?)null;
                if (!min.HasValue && !max.HasValue) continue;

                var attr = await _readContext.SpecificationAttributes.FirstOrDefaultAsync(a => a.Key == key);
                if (attr == null) continue;

                query = query.Where(p => _readContext.ProductSpecificationValues
                    .Any(psv => psv.ProductId == p.Id && psv.AttributeId == attr.Id && psv.ValueNumber != null &&
                        (!min.HasValue || psv.ValueNumber >= min) &&
                        (!max.HasValue || psv.ValueNumber <= max)));
            }
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
        return await _readContext.Products
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .Where(p => ids.Contains(p.Id) && p.IsActive)
            .ToListAsync();
    }

    public async Task<IEnumerable<Product>> GetByCategoryAsync(Guid categoryId)
    {
        return await _readContext.Products
            .Include(p => p.Category)
            .Include(p => p.Manufacturer)
            .Where(p => p.CategoryId == categoryId && p.IsActive && p.Images.Any())
            .ToListAsync();
    }

    public async Task<IEnumerable<Guid>> GetManufacturerIdsByCategoryAsync(Guid categoryId)
    {
        return await _readContext.Products
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

        var baseProductsQuery = _readContext.Products.Where(p => p.CategoryId == categoryId && p.IsActive);
        if (filterContext != null)
        {
            var manIds = filterContext.ManufacturerIds?.Where(id => id != Guid.Empty).Distinct().ToList();
            if (manIds != null && manIds.Count > 0)
                baseProductsQuery = baseProductsQuery.Where(p => p.ManufacturerId.HasValue && manIds.Contains(p.ManufacturerId.Value));
        }
        var productIds = await baseProductsQuery.Select(p => p.Id).ToListAsync();

        if (filterContext?.Specifications != null && filterContext.Specifications.Count > 0)
        {
            foreach (var (specKey, value) in filterContext.Specifications.Where(kv => kv.Key != null && kv.Value != null))
            {
                var allowedTexts = value.Split(',', StringSplitOptions.TrimEntries).Where(s => !string.IsNullOrEmpty(s)).ToList();
                if (allowedTexts.Count == 0) continue;
                var attr = await _readContext.SpecificationAttributes.FirstOrDefaultAsync(a => a.Key == specKey);
                if (attr == null) continue;
                var canonIds = await _readContext.SpecificationCanonicalValues
                    .Where(cv => cv.AttributeId == attr.Id && allowedTexts.Contains(cv.ValueText))
                    .Select(cv => cv.Id).ToListAsync();
                if (canonIds.Count == 0) continue;
                productIds = await _readContext.ProductSpecificationValues
                    .Where(psv => productIds.Contains(psv.ProductId) && psv.AttributeId == attr.Id && psv.CanonicalValueId != null && canonIds.Contains(psv.CanonicalValueId!.Value))
                    .Select(psv => psv.ProductId)
                    .Distinct()
                    .ToListAsync();
            }
        }
        if (filterContext?.SpecificationRanges != null && filterContext.SpecificationRanges.Count > 0)
        {
            foreach (var (rangeKey, rangeStr) in filterContext.SpecificationRanges)
            {
                if (string.IsNullOrEmpty(rangeKey)) continue;
                var parts = rangeStr.Split(',', StringSplitOptions.TrimEntries);
                var min = parts.Length > 0 && decimal.TryParse(parts[0], System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var m) ? m : (decimal?)null;
                var max = parts.Length > 1 && decimal.TryParse(parts[1], System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var x) ? x : (decimal?)null;
                if (!min.HasValue && !max.HasValue) continue;
                var attr = await _readContext.SpecificationAttributes.FirstOrDefaultAsync(a => a.Key == rangeKey);
                if (attr == null) continue;
                productIds = await _readContext.ProductSpecificationValues
                    .Where(psv => productIds.Contains(psv.ProductId) && psv.AttributeId == attr.Id && psv.ValueNumber != null &&
                        (!min.HasValue || psv.ValueNumber >= min) &&
                        (!max.HasValue || psv.ValueNumber <= max))
                    .Select(psv => psv.ProductId)
                    .Distinct()
                    .ToListAsync();
            }
        }

        var result = new Dictionary<string, List<string>>();
        foreach (var key in keys)
        {
            var attr = await _readContext.SpecificationAttributes.FirstOrDefaultAsync(a => a.Key == key);
            if (attr == null) continue;

            var values = await _readContext.ProductSpecificationValues
                .Where(psv => productIds.Contains(psv.ProductId) && psv.AttributeId == attr.Id && psv.CanonicalValueId != null)
                .Join(_readContext.SpecificationCanonicalValues, psv => psv.CanonicalValueId, scv => scv.Id, (psv, scv) => scv.ValueText)
                .Distinct()
                .OrderBy(t => t)
                .ToListAsync();
            if (values.Count > 0)
                result[key] = values;
        }
        return result;
    }

    public async Task<(decimal? Min, decimal? Max)> GetSpecificationRangeAsync(Guid categoryId, string attributeKey, ProductFilterDto? filterContext = null)
    {
        var attr = await _readContext.SpecificationAttributes.FirstOrDefaultAsync(a => a.Key == attributeKey);
        if (attr == null) return (null, null);

        var baseProductsQuery = _readContext.Products.Where(p => p.CategoryId == categoryId && p.IsActive);
        if (filterContext != null)
        {
            var manIds = filterContext.ManufacturerIds?.Where(id => id != Guid.Empty).Distinct().ToList();
            if (manIds != null && manIds.Count > 0)
                baseProductsQuery = baseProductsQuery.Where(p => p.ManufacturerId.HasValue && manIds.Contains(p.ManufacturerId.Value));
        }
        var productIds = await baseProductsQuery.Select(p => p.Id).ToListAsync();

        if (filterContext?.Specifications != null && filterContext.Specifications.Count > 0)
        {
            foreach (var (specKey, value) in filterContext.Specifications)
            {
                if (string.IsNullOrEmpty(specKey) || string.IsNullOrEmpty(value)) continue;
                var allowedTexts = value.Split(',', StringSplitOptions.TrimEntries).Where(s => !string.IsNullOrEmpty(s)).ToList();
                if (allowedTexts.Count == 0) continue;
                var specAttr = await _readContext.SpecificationAttributes.FirstOrDefaultAsync(a => a.Key == specKey);
                if (specAttr == null) continue;
                var canonIds = await _readContext.SpecificationCanonicalValues
                    .Where(cv => cv.AttributeId == specAttr.Id && allowedTexts.Contains(cv.ValueText))
                    .Select(cv => cv.Id).ToListAsync();
                if (canonIds.Count == 0) continue;
                productIds = await _readContext.ProductSpecificationValues
                    .Where(psv => productIds.Contains(psv.ProductId) && psv.AttributeId == specAttr.Id && psv.CanonicalValueId != null && canonIds.Contains(psv.CanonicalValueId!.Value))
                    .Select(psv => psv.ProductId).Distinct().ToListAsync();
            }
        }
        if (filterContext?.SpecificationRanges != null && filterContext.SpecificationRanges.Count > 0)
        {
            foreach (var (rangeKey, rangeStr) in filterContext.SpecificationRanges.Where(kv => kv.Key != attributeKey))
            {
                if (string.IsNullOrEmpty(rangeKey)) continue;
                var parts = rangeStr.Split(',', StringSplitOptions.TrimEntries);
                var minR = parts.Length > 0 && decimal.TryParse(parts[0], System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var m) ? m : (decimal?)null;
                var maxR = parts.Length > 1 && decimal.TryParse(parts[1], System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var x) ? x : (decimal?)null;
                if (!minR.HasValue && !maxR.HasValue) continue;
                var rangeAttr = await _readContext.SpecificationAttributes.FirstOrDefaultAsync(a => a.Key == rangeKey);
                if (rangeAttr == null) continue;
                productIds = await _readContext.ProductSpecificationValues
                    .Where(psv => productIds.Contains(psv.ProductId) && psv.AttributeId == rangeAttr.Id && psv.ValueNumber != null &&
                        (!minR.HasValue || psv.ValueNumber >= minR) &&
                        (!maxR.HasValue || psv.ValueNumber <= maxR))
                    .Select(psv => psv.ProductId).Distinct().ToListAsync();
            }
        }

        var nums = await _readContext.ProductSpecificationValues
            .Where(psv => productIds.Contains(psv.ProductId) && psv.AttributeId == attr.Id && psv.ValueNumber != null)
            .Select(psv => psv.ValueNumber!.Value)
            .ToListAsync();

        if (nums.Count == 0) return (null, null);
        return (nums.Min(), nums.Max());
    }

    public async Task<Dictionary<Guid, int>> GetProductCountsByCategoryAsync()
    {
        return await _readContext.Products
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

    public async Task SetSpecificationsAsync(Guid productId, Dictionary<string, object> specifications)
    {
        var existing = await _context.ProductSpecificationValues.Where(v => v.ProductId == productId).ToListAsync();
        _context.ProductSpecificationValues.RemoveRange(existing);
        await _context.SaveChangesAsync();

        var values = await _specNormalizer.ToSpecificationValuesAsync(productId, specifications);
        foreach (var v in values)
        {
            _context.ProductSpecificationValues.Add(v);
        }
        await _context.SaveChangesAsync();
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
        var product = await _context.Products.FindAsync(id);
        if (product != null)
        {
            product.Stock = Math.Max(0, product.Stock + quantity);
            product.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Updated stock for product {ProductId} by {Quantity}. New stock: {Stock}", 
                id, quantity, product.Stock);
        }
    }

    public async Task<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction> BeginTransactionAsync()
    {
        return await _context.Database.BeginTransactionAsync();
    }
}
