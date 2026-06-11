#pragma warning disable CA1031, CS1591, SA1600
using System.Net.Http.Json;
using GoldPC.SharedKernel.DTOs;
using Microsoft.Extensions.Logging;

namespace GoldPC.Api.Services;

/// <summary>
/// HTTP-клиент для микросервиса CatalogService (port 5000)
/// </summary>
public class CatalogServiceClient : ICatalogServiceClient
{
    private readonly HttpClient _http;
    private readonly ILogger<CatalogServiceClient> _logger;

    public CatalogServiceClient(HttpClient http, ILogger<CatalogServiceClient> logger)
    {
        _http = http;
        _logger = logger;
    }

    // ====================================================================
    // Товары
    // ====================================================================
    public async Task<PagedResult<ProductListDto>> GetProductsAsync(int page, int pageSize, string? category, bool? isActive, string? search = null)
    {
        try
        {
            var query = $"api/v1/catalog/products?page={page}&pageSize={pageSize}";
            if (!string.IsNullOrEmpty(category))
                query += $"&category={Uri.EscapeDataString(category)}";
            if (isActive.HasValue)
                query += $"&isActive={isActive.Value}";
            if (!string.IsNullOrEmpty(search))
                query += $"&search={Uri.EscapeDataString(search)}";

            _logger.LogDebug("GetProductsAsync: {Query}", query);

            var response = await _http.GetAsync(new Uri(query, UriKind.Relative));
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<PagedResult<ProductListDto>>() ?? new();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling CatalogService GetProducts");
            return new();
        }
    }

    public async Task<ProductDetailDto?> GetProductByIdAsync(Guid id)
    {
        try
        {
            _logger.LogDebug("GetProductByIdAsync: {ProductId}", id);

            var response = await _http.GetAsync(new Uri($"api/v1/catalog/products/{id}", UriKind.Relative));
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                return null;

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<ProductDetailDto>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling CatalogService GetProductById {ProductId}", id);
            return null;
        }
    }

    public async Task<ProductDetailDto> CreateProductAsync(CreateProductDto dto)
    {
        try
        {
            _logger.LogInformation("CreateProductAsync: {Name}", dto.Name);

            var response = await _http.PostAsJsonAsync(new Uri("api/v1/admin/products", UriKind.Relative), dto);
            response.EnsureSuccessStatusCode();
            return (await response.Content.ReadFromJsonAsync<ProductDetailDto>())
                ?? throw new InvalidOperationException("Пустой ответ при создании товара");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling CatalogService CreateProduct");
            throw;
        }
    }

    public async Task<ProductDetailDto?> UpdateProductAsync(Guid id, UpdateProductDto dto)
    {
        try
        {
            _logger.LogInformation("UpdateProductAsync: {ProductId}", id);

            var response = await _http.PutAsJsonAsync(new Uri($"api/v1/admin/products/{id}", UriKind.Relative), dto);
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                return null;

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<ProductDetailDto>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling CatalogService UpdateProduct {ProductId}", id);
            return null;
        }
    }

    public async Task<bool> DeleteProductAsync(Guid id)
    {
        try
        {
            _logger.LogInformation("DeleteProductAsync: {ProductId}", id);

            var response = await _http.DeleteAsync(new Uri($"api/v1/admin/products/{id}", UriKind.Relative));
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling CatalogService DeleteProduct {ProductId}", id);
            return false;
        }
    }

    // ====================================================================
    // Категории
    // ====================================================================
    public async Task<List<CategoryDto>> GetCategoriesAsync()
    {
        try
        {
            _logger.LogDebug("GetCategoriesAsync");

            var response = await _http.GetAsync(new Uri("api/v1/catalog/categories", UriKind.Relative));
            response.EnsureSuccessStatusCode();

            var wrapper = await response.Content.ReadFromJsonAsync<CategoriesWrapper>();
            return wrapper?.Data?.ToList() ?? new List<CategoryDto>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling CatalogService GetCategories");
            return new List<CategoryDto>();
        }
    }

    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto)
    {
        try
        {
            _logger.LogInformation("CreateCategoryAsync: {Name}", dto.Name);

            var response = await _http.PostAsJsonAsync(new Uri("api/v1/admin/categories", UriKind.Relative), dto);
            response.EnsureSuccessStatusCode();
            return (await response.Content.ReadFromJsonAsync<CategoryDto>())
                ?? throw new InvalidOperationException("Пустой ответ при создании категории");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling CatalogService CreateCategory");
            throw;
        }
    }

    public async Task<CategoryDto?> UpdateCategoryAsync(Guid id, UpdateCategoryDto dto)
    {
        try
        {
            _logger.LogInformation("UpdateCategoryAsync: {CategoryId}", id);

            var response = await _http.PutAsJsonAsync(new Uri($"api/v1/admin/categories/{id}", UriKind.Relative), dto);
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                return null;

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<CategoryDto>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling CatalogService UpdateCategory {CategoryId}", id);
            return null;
        }
    }

    public async Task<bool> DeleteCategoryAsync(Guid id)
    {
        try
        {
            _logger.LogInformation("DeleteCategoryAsync: {CategoryId}", id);

            var response = await _http.DeleteAsync(new Uri($"api/v1/admin/categories/{id}", UriKind.Relative));
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling CatalogService DeleteCategory {CategoryId}", id);
            return false;
        }
    }

    // ====================================================================
    // Производители
    // ====================================================================
    public async Task<List<ManufacturerDto>> GetManufacturersAsync()
    {
        try
        {
            _logger.LogDebug("GetManufacturersAsync");

            var response = await _http.GetAsync(new Uri("api/v1/catalog/manufacturers", UriKind.Relative));
            response.EnsureSuccessStatusCode();

            var wrapper = await response.Content.ReadFromJsonAsync<ManufacturersWrapper>();
            return wrapper?.Data?.ToList() ?? new List<ManufacturerDto>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling CatalogService GetManufacturers");
            return new List<ManufacturerDto>();
        }
    }

    public async Task<ManufacturerDto> CreateManufacturerAsync(CreateManufacturerDto dto)
    {
        try
        {
            _logger.LogInformation("CreateManufacturerAsync: {Name}", dto.Name);

            var response = await _http.PostAsJsonAsync(new Uri("api/v1/admin/manufacturers", UriKind.Relative), dto);
            response.EnsureSuccessStatusCode();
            return (await response.Content.ReadFromJsonAsync<ManufacturerDto>())
                ?? throw new InvalidOperationException("Пустой ответ при создании производителя");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling CatalogService CreateManufacturer");
            throw;
        }
    }

    public async Task<ManufacturerDto?> UpdateManufacturerAsync(Guid id, UpdateManufacturerDto dto)
    {
        try
        {
            _logger.LogInformation("UpdateManufacturerAsync: {ManufacturerId}", id);

            var response = await _http.PutAsJsonAsync(new Uri($"api/v1/admin/manufacturers/{id}", UriKind.Relative), dto);
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                return null;

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<ManufacturerDto>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling CatalogService UpdateManufacturer {ManufacturerId}", id);
            return null;
        }
    }

    public async Task<bool> DeleteManufacturerAsync(Guid id)
    {
        try
        {
            _logger.LogInformation("DeleteManufacturerAsync: {ManufacturerId}", id);

            var response = await _http.DeleteAsync(new Uri($"api/v1/admin/manufacturers/{id}", UriKind.Relative));
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling CatalogService DeleteManufacturer {ManufacturerId}", id);
            return false;
        }
    }

    // ====================================================================
    // Статистика
    // ====================================================================
    public async Task<int> GetTotalProductsAsync()
    {
        try
        {
            var response = await _http.GetAsync(new Uri("api/v1/catalog/products?page=1&pageSize=1", UriKind.Relative));
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<PagedResult<ProductListDto>>();
            return result?.Meta.TotalItems ?? 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling CatalogService GetTotalProducts");
            return 0;
        }
    }

    // ====================================================================
    // История цен
    // ====================================================================
    public async Task<List<PriceHistoryDto>> GetPriceHistoryAsync(Guid productId)
    {
        try
        {
            _logger.LogDebug("GetPriceHistoryAsync: {ProductId}", productId);

            var response = await _http.GetAsync(new Uri($"api/v1/admin/products/{productId}/price-history", UriKind.Relative));
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                return new List<PriceHistoryDto>();

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<List<PriceHistoryDto>>() ?? new List<PriceHistoryDto>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling CatalogService GetPriceHistory {ProductId}", productId);
            return new List<PriceHistoryDto>();
        }
    }

    // ====================================================================
    // Генерация названия товара
    // ====================================================================
    public async Task<string> GenerateProductNameAsync(string? manufacturerName, string? categorySlug, Dictionary<string, object>? specifications)
    {
        try
        {
            _logger.LogDebug("GenerateProductNameAsync: manufacturer={Manufacturer}, category={Category}", manufacturerName, categorySlug);

            var request = new
            {
                ManufacturerName = manufacturerName,
                CategorySlug = categorySlug,
                Specifications = specifications
            };

            var response = await _http.PostAsJsonAsync(new Uri("api/v1/admin/products/generate-name", UriKind.Relative), request);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<GenerateNameResponseWrapper>();
            return result?.Name ?? "Без названия";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling CatalogService GenerateProductName");
            return "Без названия";
        }
    }

    // ====================================================================
    // Мета-данные спецификаций для админки
    // ====================================================================
    public async Task<CategorySpecificationsDto?> GetCategorySpecificationsAsync(Guid categoryId)
    {
        try
        {
            _logger.LogDebug("GetCategorySpecificationsAsync: {CategoryId}", categoryId);

            var response = await _http.GetAsync(new Uri($"api/v1/admin/specifications/by-category/{categoryId}", UriKind.Relative));
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                return null;

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<CategorySpecificationsDto>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling CatalogService GetCategorySpecifications {CategoryId}", categoryId);
            return null;
        }
    }

    // ====================================================================
    // Внутренние DTO-обёртки (ответ CatalogService обёрнут в { "data": [...] })
    // ====================================================================
    private sealed record CategoriesWrapper
    {
        public List<CategoryDto> Data { get; init; } = new();
    }

    private sealed record ManufacturersWrapper
    {
        public List<ManufacturerDto> Data { get; init; } = new();
    }

    private sealed record GenerateNameResponseWrapper
    {
        public string Name { get; init; } = string.Empty;
    }
}
#pragma warning restore CA1031, CS1591, SA1600
