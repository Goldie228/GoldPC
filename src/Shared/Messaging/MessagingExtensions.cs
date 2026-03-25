using System;
using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Shared.Messaging;

public static class MessagingExtensions
{
    public static IServiceCollection AddMessaging(this IServiceCollection services, IConfiguration configuration, Action<IBusRegistrationConfigurator>? configureConsumers = null)
    {
        services.AddMassTransit(x =>
        {
            x.SetKebabCaseEndpointNameFormatter();

            if (configureConsumers != null)
            {
                configureConsumers(x);
            }

            x.UsingRabbitMq((context, cfg) =>
            {
                var rabbitMqOptions = configuration.GetSection("RabbitMQ");
                cfg.Host(rabbitMqOptions["Host"] ?? "localhost", "/", h =>
                {
                    h.Username(rabbitMqOptions["Username"] ?? "guest");
                    h.Password(rabbitMqOptions["Password"] ?? "guest");
                });

                cfg.ConfigureEndpoints(context);
            });
        });

        return services;
    }
}
