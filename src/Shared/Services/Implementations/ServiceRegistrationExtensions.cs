using GoldPC.Shared.Services.Background;
using GoldPC.Shared.Services.Interfaces;
using GoldPC.Shared.Services.Mocks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace GoldPC.Shared.Services.Implementations;

public static class ServiceRegistrationExtensions
{
    public static IServiceCollection AddProductionNotifications(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        if (environment.IsDevelopment() && configuration.GetValue<bool>("UseMocks", true))
        {
            services.AddSingleton<INotificationService>(sp =>
            {
                var logger = sp.GetRequiredService<ILogger<NotificationServiceMock>>();
                return new NotificationServiceMock(logger)
                {
                    EnableConsoleLogging = true,
                    SimulatedDelayMs = 50
                };
            });
            return services;
        }

        // 1. Email Integration (SMTP + Async Queue)
        services.AddSingleton<SmtpEmailService>();
        services.AddSingleton<IEmailQueue, EmailQueue>();
        services.AddHostedService<EmailBackgroundWorker>();

        // 2. SMS Integration (Twilio)
        services.AddSingleton<TwilioSmsService>();

        // 3. Combined Notification Service with Logging Decorator
        services.AddScoped<ProductionNotificationService>();
        services.AddScoped<INotificationService>(sp => 
        {
            var inner = sp.GetRequiredService<ProductionNotificationService>();
            var logger = sp.GetRequiredService<ILogger<NotificationServiceLoggingDecorator>>();
            return new NotificationServiceLoggingDecorator(inner, logger);
        });

        return services;
    }

    public static IServiceCollection AddProductionPayment(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        if (environment.IsDevelopment() && configuration.GetValue<bool>("UseMocks", true))
        {
            services.AddSingleton<IPaymentService>(sp =>
            {
                var logger = sp.GetRequiredService<ILogger<PaymentServiceMock>>();
                return new PaymentServiceMock(logger)
                {
                    SuccessRate = 0.95,
                    MinDelayMs = 100,
                    MaxDelayMs = 1000,
                    EnableDelay = true
                };
            });
            return services;
        }

        // Stripe Integration with Decorator
        // Note: StripePaymentService is usually in OrdersService, but we can make it generic or keep it there.
        // For now, assume it's in the calling project or shared if moved.
        return services;
    }
}
