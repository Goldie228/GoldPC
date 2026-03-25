using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CatalogService.Models;
using CatalogService.Repositories.Interfaces;

namespace GoldPC.ContractTests.Providers;

/// <summary>
/// Mock репозитория товаров для контрактных тестов
/// Позволяет динамически изменять состояние данных в процессе верификации контракта
/// </summary>
public class MockProductRepository : IProductRepository
{
    private static List<Product> _products = new();

    public static void SetProducts(List<Product> products)
    {
        _products = products;
    }

    public Task<IEnumerable<Product>> GetProductsAsync(int page, int limit)
    {
        return Task.FromResult(_products.Skip((page - 1) * limit).Take(limit));
    }

    public Task<Product?> GetProductByIdAsync(Guid id)
    {
        return Task.FromResult(_products.FirstOrDefault(p => p.Id == id));
    }

    public Task<IEnumerable<ProductCategory>> GetCategoriesAsync()
    {
        var categories = _products.Select(p => p.Category).Distinct().ToList();
        return Task.FromResult(categories.AsEnumerable());
    }

    public Task<IEnumerable<Product>> GetProductsByCategoryAsync(ProductCategory category)
    {
        return Task.FromResult(_products.Where(p => p.Category == category));
    }

    public Task<IEnumerable<Product>> SearchProductsAsync(string query)
    {
        return Task.FromResult(_products.Where(p => p.Name.Contains(query, StringComparison.OrdinalIgnoreCase)));
    }

    public Task<int> GetTotalCountAsync()
    {
        return Task.FromResult(_products.Count);
    }

    #region Provider States

    public static void SetupProductsExist()
    {
        SetProducts(new List<Product>
        {
            new() { Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), Name = "AMD Ryzen 9 7950X", Price = 59999, Stock = 10, Sku = "SKU-1" },
            new() { Id = Guid.Parse("00000000-0000-0000-0000-000000000002"), Name = "Intel Core i9-14900K", Price = 54999, Stock = 5, Sku = "SKU-2" }
        });
    }

    public static void SetupProductExists()
    {
        SetProducts(new List<Product>
        {
            new() 
            { 
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), 
                Name = "AMD Ryzen 9 7950X", 
                Price = 59999, 
                Stock = 10,
                Sku = "SKU-1",
                IsActive = true
            }
        });
    }

    public static void SetupProductNotFound()
    {
        SetProducts(new List<Product>());
    }

    public static void SetupEmptyCatalog()
    {
        SetProducts(new List<Product>());
    }

    public static void SetupProductsInCategory()
    {
        SetProducts(new List<Product>
        {
            new() { Id = Guid.NewGuid(), Name = "Product 1", Price = 1000, Sku = "SKU-P1" },
            new() { Id = Guid.NewGuid(), Name = "Product 2", Price = 2000, Sku = "SKU-P2" }
        });
    }

    #endregion
}

