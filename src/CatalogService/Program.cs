using System.Diagnostics;
using CatalogService.Data;
using Npgsql;
using CatalogService.Repositories;
using CatalogService.Repositories.Interfaces;
using CatalogService.Services;
using CatalogService.Services.Interfaces;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using OpenTelemetry;
using OpenTelemetry.Exporter;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;
using Serilog.Formatting.Json;
using Shared.Data;
using Shared.Middleware;
using Shared.Messaging;
using CatalogService.Consumers;

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
builder.Services.AddGrpc();
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

// Настройка PostgreSQL (EnableDynamicJson для Specifications Dictionary<string, object>)
var connectionString = builder.Configuration.GetConnectionString("PostgreSQL") 
    ?? "Host=localhost;Database=goldpc_catalog;Username=postgres;Password=postgres";

var readConnectionString = builder.Configuration.GetConnectionString("ReadPostgreSQL") 
    ?? connectionString;

var npgsqlBuilder = new NpgsqlDataSourceBuilder(connectionString);
npgsqlBuilder.EnableDynamicJson();
var dataSource = npgsqlBuilder.Build();
builder.Services.AddSingleton(dataSource);

var readNpgsqlBuilder = new NpgsqlDataSourceBuilder(readConnectionString);
readNpgsqlBuilder.EnableDynamicJson();
var readDataSource = readNpgsqlBuilder.Build();
builder.Services.AddKeyedSingleton("ReadPostgreSQL", readDataSource);

builder.Services.AddDbContext<CatalogDbContext>(options =>
    options.UseNpgsql(dataSource, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 5);
    }));

builder.Services.AddDbContext<ReadOnlyCatalogDbContext>(options =>
    options.UseNpgsql(readDataSource, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 5);
    }));

// Регистрация репозиториев
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IManufacturerRepository, ManufacturerRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();

// Регистрация сервисов
builder.Services.AddScoped<CatalogService.Services.SpecImportNormalizer>();
builder.Services.AddScoped<CatalogService.Services.ManufacturerDetector>();
builder.Services.AddScoped<CatalogService.Services.SpecificationDataMigration>();
builder.Services.AddScoped<ICatalogService, CatalogService.Services.CatalogService>();
builder.Services.AddScoped<CatalogService.Services.CatalogJsonImporter>();
builder.Services.AddScoped<CatalogService.Services.FilterAttributesSeeder>();

// Redis Caching
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
    options.InstanceName = "Catalog_";
});

// Messaging (Consumers for OrderPaidEvent and OrderPlacedEvent)
builder.Services.AddMessaging(builder.Configuration, x =>
{
    x.AddConsumer<OrderPaidConsumer>();
    x.AddConsumer<OrderPlacedConsumer>();
});

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

// Раздача локальных изображений из /uploads (product_images.path, manufacturers.logo_path)
var uploadsPath = builder.Configuration["CatalogService:UploadsPath"] ?? "uploads";
var uploadsFullPath = Path.Combine(builder.Environment.ContentRootPath, uploadsPath);
if (!Directory.Exists(uploadsFullPath))
{
    Directory.CreateDirectory(uploadsFullPath);
}
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsFullPath),
    RequestPath = "/uploads",
});

app.UseAuthorization();
app.MapControllers();
app.MapGrpcService<CatalogService.Grpc.CatalogGrpcService>();

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

// CLI: dotnet run -- seed-xcore-images [путь к xcore-images.json]
if (args is ["seed-xcore-images"] or ["seed-xcore-images", _])
{
    var jsonPath = args.Length == 2 ? args[1] : null;
    if (string.IsNullOrEmpty(jsonPath))
    {
        var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
        jsonPath = Path.Combine(repoRoot, "scripts", "scraper", "data", "xcore-images.json");
    }
    else if (!Path.IsPathRooted(jsonPath))
    {
        var fromCwd = Path.GetFullPath(Path.Combine(Environment.CurrentDirectory, jsonPath));
        var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
        var fromRepo = Path.Combine(repoRoot, jsonPath);
        jsonPath = File.Exists(fromCwd) ? fromCwd : (File.Exists(fromRepo) ? fromRepo : fromCwd);
    }
    if (!File.Exists(jsonPath))
    {
        Console.WriteLine($"Файл не найден: {jsonPath}");
        Console.WriteLine("Сначала выполните: cd scripts/scraper && node fetch-product-images.mjs");
        return 1;
    }
    using var scope = app.Services.CreateScope();
    var importer = scope.ServiceProvider.GetRequiredService<CatalogService.Services.CatalogJsonImporter>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var result = await importer.UpdateProductImagesFromFileAsync(jsonPath);
        logger.LogInformation("Обновление изображений: {Updated} обновлено, {Deleted} очищено (SKU не в файле), {NotFound} не найдено, {Errors} ошибок",
            result.Updated, result.Deleted, result.NotFound, result.Errors);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Ошибка обновления изображений");
        throw;
    }
    return 0;
}

// CLI: dotnet run -- seed-xcore-images-merge [путь к xcore-images.json]
// Инкрементально добавляет новые изображения без удаления уже существующих.
if (args is ["seed-xcore-images-merge"] or ["seed-xcore-images-merge", _])
{
    var jsonPath = args.Length == 2 ? args[1] : null;
    if (string.IsNullOrEmpty(jsonPath))
    {
        var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
        jsonPath = Path.Combine(repoRoot, "scripts", "scraper", "data", "xcore-images.json");
    }
    else if (!Path.IsPathRooted(jsonPath))
    {
        var fromCwd = Path.GetFullPath(Path.Combine(Environment.CurrentDirectory, jsonPath));
        var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
        var fromRepo = Path.Combine(repoRoot, jsonPath);
        jsonPath = File.Exists(fromCwd) ? fromCwd : (File.Exists(fromRepo) ? fromRepo : fromCwd);
    }

    if (!File.Exists(jsonPath))
    {
        Console.WriteLine($"Файл не найден: {jsonPath}");
        Console.WriteLine("Сначала выполните: cd scripts/scraper && npm run fetch-images");
        return 1;
    }

    using var scope = app.Services.CreateScope();
    var importer = scope.ServiceProvider.GetRequiredService<CatalogService.Services.CatalogJsonImporter>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var result = await importer.MergeProductImagesFromFileAsync(jsonPath);
        logger.LogInformation("Merge изображений: {Updated} товаров дополнено, {NotFound} не найдено, {Errors} ошибок",
            result.Updated, result.NotFound, result.Errors);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Ошибка seed-xcore-images-merge");
        throw;
    }

    return 0;
}

// CLI: dotnet run -- seed-catalog-reset (алиас: seed-xcore-reset)
// Полный сброс товаров XCORE-* и импорт из scripts/seed-data/catalog-seed.json; опционально merge картинок из JSON
if (args is ["seed-catalog-reset"] or ["seed-xcore-reset"])
{
    var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
    var productsPath = Path.Combine(repoRoot, "scripts", "seed-data", "catalog-seed.json");
    if (!File.Exists(productsPath))
    {
        productsPath = Path.Combine(repoRoot, "scripts", "scraper", "data", "xcore-products.json");
    }

    var imagesPath = Path.Combine(repoRoot, "scripts", "scraper", "data", "xcore-images.json");

    if (!File.Exists(productsPath))
    {
        Console.WriteLine($"Файл не найден: {productsPath}");
        return 1;
    }

    using var scope = app.Services.CreateScope();
    var importer = scope.ServiceProvider.GetRequiredService<CatalogService.Services.CatalogJsonImporter>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        var deleted = await importer.DeleteXCoreProductsAsync();
        logger.LogInformation("Удалено товаров со SKU XCORE-*: {Count}", deleted);

        var importResult = await importer.ImportFromFileAsync(productsPath);
        logger.LogInformation("Импорт: {Imported} добавлено, {Updated} обновлено, {Skipped} пропущено, {Errors} ошибок",
            importResult.Imported, importResult.Updated, importResult.Skipped, importResult.Errors);

        if (File.Exists(imagesPath))
        {
            var imagesResult = await importer.UpdateProductImagesFromFileAsync(imagesPath);
            logger.LogInformation("Изображения (опционально): {Updated} обновлено, {Deleted} очищено, {NotFound} не найдено, {Errors} ошибок",
                imagesResult.Updated, imagesResult.Deleted, imagesResult.NotFound, imagesResult.Errors);
        }
        else
        {
            logger.LogInformation("Файл картинок не найден ({ImagesPath}), пропуск обновления изображений из внешнего JSON", imagesPath);
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Ошибка seed-catalog-reset");
        throw;
    }
    return 0;
}

// CLI: dotnet run -- migrate-gpu-release-year
// Миграция: data_vykhoda_na_rynok_2 → release_year для видеокарт
if (args is ["migrate-gpu-release-year"])
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var gpuCategory = await context.Categories.FirstOrDefaultAsync(c => c.Slug == "gpu");
        if (gpuCategory == null)
        {
            logger.LogWarning("Категория gpu не найдена");
            return 1;
        }
        var dataAttr = await context.SpecificationAttributes.FirstOrDefaultAsync(a => a.Key == "data_vykhoda_na_rynok_2");
        var releaseAttr = await context.SpecificationAttributes.FirstOrDefaultAsync(a => a.Key == "release_year");
        if (dataAttr == null || releaseAttr == null)
        {
            logger.LogInformation("Миграция GPU: атрибуты data_vykhoda_na_rynok_2/release_year не найдены, пропуск");
            return 0;
        }
        var psvs = await context.ProductSpecificationValues
            .Where(psv => psv.AttributeId == dataAttr.Id)
            .Include(psv => psv.CanonicalValue)
            .ToListAsync();
        var migrated = 0;
        foreach (var psv in psvs)
        {
            if (psv.CanonicalValue == null) continue;
            var cvRelease = await context.SpecificationCanonicalValues
                .FirstOrDefaultAsync(cv => cv.AttributeId == releaseAttr.Id && cv.ValueText == psv.CanonicalValue.ValueText);
            if (cvRelease == null)
            {
                cvRelease = new CatalogService.Models.SpecificationCanonicalValue
                {
                    Id = Guid.NewGuid(),
                    AttributeId = releaseAttr.Id,
                    ValueText = psv.CanonicalValue.ValueText,
                    SortOrder = 999
                };
                context.SpecificationCanonicalValues.Add(cvRelease);
                await context.SaveChangesAsync();
            }
            context.ProductSpecificationValues.Add(new CatalogService.Models.ProductSpecificationValue
            {
                Id = Guid.NewGuid(),
                ProductId = psv.ProductId,
                AttributeId = releaseAttr.Id,
                CanonicalValueId = cvRelease.Id,
                ValueNumber = null
            });
            context.ProductSpecificationValues.Remove(psv);
            migrated++;
        }
        await context.SaveChangesAsync();
        logger.LogInformation("Миграция GPU: {Migrated} товаров обновлено (data_vykhoda_na_rynok_2 → release_year)", migrated);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Ошибка миграции migrate-gpu-release-year");
        throw;
    }
    return 0;
}

// CLI: dotnet run -- seed-filter-attributes [путь к xcore-filter-attributes.json]
if (args is ["seed-filter-attributes"] or ["seed-filter-attributes", _])
{
    var jsonPath = args.Length == 2 ? args[1] : null;
    if (string.IsNullOrEmpty(jsonPath))
    {
        var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
        jsonPath = Path.Combine(repoRoot, "scripts", "scraper", "config", "xcore-filter-attributes.json");
    }
    else if (!Path.IsPathRooted(jsonPath))
    {
        var fromCwd = Path.GetFullPath(Path.Combine(Environment.CurrentDirectory, jsonPath));
        var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
        var fromRepo = Path.Combine(repoRoot, jsonPath);
        jsonPath = File.Exists(fromCwd) ? fromCwd : (File.Exists(fromRepo) ? fromRepo : fromCwd);
    }
    if (!File.Exists(jsonPath))
    {
        Console.WriteLine($"Файл не найден: {jsonPath}");
        return 1;
    }
    using var scope = app.Services.CreateScope();
    var seeder = scope.ServiceProvider.GetRequiredService<CatalogService.Services.FilterAttributesSeeder>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var result = await seeder.SeedFromFileAsync(jsonPath);
        logger.LogInformation("Filter attributes: {Added} добавлено, {Deleted} удалено, {Skipped} пропущено",
            result.Added, result.Deleted, result.Skipped);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Ошибка seed-filter-attributes");
        throw;
    }
    return 0;
}

// CLI: dotnet run -- seed-catalog [путь к JSON]  (алиас: seed-xcore)
if (args is ["seed-catalog"] or ["seed-catalog", _] or ["seed-xcore"] or ["seed-xcore", _])
{
    var jsonPath = args.Length == 2 ? args[1] : null;
    if (string.IsNullOrEmpty(jsonPath))
    {
        var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
        jsonPath = Path.Combine(repoRoot, "scripts", "seed-data", "catalog-seed.json");
        if (!File.Exists(jsonPath))
        {
            jsonPath = Path.Combine(repoRoot, "scripts", "scraper", "data", "sample-products.json");
        }
    }
    else if (!Path.IsPathRooted(jsonPath))
    {
        var fromCwd = Path.GetFullPath(Path.Combine(Environment.CurrentDirectory, jsonPath));
        var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
        var fromRepo = Path.Combine(repoRoot, jsonPath);
        jsonPath = File.Exists(fromCwd) ? fromCwd : (File.Exists(fromRepo) ? fromRepo : fromCwd);
    }
    using var scope = app.Services.CreateScope();
    var importer = scope.ServiceProvider.GetRequiredService<CatalogService.Services.CatalogJsonImporter>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var result = await importer.ImportFromFileAsync(jsonPath);
        logger.LogInformation("Импорт завершён: {Imported} добавлено, {Updated} обновлено, {Skipped} пропущено, {Errors} ошибок",
            result.Imported, result.Updated, result.Skipped, result.Errors);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Ошибка импорта");
        throw;
    }
    return 0;
}

// CLI: dotnet run -- delete-demo-catalog-products
// Удаляет товары офлайн-cида: ExternalId начинается с demo_ или SKU с DEMO-.
if (args is ["delete-demo-catalog-products"])
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var toDelete = await context.Products
            .Where(p =>
                (p.ExternalId != null && EF.Functions.ILike(p.ExternalId, "demo_%")) ||
                (p.Sku != null && EF.Functions.ILike(p.Sku, "DEMO-%")))
            .ToListAsync();
        context.Products.RemoveRange(toDelete);
        await context.SaveChangesAsync();
        logger.LogInformation("Удалено демо-товаров каталога: {Count}", toDelete.Count);
        Console.WriteLine($"Удалено демо-товаров: {toDelete.Count}");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Ошибка delete-demo-catalog-products");
        throw;
    }
    return 0;
}

// CLI: dotnet run -- backfill-manufacturers [batchSize]
// Разово доопределяет производителя для товаров без ManufacturerId.
if (args is ["backfill-manufacturers"] or ["backfill-manufacturers", _])
{
    var batchSize = 100;
    if (args.Length == 2 && int.TryParse(args[1], out var parsedBatchSize) && parsedBatchSize > 0)
    {
        batchSize = parsedBatchSize;
    }

    using var scope = app.Services.CreateScope();
    var importer = scope.ServiceProvider.GetRequiredService<CatalogService.Services.CatalogJsonImporter>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        var result = await importer.BackfillMissingManufacturersAsync(batchSize);
        logger.LogInformation(
            "Backfill производителей завершён: кандидатов {Total}, обработано {Processed}, обновлено {UpdatedProducts}, создано производителей {CreatedManufacturers}, пропущено {Skipped}, ошибок {Errors}",
            result.TotalCandidates,
            result.Processed,
            result.UpdatedProducts,
            result.CreatedManufacturers,
            result.Skipped,
            result.Errors);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Ошибка backfill-manufacturers");
        throw;
    }

    return 0;
}

// CLI: dotnet run -- sync-image-paths-from-disk
// Проставляет path в product_images, если файл уже есть на диске (как download-images.mjs).
if (args is ["sync-image-paths-from-disk"])
{
    using var scope = app.Services.CreateScope();
    var importer = scope.ServiceProvider.GetRequiredService<CatalogService.Services.CatalogJsonImporter>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var result = await importer.SyncImagePathsFromDiskAsync();
        logger.LogInformation(
            "sync-image-paths-from-disk: просмотрено записей {Scanned}, обновлено path {Updated}",
            result.Scanned,
            result.Updated);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Ошибка sync-image-paths-from-disk");
        throw;
    }

    return 0;
}

// CLI: dotnet run -- cleanup-invalid-products
// Удаляет невалидные товары с external_id (без производителя или без локальных изображений).
if (args is ["cleanup-invalid-products"])
{
    using var scope = app.Services.CreateScope();
    var importer = scope.ServiceProvider.GetRequiredService<CatalogService.Services.CatalogJsonImporter>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        var result = await importer.CleanupInvalidProductsAsync();
        logger.LogInformation(
            "Cleanup невалидных товаров: проверено {Checked}, удалено {Deleted}, без производителя {MissingManufacturer}, без изображений {MissingImages}",
            result.Checked,
            result.Deleted,
            result.MissingManufacturer,
            result.MissingImages);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Ошибка cleanup-invalid-products");
        throw;
    }

    return 0;
}

Log.Information("Catalog Service запущен на: {Urls}", string.Join(", ", app.Urls));

await app.RunAsync();
return 0;

/// <summary>
/// Partial класс для обеспечения доступа к Program из тестов (WebApplicationFactory)
/// </summary>
public partial class Program { }
