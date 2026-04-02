using Microsoft.EntityFrameworkCore;
using PCBuilderService.Data;
using PCBuilderService.Services;
using Serilog;
using Serilog.Events;
using Shared.Middleware;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/pcbuilder-service-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "GoldPC PCBuilder Service API",
        Version = "v1",
        Description = "API constructora PK dlya komputernogo magazina GoldPC"
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=goldpc_pcbuilder;Username=postgres;Password=postgres";
builder.Services.AddDbContext<PCBuilderDbContext>(options =>
    options.UseNpgsql(connectionString));

// Загрузка декларативных правил совместимости из JSON
var rulesPath = Path.Combine(builder.Environment.ContentRootPath, "Data", "compatibility-rules.json");
builder.Services.AddSingleton(sp =>
{
    var logger = sp.GetRequiredService<ILogger<CompatibilityRuleEngine>>();
    return new CompatibilityRuleEngine(rulesPath, logger);
});

builder.Services.AddScoped<ICompatibilityService, CompatibilityService>();
builder.Services.AddScoped<IConfigurationService, ConfigurationService>();

// Регистрация сервиса расчёта FPS (singleton, загружает benchmarks.json один раз)
var fpsBenchmarksPath = Path.Combine(builder.Environment.ContentRootPath, "Data", "fps-benchmarks.json");
builder.Services.AddSingleton<IFpsCalculationService>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<FpsCalculationService>>();
    return new FpsCalculationService(fpsBenchmarksPath, logger);
});

var catalogServiceGrpcUrl = builder.Configuration["CatalogService:GrpcUrl"] ?? "http://localhost:5000";
builder.Services.AddGrpcClient<Shared.Protos.CatalogGrpc.CatalogGrpcClient>(o =>
{
    o.Address = new Uri(catalogServiceGrpcUrl);
});

var catalogServiceUrl = builder.Configuration["CatalogService:Url"] ?? "http://localhost:5000";
builder.Services.AddHttpClient("CatalogService", client =>
{
    client.BaseAddress = new Uri(catalogServiceUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

builder.Services.AddHealthChecks();

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddChaosMiddleware(builder.Configuration);
}

var app = builder.Build();

app.UseSecurityHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "PCBuilder Service v1");
    });
    app.UseChaosMiddleware();
}

app.UseCors();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

Log.Information("PCBuilder Service started");

app.Run();
