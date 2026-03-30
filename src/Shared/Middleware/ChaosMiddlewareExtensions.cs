#pragma warning disable S1481
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Shared.Middleware;

/// <summary>
/// Extension методы для регистрации Chaos Middleware в DI контейнере.
/// </summary>
public static class ChaosMiddlewareExtensions
{
    /// <summary>
    /// Добавляет Chaos Middleware сервисы в DI контейнер.
    /// Конфигурация загружается из секции "Chaos" в appsettings.json.
    /// </summary>
    /// <param name="services">Коллекция сервисов.</param>
    /// <param name="configuration">Конфигурация приложения.</param>
    /// <returns>Коллекция сервисов для chaining.</returns>
    public static IServiceCollection AddChaosMiddleware(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var options = configuration.GetSection("Chaos").Get<ChaosOptions>()
                      ?? new ChaosOptions();

        services.Configure<ChaosOptions>(configuration.GetSection("Chaos"));

        return services;
    }

    /// <summary>
    /// Добавляет Chaos Middleware сервисы с пользовательской конфигурацией.
    /// </summary>
    /// <param name="services">Коллекция сервисов.</param>
    /// <param name="configure">Делегат для конфигурации опций.</param>
    /// <returns>Коллекция сервисов для chaining.</returns>
    public static IServiceCollection AddChaosMiddleware(
        this IServiceCollection services,
        Action<ChaosOptions> configure)
    {
        services.Configure(configure);
        return services;
    }

    /// <summary>
    /// Добавляет Chaos Middleware в pipeline запросов.
    /// </summary>
    /// <param name="builder">Builder приложения.</param>
    /// <returns>Builder приложения для chaining.</returns>
    public static IApplicationBuilder UseChaosMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ChaosMiddleware>();
    }

    /// <summary>
    /// Добавляет Chaos Middleware в pipeline запросов условно (только в Development).
    /// </summary>
    /// <param name="builder">Builder приложения.</param>
    /// <param name="isDevelopment">Флаг, указывающий, является ли среда Development.</param>
    /// <returns>Builder приложения для chaining.</returns>
    public static IApplicationBuilder UseChaosMiddlewareIfDevelopment(
        this IApplicationBuilder builder,
        bool isDevelopment)
    {
        if (isDevelopment)
        {
            builder.UseMiddleware<ChaosMiddleware>();
        }

        return builder;
    }
}
#pragma warning restore S1481
