#pragma warning disable ASP0004, ASP0005, CA1716, SA1402, SA1616, SA1625
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Shared.Middleware;
using Shared.Stubs.Controllers;
using Shared.Stubs.DTOs;
using Shared.Stubs.Middleware;

namespace Shared.Stubs.Extensions;

/// <summary>
/// Методы расширения для регистрации сервисов заглушек.
/// </summary>
public static class StubServiceExtensions
{
    /// <summary>
    /// Добавить сервисы заглушек в DI контейнер.
    /// </summary>
    /// <param name="services">Коллекция сервисов.</param>
    /// <param name="configuration">Конфигурация (опционально).</param>
    /// <returns>Коллекция сервисов.</returns>
    public static IServiceCollection AddStubServices(
        this IServiceCollection services,
        IConfiguration? configuration = null)
    {
        // Регистрируем ChaosOptions из конфигурации
        if (configuration != null)
        {
            services.Configure<ChaosOptions>(
                configuration.GetSection("Chaos"));
        }
        else
        {
            services.Configure<ChaosOptions>(options => { });
        }

        // Инициализируем Singleton реестр с логгером
        var serviceProvider = services.BuildServiceProvider();
        var logger = serviceProvider.GetService<ILogger<StubRegistry>>();

        if (logger != null)
        {
            StubRegistry.Instance.SetLogger(logger);
        }

        return services;
    }

    /// <summary>
    /// Добавить контроллер заглушек (для внутреннего API).
    /// </summary>
    /// <param name="services">Коллекция сервисов.</param>
    /// <returns>Коллекция сервисов.</returns>
    public static IServiceCollection AddStubController(this IServiceCollection services)
    {
        // Регистрируем контроллер как transient, чтобы он создавался на каждый запрос
        // Контроллер использует Singleton StubRegistry.Instance
        return services;
    }

    /// <summary>
    /// Использовать Chaos Middleware с поддержкой заглушек.
    /// </summary>
    /// <param name="app">Application builder.</param>
    /// <param name="configure">Действие для конфигурации опций (опционально).</param>
    /// <returns>Application builder.</returns>
    public static IApplicationBuilder UseStubAwareChaos(
        this IApplicationBuilder app,
        Action<ChaosOptions>? configure = null)
    {
        var options = new ChaosOptions();
        configure?.Invoke(options);

        return app.UseMiddleware<StubAwareChaosMiddleware>(options);
    }

    /// <summary>
    /// Использовать Chaos Middleware для конкретного сервиса.
    /// </summary>
    /// <param name="app">Application builder.</param>
    /// <param name="serviceName">Имя сервиса (имя заглушки в реестре).</param>
    /// <param name="configure">Действие для конфигурации опций (опционально).</param>
    /// <returns>Application builder.</returns>
    public static IApplicationBuilder UseStubAwareChaosForService(
        this IApplicationBuilder app,
        string serviceName,
        Action<ChaosOptions>? configure = null)
    {
        StubAwareChaosMiddleware.ServiceStubName = serviceName;

        var options = new ChaosOptions();
        configure?.Invoke(options);

        return app.UseMiddleware<StubAwareChaosMiddleware>(options);
    }

    /// <summary>
    /// Сопоставить маршруты для контроллера заглушек.
    /// </summary>
    /// <param name="endpoints">Endpoint route builder.</param>
    /// <returns>Endpoint route builder.</returns>
    public static IEndpointRouteBuilder MapStubEndpoints(this IEndpointRouteBuilder endpoints)
    {
        // GET /api/internal/stubs
        endpoints.MapGet("/api/internal/stubs", () =>
        {
            var controller = new StubsController();
            return Results.Ok(controller.GetAll());
        })
        .WithName("GetAllStubs")
        .WithTags("Stubs");

        // GET /api/internal/stubs/stats
        endpoints.MapGet("/api/internal/stubs/stats", () =>
        {
            var controller = new StubsController();
            return Results.Ok(controller.GetStats());
        })
        .WithName("GetStubStats")
        .WithTags("Stubs");

        // GET /api/internal/stubs/{name}
        endpoints.MapGet("/api/internal/stubs/{name}", (string name) =>
        {
            var controller = new StubsController();
            return controller.Get(name);
        })
        .WithName("GetStub")
        .WithTags("Stubs");

        // PATCH /api/internal/stubs/{name}
        endpoints.MapPatch("/api/internal/stubs/{name}", (string name, StubConfigurationRequest request) =>
        {
            var controller = new StubsController();
            return controller.Configure(name, request);
        })
        .WithName("ConfigureStub")
        .WithTags("Stubs");

        // PUT /api/internal/stubs/{name}/mode
        endpoints.MapPut("/api/internal/stubs/{name}/mode", (string name, string mode) =>
        {
            var controller = new StubsController();
            return controller.SetMode(name, mode);
        })
        .WithName("SetStubMode")
        .WithTags("Stubs");

        // PUT /api/internal/stubs/{name}/enabled
        endpoints.MapPut("/api/internal/stubs/{name}/enabled", (string name, bool enabled) =>
        {
            var controller = new StubsController();
            return controller.SetEnabled(name, enabled);
        })
        .WithName("SetStubEnabled")
        .WithTags("Stubs");

        // POST /api/internal/stubs/reset
        endpoints.MapPost("/api/internal/stubs/reset", () =>
        {
            var controller = new StubsController();
            return controller.ResetAll();
        })
        .WithName("ResetAllStubs")
        .WithTags("Stubs");

        // POST /api/internal/stubs
        endpoints.MapPost("/api/internal/stubs", (StubDefinitionRequest request) =>
        {
            var controller = new StubsController();
            return controller.Register(request);
        })
        .WithName("RegisterStub")
        .WithTags("Stubs");

        // DELETE /api/internal/stubs/{name}
        endpoints.MapDelete("/api/internal/stubs/{name}", (string name) =>
        {
            var controller = new StubsController();
            return controller.Remove(name);
        })
        .WithName("DeleteStub")
        .WithTags("Stubs");

        return endpoints;
    }
}

/// <summary>
/// Методы расширения для конфигурации Chaos.
/// </summary>
public static class ChaosConfigurationExtensions
{
    /// <summary>
    /// Настроить Chaos Options из конфигурации.
    /// </summary>
    /// <returns></returns>
    public static ChaosOptions ConfigureFrom(this ChaosOptions options, IConfiguration configuration)
    {
        configuration.GetSection("Chaos").Bind(options);
        return options;
    }

    /// <summary>
    /// Включить Chaos Engineering для тестовой среды.
    /// </summary>
    /// <returns></returns>
    public static ChaosOptions EnableForTesting(this ChaosOptions options, double failureRate = 0.1)
    {
        options.Enabled = true;
        options.EnableRandomFailures = true;
        options.FailureRate = failureRate;
        return options;
    }

    /// <summary>
    /// Отключить Chaos Engineering.
    /// </summary>
    /// <returns></returns>
    public static ChaosOptions Disable(this ChaosOptions options)
    {
        options.Enabled = false;
        options.EnableRandomFailures = false;
        options.EnableLatency = false;
        options.EnableServiceOutage = false;
        return options;
    }

    /// <summary>
    /// Настроить Chaos для симуляции медленных ответов.
    /// </summary>
    /// <returns></returns>
    public static ChaosOptions ConfigureSlowResponses(
        this ChaosOptions options,
        int minLatencyMs = 500,
        int maxLatencyMs = 3000,
        double latencyRate = 0.5)
    {
        options.EnableLatency = true;
        options.LatencyRate = latencyRate;
        options.MinLatencyMs = minLatencyMs;
        options.MaxLatencyMs = maxLatencyMs;
        return options;
    }

    /// <summary>
    /// Настроить Chaos для симуляции случайных ошибок.
    /// </summary>
    /// <returns></returns>
    public static ChaosOptions ConfigureRandomFailures(
        this ChaosOptions options,
        double failureRate = 0.1)
    {
        options.EnableRandomFailures = true;
        options.FailureRate = failureRate;
        return options;
    }
}
#pragma warning restore ASP0004, ASP0005, CA1716, SA1402, SA1616, SA1625
