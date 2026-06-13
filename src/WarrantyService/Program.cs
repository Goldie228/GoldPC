using System.Text;
using GoldPC.WarrantyService.Data;
using GoldPC.WarrantyService.Services;
using GoldPC.WarrantyService.Background;
using GoldPC.Shared.Services.Interfaces;
using GoldPC.Shared.Services.Mocks;
using GoldPC.Shared.Services;
using Shared.Messaging;
using GoldPC.WarrantyService.Consumers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Shared.Middleware;
using GoldPC.Shared.Services.Implementations;

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

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/warranty-service-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddDbContext<WarrantyDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IWarrantyService, WarrantyService>();

// Messaging (Consumer for OrderPlacedEvent)
builder.Services.AddMessaging(builder.Configuration, x =>
{
    x.AddConsumer<OrderPlacedConsumer>();
});

// Production Notifications (SMTP, Twilio, Mocks support)
builder.Services.AddProductionNotifications(builder.Configuration, builder.Environment);

// Background worker
builder.Services.AddHostedService<WarrantyExpirationWorker>();

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
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "GoldPC Warranty Service", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Name = "Authorization", In = ParameterLocation.Header, Type = SecuritySchemeType.ApiKey, Scheme = "Bearer" });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() } });
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

var app = builder.Build();

// Security Headers Middleware - должен быть в начале pipeline
app.UseSecurityHeaders();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<WarrantyDbContext>();
    dbContext.Database.EnsureCreated();
}

if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }

// HTTPS-редирект отключён: сервис работает за Vite-прокси по HTTP/1.1
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/health", () => Results.Ok());
app.MapControllers();

Log.Information("Warranty Service starting on port 5004");
app.Run();