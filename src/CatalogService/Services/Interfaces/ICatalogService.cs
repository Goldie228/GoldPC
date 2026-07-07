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
    Task<PagedResult<ProductListDto>> GetAdminProductsAsync(ProductFilterDto filter);
    Task<ProductDetailDto?> GetProductByIdAsync(Guid id);
    Task<ProductDetailDto?> GetAdminProductByIdAsync(Guid id);
    Task<ProductDetailDto?> GetProductBySlugAsync(string slug);
    Task<ProductDetailDto?> GetProductBySkuAsync(string sku);
    Task<ProductDetailDto> CreateProductAsync(CreateProductDto dto);
    Task<ProductDetailDto?> UpdateProductAsync(Guid id, UpdateProductDto dto);
    Task<bool> DeleteProductAsync(Guid id);
    Task<IEnumerable<ProductListDto>> GetProductsByIdsAsync(IEnumerable<Guid> ids);
    
    // Категории
    Task<IEnumerable<CategoryDto>> GetCategoriesAsync();
    Task<CategoryDto?> GetCategoryBySlugAsync(string slug);
    Task<IEnumerable<FilterAttributeDto>> GetFilterAttributesByCategoryAsync(string categorySlug, FilterAttributesQueryDto? filterParams = null);
    Task<IEnumerable<FilterFacetAttributeDto>> GetFilterFacetsByCategoryAsync(string categorySlug, FilterAttributesQueryDto? filterParams = null);
    Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto);
    Task<CategoryDto?> UpdateCategoryAsync(Guid id, UpdateCategoryDto dto);
    Task<bool> DeleteCategoryAsync(Guid id);
    
    // Производители
    Task<IEnumerable<ManufacturerDto>> GetManufacturersAsync();
    Task<IEnumerable<ManufacturerDto>> GetManufacturersByCategoryAsync(string categorySlug);
    Task<ManufacturerDto> CreateManufacturerAsync(CreateManufacturerDto dto);
    Task<ManufacturerDto?> UpdateManufacturerAsync(Guid id, UpdateManufacturerDto dto);
    Task<bool> DeleteManufacturerAsync(Guid id);
    
    // Отзывы
    Task<ReviewDto> CreateReviewAsync(Guid productId, Guid userId, CreateReviewDto dto);
    Task<IEnumerable<ReviewDto>> GetProductReviewsAsync(Guid productId);
    Task<ReviewDto> UpdateReviewAsync(Guid reviewId, Guid userId, UpdateReviewDto dto);
    Task<bool> DeleteReviewAsync(Guid reviewId, Guid userId);
    Task<bool> ToggleHelpfulAsync(Guid reviewId);

    // Склад
    Task<(bool Success, string? Error)> ReserveStockAsync(IEnumerable<(Guid ProductId, int Quantity)> items);
    Task<(bool Success, string? Error)> ReleaseStockAsync(IEnumerable<(Guid ProductId, int Quantity)> items);

    // История цен
    Task<List<PriceHistoryDto>> GetPriceHistoryAsync(Guid productId);

    // Мета-данные спецификаций
    Task<CategorySpecificationsDto> GetCategorySpecificationsAsync(Guid categoryId);

    // Уникальные значения характеристик для категории
    Task<Dictionary<string, List<string>>> GetUniqueSpecValuesAsync(Guid categoryId);
}