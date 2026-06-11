using System;
using System.Text;
using GoldPC.ReportingService.Data;
using GoldPC.Shared.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.Formatting.Json;
using Shared.Middleware;

var builder = WebApplication.CreateBuilder(args);

// === SECURITY: JWT SecretKey must come from environment variables in Production ===
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

// Настройка Serilog
var loggerConfiguration = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "GoldPC")
    .Enrich.WithProperty("Service", "ReportingService");

if (builder.Environment.IsProduction())
{
    loggerConfiguration.WriteTo.Console(new JsonFormatter());
}
else
{
    loggerConfiguration.WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}");
}

loggerConfiguration.WriteTo.File("logs/reporting-service-.log", rollingInterval: RollingInterval.Day);
Log.Logger = loggerConfiguration.CreateLogger();

builder.Host.UseSerilog();

// Добавление сервисов
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "GoldPC Reporting Service API",
        Version = "v1",
        Description = "API сервиса отчётности и аналитики для GoldPC"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Настройка PostgreSQL
// По умолчанию ReportingService подключается к реплике для чтения (postgres-replica)
// В development используем postgres-replica, в проде - по конфигу
var connectionString = builder.Configuration.GetConnectionString("PostgreSQL") 
    ?? "Host=postgres-replica;Port=5432;Database=goldpc_reporting;Username=postgres;Password=admin";

builder.Services.AddDbContext<ReportingDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 5);
    }));

// Настройка JWT-аутентификации
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? "development_secret_key_32_chars_long!!";

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
        ValidIssuer = jwtSettings["Issuer"] ?? "goldpc",
        ValidAudience = jwtSettings["Audience"] ?? "goldpc-users",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization(options =>
{
    foreach (var permission in Permissions.AllPermissions)
    {
        options.AddPolicy(permission, policy => policy.Requirements.Add(new PermissionRequirement(permission)));
    }
});

builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();

// Настройка CORS
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

// Health checks
builder.Services.AddHealthChecks()
    .AddNpgSql(
        connectionString,
        name: "postgresql-replica",
        tags: new[] { "db", "critical" },
        failureStatus: Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Unhealthy);

var app = builder.Build();

// Security Headers Middleware
app.UseSecurityHeaders();

// Correlation ID Middleware
app.UseCorrelationId();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Reporting Service v1");
    });
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapHealthChecks("/health");

Log.Information("Reporting Service запущен");

await app.RunAsync();

namespace GoldPC.ReportingService
{
    public partial class Program { }
}
