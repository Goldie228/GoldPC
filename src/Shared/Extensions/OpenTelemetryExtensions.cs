using Microsoft.Extensions.DependencyInjection;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

namespace Shared.Extensions;

/// <summary>
/// Extension methods for configuring OpenTelemetry with Prometheus exporter.
/// </summary>
public static class OpenTelemetryExtensions
{
    /// <summary>
    /// Adds OpenTelemetry services with Prometheus exporter for metrics collection.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="serviceName">The name of the service for telemetry identification.</param>
    /// <returns>The service collection for chaining.</returns>
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