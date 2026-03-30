using System.Text;
using GoldPC.OrdersService.Data;
using GoldPC.OrdersService.Services;
using GoldPC.Shared.Services;
using GoldPC.Shared.Services.Background;
using GoldPC.Shared.Services.Implementations;
using GoldPC.Shared.Services.Interfaces;
using GoldPC.Shared.Services.Mocks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Shared.Data;
using Shared.Middleware;
using Shared.Messaging;
using GoldPC.OrdersService.Background;

var builder = WebApplication.CreateBuilder(args);

// Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/orders-service-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Database
builder.Services.AddDbContext<OrdersDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Services
builder.Services.AddScoped<IOrdersService, GoldPC.OrdersService.Services.OrdersService>();
builder.Services.AddScoped<GoldPC.OrdersService.Services.Interfaces.IPromoCodeService, GoldPC.OrdersService.Services.PromoCodeService>();
builder.Services.AddMessaging(builder.Configuration);

// Outbox Processor
builder.Services.AddHostedService<OutboxProcessor>();

// gRPC Clients
builder.Services.AddGrpcClient<Shared.Protos.CatalogGrpc.CatalogGrpcClient>(o =>
{
    o.Address = new Uri(builder.Configuration["CatalogService:GrpcUrl"] ?? "http://localhost:5000");
});

// Background Services
builder.Services.AddHostedService<GoldPC.OrdersService.BackgroundServices.OrderExpirationWorker>();

// Payment and Notification Services
if (builder.Environment.IsDevelopment() && builder.Configuration.GetValue<bool>("UseMocks", true))
{
    Log.Information("Running in Development mode with Mocks");
    
    // Payment Service Mock
    builder.Services.AddSingleton<IPaymentService>(sp =>
    {
        var logger = sp.GetRequiredService<ILogger<PaymentServiceMock>>();
        return new PaymentServiceMock(logger)
        {
            SuccessRate = 0.95,
            MinDelayMs = 100,
            MaxDelayMs = 1000,
            EnableDelay = true
        };
    });
    
    // Notification Service Mock
    builder.Services.AddSingleton<INotificationService>(sp =>
    {
        var logger = sp.GetRequiredService<ILogger<NotificationServiceMock>>();
        return new NotificationServiceMock(logger)
        {
            EnableConsoleLogging = true,
            SimulatedDelayMs = 50
        };
    });
}
else
{
    Log.Information("Using Production Integrations (Stripe, Twilio, SMTP)");

    // 1. Payment Integration (Stripe with Decorator)
    builder.Services.AddScoped<StripePaymentService>();
    builder.Services.AddScoped<IPaymentService>(sp => 
    {
        var inner = sp.GetRequiredService<StripePaymentService>();
        var logger = sp.GetRequiredService<ILogger<PaymentServiceLoggingDecorator>>();
        return new PaymentServiceLoggingDecorator(inner, logger);
    });

    // 2. Email Integration (SMTP + Async Queue)
    builder.Services.AddSingleton<GoldPC.Shared.Services.Implementations.SmtpEmailService>();
    builder.Services.AddSingleton<IEmailQueue, EmailQueue>();
    builder.Services.AddHostedService<EmailBackgroundWorker>();

    // 3. SMS Integration (Twilio)
    builder.Services.AddSingleton<TwilioSmsService>();

    // 4. Combined Notification Service with Logging Decorator
    builder.Services.AddScoped<ProductionNotificationService>();
    builder.Services.AddScoped<INotificationService>(sp => 
    {
        var inner = sp.GetRequiredService<ProductionNotificationService>();
        var logger = sp.GetRequiredService<ILogger<NotificationServiceLoggingDecorator>>();
        return new NotificationServiceLoggingDecorator(inner, logger);
    });

    builder.Services.AddScoped<IOneCIntegrationService, OneCIntegrationService>();
}

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? "GoldPC_SuperSecretKey_ForDevelopment_Only_2024!";

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
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "GoldPC Orders Service",
        Version = "v1",
        Description = "Сервис заказов для системы GoldPC"
    });
    
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Example: \"Authorization: Bearer {token}\"",
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
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

// Security Headers Middleware - должен быть в начале pipeline
app.UseSecurityHeaders();

// Применение миграций при запуске с использованием extension метода
app.ApplyMigrations<OrdersDbContext>();

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

Log.Information("Orders Service starting on port 5002");
app.Run();