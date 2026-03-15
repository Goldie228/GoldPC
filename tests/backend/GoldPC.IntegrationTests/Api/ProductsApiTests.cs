using FluentAssertions;
using GoldPC.IntegrationTests.Fixtures;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace GoldPC.IntegrationTests.Api;

/// <summary>
/// Интеграционные тесты для Products API
/// </summary>
public class ProductsApiTests : IClassFixture<ApiFixture>
{
    private readonly HttpClient _client;

    public ProductsApiTests(ApiFixture fixture)
    {
        _client = fixture.Client;
    }

    #region GET /api/v1/catalog/products

    [Fact]
    public async Task GetProducts_ReturnsOkWithProducts()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/catalog/products?page=1&limit=20");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadFromJsonAsync<ProductsResponse>();
        content.Should().NotBeNull();
        content!.Data.Should().NotBeNull();
        content.Pagination.Should().NotBeNull();
    }

    [Fact]
    public async Task GetProducts_WithCategory_ReturnsFilteredProducts()
    {
        // Arrange
        var category = "cpu";

        // Act
        var response = await _client.GetAsync($"/api/v1/catalog/products?category={category}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadFromJsonAsync<ProductsResponse>();
        content!.Data.Should().NotBeNull();
        content.Data.All(p => p.Category == category).Should().BeTrue();
    }

    [Fact]
    public async Task GetProducts_WithInvalidPagination_ReturnsBadRequest()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/catalog/products?page=-1&limit=0");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region GET /api/v1/catalog/products/{id}

    [Fact]
    public async Task GetProductById_WhenProductExists_ReturnsOk()
    {
        // Arrange - сначала создаем товар или используем существующий
        var productId = Guid.Parse("00000000-0000-0000-0000-000000000001");

        // Act
        var response = await _client.GetAsync($"/api/v1/catalog/products/{productId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadFromJsonAsync<ProductResponse>();
        content.Should().NotBeNull();
        content!.Id.Should().Be(productId);
    }

    [Fact]
    public async Task GetProductById_WhenProductNotFound_ReturnsNotFound()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/v1/catalog/products/{nonExistentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region POST /api/v1/catalog/products (Admin)

    [Fact]
    public async Task CreateProduct_WithValidData_ReturnsCreated()
    {
        // Arrange
        var request = new CreateProductRequest
        {
            Name = "Test Product",
            Price = 9999.99m,
            Category = "cpu",
            Stock = 10,
            Manufacturer = "Test Manufacturer",
            Specifications = new Dictionary<string, object>
            {
                ["socket"] = "AM5",
                ["cores"] = 8
            }
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/catalog/products", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var content = await response.Content.ReadFromJsonAsync<ProductResponse>();
        content.Should().NotBeNull();
        content!.Name.Should().Be(request.Name);
        content.Price.Should().Be(request.Price);
        content.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task CreateProduct_WithInvalidPrice_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreateProductRequest
        {
            Name = "Test Product",
            Price = -100, // Неверная цена
            Category = "cpu",
            Stock = 10
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/catalog/products", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateProduct_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange - клиент без авторизации
        var request = new CreateProductRequest
        {
            Name = "Test Product",
            Price = 999.99m,
            Category = "cpu",
            Stock = 10
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/catalog/products", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region PUT /api/v1/catalog/products/{id}/stock

    [Fact]
    public async Task UpdateStock_WhenProductExists_ReturnsOk()
    {
        // Arrange
        var productId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var request = new UpdateStockRequest { Stock = 50 };

        // Act
        var response = await _client.PutAsJsonAsync(
            $"/api/v1/catalog/products/{productId}/stock", 
            request
        );

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadFromJsonAsync<ProductResponse>();
        content!.Stock.Should().Be(50);
    }

    [Fact]
    public async Task UpdateStock_WithNegativeValue_ReturnsBadRequest()
    {
        // Arrange
        var productId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var request = new UpdateStockRequest { Stock = -10 };

        // Act
        var response = await _client.PutAsJsonAsync(
            $"/api/v1/catalog/products/{productId}/stock", 
            request
        );

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion
}

#region DTOs

public class ProductsResponse
{
    public List<ProductResponse> Data { get; set; } = new();
    public PaginationResponse Pagination { get; set; } = new();
}

public class ProductResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public Dictionary<string, object> Specifications { get; set; } = new();
    public double Rating { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PaginationResponse
{
    public int Page { get; set; }
    public int Limit { get; set; }
    public int Total { get; set; }
    public int TotalPages { get; set; }
}

public class CreateProductRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Category { get; set; } = string.Empty;
    public int Stock { get; set; }
    public string Manufacturer { get; set; } = string.Empty;
    public Dictionary<string, object> Specifications { get; set; } = new();
}

public class UpdateStockRequest
{
    public int Stock { get; set; }
}

#endregion