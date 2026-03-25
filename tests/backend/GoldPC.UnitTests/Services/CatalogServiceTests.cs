// <copyright file="CatalogServiceTests.cs" company="GoldPC">
// Copyright (c) GoldPC. All rights reserved.
// </copyright>

using AutoFixture;
using GoldPC.SharedKernel.DTOs;
using CatalogService.Models;
using CatalogService.Repositories;
using CatalogService.Repositories.Interfaces;
using CatalogService.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace GoldPC.UnitTests.Services;

/// <summary>
/// Модульные тесты для сервиса каталога.
/// Тесты следуют принципам FIRST:
/// - Fast: выполняются быстро без внешних зависимостей
/// - Independent: каждый тест независим и создаёт свои данные
/// - Repeatable: одинаковый результат при каждом запуске
/// - Self-validating: автоматический assert без ручной проверки
/// - Timely: пишутся вместе с кодом
/// </summary>
public class CatalogServiceTests
{
    private readonly Fixture _fixture = new();
    private readonly Mock<IProductRepository> _productRepositoryMock;
    private readonly Mock<ICategoryRepository> _categoryRepositoryMock;
    private readonly Mock<IManufacturerRepository> _manufacturerRepositoryMock;
    private readonly Mock<IReviewRepository> _reviewRepositoryMock;
    private readonly Mock<ILogger<CatalogService>> _loggerMock;
    private readonly CatalogService _sut; // System Under Test

    public CatalogServiceTests()
    {
        _productRepositoryMock = new Mock<IProductRepository>();
        _categoryRepositoryMock = new Mock<ICategoryRepository>();
        _manufacturerRepositoryMock = new Mock<IManufacturerRepository>();
        _reviewRepositoryMock = new Mock<IReviewRepository>();
        _loggerMock = new Mock<ILogger<CatalogService>>();

        _sut = new CatalogService(
            _productRepositoryMock.Object,
            _categoryRepositoryMock.Object,
            _manufacturerRepositoryMock.Object,
            _reviewRepositoryMock.Object,
            _loggerMock.Object
        );

        // Настройка AutoFixture для генерации DTO
        _fixture.Customize<ProductFilterDto>(c => c
            .With(f => f.Page, 1)
            .With(f => f.PageSize, 20)
            .With(f => f.SortBy, "createdAt")
            .With(f => f.SortOrder, "desc"));
    }

    #region GetProductById Tests

    [Fact]
    public async Task GetProductById_WhenProductExists_ReturnsProductDetailDto()
    {
        // Arrange
        var productId = _fixture.Create<Guid>();
        var category = CreateTestCategory();
        var manufacturer = CreateTestManufacturer();
        
        var expectedProduct = CreateTestProduct(productId, category, manufacturer);

        _productRepositoryMock
            .Setup(r => r.GetDetailByIdAsync(productId))
            .ReturnsAsync(expectedProduct);

        // Act
        var result = await _sut.GetProductByIdAsync(productId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(productId);
        result.Name.Should().Be(expectedProduct.Name);
        result.Sku.Should().Be(expectedProduct.Sku);
        result.Price.Should().Be(expectedProduct.Price);
        result.Stock.Should().Be(expectedProduct.Stock);
        result.Category.Should().Be(category.Name);
        result.Manufacturer.Should().NotBeNull();
        result.Manufacturer!.Name.Should().Be(manufacturer.Name);
        
        _productRepositoryMock.Verify(r => r.GetDetailByIdAsync(productId), Times.Once);
    }

    [Fact]
    public async Task GetProductById_WhenProductNotFound_ReturnsNull()
    {
        // Arrange
        var productId = _fixture.Create<Guid>();

        _productRepositoryMock
            .Setup(r => r.GetDetailByIdAsync(productId))
            .ReturnsAsync((Product?)null);

        // Act
        var result = await _sut.GetProductByIdAsync(productId);

        // Assert
        result.Should().BeNull();
        _productRepositoryMock.Verify(r => r.GetDetailByIdAsync(productId), Times.Once);
    }

    [Fact]
    public async Task GetProductById_WhenProductInactive_ReturnsNull()
    {
        // Arrange
        var productId = _fixture.Create<Guid>();
        var inactiveProduct = CreateTestProduct(productId);
        inactiveProduct.IsActive = false;

        _productRepositoryMock
            .Setup(r => r.GetDetailByIdAsync(productId))
            .ReturnsAsync(inactiveProduct);

        // Act
        var result = await _sut.GetProductByIdAsync(productId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetProductById_WithImages_ReturnsProductWithImages()
    {
        // Arrange
        var productId = _fixture.Create<Guid>();
        var product = CreateTestProduct(productId);
        product.Images.Add(new ProductImage
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            Url = "https://example.com/image1.jpg",
            IsPrimary = true,
            SortOrder = 0
        });
        product.Images.Add(new ProductImage
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            Url = "https://example.com/image2.jpg",
            IsPrimary = false,
            SortOrder = 1
        });

        _productRepositoryMock
            .Setup(r => r.GetDetailByIdAsync(productId))
            .ReturnsAsync(product);

        // Act
        var result = await _sut.GetProductByIdAsync(productId);

        // Assert
        result.Should().NotBeNull();
        result!.Images.Should().HaveCount(2);
        result.Images[0].IsMain.Should().BeTrue();
        result.Images[0].Url.Should().Be("https://example.com/image1.jpg");
    }

    [Fact]
    public async Task GetProductById_WithRating_ReturnsProductWithRating()
    {
        // Arrange
        var productId = _fixture.Create<Guid>();
        var product = CreateTestProduct(productId);
        product.Rating = 4.5;
        product.ReviewCount = 42;

        _productRepositoryMock
            .Setup(r => r.GetDetailByIdAsync(productId))
            .ReturnsAsync(product);

        // Act
        var result = await _sut.GetProductByIdAsync(productId);

        // Assert
        result.Should().NotBeNull();
        result!.Rating.Should().NotBeNull();
        result.Rating!.Average.Should().Be(4.5);
        result.Rating.Count.Should().Be(42);
    }

    #endregion

    #region GetProducts (Filtering) Tests

    [Theory]
    [InlineData("cpu", 1, 10, 5)]
    [InlineData("gpu", 1, 20, 3)]
    [InlineData("ram", 2, 15, 8)]
    public async Task GetProducts_WithCategoryFilter_ReturnsFilteredProducts(
        string categorySlug, int page, int pageSize, int expectedCount)
    {
        // Arrange
        var categoryId = Guid.NewGuid();
        var category = new Category
        {
            Id = categoryId,
            Name = categorySlug.ToUpper(),
            Slug = categorySlug
        };

        var products = Enumerable.Range(0, expectedCount)
            .Select(_ => CreateTestProduct(Guid.NewGuid(), category))
            .ToList();

        var filter = new ProductFilterDto
        {
            Category = categorySlug,
            Page = page,
            PageSize = pageSize
        };

        _productRepositoryMock
            .Setup(r => r.GetFilteredAsync(filter))
            .ReturnsAsync(new RepositoryPagedResult<Product>
            {
                Items = products,
                TotalCount = expectedCount,
                Page = page,
                PageSize = pageSize
            });

        // Act
        var result = await _sut.GetProductsAsync(filter);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().HaveCount(expectedCount);
        result.Meta.Page.Should().Be(page);
        result.Meta.PageSize.Should().Be(pageSize);
        result.Meta.TotalItems.Should().Be(expectedCount);
    }

    [Theory]
    [InlineData(100, 500, 7)]
    [InlineData(500, 1000, 5)]
    [InlineData(1000, 5000, 3)]
    public async Task GetProducts_WithPriceRangeFilter_ReturnsFilteredProducts(
        decimal minPrice, decimal maxPrice, int expectedCount)
    {
        // Arrange
        var products = Enumerable.Range(0, expectedCount)
            .Select(i => CreateTestProduct(Guid.NewGuid()))
            .ToList();

        var filter = new ProductFilterDto
        {
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            Page = 1,
            PageSize = 20
        };

        _productRepositoryMock
            .Setup(r => r.GetFilteredAsync(filter))
            .ReturnsAsync(new RepositoryPagedResult<Product>
            {
                Items = products,
                TotalCount = expectedCount,
                Page = 1,
                PageSize = 20
            });

        // Act
        var result = await _sut.GetProductsAsync(filter);

        // Assert
        result.Data.Should().HaveCount(expectedCount);
        _productRepositoryMock.Verify(r => r.GetFilteredAsync(
            It.Is<ProductFilterDto>(f => f.MinPrice == minPrice && f.MaxPrice == maxPrice)), 
            Times.Once);
    }

    [Theory]
    [InlineData(true, 5)]
    [InlineData(false, 10)]
    public async Task GetProducts_WithInStockFilter_ReturnsFilteredProducts(
        bool inStockOnly, int expectedCount)
    {
        // Arrange
        var products = Enumerable.Range(0, expectedCount)
            .Select(i => 
            {
                var product = CreateTestProduct(Guid.NewGuid());
                product.Stock = inStockOnly ? 10 : 0;
                return product;
            })
            .ToList();

        var filter = new ProductFilterDto
        {
            InStock = inStockOnly,
            Page = 1,
            PageSize = 20
        };

        _productRepositoryMock
            .Setup(r => r.GetFilteredAsync(filter))
            .ReturnsAsync(new RepositoryPagedResult<Product>
            {
                Items = products,
                TotalCount = expectedCount,
                Page = 1,
                PageSize = 20
            });

        // Act
        var result = await _sut.GetProductsAsync(filter);

        // Assert
        result.Data.Should().HaveCount(expectedCount);
        _productRepositoryMock.Verify(r => r.GetFilteredAsync(
            It.Is<ProductFilterDto>(f => f.InStock == inStockOnly)), 
            Times.Once);
    }

    [Theory]
    [InlineData("Ryzen", 3)]
    [InlineData("RTX", 5)]
    [InlineData("DDR5", 2)]
    public async Task GetProducts_WithSearchQuery_ReturnsMatchingProducts(
        string searchQuery, int expectedCount)
    {
        // Arrange
        var products = Enumerable.Range(0, expectedCount)
            .Select(_ => CreateTestProduct(Guid.NewGuid()))
            .ToList();

        var filter = new ProductFilterDto
        {
            Search = searchQuery,
            Page = 1,
            PageSize = 20
        };

        _productRepositoryMock
            .Setup(r => r.GetFilteredAsync(filter))
            .ReturnsAsync(new RepositoryPagedResult<Product>
            {
                Items = products,
                TotalCount = expectedCount,
                Page = 1,
                PageSize = 20
            });

        // Act
        var result = await _sut.GetProductsAsync(filter);

        // Assert
        result.Data.Should().HaveCount(expectedCount);
        _productRepositoryMock.Verify(r => r.GetFilteredAsync(
            It.Is<ProductFilterDto>(f => f.Search == searchQuery)), 
            Times.Once);
    }

    [Theory]
    [InlineData(true, 4)]
    [InlineData(false, 10)]
    public async Task GetProducts_WithFeaturedFilter_ReturnsFilteredProducts(
        bool featuredOnly, int expectedCount)
    {
        // Arrange
        var products = Enumerable.Range(0, expectedCount)
            .Select(i => 
            {
                var product = CreateTestProduct(Guid.NewGuid());
                product.IsFeatured = featuredOnly;
                return product;
            })
            .ToList();

        var filter = new ProductFilterDto
        {
            IsFeatured = featuredOnly,
            Page = 1,
            PageSize = 20
        };

        _productRepositoryMock
            .Setup(r => r.GetFilteredAsync(filter))
            .ReturnsAsync(new RepositoryPagedResult<Product>
            {
                Items = products,
                TotalCount = expectedCount,
                Page = 1,
                PageSize = 20
            });

        // Act
        var result = await _sut.GetProductsAsync(filter);

        // Assert
        result.Data.Should().HaveCount(expectedCount);
        _productRepositoryMock.Verify(r => r.GetFilteredAsync(
            It.Is<ProductFilterDto>(f => f.IsFeatured == featuredOnly)), 
            Times.Once);
    }

    [Theory]
    [InlineData(1, 10, 50, 5)]
    [InlineData(2, 20, 100, 5)]
    [InlineData(3, 15, 45, 3)]
    public async Task GetProducts_WithPagination_ReturnsCorrectPagedResult(
        int page, int pageSize, int totalCount, int expectedTotalPages)
    {
        // Arrange
        var products = Enumerable.Range(0, pageSize)
            .Select(_ => CreateTestProduct(Guid.NewGuid()))
            .ToList();

        var filter = new ProductFilterDto
        {
            Page = page,
            PageSize = pageSize
        };

        _productRepositoryMock
            .Setup(r => r.GetFilteredAsync(filter))
            .ReturnsAsync(new RepositoryPagedResult<Product>
            {
                Items = products,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });

        // Act
        var result = await _sut.GetProductsAsync(filter);

        // Assert
        result.Data.Should().HaveCount(pageSize);
        result.Meta.Page.Should().Be(page);
        result.Meta.PageSize.Should().Be(pageSize);
        result.Meta.TotalItems.Should().Be(totalCount);
        result.Meta.TotalPages.Should().Be(expectedTotalPages);
        result.Meta.HasNextPage.Should().Be(page < expectedTotalPages);
        result.Meta.HasPrevPage.Should().Be(page > 1);
    }

    [Fact]
    public async Task GetProducts_WithManufacturerFilter_ReturnsFilteredProducts()
    {
        // Arrange
        var manufacturerId = Guid.NewGuid();
        var expectedCount = 5;
        var manufacturer = new Manufacturer
        {
            Id = manufacturerId,
            Name = "AMD",
            Country = "USA"
        };

        var products = Enumerable.Range(0, expectedCount)
            .Select(_ => 
            {
                var product = CreateTestProduct(Guid.NewGuid());
                product.ManufacturerId = manufacturerId;
                product.Manufacturer = manufacturer;
                return product;
            })
            .ToList();

        var filter = new ProductFilterDto
        {
            ManufacturerId = manufacturerId,
            Page = 1,
            PageSize = 20
        };

        _productRepositoryMock
            .Setup(r => r.GetFilteredAsync(filter))
            .ReturnsAsync(new RepositoryPagedResult<Product>
            {
                Items = products,
                TotalCount = expectedCount,
                Page = 1,
                PageSize = 20
            });

        // Act
        var result = await _sut.GetProductsAsync(filter);

        // Assert
        result.Data.Should().HaveCount(expectedCount);
        _productRepositoryMock.Verify(r => r.GetFilteredAsync(
            It.Is<ProductFilterDto>(f => f.ManufacturerId == manufacturerId)), 
            Times.Once);
    }

    [Fact]
    public async Task GetProducts_WhenEmpty_ReturnsEmptyPagedResult()
    {
        // Arrange
        var filter = new ProductFilterDto
        {
            Page = 1,
            PageSize = 20
        };

        _productRepositoryMock
            .Setup(r => r.GetFilteredAsync(filter))
            .ReturnsAsync(new RepositoryPagedResult<Product>
            {
                Items = new List<Product>(),
                TotalCount = 0,
                Page = 1,
                PageSize = 20
            });

        // Act
        var result = await _sut.GetProductsAsync(filter);

        // Assert
        result.Data.Should().BeEmpty();
        result.Meta.TotalItems.Should().Be(0);
        result.Meta.TotalPages.Should().Be(0);
    }

    #endregion

    #region GetProductBySku Tests

    [Fact]
    public async Task GetProductBySku_WhenProductExists_ReturnsProduct()
    {
        // Arrange
        var sku = "SKU-12345";
        var productId = Guid.NewGuid();
        var category = CreateTestCategory();
        var product = CreateTestProduct(productId, category);

        _productRepositoryMock
            .Setup(r => r.GetBySkuAsync(sku))
            .ReturnsAsync(product);

        _productRepositoryMock
            .Setup(r => r.GetDetailByIdAsync(productId))
            .ReturnsAsync(product);

        // Act
        var result = await _sut.GetProductBySkuAsync(sku);

        // Assert
        result.Should().NotBeNull();
        result!.Sku.Should().Be(product.Sku);
    }

    [Fact]
    public async Task GetProductBySku_WhenProductNotFound_ReturnsNull()
    {
        // Arrange
        var sku = "NONEXISTENT-SKU";

        _productRepositoryMock
            .Setup(r => r.GetBySkuAsync(sku))
            .ReturnsAsync((Product?)null);

        // Act
        var result = await _sut.GetProductBySkuAsync(sku);

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region CreateProduct Tests

    [Fact]
    public async Task CreateProduct_WithValidData_ReturnsCreatedProduct()
    {
        // Arrange
        var categoryId = Guid.NewGuid();
        var category = new Category
        {
            Id = categoryId,
            Name = "Процессоры",
            Slug = "cpu"
        };

        var createDto = new CreateProductDto
        {
            Name = "AMD Ryzen 9 7950X",
            Sku = "RYZEN-7950X",
            CategoryId = categoryId,
            Price = 59999m,
            Stock = 10,
            WarrantyMonths = 36,
            Description = "Топовый процессор AMD",
            Specifications = new Dictionary<string, object>
            {
                ["cores"] = 16,
                ["threads"] = 32,
                ["socket"] = "AM5"
            }
        };

        _productRepositoryMock
            .Setup(r => r.SkuExistsAsync(createDto.Sku))
            .ReturnsAsync(false);

        _productRepositoryMock
            .Setup(r => r.CreateAsync(It.IsAny<Product>()))
            .ReturnsAsync((Product p) =>
            {
                p.Id = Guid.NewGuid();
                return p;
            });

        _productRepositoryMock
            .Setup(r => r.GetDetailByIdAsync(It.IsAny<Guid>()))
            .ReturnsAsync((Guid id) =>
            {
                var product = CreateTestProduct(id, category);
                product.Name = createDto.Name;
                product.Sku = createDto.Sku;
                product.Price = createDto.Price;
                product.Stock = createDto.Stock;
                product.WarrantyMonths = createDto.WarrantyMonths;
                product.Description = createDto.Description;
                product.Specifications = createDto.Specifications;
                return product;
            });

        // Act
        var result = await _sut.CreateProductAsync(createDto);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(createDto.Name);
        result.Sku.Should().Be(createDto.Sku);
        result.Price.Should().Be(createDto.Price);
        result.Stock.Should().Be(createDto.Stock);
        
        _productRepositoryMock.Verify(r => r.CreateAsync(It.IsAny<Product>()), Times.Once);
    }

    [Fact]
    public async Task CreateProduct_WithDuplicateSku_ThrowsInvalidOperationException()
    {
        // Arrange
        var createDto = new CreateProductDto
        {
            Name = "Test Product",
            Sku = "EXISTING-SKU",
            CategoryId = Guid.NewGuid(),
            Price = 1000m,
            Stock = 5
        };

        _productRepositoryMock
            .Setup(r => r.SkuExistsAsync(createDto.Sku))
            .ReturnsAsync(true);

        // Act
        var act = async () => await _sut.CreateProductAsync(createDto);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*{createDto.Sku}*");
        
        _productRepositoryMock.Verify(r => r.CreateAsync(It.IsAny<Product>()), Times.Never);
    }

    [Fact]
    public async Task CreateProduct_WithCategorySlug_ResolvesCategory()
    {
        // Arrange
        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = "Процессоры",
            Slug = "cpu"
        };

        var createDto = new CreateProductDto
        {
            Name = "Test Product",
            Sku = "TEST-SKU",
            Category = "cpu",
            Price = 1000m,
            Stock = 5
        };

        _productRepositoryMock
            .Setup(r => r.SkuExistsAsync(createDto.Sku))
            .ReturnsAsync(false);

        _categoryRepositoryMock
            .Setup(r => r.GetBySlugAsync("cpu"))
            .ReturnsAsync(category);

        _productRepositoryMock
            .Setup(r => r.CreateAsync(It.IsAny<Product>()))
            .ReturnsAsync((Product p) =>
            {
                p.Id = Guid.NewGuid();
                return p;
            });

        _productRepositoryMock
            .Setup(r => r.GetDetailByIdAsync(It.IsAny<Guid>()))
            .ReturnsAsync((Guid id) => CreateTestProduct(id, category));

        // Act
        var result = await _sut.CreateProductAsync(createDto);

        // Assert
        result.Should().NotBeNull();
        _categoryRepositoryMock.Verify(r => r.GetBySlugAsync("cpu"), Times.Once);
    }

    #endregion

    #region DeleteProduct Tests

    [Fact]
    public async Task DeleteProduct_WhenProductExists_ReturnsTrue()
    {
        // Arrange
        var productId = Guid.NewGuid();

        _productRepositoryMock
            .Setup(r => r.ExistsAsync(productId))
            .ReturnsAsync(true);

        _productRepositoryMock
            .Setup(r => r.DeleteAsync(productId))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _sut.DeleteProductAsync(productId);

        // Assert
        result.Should().BeTrue();
        _productRepositoryMock.Verify(r => r.DeleteAsync(productId), Times.Once);
    }

    [Fact]
    public async Task DeleteProduct_WhenProductNotFound_ReturnsFalse()
    {
        // Arrange
        var productId = Guid.NewGuid();

        _productRepositoryMock
            .Setup(r => r.ExistsAsync(productId))
            .ReturnsAsync(false);

        // Act
        var result = await _sut.DeleteProductAsync(productId);

        // Assert
        result.Should().BeFalse();
        _productRepositoryMock.Verify(r => r.DeleteAsync(It.IsAny<Guid>()), Times.Never);
    }

    #endregion

    #region GetProductsByIds Tests

    [Fact]
    public async Task GetProductsByIds_WithValidIds_ReturnsProducts()
    {
        // Arrange
        var ids = new List<Guid> { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };
        var products = ids.Select(id => CreateTestProduct(id)).ToList();

        _productRepositoryMock
            .Setup(r => r.GetByIdsAsync(ids))
            .ReturnsAsync(products);

        // Act
        var result = await _sut.GetProductsByIdsAsync(ids);

        // Assert
        result.Should().HaveCount(3);
        result.Select(p => p.Id).Should().BeEquivalentTo(ids);
    }

    [Fact]
    public async Task GetProductsByIds_WithEmptyIds_ReturnsEmptyCollection()
    {
        // Arrange
        var ids = new List<Guid>();

        _productRepositoryMock
            .Setup(r => r.GetByIdsAsync(ids))
            .ReturnsAsync(new List<Product>());

        // Act
        var result = await _sut.GetProductsByIdsAsync(ids);

        // Assert
        result.Should().BeEmpty();
    }

    #endregion

    #region Helper Methods

    private static Product CreateTestProduct(Guid id, Category? category = null, Manufacturer? manufacturer = null)
    {
        return new Product
        {
            Id = id,
            Name = $"Test Product {id:N}",
            Sku = $"SKU-{id:N}"[..13],
            Description = "Test product description",
            Price = 1000m + Random.Shared.Next(100, 5000),
            OldPrice = null,
            Stock = Random.Shared.Next(0, 100),
            CategoryId = category?.Id ?? Guid.NewGuid(),
            Category = category ?? CreateTestCategory(),
            ManufacturerId = manufacturer?.Id ?? Guid.NewGuid(),
            Manufacturer = manufacturer ?? CreateTestManufacturer(),
            WarrantyMonths = 12,
            Rating = 4.5,
            ReviewCount = 10,
            IsActive = true,
            IsFeatured = false,
            Specifications = new Dictionary<string, object>
            {
                ["test_spec"] = "test_value"
            },
            Images = new List<ProductImage>(),
            Reviews = new List<Review>(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = null
        };
    }

    private static Category CreateTestCategory()
    {
        return new Category
        {
            Id = Guid.NewGuid(),
            Name = "Процессоры",
            Slug = "cpu",
            Description = "Процессоры для ПК",
            Order = 1
        };
    }

    private static Manufacturer CreateTestManufacturer()
    {
        return new Manufacturer
        {
            Id = Guid.NewGuid(),
            Name = "AMD",
            Country = "USA",
            Description = "Advanced Micro Devices"
        };
    }

    #endregion
}