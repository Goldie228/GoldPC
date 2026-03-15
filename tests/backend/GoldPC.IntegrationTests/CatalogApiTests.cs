using CatalogService.Data;
using CatalogService.DTOs;
using CatalogService.Services.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using Xunit;

namespace GoldPC.IntegrationTests;

/// <summary>
/// Интеграционные тесты для Catalog API с использованием WebApplicationFactory
/// </summary>
public class CatalogApiTests : IClassFixture<CatalogApiFactory>
{
    private readonly HttpClient _client;

    public CatalogApiTests(CatalogApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    /// <summary>
    /// Тест: GET /api/v1/catalog/products возвращает 200 OK и список товаров
    /// </summary>
    [Fact]
    public async Task GetProducts_ReturnsSuccessAndList()
    {
        // Arrange
        var requestUri = "/api/v1/catalog/products";

        // Act
        var response = await _client.GetAsync(requestUri);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK, 
            "потому что API должен возвращать успешный статус для корректного запроса");

        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty("потому что ответ должен содержать данные о товарах");
    }
}

/// <summary>
/// Фабрика для создания тестового WebApplication с mock сервисами
/// </summary>
public class CatalogApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Устанавливаем среду Testing для пропуска миграций
        builder.UseEnvironment("Testing");

        builder.ConfigureTestServices(services =>
        {
            // Удаляем реальный DbContext
            var dbDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<CatalogDbContext>));
            if (dbDescriptor != null)
            {
                services.Remove(dbDescriptor);
            }

            // Регистрируем InMemory DbContext
            services.AddDbContext<CatalogDbContext>(options =>
            {
                options.UseInMemoryDatabase("TestCatalogDb");
            });

            // Удаляем реальный CatalogService
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(ICatalogService));
            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            // Регистрируем mock CatalogService
            services.AddScoped<ICatalogService, MockCatalogService>();
        });

        base.ConfigureWebHost(builder);
    }
}

/// <summary>
/// Mock реализация ICatalogService для тестов
/// </summary>
public class MockCatalogService : ICatalogService
{
    public Task<PagedResult<ProductListDto>> GetProductsAsync(ProductFilterDto filter)
    {
        var products = new List<ProductListDto>
        {
            new ProductListDto
            {
                Id = Guid.NewGuid(),
                Name = "Test Product 1",
                Sku = "TEST-001",
                Price = 999.99m,
                Category = "cpu",
                Stock = 10,
                Manufacturer = new ManufacturerDto { Id = Guid.NewGuid(), Name = "Test Manufacturer" },
                Rating = new RatingDto { Average = 4.5, Count = 10 },
                IsActive = true
            },
            new ProductListDto
            {
                Id = Guid.NewGuid(),
                Name = "Test Product 2",
                Sku = "TEST-002",
                Price = 1499.99m,
                Category = "gpu",
                Stock = 5,
                Manufacturer = new ManufacturerDto { Id = Guid.NewGuid(), Name = "Test Manufacturer" },
                Rating = new RatingDto { Average = 4.8, Count = 15 },
                IsActive = true
            }
        };

        return Task.FromResult(new PagedResult<ProductListDto>
        {
            Data = products,
            Meta = new PaginationMeta
            {
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalItems = products.Count,
                TotalPages = 1,
                HasNextPage = false,
                HasPrevPage = false
            }
        });
    }

    public Task<ProductDetailDto?> GetProductByIdAsync(Guid id)
    {
        return Task.FromResult<ProductDetailDto?>(new ProductDetailDto
        {
            Id = id,
            Name = "Test Product",
            Sku = "TEST-001",
            Price = 999.99m,
            Category = "cpu",
            Manufacturer = new ManufacturerDto { Id = Guid.NewGuid(), Name = "Test Manufacturer" },
            Rating = new RatingDto { Average = 4.5, Count = 10 },
            IsActive = true,
            Stock = 10,
            Specifications = new Dictionary<string, object>()
        });
    }

    public Task<ProductDetailDto?> GetProductBySkuAsync(string sku)
    {
        return Task.FromResult<ProductDetailDto?>(null);
    }

    public Task<IEnumerable<ProductListDto>> GetProductsByIdsAsync(IEnumerable<Guid> ids)
    {
        return Task.FromResult(Enumerable.Empty<ProductListDto>());
    }

    public Task<IEnumerable<ReviewDto>> GetProductReviewsAsync(Guid productId)
    {
        return Task.FromResult(Enumerable.Empty<ReviewDto>());
    }

    public Task<ReviewDto> CreateReviewAsync(Guid productId, Guid userId, CreateReviewDto dto)
    {
        return Task.FromResult(new ReviewDto
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            UserId = userId,
            Rating = dto.Rating,
            Comment = dto.Comment,
            CreatedAt = DateTime.UtcNow
        });
    }

    public Task<IEnumerable<CategoryDto>> GetCategoriesAsync()
    {
        return Task.FromResult(Enumerable.Empty<CategoryDto>());
    }

    public Task<CategoryDto?> GetCategoryBySlugAsync(string slug)
    {
        return Task.FromResult<CategoryDto?>(null);
    }

    public Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto)
    {
        return Task.FromResult(new CategoryDto { Name = dto.Name, Slug = dto.Slug });
    }

    public Task<IEnumerable<ManufacturerDto>> GetManufacturersAsync()
    {
        return Task.FromResult(Enumerable.Empty<ManufacturerDto>());
    }

    public Task<IEnumerable<ManufacturerDto>> GetManufacturersByCategoryAsync(string category)
    {
        return Task.FromResult(Enumerable.Empty<ManufacturerDto>());
    }

    public Task<ManufacturerDto> CreateManufacturerAsync(CreateManufacturerDto dto)
    {
        return Task.FromResult(new ManufacturerDto { Id = Guid.NewGuid(), Name = dto.Name });
    }

    public Task<ProductDetailDto> CreateProductAsync(CreateProductDto dto)
    {
        return Task.FromResult(new ProductDetailDto
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Sku = dto.Sku,
            Price = dto.Price,
            Category = dto.Category,
            ManufacturerId = dto.ManufacturerId,
            IsActive = true,
            Stock = dto.Stock,
            Specifications = dto.Specifications
        });
    }

    public Task<ProductDetailDto?> UpdateProductAsync(Guid id, UpdateProductDto dto)
    {
        return Task.FromResult<ProductDetailDto?>(null);
    }

    public Task<bool> DeleteProductAsync(Guid id)
    {
        return Task.FromResult(true);
    }
}