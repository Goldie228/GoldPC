using System;
using System.Collections.Generic;
using CatalogService.Repositories.Interfaces;
using CatalogService.Services;
using CatalogService.Services.Interfaces;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace GoldPC.ContractTests.Providers;

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
                services.AddLogging(builder => builder.AddConsole());
                services.AddControllers().AddApplicationPart(typeof(CatalogService.Controllers.CatalogController).Assembly);
                
                // Регистрация сервисов с моками
                services.AddScoped<IProductRepository, MockProductRepository>();
                services.AddScoped<ICategoryRepository, MockCategoryRepository>();
                services.AddScoped<IManufacturerRepository, MockManufacturerRepository>();
                services.AddScoped<IReviewRepository, MockReviewRepository>();
                services.AddScoped<ICatalogService, CatalogService.Services.CatalogService>();
            })
            .Configure(app =>
            {
                app.UseRouting();
                
                // Добавляем middleware для состояний Pact
                app.UseMiddleware<CatalogProviderStateMiddleware>();
                
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
