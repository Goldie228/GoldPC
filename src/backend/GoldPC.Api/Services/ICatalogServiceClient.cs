#pragma warning disable CS1591
using GoldPC.SharedKernel.DTOs;

namespace GoldPC.Api.Services;

/// <summary>
/// HTTP-клиент для взаимодействия с CatalogService
/// </summary>
public interface ICatalogServiceClient
{
    // Товары
    Task<PagedResult<ProductListDto>> GetProductsAsync(int page, int pageSize, string? category, bool? isActive, string? search = null);
    Task<ProductDetailDto?> GetProductByIdAsync(Guid id);
    Task<ProductDetailDto> CreateProductAsync(CreateProductDto dto);
    Task<ProductDetailDto?> UpdateProductAsync(Guid id, UpdateProductDto dto);
    Task<bool> DeleteProductAsync(Guid id);

    // Категории
    Task<List<CategoryDto>> GetCategoriesAsync();
    Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto);
    Task<CategoryDto?> UpdateCategoryAsync(Guid id, UpdateCategoryDto dto);
    Task<bool> DeleteCategoryAsync(Guid id);

    // Производители
    Task<List<ManufacturerDto>> GetManufacturersAsync();
    Task<ManufacturerDto> CreateManufacturerAsync(CreateManufacturerDto dto);
    Task<ManufacturerDto?> UpdateManufacturerAsync(Guid id, UpdateManufacturerDto dto);
    Task<bool> DeleteManufacturerAsync(Guid id);

    // Статистика
    Task<int> GetTotalProductsAsync();
    Task<int> GetTotalCategoriesAsync();
    Task<int> GetTotalManufacturersAsync();

    // История цен
    Task<List<PriceHistoryDto>> GetPriceHistoryAsync(Guid productId);

    // Генерация названия
    Task<string> GenerateProductNameAsync(string? manufacturerName, string? categorySlug, Dictionary<string, object>? specifications);

    // Мета-данные спецификаций
    Task<CategorySpecificationsDto?> GetCategorySpecificationsAsync(Guid categoryId);
}
#pragma warning restore CS1591
