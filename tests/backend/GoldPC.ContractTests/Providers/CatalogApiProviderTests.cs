using PactNet;
using PactNet.Infrastructure.Outputters;
using Xunit;
using FluentAssertions;

namespace GoldPC.ContractTests.Providers;

/// <summary>
/// Контрактные тесты провайдера Catalog API
/// Проверяют соответствие API контракту с потребителем (Frontend)
/// </summary>
public class CatalogApiProviderTests : IClassFixture<CatalogApiFixture>
{
    private readonly CatalogApiFixture _fixture;

    public CatalogApiProviderTests(CatalogApiFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public void VerifyPactWithFrontend_ShouldSucceed()
    {
        // Arrange
        var config = new PactVerifierConfig
        {
            Outputters = new List<IOutput>
            {
                new ConsoleOutput()
            },
            LogLevel = PactLogLevel.Debug
        };

        // Act & Assert
        using var verifier = new PactVerifier(config);
        
        verifier
            .ServiceProvider("GoldPC-Catalog-API", _fixture.ServerUri)
            .HonoursPactWith("GoldPC-Frontend")
            .PactUri($"./pacts/frontend-catalog.json")
            .Verify();
    }

    [Fact]
    public void VerifyPactWithAdminPanel_ShouldSucceed()
    {
        // Arrange
        var config = new PactVerifierConfig
        {
            Outputters = new List<IOutput>
            {
                new ConsoleOutput()
            }
        };

        // Act & Assert
        using var verifier = new PactVerifier(config);
        
        verifier
            .ServiceProvider("GoldPC-Catalog-API", _fixture.ServerUri)
            .HonoursPactWith("GoldPC-AdminPanel")
            .PactUri($"./pacts/admin-catalog.json")
            .Verify();
    }
}

/// <summary>
/// Fixture для настройки тестового сервера API
/// </summary>
public class CatalogApiFixture : IDisposable
{
    public Uri ServerUri { get; }
    private readonly TestServer _server;

    public CatalogApiFixture()
    {
        ServerUri = new Uri("http://localhost:5001");
        
        // Настройка тестового сервера
        var webHostBuilder = new WebHostBuilder()
            .ConfigureServices(services =>
            {
                // Регистрация сервисов с моками
                services.AddScoped<IProductRepository, MockProductRepository>();
                services.AddScoped<ICatalogService, CatalogService>();
            })
            .Configure(app =>
            {
                app.UseRouting();
                app.UseEndpoints(endpoints =>
                {
                    endpoints.MapControllers();
                });
            });

        _server = new TestServer(webHostBuilder);
    }

    public void Dispose()
    {
        _server?.Dispose();
    }
}

/// <summary>
/// Провайдер состояний для контрактных тестов
/// </summary>
public class CatalogProviderStateMiddleware
{
    private readonly RequestDelegate _next;
    private readonly Dictionary<string, Action> _providerStates;

    public CatalogProviderStateMiddleware(RequestDelegate next)
    {
        _next = next;

        _providerStates = new Dictionary<string, Action>
        {
            ["products exist"] = SetupProductsExist,
            ["product with id exists"] = SetupProductExists,
            ["product with id not found"] = SetupProductNotFound,
            ["empty catalog"] = SetupEmptyCatalog,
            ["products in category exist"] = SetupProductsInCategory
        };
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments("/provider-states"))
        {
            await HandleProviderStateRequest(context);
            return;
        }

        await _next(context);
    }

    private async Task HandleProviderStateRequest(HttpContext context)
    {
        using var reader = new StreamReader(context.Request.Body);
        var body = await reader.ReadToEndAsync();
        var providerState = JsonSerializer.Deserialize<ProviderState>(body);

        context.Response.StatusCode = StatusCodes.Status200OK;

        if (providerState?.State != null && _providerStates.TryGetValue(providerState.State, out var action))
        {
            action();
        }
    }

    private static void SetupProductsExist()
    {
        // Настройка состояния: существуют товары
        MockProductRepository.SetProducts(new List<Product>
        {
            new() { Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), Name = "AMD Ryzen 9 7950X", Price = 59999, Stock = 10 },
            new() { Id = Guid.Parse("00000000-0000-0000-0000-000000000002"), Name = "Intel Core i9-14900K", Price = 54999, Stock = 5 }
        });
    }

    private static void SetupProductExists()
    {
        MockProductRepository.SetProducts(new List<Product>
        {
            new() 
            { 
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), 
                Name = "AMD Ryzen 9 7950X", 
                Price = 59999, 
                Stock = 10,
                Category = ProductCategory.Cpu,
                IsActive = true
            }
        });
    }

    private static void SetupProductNotFound()
    {
        MockProductRepository.SetProducts(new List<Product>());
    }

    private static void SetupEmptyCatalog()
    {
        MockProductRepository.SetProducts(new List<Product>());
    }

    private static void SetupProductsInCategory()
    {
        MockProductRepository.SetProducts(new List<Product>
        {
            new() { Id = Guid.NewGuid(), Name = "Product 1", Category = ProductCategory.Cpu, Price = 1000 },
            new() { Id = Guid.NewGuid(), Name = "Product 2", Category = ProductCategory.Cpu, Price = 2000 },
            new() { Id = Guid.NewGuid(), Name = "Product 3", Category = ProductCategory.Gpu, Price = 3000 }
        });
    }
}

public class ProviderState
{
    public string? Consumer { get; set; }
    public string? State { get; set; }
}