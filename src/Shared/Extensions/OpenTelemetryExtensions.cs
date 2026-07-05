#pragma warning disable CA1716, S125
using Microsoft.Extensions.DependencyInjection;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

namespace Shared.Extensions;

/// <summary>
/// Extension методы для настройки OpenTelemetry с экспортером Prometheus.
/// </summary>
public static class OpenTelemetryExtensions
{
    /// <summary>
    /// Добавляет сервисы OpenTelemetry с экспортером Prometheus для сбора метрик.
    /// </summary>
    /// <param name="services">Коллекция сервисов.</param>
    /// <param name="serviceName">Имя сервиса для идентификации телеметрии.</param>
    /// <returns>Коллекция сервисов для chaining.</returns>
    public static IServiceCollection AddGoldPCOpenTelemetry(
        this IServiceCollection services,
        string serviceName)
    {
        services.AddOpenTelemetry()
            .WithMetrics(builder =>
            {
                builder
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddRuntimeInstrumentation()
                    .AddProcessInstrumentation()
                    .AddPrometheusExporter(options =>
                    {
                        options.ScrapeEndpointPath = "/metrics";
                    });

                // Add custom meters for the service
                builder.AddMeter(serviceName);
            })
            .WithTracing(builder =>
            {
                builder
                    .AddAspNetCoreInstrumentation(options =>
                    {
                        options.RecordException = true;
                        options.EnrichWithHttpRequest = (activity, request) =>
                        {
                            activity.SetTag("http.request.body.size", request.ContentLength);
                        };
                    })
                    .AddHttpClientInstrumentation()
                    .AddSource(serviceName);

                // Only add Jaeger exporter if configured
                // builder.AddJaegerExporter(options =>
                // {
                //     options.AgentHost = configuration["Jaeger:Host"] ?? "localhost";
                //     options.AgentPort = configuration.GetValue<int>("Jaeger:Port", 6831);
                // });
            });

        return services;
    }
}
#pragma warning restore CA1716, S125
