using CatalogService.Data;
using CatalogService.Repositories;
using CatalogService.Repositories.Interfaces;
using CatalogService.Services;
using CatalogService.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared.Data;
using Shared.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Настройка Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/catalog-service-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

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

// Health checks
builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString);

// Chaos Middleware (только в Development)
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddChaosMiddleware(builder.Configuration);
}

var app = builder.Build();

// Security Headers Middleware - должен быть в начале pipeline
app.UseSecurityHeaders();

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
app.MapHealthChecks("/health");

Log.Information("Catalog Service запущен на порту {Port}", 
    app.Services.GetRequiredService<IConfiguration>()["ASPNETCORE_URLS"] ?? "5000");

app.Run();

/// <summary>
/// Partial класс для обеспечения доступа к Program из тестов (WebApplicationFactory)
/// </summary>
public partial class Program { }
