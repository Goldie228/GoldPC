using GoldPC.Shared.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace GoldPC.Shared.Services.Mocks;

/// <summary>
/// Методы расширения для регистрации mock-сервисов в DI
/// </summary>
public static class MockServiceExtensions
{
    /// <summary>
    /// Регистрирует mock-сервисы при работе в Development окружении
    /// </summary>
    public static IServiceCollection AddMockServices(
        this IServiceCollection services, 
        IHostEnvironment environment)
    {
        if (!environment.IsDevelopment())
        {
            return services;
        }

        services.AddSingleton<IPaymentService, PaymentServiceMock>();
        services.AddSingleton<INotificationService, NotificationServiceMock>();

        return services;
    }

    /// <summary>
    /// Регистрирует mock-сервисы с настраиваемыми параметрами
    /// </summary>
    public static IServiceCollection AddMockServices(
        this IServiceCollection services,
        IHostEnvironment environment,
        Action<MockServicesConfiguration> configure)
    {
        if (!environment.IsDevelopment())
        {
            return services;
        }

        var config = new MockServicesConfiguration();
        configure(config);

        if (config.UsePaymentServiceMock)
        {
            services.AddSingleton<IPaymentService>(sp =>
            {
                var logger = sp.GetRequiredService<ILogger<PaymentServiceMock>>();
                return new PaymentServiceMock(logger)
                {
                    SuccessRate = config.PaymentSuccessRate,
                    MinDelayMs = config.MinPaymentDelayMs,
                    MaxDelayMs = config.MaxPaymentDelayMs,
                    EnableDelay = config.EnablePaymentDelay
                };
            });
        }

        if (config.UseNotificationServiceMock)
        {
            services.AddSingleton<INotificationService>(sp =>
            {
                var logger = sp.GetRequiredService<ILogger<NotificationServiceMock>>();
                return new NotificationServiceMock(logger)
                {
                    EnableConsoleLogging = config.EnableNotificationLogging,
                    SimulatedDelayMs = config.NotificationDelayMs
                };
            });
        }

        return services;
    }

    /// <summary>
    /// Регистрирует mock-сервисы в любом окружении (для тестов)
    /// </summary>
    public static IServiceCollection AddMockServicesForTesting(this IServiceCollection services)
    {
        services.AddSingleton<IPaymentService, PaymentServiceMock>();
        services.AddSingleton<INotificationService, NotificationServiceMock>();

        return services;
    }

    /// <summary>
    /// Регистрирует mock-сервисы с настройками для тестирования
    /// </summary>
    public static IServiceCollection AddMockServicesForTesting(
        this IServiceCollection services,
        double paymentSuccessRate = 1.0,
        bool enablePaymentDelay = false)
    {
        services.AddSingleton<IPaymentService>(sp =>
        {
            var logger = sp.GetRequiredService<ILogger<PaymentServiceMock>>();
            return new PaymentServiceMock(logger)
            {
                SuccessRate = paymentSuccessRate,
                EnableDelay = enablePaymentDelay,
                MinDelayMs = 0,
                MaxDelayMs = 0
            };
        });

        services.AddSingleton<INotificationService>(sp =>
        {
            var logger = sp.GetRequiredService<ILogger<NotificationServiceMock>>();
            return new NotificationServiceMock(logger)
            {
                EnableConsoleLogging = false,
                SimulatedDelayMs = 0
            };
        });

        return services;
    }
}

/// <summary>
/// Конфигурация mock-сервисов
/// </summary>
public class MockServicesConfiguration
{
    public bool UsePaymentServiceMock { get; set; } = true;
    public bool UseNotificationServiceMock { get; set; } = true;
    public double PaymentSuccessRate { get; set; } = 0.95;
    public bool EnablePaymentDelay { get; set; } = true;
    public int MinPaymentDelayMs { get; set; } = 100;
    public int MaxPaymentDelayMs { get; set; } = 1000;
    public bool EnableNotificationLogging { get; set; } = true;
    public int NotificationDelayMs { get; set; } = 50;
}