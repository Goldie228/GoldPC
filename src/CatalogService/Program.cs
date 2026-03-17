using System.Diagnostics;
using CatalogService.Data;
using CatalogService.Repositories;
using CatalogService.Repositories.Interfaces;
using CatalogService.Services;
using CatalogService.Services.Interfaces;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using OpenTelemetry;
using OpenTelemetry.Exporter;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;
using Serilog.Formatting.Json;
using Shared.Data;
using Shared.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Настройка Serilog с разделением форматов для Development/Production
var loggerConfiguration = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "GoldPC")
    .Enrich.WithProperty("Service", "CatalogService");

if (builder.Environment.IsProduction())
{
    loggerConfiguration.WriteTo.Console(new JsonFormatter());
}
else
{
    loggerConfiguration.WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}");
}

loggerConfiguration.WriteTo.File("logs/catalog-service-.log", rollingInterval: RollingInterval.Day);
Log.Logger = loggerConfiguration.CreateLogger();

builder.Host.UseSerilog();

// Добавление сервисов
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "GoldPC Catalog Service API",
        Version = "v1",
        Description = "API сервиса каталога товаров для компьютерного магазина GoldPC"
    });
});

// Настройка PostgreSQL
var connectionString = builder.Configuration.GetConnectionString("PostgreSQL") 
    ?? "Host=localhost;Database=goldpc_catalog;Username=postgres;Password=postgres";

builder.Services.AddDbContext<CatalogDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 5);
    }));

// Регистрация репозиториев
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IManufacturerRepository, ManufacturerRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();

// Регистрация сервисов
builder.Services.AddScoped<ICatalogService, CatalogService.Services.CatalogService>();

// Настройка CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Настройка Redis
var redisConnection = builder.Configuration.GetConnectionString("Redis") 
    ?? "localhost:6379";

// Health checks с проверкой PostgreSQL и Redis
builder.Services.AddHealthChecks()
    .AddNpgSql(
        connectionString,
        name: "postgresql",
        tags: new[] { "db", "critical" },
        failureStatus: Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Unhealthy)
    .AddRedis(
        redisConnection,
        name: "redis",
        tags: new[] { "cache", "critical" },
        failureStatus: Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Unhealthy);

// Chaos Middleware (только в Development)
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddChaosMiddleware(builder.Configuration);
}

// Настройка OpenTelemetry Tracing с Jaeger Exporter
var jaegerHost = builder.Configuration["Jaeger:Host"] 
    ?? Environment.GetEnvironmentVariable("JAEGER_HOST") 
    ?? "localhost";
var jaegerPort = builder.Configuration.GetValue<int>("Jaeger:Port", 
    int.TryParse(Environment.GetEnvironmentVariable("JAEGER_PORT"), out var port) ? port : 6831);

builder.Services.AddOpenTelemetry()
    .WithTracing(tracerProviderBuilder =>
    {
        tracerProviderBuilder
            .AddSource("GoldPC.CatalogService")
            .SetResourceBuilder(ResourceBuilder.CreateDefault()
                .AddService("CatalogService", serviceVersion: "1.0.0")
                .AddAttributes(new[]
                {
                    new KeyValuePair<string, object>("deployment.environment", builder.Environment.EnvironmentName)
                }))
            .AddAspNetCoreInstrumentation(options =>
            {
                options.RecordException = true;
                options.EnrichWithHttpRequest = (activity, request) =>
                {
                    activity.SetTag("http.request.body.size", request.ContentLength);
                    activity.SetTag("http.request.scheme", request.Scheme);
                };
                options.EnrichWithHttpResponse = (activity, response) =>
                {
                    activity.SetTag("http.response.content_type", response.ContentType);
                };
            })
            .AddHttpClientInstrumentation(options =>
            {
                options.RecordException = true;
            })
            .AddJaegerExporter(options =>
            {
                options.AgentHost = jaegerHost;
                options.AgentPort = jaegerPort;
                options.ExportProcessorType = ExportProcessorType.Batch;
                options.BatchExportProcessorOptions = new BatchExportProcessorOptions<Activity>
                {
                    MaxQueueSize = 2048,
                    ScheduledDelayMilliseconds = 5000,
                    ExporterTimeoutMilliseconds = 30000,
                    MaxExportBatchSize = 512
                };
            });
    })
    .WithMetrics(meterProviderBuilder =>
    {
        meterProviderBuilder
            .SetResourceBuilder(ResourceBuilder.CreateDefault()
                .AddService("CatalogService", serviceVersion: "1.0.0"))
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation()
            .AddProcessInstrumentation()
            .AddPrometheusExporter(options =>
            {
                options.ScrapeEndpointPath = "/metrics";
            });
    });

Log.Information("OpenTelemetry configured with Jaeger exporter: {Host}:{Port}", jaegerHost, jaegerPort);

var app = builder.Build();

// Security Headers Middleware - должен быть в начале pipeline
app.UseSecurityHeaders();

// Correlation ID Middleware - добавляет X-Correlation-ID для распределённой трассировки
app.UseCorrelationId();

// Применение миграций при запуске с использованием extension метода
// Пропускаем миграции в среде Testing (для WebApplicationFactory)
if (!app.Environment.IsEnvironment("Testing"))
{
    app.ApplyMigrations<CatalogDbContext>();
}

// Настройка pipeline
// Chaos Middleware должен быть добавлен в начале pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Catalog Service v1");
    });
    
    // Включаем Chaos Middleware только в Development
    app.UseChaosMiddleware();
}

app.UseCors();
app.UseAuthorization();
app.MapControllers();

// Health check endpoints для container orchestration
// /health - полный отчет со всеми зависимостями (для мониторинга и диагностики)
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

// /health/ready - readiness probe для Kubernetes (только критические зависимости)
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("critical"),
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

// /health/live - liveness probe (проверяет только, что приложение запущено)
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false
});

// Prometheus metrics endpoint для сбора метрик
app.MapPrometheusScrapingEndpoint();

Log.Information("Catalog Service запущен на порту {Port}", 
    app.Services.GetRequiredService<IConfiguration>()["ASPNETCORE_URLS"] ?? "5000");

app.Run();

/// <summary>
/// Partial класс для обеспечения доступа к Program из тестов (WebApplicationFactory)
/// </summary>
public partial class Program { }
