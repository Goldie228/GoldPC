using PCBuilderService.Controllers;
using PCBuilderService.Services;
using Serilog;
using Serilog.Events;

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

// Регистрация сервисов
builder.Services.AddScoped<ICompatibilityService, CompatibilityService>();
builder.Services.AddScoped<IConfigurationService, ConfigurationService>();

// Настройка HttpClient для Catalog Service
var catalogServiceUrl = builder.Configuration["CatalogService:Url"] ?? "http://localhost:5001";
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

var app = builder.Build();

// Настройка pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "PCBuilder Service v1");
    });
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

    public ConfigurationService(ILogger<ConfigurationService> logger, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
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
        // В реальности будет запрос к Catalog Service для получения цен
        // Здесь заглушка
        decimal total = 0;
        
        var componentIds = new[] 
        { 
            dto.ProcessorId, dto.MotherboardId, dto.RamId, 
            dto.GpuId, dto.PsuId, dto.StorageId, dto.CaseId, dto.CoolerId 
        }.Where(id => id.HasValue).Select(id => id!.Value).ToList();

        // Заглушка: базовая цена для демонстрации
        total = componentIds.Count * 15000; // Примерная средняя цена компонента в BYN
        
        return await Task.FromResult(total);
    }
}