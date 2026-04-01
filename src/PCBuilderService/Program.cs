using Microsoft.EntityFrameworkCore;
using PCBuilderService.Data;
using PCBuilderService.Controllers;
using PCBuilderService.Services;
using Serilog;
using Serilog.Events;
using Shared.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Настройка Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/pcbuilder-service-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Добавление сервисов
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "GoldPC PCBuilder Service API",
        Version = "v1",
        Description = "API конструктора ПК для компьютерного магазина GoldPC"
    });
});

// Настройка базы данных
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=goldpc_pcbuilder;Username=postgres;Password=postgres";
builder.Services.AddDbContext<PCBuilderDbContext>(options =>
    options.UseNpgsql(connectionString));

// Регистрация сервисов
builder.Services.AddScoped<ICompatibilityService, CompatibilityService>();
builder.Services.AddScoped<IConfigurationService, ConfigurationService>();

// Настройка gRPC для Catalog Service
var catalogServiceGrpcUrl = builder.Configuration["CatalogService:GrpcUrl"] ?? "http://localhost:5000";
builder.Services.AddGrpcClient<Shared.Protos.CatalogGrpc.CatalogGrpcClient>(o =>
{
    o.Address = new Uri(catalogServiceGrpcUrl);
});

// Настройка HttpClient для Catalog Service
var catalogServiceUrl = builder.Configuration["CatalogService:Url"] ?? "http://localhost:5000";
builder.Services.AddHttpClient("CatalogService", client =>
{
    client.BaseAddress = new Uri(catalogServiceUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
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

// Health checks
builder.Services.AddHealthChecks();

// Chaos Middleware (только в Development)
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddChaosMiddleware(builder.Configuration);
}

var app = builder.Build();

// Security Headers Middleware - должен быть в начале pipeline
app.UseSecurityHeaders();

// Настройка pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "PCBuilder Service v1");
    });
    
    // Включаем Chaos Middleware только в Development
    app.UseChaosMiddleware();
}

app.UseCors();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

Log.Information("PCBuilder Service запущен");

app.Run();

/// <summary>
/// Реализация сервиса управления конфигурациями (in-memory для разработки)
/// </summary>
public class ConfigurationService : IConfigurationService
{
    private readonly List<PCBuilderService.Models.PCConfiguration> _configurations = new();
    private readonly ILogger<ConfigurationService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly Shared.Protos.CatalogGrpc.CatalogGrpcClient _catalogClient;

    public ConfigurationService(ILogger<ConfigurationService> logger, IHttpClientFactory httpClientFactory, Shared.Protos.CatalogGrpc.CatalogGrpcClient catalogClient)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _catalogClient = catalogClient;
    }

    public Task<PCBuilderService.Models.PCConfiguration?> GetConfigurationAsync(Guid id)
    {
        var config = _configurations.FirstOrDefault(c => c.Id == id);
        return Task.FromResult(config);
    }

    public Task<IEnumerable<PCBuilderService.Models.PCConfiguration>> GetUserConfigurationsAsync(Guid userId)
    {
        var configs = _configurations.Where(c => c.UserId == userId);
        return Task.FromResult(configs);
    }

    public Task<PCBuilderService.Models.PCConfiguration> SaveConfigurationAsync(PCBuilderService.Models.PCConfiguration config)
    {
        if (config.Id == Guid.Empty)
        {
            config.Id = Guid.NewGuid();
            config.CreatedAt = DateTime.UtcNow;
            _configurations.Add(config);
            _logger.LogInformation("Создана новая конфигурация {ConfigId}", config.Id);
        }
        else
        {
            config.UpdatedAt = DateTime.UtcNow;
            var existing = _configurations.FirstOrDefault(c => c.Id == config.Id);
            if (existing != null)
            {
                _configurations.Remove(existing);
                _configurations.Add(config);
                _logger.LogInformation("Обновлена конфигурация {ConfigId}", config.Id);
            }
        }
        return Task.FromResult(config);
    }

    public Task<bool> DeleteConfigurationAsync(Guid id)
    {
        var config = _configurations.FirstOrDefault(c => c.Id == id);
        if (config != null)
        {
            _configurations.Remove(config);
            _logger.LogInformation("Удалена конфигурация {ConfigId}", id);
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }

    public async Task<decimal> CalculateTotalPriceAsync(PCConfigurationDto dto)
    {
        var componentIds = new[] 
        { 
            dto.ProcessorId, dto.MotherboardId, dto.RamId, 
            dto.GpuId, dto.PsuId, dto.StorageId, dto.CaseId, dto.CoolerId 
        }
        .Where(id => id.HasValue)
        .Select(id => id!.Value.ToString())
        .ToList();

        if (!componentIds.Any()) return 0;

        try
        {
            var request = new Shared.Protos.GetProductsRequest();
            request.Ids.AddRange(componentIds);

            var response = await _catalogClient.GetProductsByIdsAsync(request);
            
            return (decimal)response.Products.Sum(p => p.Price);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "gRPC Error: Failed to calculate total price via Catalog Service");
            throw new InvalidOperationException("Price calculation currently unavailable", ex);
        }
    }
}