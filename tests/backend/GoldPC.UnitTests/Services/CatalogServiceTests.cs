using FluentAssertions;
using Moq;
using Xunit;
using AutoFixture;
using GoldPC.UnitTests.Fakers;
using Microsoft.Extensions.Logging;

namespace GoldPC.UnitTests.Services;

/// <summary>
/// Модульные тесты для сервиса каталога
/// </summary>
public class CatalogServiceTests
{
    private readonly Fixture _fixture = new();
    private readonly Mock<IProductRepository> _repositoryMock;
    private readonly Mock<ICacheService> _cacheMock;
    private readonly Mock<ILogger<CatalogService>> _loggerMock;
    private readonly CatalogService _sut; // System Under Test

    public CatalogServiceTests()
    {
        _repositoryMock = new Mock<IProductRepository>();
        _cacheMock = new Mock<ICacheService>();
        _loggerMock = new Mock<ILogger<CatalogService>>();
        
        _sut = new CatalogService(
            _repositoryMock.Object,
            _cacheMock.Object,
            _loggerMock.Object
        );
    }

    #region GetProductById Tests

    [Fact]
    public async Task GetProductById_WhenProductExists_ReturnsProduct()
    {
        // Arrange
        var productId = _fixture.Create<Guid>();
        var expectedProduct = new ProductFaker()
            .WithCategory(ProductCategory.Cpu)
            .Generate();
        expectedProduct.Id = productId;

        _repositoryMock
            .Setup(r => r.GetByIdAsync(productId))
            .ReturnsAsync(expectedProduct);

        _cacheMock
            .Setup(c => c.GetAsync<Product>($"product:{productId}"))
            .ReturnsAsync((Product?)null);

        // Act
        var result = await _sut.GetProductByIdAsync(productId);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEquivalentTo(expectedProduct);
        result!.Id.Should().Be(productId);
        
        _repositoryMock.Verify(r => r.GetByIdAsync(productId), Times.Once);
        _cacheMock.Verify(c => c.SetAsync($"product:{productId}", expectedProduct, It.IsAny<TimeSpan>()), Times.Once);
    }

    [Fact]
    public async Task GetProductById_WhenProductCached_ReturnsFromCache()
    {
        // Arrange
        var productId = _fixture.Create<Guid>();
        var cachedProduct = new ProductFaker().Generate();
        cachedProduct.Id = productId;

        _cacheMock
            .Setup(c => c.GetAsync<Product>($"product:{productId}"))
            .ReturnsAsync(cachedProduct);

        // Act
        var result = await _sut.GetProductByIdAsync(productId);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEquivalentTo(cachedProduct);
        
        // Repository не должен вызываться, если товар в кэше
        _repositoryMock.Verify(r => r.GetByIdAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task GetProductById_WhenProductNotFound_ReturnsNull()
    {
        // Arrange
        var productId = _fixture.Create<Guid>();
        
        _cacheMock
            .Setup(c => c.GetAsync<Product>($"product:{productId}"))
            .ReturnsAsync((Product?)null);
            
        _repositoryMock
            .Setup(r => r.GetByIdAsync(productId))
            .ReturnsAsync((Product?)null);

        // Act
        var result = await _sut.GetProductByIdAsync(productId);

        // Assert
        result.Should().BeNull();
        _repositoryMock.Verify(r => r.GetByIdAsync(productId), Times.Once);
    }

    [Fact]
    public async Task GetProductById_WhenProductInactive_ReturnsNull()
    {
        // Arrange
        var productId = _fixture.Create<Guid>();
        var inactiveProduct = new ProductFaker()
            .AsInactive()
            .Generate();
        inactiveProduct.Id = productId;

        _cacheMock
            .Setup(c => c.GetAsync<Product>($"product:{productId}"))
            .ReturnsAsync((Product?)null);
            
        _repositoryMock
            .Setup(r => r.GetByIdAsync(productId))
            .ReturnsAsync(inactiveProduct);

        // Act
        var result = await _sut.GetProductByIdAsync(productId);

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region GetProducts Tests

    [Theory]
    [InlineData("cpu", 10)]
    [InlineData("gpu", 5)]
    [InlineData("ram", 20)]
    public async Task GetProductsByCategory_ReturnsFilteredProducts(
        string categoryName, int expectedCount)
    {
        // Arrange
        var category = Enum.Parse<ProductCategory>(categoryName, ignoreCase: true);
        var categoryProducts = new ProductFaker()
            .WithCategory(category)
            .Generate(expectedCount);

        _repositoryMock
            .Setup(r => r.GetByCategoryAsync(category))
            .ReturnsAsync(categoryProducts);

        // Act
        var result = await _sut.GetProductsByCategoryAsync(category);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(expectedCount);
        result.All(p => p.Category == category).Should().BeTrue();
    }

    [Fact]
    public async Task GetProducts_WithPagination_ReturnsCorrectPage()
    {
        // Arrange
        var page = 2;
        var limit = 10;
        var allProducts = new ProductFaker().Generate(50);

        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(allProducts);

        // Act
        var result = await _sut.GetProductsAsync(page, limit);

        // Assert
        result.Items.Should().HaveCount(limit);
        result.TotalCount.Should().Be(50);
        result.CurrentPage.Should().Be(page);
        result.TotalPages.Should().Be(5);
    }

    [Fact]
    public async Task GetProducts_WhenEmpty_ReturnsEmptyList()
    {
        // Arrange
        _repositoryMock
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Product>());

        // Act
        var result = await _sut.GetProductsAsync(1, 10);

        // Assert
        result.Items.Should().BeEmpty();
        result.TotalCount.Should().Be(0);
    }

    #endregion

    #region SearchProducts Tests

    [Fact]
    public async Task SearchProducts_WithValidQuery_ReturnsMatchingProducts()
    {
        // Arrange
        var searchQuery = "Ryzen";
        var products = new List<Product>
        {
            new() { Id = Guid.NewGuid(), Name = "AMD Ryzen 9 7950X", IsActive = true },
            new() { Id = Guid.NewGuid(), Name = "AMD Ryzen 7 7800X3D", IsActive = true },
            new() { Id = Guid.NewGuid(), Name = "Intel Core i9-14900K", IsActive = true },
        };

        _repositoryMock
            .Setup(r => r.SearchAsync(searchQuery))
            .ReturnsAsync(products.Where(p => p.Name.Contains(searchQuery, StringComparison.OrdinalIgnoreCase)).ToList());

        // Act
        var result = await _sut.SearchProductsAsync(searchQuery);

        // Assert
        result.Should().HaveCount(2);
        result.All(p => p.Name.Contains("Ryzen")).Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task SearchProducts_WithInvalidQuery_ReturnsEmptyList(string? query)
    {
        // Act
        var result = await _sut.SearchProductsAsync(query!);

        // Assert
        result.Should().BeEmpty();
        _repositoryMock.Verify(r => r.SearchAsync(It.IsAny<string>()), Times.Never);
    }

    #endregion

    #region CreateProduct Tests

    [Fact]
    public async Task CreateProduct_WithValidData_ReturnsCreatedProduct()
    {
        // Arrange
        var productData = new CreateProductDto
        {
            Name = "AMD Ryzen 9 7950X",
            Price = 59999,
            Category = ProductCategory.Cpu,
            Stock = 10,
            Manufacturer = "AMD",
            Specifications = new Dictionary<string, object>
            {
                ["socket"] = "AM5",
                ["cores"] = 16
            }
        };

        _repositoryMock
            .Setup(r => r.CreateAsync(It.IsAny<Product>()))
            .ReturnsAsync((Product p) => p);

        // Act
        var result = await _sut.CreateProductAsync(productData);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(productData.Name);
        result.Price.Should().Be(productData.Price);
        result.IsActive.Should().BeTrue();
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        
        _repositoryMock.Verify(r => r.CreateAsync(It.IsAny<Product>()), Times.Once);
    }

    [Fact]
    public async Task CreateProduct_WithInvalidPrice_ThrowsValidationException()
    {
        // Arrange
        var productData = new CreateProductDto
        {
            Name = "Invalid Product",
            Price = -100, // Отрицательная цена
            Category = ProductCategory.Cpu,
            Stock = 10
        };

        // Act
        var act = async () => await _sut.CreateProductAsync(productData);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*цена*должна быть больше нуля*");
    }

    [Fact]
    public async Task CreateProduct_WithEmptyName_ThrowsValidationException()
    {
        // Arrange
        var productData = new CreateProductDto
        {
            Name = "",
            Price = 1000,
            Category = ProductCategory.Cpu,
            Stock = 10
        };

        // Act
        var act = async () => await _sut.CreateProductAsync(productData);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*название*обязательно*");
    }

    #endregion

    #region UpdateStock Tests

    [Fact]
    public async Task UpdateStock_WhenProductExists_UpdatesStock()
    {
        // Arrange
        var productId = Guid.NewGuid();
        var newStock = 50;
        var product = new ProductFaker().Generate();
        product.Id = productId;

        _repositoryMock
            .Setup(r => r.GetByIdAsync(productId))
            .ReturnsAsync(product);

        _repositoryMock
            .Setup(r => r.UpdateAsync(It.IsAny<Product>()))
            .ReturnsAsync((Product p) => p);

        // Act
        var result = await _sut.UpdateStockAsync(productId, newStock);

        // Assert
        result.Should().NotBeNull();
        result!.Stock.Should().Be(newStock);
        
        _repositoryMock.Verify(r => r.UpdateAsync(It.IsAny<Product>()), Times.Once);
        _cacheMock.Verify(c => c.RemoveAsync($"product:{productId}"), Times.Once);
    }

    [Fact]
    public async Task UpdateStock_WhenProductNotFound_ReturnsNull()
    {
        // Arrange
        var productId = Guid.NewGuid();

        _repositoryMock
            .Setup(r => r.GetByIdAsync(productId))
            .ReturnsAsync((Product?)null);

        // Act
        var result = await _sut.UpdateStockAsync(productId, 50);

        // Assert
        result.Should().BeNull();
        _repositoryMock.Verify(r => r.UpdateAsync(It.IsAny<Product>()), Times.Never);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(-100)]
    public async Task UpdateStock_WithNegativeValue_ThrowsValidationException(int negativeStock)
    {
        // Arrange
        var productId = Guid.NewGuid();

        // Act
        var act = async () => await _sut.UpdateStockAsync(productId, negativeStock);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*количество*не может быть отрицательным*");
    }

    #endregion
}

#region Interfaces and DTOs (Stubs)

public interface IProductRepository
{
    Task<Product?> GetByIdAsync(Guid id);
    Task<List<Product>> GetAllAsync();
    Task<List<Product>> GetByCategoryAsync(ProductCategory category);
    Task<List<Product>> SearchAsync(string query);
    Task<Product> CreateAsync(Product product);
    Task<Product> UpdateAsync(Product product);
    Task DeleteAsync(Guid id);
}

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null);
    Task RemoveAsync(string key);
}

// ILogger определён в CompatibilityServiceTests.cs

public class CatalogService
{
    private readonly IProductRepository _repository;
    private readonly ICacheService _cache;
    private readonly ILogger<CatalogService> _logger;

    public CatalogService(IProductRepository repository, ICacheService cache, ILogger<CatalogService> logger)
    {
        _repository = repository;
        _cache = cache;
        _logger = logger;
    }

    public async Task<Product?> GetProductByIdAsync(Guid id)
    {
        var cached = await _cache.GetAsync<Product>($"product:{id}");
        if (cached != null) return cached;

        var product = await _repository.GetByIdAsync(id);
        if (product == null || !product.IsActive) return null;

        await _cache.SetAsync($"product:{id}", product, TimeSpan.FromMinutes(10));
        return product;
    }

    public async Task<List<Product>> GetProductsByCategoryAsync(ProductCategory category)
    {
        return await _repository.GetByCategoryAsync(category);
    }

    public async Task<PagedResult<Product>> GetProductsAsync(int page, int limit)
    {
        var all = await _repository.GetAllAsync();
        var items = all.Skip((page - 1) * limit).Take(limit).ToList();
        return new PagedResult<Product>
        {
            Items = items,
            TotalCount = all.Count,
            CurrentPage = page,
            TotalPages = (int)Math.Ceiling(all.Count / (double)limit)
        };
    }

    public async Task<List<Product>> SearchProductsAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query)) return new List<Product>();
        return await _repository.SearchAsync(query);
    }

    public async Task<Product> CreateProductAsync(CreateProductDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ValidationException("Название товара обязательно");
        if (dto.Price <= 0)
            throw new ValidationException("Цена должна быть больше нуля");

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Price = dto.Price,
            Category = dto.Category,
            Stock = dto.Stock,
            Manufacturer = dto.Manufacturer,
            Specifications = dto.Specifications,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        return await _repository.CreateAsync(product);
    }

    public async Task<Product?> UpdateStockAsync(Guid productId, int newStock)
    {
        if (newStock < 0)
            throw new ValidationException("Количество не может быть отрицательным");

        var product = await _repository.GetByIdAsync(productId);
        if (product == null) return null;

        product.Stock = newStock;
        await _repository.UpdateAsync(product);
        await _cache.RemoveAsync($"product:{productId}");

        return product;
    }
}

public class CreateProductDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public ProductCategory Category { get; set; }
    public int Stock { get; set; }
    public string Manufacturer { get; set; } = string.Empty;
    public Dictionary<string, object> Specifications { get; set; } = new();
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
}

public class ValidationException : Exception
{
    public ValidationException(string message) : base(message) { }
}

#endregion