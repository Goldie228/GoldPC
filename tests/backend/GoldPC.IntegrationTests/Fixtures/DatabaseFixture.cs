using CatalogService.Data;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;
using Xunit;

namespace GoldPC.IntegrationTests.Fixtures;

/// <summary>
/// Fixture для интеграционных тестов с реальной PostgreSQL базой данных в Docker контейнере.
/// Реализует IAsyncLifetime для управления жизненным циклом контейнеров.
/// Может быть инжектирован в тестовые классы через IClassFixture или ICollectionFixture.
/// </summary>
public class DatabaseFixture : IAsyncLifetime
{
    private PostgreSqlContainer _postgresContainer = null!;

    /// <summary>
    /// Строка подключения к PostgreSQL
    /// </summary>
    public string ConnectionString { get; private set; } = string.Empty;

    /// <summary>
    /// Имя тестовой базы данных
    /// </summary>
    public const string DatabaseName = "goldpc_catalog_test";

    /// <summary>
    /// Инициализация контейнера PostgreSQL
    /// </summary>
    public async Task InitializeAsync()
    {
        _postgresContainer = new PostgreSqlBuilder()
            .WithImage("postgres:16-alpine")
            .WithDatabase(DatabaseName)
            .WithUsername("postgres")
            .WithPassword("postgres")
            .WithCleanUp(true)
            .Build();

        await _postgresContainer.StartAsync();

        ConnectionString = _postgresContainer.GetConnectionString();
    }

    /// <summary>
    /// Остановка контейнера PostgreSQL
    /// </summary>
    public async Task DisposeAsync()
    {
        await _postgresContainer.DisposeAsync();
    }

    /// <summary>
    /// Создание контекста БД для тестов
    /// </summary>
    public CatalogDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CatalogDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;

        return new CatalogDbContext(options);
    }

    /// <summary>
    /// Очистка таблиц после тестов
    /// </summary>
    public async Task CleanupAsync()
    {
        await using var dbContext = CreateDbContext();
        
        // Очистка таблиц в порядке обратном зависимостям
        await dbContext.Database.ExecuteSqlRawAsync("TRUNCATE TABLE reviews CASCADE");
        await dbContext.Database.ExecuteSqlRawAsync("TRUNCATE TABLE product_images CASCADE");
        await dbContext.Database.ExecuteSqlRawAsync("TRUNCATE TABLE products CASCADE");
        // Категории и производители не очищаем, так как они сидируются
    }
}

/// <summary>
/// Fixture для WebApplicationFactory с тестовой БД через Testcontainers.
/// Предоставляет настроенный HttpClient для интеграционных тестов API.
/// </summary>
public class ApiFixture : IAsyncLifetime
{
    private readonly DatabaseFixture _dbFixture;
    private Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<CatalogService.Program>? _factory;
    private HttpClient? _client;

    /// <summary>
    /// HttpClient для выполнения HTTP запросов к тестовому сервереру
    /// </summary>
    public HttpClient Client => _client ?? throw new InvalidOperationException("Client not initialized. Call InitializeAsync first.");

    /// <summary>
    /// Строка подключения к тестовой БД
    /// </summary>
    public string ConnectionString => _dbFixture.ConnectionString;

    public ApiFixture(DatabaseFixture dbFixture)
    {
        _dbFixture = dbFixture;
    }

    public async Task InitializeAsync()
    {
        _factory = new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<CatalogService.Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Testing");
                
                builder.ConfigureServices(services =>
                {
                    // Удаляем существующую регистрацию DbContext
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(Microsoft.EntityFrameworkCore.DbContextOptions<CatalogDbContext>));
                    if (descriptor != null)
                    {
                        services.Remove(descriptor);
                    }

                    // Регистрируем DbContext с тестовой строкой подключения
                    services.AddDbContext<CatalogDbContext>(options =>
                    {
                        options.UseNpgsql(_dbFixture.ConnectionString);
                    });
                });
            });

        _client = _factory.CreateClient();

        // Применяем миграции к тестовой БД
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
        await dbContext.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        _client?.Dispose();
        _factory?.Dispose();
        await Task.CompletedTask;
    }

    /// <summary>
    /// Очистка данных между тестами
    /// </summary>
    public async Task CleanupDatabaseAsync()
    {
        await _dbFixture.CleanupAsync();
    }
}

/// <summary>
/// Коллекция фикстур для совместного использования между тестовыми классами
/// </summary>
[CollectionDefinition("Database Collection")]
public class DatabaseCollection : ICollectionFixture<DatabaseFixture>
{
    // Этот класс не содержит кода, только маркер для xUnit
}