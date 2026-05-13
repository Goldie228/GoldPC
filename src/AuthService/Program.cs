using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using GoldPC.AuthService.Data;
using GoldPC.AuthService.Services;
using GoldPC.AuthService.Validators;
using GoldPC.Shared.Services.Implementations;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.Formatting.Json;
using Shared.Middleware;
using GoldPC.Shared.Authorization;
using GoldPC.AuthService.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Настройка Serilog с разделением форматов для Development/Production
var loggerConfiguration = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "GoldPC")
    .Enrich.WithProperty("Service", "AuthService");

if (builder.Environment.IsProduction())
{
    loggerConfiguration.WriteTo.Console(new JsonFormatter());
}
else
{
    loggerConfiguration.WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}");
}

loggerConfiguration.WriteTo.File("logs/auth-service-.log", rollingInterval: RollingInterval.Day);
Log.Logger = loggerConfiguration.CreateLogger();

builder.Host.UseSerilog();

// Настройка базы данных
builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Redis cache для токенов сброса пароля (автоматический TTL)
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
});

// Регистрация сервисов
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddSingleton<SmtpEmailService>();
builder.Services.AddSingleton<ITokenCache, RedisTokenCache>();

// Настройка JWT аутентификации
var jwtSettings = builder.Configuration.GetSection("Jwt");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // В Development оставляем поддержку симметричных ключей или моков, 
    // в Production используем Keycloak (OIDC)
    if (builder.Environment.IsProduction())
    {
        options.Authority = jwtSettings["Authority"] ?? "https://auth.goldpc.by/realms/goldpc";
        options.Audience = jwtSettings["Audience"] ?? "goldpc-api";
        options.RequireHttpsMetadata = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Authority"] ?? "https://auth.goldpc.by/realms/goldpc",
            ValidAudience = jwtSettings["Audience"] ?? "goldpc-api",
            ClockSkew = TimeSpan.Zero
        };
    }
    else
    {
        var secretKey = jwtSettings["SecretKey"] ?? "development_secret_key_32_chars_long!!";
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
    }
});

builder.Services.AddPermissionBasedAuthorization();

// Настройка контроллеров с FluentValidation
builder.Services.AddControllers()
    .AddFluentValidation(fv =>
    {
        fv.RegisterValidatorsFromAssemblyContaining<RegisterRequestValidator>();
        fv.DisableDataAnnotationsValidation = false; // Сохраняем DataAnnotations как fallback
    });

// Регистрация валидаторов
builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

// Настройка Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "GoldPC Auth Service",
        Version = "v1",
        Description = "Сервис аутентификации и авторизации для системы GoldPC"
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

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Security Headers Middleware - должен быть в начале pipeline
app.UseSecurityHeaders();

// Автоматическое применение миграций
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    // For development: ensure database is recreated with latest migrations
    // In production, use dbContext.Database.Migrate() only
    dbContext.Database.Migrate();
}

// Настройка HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok());

Log.Information("Auth Service starting on port 5001");

app.Run();