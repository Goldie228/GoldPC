using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? "GoldPC-Dev-JWT-Secret-Key-Must-Be-At-Least-32-Chars!";

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
    ?? "Host=localhost;Port=5434;Database=goldpc_pcbuilder;Username=postgres;Password=postgres";
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
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

Log.Information("PCBuilder Service started");

app.Run();
