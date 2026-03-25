using GoldPC.SharedKernel.DTOs;
using CatalogService.Models;

namespace CatalogService.Services.Interfaces;

/// <summary>
/// Интерфейс сервиса каталога
/// </summary>
public interface ICatalogService
{
    // Товары
    Task<PagedResult<ProductListDto>> GetProductsAsync(ProductFilterDto filter);
    Task<ProductDetailDto?> GetProductByIdAsync(Guid id);
    Task<ProductDetailDto?> GetProductBySkuAsync(string sku);
    Task<ProductDetailDto> CreateProductAsync(CreateProductDto dto);
    Task<ProductDetailDto?> UpdateProductAsync(Guid id, UpdateProductDto dto);
    Task<bool> DeleteProductAsync(Guid id);
    Task<IEnumerable<ProductListDto>> GetProductsByIdsAsync(IEnumerable<Guid> ids);
    
    // Категории
    Task<IEnumerable<CategoryDto>> GetCategoriesAsync();
    Task<CategoryDto?> GetCategoryBySlugAsync(string slug);
    Task<IEnumerable<FilterAttributeDto>> GetFilterAttributesByCategoryAsync(string categorySlug, FilterAttributesQueryDto? filterParams = null);
    Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto);
    
    // Производители
    Task<IEnumerable<ManufacturerDto>> GetManufacturersAsync();
    Task<IEnumerable<ManufacturerDto>> GetManufacturersByCategoryAsync(string categorySlug);
    Task<ManufacturerDto> CreateManufacturerAsync(CreateManufacturerDto dto);
    
    // Отзывы
    Task<ReviewDto> CreateReviewAsync(Guid productId, Guid userId, CreateReviewDto dto);
    Task<IEnumerable<ReviewDto>> GetProductReviewsAsync(Guid productId);

    // Склад
    Task<(bool Success, string? Error)> ReserveStockAsync(IEnumerable<(Guid ProductId, int Quantity)> items);
    Task<(bool Success, string? Error)> ReleaseStockAsync(IEnumerable<(Guid ProductId, int Quantity)> items);
}

/// <summary>
/// DTO для создания категории
/// </summary>
public record CreateCategoryDto
{
    public string Name { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Guid? ParentId { get; init; }
    public ComponentType? ComponentType { get; init; }
}

/// <summary>
/// DTO для создания производителя
/// </summary>
public record CreateManufacturerDto
{
    public string Name { get; init; } = string.Empty;
    public string? Country { get; init; }
    public string? LogoUrl { get; init; }
    public string? Description { get; init; }
}