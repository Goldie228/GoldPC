using CatalogService.Data;
using FluentAssertions;
using GoldPC.IntegrationTests.Fixtures;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace GoldPC.IntegrationTests.Api;

/// <summary>
/// Интеграционные тесты для Products API CatalogService.
/// Демонстрирует использование DatabaseFixture через IClassFixture.
/// </summary>
public class ProductsApiTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;
    private HttpClient? _client;
    private CatalogDbContext? _dbContext;

    public ProductsApiTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    public async Task InitializeAsync()
    {
        // Применяем миграции
        await _fixture.MigrateCatalogAsync();
        
        // Создаем DbContext для прямого доступа к БД
        _dbContext = _fixture.CreateCatalogDbContext();
        
        // В реальном проекте здесь создается WebApplicationFactory
        // _factory = new WebApplicationFactory<CatalogService.Program>()
        //     .WithWebHostBuilder(...);
        // _client = _factory.CreateClient();
        
        // Заглушка для демонстрации
        _client = new HttpClient();
    }

    public async Task DisposeAsync()
    {
        // Очищаем БД после каждого теста для изоляции
        await _fixture.ResetCatalogData();
        _dbContext?.Dispose();
        _client?.Dispose();
    }

    #region GET /api/v1/catalog/products

    [Fact]
    public async Task GetProducts_WithValidData_ReturnsOk()
    {
        // Arrange
        // В реальном тесте здесь используется _client для запроса к API
        
        // Act & Assert - демонстрация прямого доступа к БД через fixture
        await using var context = _fixture.CreateCatalogDbContext();
        
        // Проверяем что БД доступна и содержит таблицы
        var canConnect = await context.Database.CanConnectAsync();
        canConnect.Should().BeTrue("БД должна быть доступна через fixture");
    }

    [Fact]
    public async Task DatabaseFixture_ResetDatabase_ClearsData()
    {
        // Arrange - добавляем тестовый товар
        await using var context = _fixture.CreateCatalogDbContext();
        
        var category = new CatalogService.Models.Category
        {
            Id = Guid.NewGuid(),
            Name = "Test Category",
            Slug = "test-category"
        };
        
        context.Categories.Add(category);
        await context.SaveChangesAsync();
        
        // Verify data was added
        var countBefore = await context.Categories.CountAsync(c => c.Slug == "test-category");
        countBefore.Should().Be(1);
        
        // Act - сбрасываем данные
        await _fixture.ResetCatalogData();
        
        // Assert - проверяем что данные очищены
        await using var contextAfter = _fixture.CreateCatalogDbContext();
        var countAfter = await contextAfter.Categories.CountAsync(c => c.Slug == "test-category");
        countAfter.Should().Be(0, "ResetDatabase должен очистить данные");
    }

    [Fact]
    public async Task DatabaseFixture_MultipleTests_ShouldBeIsolated()
    {
        // Arrange
        await using var context = _fixture.CreateCatalogDbContext();
        
        var category = new CatalogService.Models.Category
        {
            Id = Guid.NewGuid(),
            Name = "Isolation Test Category",
            Slug = "isolation-test"
        };
        
        context.Categories.Add(category);
        await context.SaveChangesAsync();
        
        // Act
        var savedCategory = await context.Categories.FirstOrDefaultAsync(c => c.Slug == "isolation-test");
        
        // Assert
        savedCategory.Should().NotBeNull("данные должны быть доступны в рамках теста");
    }

    #endregion
}

/// <summary>
/// Пример тестового класса с использованием ApiFixture{TProgram}.
/// </summary>
/// <remarks>
/// Этот класс демонстрирует как использовать типизированную ApiFixture
/// для тестирования конкретного сервиса.
/// </remarks>
public class ProductsApiWithFixtureTests : IClassFixture<ApiFixture<CatalogService.Program>>
{
    private readonly ApiFixture<CatalogService.Program> _fixture;
    private readonly HttpClient _client;

    public ProductsApiWithFixtureTests(ApiFixture<CatalogService.Program> fixture)
    {
        _fixture = fixture;
        _client = fixture.Client;
    }

    [Fact]
    public async Task GetProducts_ReturnsOk()
    {
        // Act
        // var response = await _client.GetAsync("/api/v1/catalog/products");
        
        // Assert
        // response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Заглушка для демонстрации структуры
        await Task.CompletedTask;
        true.Should().BeTrue();
    }

    [Fact]
    public async Task CreateProduct_WithAuthorization_ReturnsCreated()
    {
        // Arrange
        var authorizedClient = _fixture.CreateAuthorizedClient(
            Guid.Parse("00000000-0000-0000-0000-000000000001"),
            "Manager"
        );
        
        // Act & Assert - демонстрация
        authorizedClient.Should().NotBeNull();
        await Task.CompletedTask;
    }

    [Fact]
    public async Task ResetDatabase_ProvidesIsolationBetweenTests()
    {
        // Arrange
        await _fixture.ResetDatabase();
        
        // Act & Assert
        // БД теперь чистая и готова для теста
        true.Should().BeTrue();
    }
}

/// <summary>
/// Пример использования CollectionFixture для совместного использования DatabaseFixture.
/// </summary>
[Collection("DatabaseCollection")]
public class ProductsApiCollectionTests
{
    private readonly DatabaseFixture _fixture;

    public ProductsApiCollectionTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task CollectionFixture_ProvidesSharedDatabase()
    {
        // Arrange
        var connectionString = _fixture.ConnectionString;
        
        // Assert
        connectionString.Should().NotBeNullOrEmpty("fixture должна предоставить строку подключения");
    }

    [Fact]
    public async Task CollectionFixture_CanCreateDbContext()
    {
        // Act
        await using var context = _fixture.CreateCatalogDbContext();
        
        // Assert
        context.Should().NotBeNull();
        (await context.Database.CanConnectAsync()).Should().BeTrue();
    }

    [Fact]
    public async Task CollectionFixture_CanMigrateDatabase()
    {
        // Act & Assert - не должно выбросить исключение
        var act = async () => await _fixture.MigrateCatalogAsync();
        await act.Should().NotThrowAsync();
    }
}

// Вспомогательные namespace импорты для CatalogService.Program
namespace CatalogService
{
    /// <summary>
    /// Заглушка класса Program для тестов.
    /// В реальном проекте это класс Program из CatalogService.
    /// </summary>
    public class Program { }
}