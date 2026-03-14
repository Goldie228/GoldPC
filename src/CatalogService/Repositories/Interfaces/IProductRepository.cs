using CatalogService.DTOs;
using CatalogService.Models;

namespace CatalogService.Repositories.Interfaces;

/// <summary>
/// Интерфейс репозитория товаров
/// </summary>
public interface IProductRepository
{
    Task<Product?> GetByIdAsync(Guid id);
    Task<Product?> GetBySkuAsync(string sku);
    Task<Product?> GetDetailByIdAsync(Guid id);
    Task<PagedResult<Product>> GetFilteredAsync(ProductFilterDto filter);
    Task<IEnumerable<Product>> GetByIdsAsync(IEnumerable<Guid> ids);
    Task<IEnumerable<Product>> GetByCategoryAsync(Guid categoryId);
    Task<Product> CreateAsync(Product product);
    Task<Product> UpdateAsync(Product product);
    Task DeleteAsync(Guid id);
    Task<bool> ExistsAsync(Guid id);
    Task<bool> SkuExistsAsync(string sku, Guid? excludeId = null);
    Task UpdateStockAsync(Guid id, int quantity);
}

/// <summary>
/// Интерфейс репозитория категорий
/// </summary>
public interface ICategoryRepository
{
    Task<Category?> GetByIdAsync(Guid id);
    Task<Category?> GetBySlugAsync(string slug);
    Task<IEnumerable<Category>> GetAllAsync();
    Task<IEnumerable<Category>> GetRootCategoriesAsync();
    Task<Category> CreateAsync(Category category);
    Task<Category> UpdateAsync(Category category);
    Task DeleteAsync(Guid id);
    Task<bool> HasProductsAsync(Guid id);
}

/// <summary>
/// Интерфейс репозитория производителей
/// </summary>
public interface IManufacturerRepository
{
    Task<Manufacturer?> GetByIdAsync(Guid id);
    Task<Manufacturer?> GetByNameAsync(string name);
    Task<IEnumerable<Manufacturer>> GetAllAsync();
    Task<Manufacturer> CreateAsync(Manufacturer manufacturer);
    Task<Manufacturer> UpdateAsync(Manufacturer manufacturer);
    Task DeleteAsync(Guid id);
    Task<bool> HasProductsAsync(Guid id);
}

/// <summary>
/// Интерфейс репозитория отзывов
/// </summary>
public interface IReviewRepository
{
    Task<Review?> GetByIdAsync(Guid id);
    Task<IEnumerable<Review>> GetByProductIdAsync(Guid productId);
    Task<IEnumerable<Review>> GetByUserIdAsync(Guid userId);
    Task<Review> CreateAsync(Review review);
    Task DeleteAsync(Guid id);
    Task<double> GetAverageRatingAsync(Guid productId);
    Task<int> GetReviewCountAsync(Guid productId);
}