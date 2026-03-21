using CatalogService.Data;
using CatalogService.DTOs;
using CatalogService.Models;
using CatalogService.Repositories.Interfaces;
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
            .Where(p => p.IsActive);

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

        // Фильтрация по производителю
        if (filter.ManufacturerId.HasValue)
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

        // Фильтрация по спецификациям (JSONB @> containment)
        if (filter.Specifications != null && filter.Specifications.Count > 0)
        {
            foreach (var (key, value) in filter.Specifications)
            {
                if (string.IsNullOrEmpty(key) || string.IsNullOrEmpty(value))
                    continue;
                object parsedValue = int.TryParse(value, out var intVal) ? intVal : (double.TryParse(value, out var dblVal) ? dblVal : value);
                var contained = new Dictionary<string, object> { [key] = parsedValue };
                query = query.Where(p => EF.Functions.JsonContains(p.Specifications, contained));
            }
        }

        // Подсчёт общего количества
        var totalCount = await query.CountAsync();

        // Сортировка
        var sortDesc = filter.SortOrder?.ToLower() == "desc";
        query = ApplySorting(query, filter.SortBy, sortDesc);

        // Пагинация
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
            .Where(p => p.CategoryId == categoryId && p.IsActive)
            .ToListAsync();
    }

    public async Task<Dictionary<string, List<string>>> GetDistinctSpecificationValuesAsync(Guid categoryId, IEnumerable<string> attributeKeys)
    {
        var keys = attributeKeys.Where(k => !string.IsNullOrEmpty(k)).Distinct().ToList();
        if (keys.Count == 0)
            return new Dictionary<string, List<string>>();

        var result = new Dictionary<string, List<string>>();
        foreach (var key in keys)
        {
            var products = await _context.Products
                .Where(p => p.CategoryId == categoryId && p.IsActive && p.Specifications != null)
                .Select(p => p.Specifications)
                .ToListAsync();

            var values = products
                .Where(s => s != null && s.ContainsKey(key) && s[key] != null)
                .Select(s => s[key]?.ToString() ?? string.Empty)
                .Where(v => !string.IsNullOrEmpty(v))
                .Distinct()
                .OrderBy(v => v)
                .ToList();

            if (values.Count > 0)
                result[key] = values;
        }
        return result;
    }

    public async Task<Dictionary<Guid, int>> GetProductCountsByCategoryAsync()
    {
        return await _context.Products
            .Where(p => p.IsActive)
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
