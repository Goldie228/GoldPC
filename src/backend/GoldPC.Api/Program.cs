using System.Text;
using GoldPC.Api.Controllers;
using GoldPC.Api.Hubs;
using GoldPC.Api.Services;
using GoldPC.Shared.Authorization;
using GoldPC.Shared.Services;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Versioning;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Http.Resilience;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Shared.Middleware;

var builder = WebApplication.CreateBuilder(args);

// === SECURITY: JWT SecretKey must come from environment variables in Production ===
// Environment variables override appsettings.json via the pattern: Jwt__SecretKey
// In Production, fail fast if the secret is a hardcoded/development value.
if (builder.Environment.IsProduction())
{
    var jwtKey = builder.Configuration["Jwt:SecretKey"];
    if (string.IsNullOrEmpty(jwtKey) || jwtKey.Contains("Dev", StringComparison.OrdinalIgnoreCase) || jwtKey.Contains("development_secret_key", StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException(
            "CRITICAL SECURITY: Jwt:SecretKey is not configured via environment variable in Production. " +
            "Set the Jwt__SecretKey environment variable (or use Docker secrets).");
    }
}

// === Structured Logging (Serilog) ===
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "GoldPC")
    .Enrich.WithProperty("Service", "Gateway")
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();

// Загрузка конфигурации для доступа к ServiceUrls
var servicesConfig = builder.Configuration.GetSection("ServiceUrls");

// Add services to the container.
builder.Services.AddControllers();

// Генерация OpenAPI спецификации для шлюза
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "GoldPC Gateway API",
        Version = "v1",
        Description = "BFF-шлюз для фронтенда GoldPC. Агрегирует эндпоинты микросервисов."
    });
});

// Add SignalR
builder.Services.AddSignalR();

// Add Email Service (SMTP)
builder.Services.AddSingleton<IEmailService, EmailService>();

// Add Notification Service
builder.Services.AddScoped<INotificationService, NotificationService>();

// Add Notification Preference Service (checks admin settings before sending)
builder.Services.AddScoped<INotificationPreferenceService, NotificationPreferenceService>();

// Add User Notification Preference Service (per-user JSON persistence)
builder.Services.AddScoped<UserNotificationPreferenceService>();

// Add Admin Service
builder.Services.AddScoped<IAdminService, AdminService>();

// Add File Service
builder.Services.AddScoped<IFileService, FileService>();

// Сервис обратной связи (FeedbackController)
builder.Services.AddScoped<IFeedbackService, FeedbackService>();

// Add HttpContextAccessor for auth forwarding
builder.Services.AddHttpContextAccessor();

// === API Versioning ===
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        new HeaderApiVersionReader("X-Api-Version"));
});

// === Health Checks ===
builder.Services.AddHealthChecks()
    .AddNpgSql(
        builder.Configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured."),
        name: "postgresql",
        failureStatus: HealthStatus.Unhealthy,
        tags: ["db", "ready"])
    .AddRedis(
        builder.Configuration.GetValue<string>("Redis:Connection")
            ?? builder.Configuration.GetConnectionString("Redis")
            ?? "localhost:6379",
        name: "redis",
        failureStatus: HealthStatus.Degraded,
        tags: ["cache", "ready"])
    .AddUrlGroup(
        new Uri(servicesConfig["CatalogService"] ?? "http://localhost:5000"),
        name: "catalogservice",
        failureStatus: HealthStatus.Unhealthy,
        tags: ["downstream", "ready"])
    .AddUrlGroup(
        new Uri(servicesConfig["AuthService"] ?? "http://localhost:5002"),
        name: "authservice",
        failureStatus: HealthStatus.Unhealthy,
        tags: ["downstream", "ready"]);

// Add Catalog Service Client (HTTP client to CatalogService)
builder.Services.AddTransient<AuthForwardingHandler>();
builder.Services.AddHttpClient<ICatalogServiceClient, CatalogServiceClient>(client =>
{
    var baseUrl = servicesConfig["CatalogService"]
        ?? throw new InvalidOperationException("ServiceUrls:CatalogService is not configured");
    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
})
.AddHttpMessageHandler<AuthForwardingHandler>()
.AddResilienceHandler("CatalogServiceResilience", (builder, sp) =>
{
    var logger = sp.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("GoldPC.Api.CatalogServiceClient");
    PollyPolicies.ConfigureRetryPipeline(builder, logger);
    PollyPolicies.ConfigureCircuitBreaker(builder, logger);
});

// Add Auth Service Client (HTTP client to AuthService for admin user management)
builder.Services.AddHttpClient<IAuthServiceClient, AuthServiceClient>(client =>
{
    var baseUrl = servicesConfig["AuthService"]
        ?? throw new InvalidOperationException("ServiceUrls:AuthService is not configured");
    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
})
.AddHttpMessageHandler<AuthForwardingHandler>()
.AddResilienceHandler("AuthServiceResilience", (builder, sp) =>
{
    var logger = sp.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("GoldPC.Api.AuthServiceClient");
    PollyPolicies.ConfigureRetryPipeline(builder, logger);
    PollyPolicies.ConfigureCircuitBreaker(builder, logger);
});

// Add Orders Service Client (HTTP client to OrdersService for dashboard stats)
builder.Services.AddHttpClient<IOrdersServiceClient, OrdersServiceClient>(client =>
{
    var baseUrl = servicesConfig["OrdersService"]
        ?? throw new InvalidOperationException("ServiceUrls:OrdersService is not configured");
    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
})
.AddHttpMessageHandler<AuthForwardingHandler>()
.AddResilienceHandler("OrdersServiceResilience", (builder, sp) =>
{
    var logger = sp.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("GoldPC.Api.OrdersServiceClient");
    PollyPolicies.ConfigureRetryPipeline(builder, logger);
    PollyPolicies.ConfigureCircuitBreaker(builder, logger);
});

// Add Reporting Service Client (HTTP client to ReportingService for financial reports)
builder.Services.AddHttpClient<IReportingServiceClient, ReportingServiceClient>(client =>
{
    var baseUrl = servicesConfig["ReportingService"]
        ?? throw new InvalidOperationException("ServiceUrls:ReportingService is not configured");
    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
})
.AddHttpMessageHandler<AuthForwardingHandler>()
.AddResilienceHandler("ReportingServiceResilience", (builder, sp) =>
{
    var logger = sp.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("GoldPC.Api.ReportingServiceClient");
    PollyPolicies.ConfigureRetryPipeline(builder, logger);
    PollyPolicies.ConfigureCircuitBreaker(builder, logger);
});

// Configure form options for file uploads
builder.Services.Configure<FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 5 * 1024 * 1024; // 5 MB
});

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"];
if (string.IsNullOrEmpty(secretKey))
{
    if (builder.Environment.IsDevelopment())
    {
        // В development разрешаем использование ключа по умолчанию
        secretKey = "development_secret_key_32_chars_long!!";
        Console.WriteLine("WARNING: Using default development JWT key. Set Jwt:SecretKey for production.");
    }
    else
    {
        throw new InvalidOperationException(
            "CRITICAL SECURITY: Jwt:SecretKey is not configured. " +
            "Set the Jwt__SecretKey environment variable or configure in appsettings.json.");
    }
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

builder.Services.AddPermissionBasedAuthorization();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                     ?? new[] { "http://localhost:3000", "http://localhost:5173" };
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.

// Health check endpoints (unauthenticated — для docker-compose / dev-local health probes)
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
    Predicate = _ => true // Include all health checks
});

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
    Predicate = check => check.Tags.Contains("ready") // Only "ready" tagged checks
});

app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false // Liveness: just confirms the process is alive
});

// Correlation ID middleware — assigns/propagates X-Correlation-Id across all requests
app.UseCorrelationId();

app.UseHttpsRedirection();

app.UseCors("AllowAll");

#pragma warning disable S125 // Descriptive comment explaining middleware placement order
// Maintenance mode middleware — блокирует запросы (503) при включённом режиме обслуживания
// Размещён ДО UseStaticFiles, чтобы статика тоже блокировалась;
// Админ-панель (/api/v1/admin/*), аутентификация (/api/auth/*) и health check (/health) исключены.
#pragma warning restore S125
app.UseMiddleware<GoldPC.Api.Middleware.MaintenanceMiddleware>();

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

#pragma warning disable S125 // Middleware для CSRF-защиты — проверяет токен при unsafe методах
// CSRF middleware — генерирует и проверяет CSRF-токены для защиты от атак на state-changing операции
// Размещён ПОСЛЕ UseAuthorization(), чтобы не блокировать JWT-запросы (Bearer токены уже защищены от CSRF)
#pragma warning restore S125
app.UseMiddleware<GoldPC.Api.Middleware.CsrfMiddleware>();

app.MapControllers();

// OpenAPI (Swagger) только в Development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "GoldPC Gateway v1"));
}

// Map SignalR hubs
app.MapHub<NotificationHub>("/hubs/notifications");

await app.RunAsync();
