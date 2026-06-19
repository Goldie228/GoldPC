using System.Text;
using GoldPC.Api.Controllers;
using GoldPC.Api.Hubs;
using GoldPC.Api.Services;
using GoldPC.Shared.Authorization;
using GoldPC.Shared.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http.Resilience;
using Microsoft.IdentityModel.Tokens;

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

// Загрузка конфигурации для доступа к ServiceUrls
var servicesConfig = builder.Configuration.GetSection("ServiceUrls");

// Add services to the container.
builder.Services.AddControllers();

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
.AddResilienceHandler("CatalogServiceRetry", (builder, sp) =>
{
    var logger = sp.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("GoldPC.Api.CatalogServiceClient");
    PollyPolicies.ConfigureRetryPipeline(builder, logger);
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
.AddResilienceHandler("AuthServiceRetry", (builder, sp) =>
{
    var logger = sp.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("GoldPC.Api.AuthServiceClient");
    PollyPolicies.ConfigureRetryPipeline(builder, logger);
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
.AddResilienceHandler("OrdersServiceRetry", (builder, sp) =>
{
    var logger = sp.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("GoldPC.Api.OrdersServiceClient");
    PollyPolicies.ConfigureRetryPipeline(builder, logger);
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
.AddResilienceHandler("ReportingServiceRetry", (builder, sp) =>
{
    var logger = sp.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("GoldPC.Api.ReportingServiceClient");
    PollyPolicies.ConfigureRetryPipeline(builder, logger);
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
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.

// Health check endpoint (unauthenticated — для docker-compose / dev-local health probes)
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

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

// Map SignalR hubs
app.MapHub<NotificationHub>("/hubs/notifications");

await app.RunAsync();
