using System.Diagnostics;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
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
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;
using Serilog.Formatting.Json;
using Shared.Data;
using Shared.Middleware;
using Shared.Messaging;
using CatalogService.Consumers;

// Включаем HTTP/2 без TLS для gRPC
AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);

var builder = WebApplication.CreateBuilder(args);

// Настройка Kestrel для локального режима:
// - REST API на HTTP/1.1 (порт 5000)
// - gRPC на HTTP/2 h2c (порт 5006)
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenLocalhost(5000, listenOptions =>
    {
        listenOptions.Protocols = Microsoft.AspNetCore.Server.Kestrel.Core.HttpProtocols.Http1;
    });

    options.ListenLocalhost(5006, listenOptions =>
    {
        listenOptions.Protocols = Microsoft.AspNetCore.Server.Kestrel.Core.HttpProtocols.Http2;
    });
});

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
builder.Services.AddScoped<CatalogService.Services.DescriptionToSpecsMigration>();
builder.Services.AddScoped<ICategoryParser, CategoryParser>();
builder.Services.AddScoped<IProductNameGenerator, ProductNameGenerator>();
builder.Services.AddScoped<ICatalogService, CatalogService.Services.CatalogService>();
builder.Services.AddScoped<CatalogService.Services.CatalogJsonImporter>();
builder.Services.AddScoped<CatalogService.Services.FilterAttributesSeeder>();

// Redis Caching с fallback на in-memory кэш
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
    options.InstanceName = "Catalog_";
});

// In-memory кэш как fallback при недоступности Redis
builder.Services.AddSingleton<MemoryCacheService>();

// ICacheService: декоратор с graceful degradation Redis → in-memory
builder.Services.AddScoped<ICacheService, CacheService>();

// Messaging (Consumers for OrderPaidEvent and OrderPlacedEvent)
builder.Services.AddMessaging(builder.Configuration, x =>
{
    x.AddConsumer<OrderPaidConsumer>();
    x.AddConsumer<OrderPlacedConsumer>();
});

// Настройка CORS — не AllowAnyOrigin в продакшне, читаем из конфигурации
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("CORS:AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:5173", "http://localhost:3000" };
        policy.WithOrigins(allowedOrigins)
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

// Настройка OpenTelemetry Tracing с OTLP Exporter
// Endpoint читается из OTEL_EXPORTER_OTLP_ENDPOINT (по умолчанию http://localhost:4317 для gRPC)
var otlpEndpoint = builder.Configuration["Otlp:Endpoint"]
    ?? Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_ENDPOINT")
    ?? "http://localhost:4317";

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
            });
    })
    .UseOtlpExporter()
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

Log.Information("OpenTelemetry configured with OTLP exporter: {Endpoint}", otlpEndpoint);

// JWT Authentication — must be registered BEFORE builder.Build()
{
    var jwtSettings = builder.Configuration.GetSection("Jwt");
    var secretKey = jwtSettings["SecretKey"];
    if (string.IsNullOrEmpty(secretKey) || secretKey == "development_secret_key_32_chars_long!!")
    {
        if (builder.Environment.IsProduction())
            throw new InvalidOperationException("Jwt:SecretKey must be configured in production");
        secretKey = "development_secret_key_32_chars_long!!";
    }

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"] ?? "GoldPC",
            ValidAudience = jwtSettings["Audience"] ?? "GoldPC",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

    builder.Services.AddAuthorization();
}

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

app.UseAuthentication();
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

// ──────────────────────────────────────────────────────
// Auto-seed filter attributes on startup if table is empty
// ──────────────────────────────────────────────────────
if (!args.Any(a => a.StartsWith("seed-", StringComparison.Ordinal)))
{
    try
    {
        using var seedScope = app.Services.CreateScope();
        var dbContext = seedScope.ServiceProvider.GetRequiredService<CatalogDbContext>();
        var hasAttrs = await dbContext.CategoryFilterAttributes.AnyAsync();
        if (!hasAttrs)
        {
            var seeder = seedScope.ServiceProvider.GetRequiredService<CatalogService.Services.FilterAttributesSeeder>();
            var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
            var jsonPath = Path.Combine(repoRoot, "scripts", "scraper", "config", "xcore-filter-attributes.json");
            if (File.Exists(jsonPath))
            {
                var seedResult = await seeder.SeedFromFileAsync(jsonPath);
                Log.Information("Auto-seed filter attributes: {Added} added, {Deleted} deleted, {Skipped} skipped",
                    seedResult.Added, seedResult.Deleted, seedResult.Skipped);
            }
            else
            {
                Log.Warning("Filter attributes seed file not found: {JsonPath}", jsonPath);
            }
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Failed to auto-seed filter attributes on startup");
    }
}

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
        Log.Warning("Файл не найден: {JsonPath}", jsonPath);
        Log.Information("Сначала выполните: cd scripts/scraper && node fetch-product-images.mjs");
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
        Log.Warning("Файл не найден: {JsonPath}", jsonPath);
        Log.Information("Сначала выполните: cd scripts/scraper && npm run fetch-images");
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
        Log.Warning("Файл не найден: {ProductsPath}", productsPath);
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
        Log.Warning("Файл не найден: {JsonPath}", jsonPath);
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

// CLI: dotnet run -- backfill-spec-attributes
// Создаёт SpecificationAttribute записи из уникальных ключей specifications в JSON-файле.
// Должен выполняться ПЕРЕД seed-catalog, чтобы SpecImportNormalizer мог сопоставить ключи.
if (args is ["backfill-spec-attributes"])
{
    using var scope = app.Services.CreateScope();
    var ctx = scope.ServiceProvider.GetRequiredService<CatalogDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        // Читаем уникальные ключи из catalog-seed.json
        var seedPaths = new[]
        {
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "scripts", "seed-data", "catalog-seed.json"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "scripts", "scraper", "data", "xcore-products.json"),
        };

        var seedFile = seedPaths.FirstOrDefault(File.Exists)
            ?? throw new FileNotFoundException("catalog-seed.json не найден. Запустите seed-all.sh сначала.");

        var json = File.ReadAllText(seedFile);
        using var doc = System.Text.Json.JsonDocument.Parse(json);
        var root = doc.RootElement;
        var products = root.GetProperty("products");

        var allKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var product in products.EnumerateArray())
        {
            if (product.TryGetProperty("specifications", out var specs))
            {
                foreach (var prop in specs.EnumerateObject())
                {
                    allKeys.Add(prop.Name.Trim().ToLowerInvariant().Replace(" ", "_"));
                }
            }
        }

        // Загружаем существующие ключи из БД
        var existingKeys = await ctx.SpecificationAttributes.Select(a => a.Key).ToListAsync();
        var existingSet = new HashSet<string>(existingKeys, StringComparer.OrdinalIgnoreCase);

        var toAdd = allKeys
            .Where(k => !existingSet.Contains(k))
            .Select(k => new CatalogService.Models.SpecificationAttribute
            {
                Id = Guid.NewGuid(),
                Key = k,
                DisplayName = k.Replace('_', ' '),
                ValueType = CatalogService.Models.SpecificationAttributeValueType.Select,
                IsMultiValue = false,
                GroupName = null,
                IsRequired = false,
                SortOrder = 0,
                Unit = null,
                ValidationMin = null,
                ValidationMax = null,
                ValidationStep = null,
            })
            .ToList();

        if (toAdd.Count > 0)
        {
            ctx.SpecificationAttributes.AddRange(toAdd);
            await ctx.SaveChangesAsync();
        }

        logger.LogInformation(
            "Backfill spec attributes: из JSON {JsonKeys} уникальных ключей, в БД {Existing}, добавлено {Added}",
            allKeys.Count, existingSet.Count, toAdd.Count);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Ошибка backfill-spec-attributes");
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

// CLI: dotnet run -- migrate-descriptions-to-specs
// Переносит характеристики из текстового description в product_specification_values
if (args is ["migrate-descriptions-to-specs"])
{
    using var scope = app.Services.CreateScope();
    var migration = scope.ServiceProvider.GetRequiredService<DescriptionToSpecsMigration>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var result = await migration.MigrateAsync();
        logger.LogInformation(
            "Миграция описаний завершена: обработано {Processed}, найдено пар {ParsedPairs}, сопоставлено {Mapped}, сохранено {Saved}, пропущено {Skipped}, ошибок {Errors}",
            result.Processed, result.ParsedPairs, result.Mapped, result.Saved, result.Skipped, result.Errors);
        logger.LogInformation("Processed: {Processed}, Parsed: {ParsedPairs}, Mapped: {Mapped}, Saved: {Saved}, Skipped: {Skipped}, Errors: {Errors}",
            result.Processed, result.ParsedPairs, result.Mapped, result.Saved, result.Skipped, result.Errors);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Ошибка migrate-descriptions-to-specs");
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
