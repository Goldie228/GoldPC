using System.Text;
using GoldPC.OrdersService.Data;
using GoldPC.OrdersService.Services;
using GoldPC.Shared.Services;
using GoldPC.Shared.Services.Background;
using GoldPC.Shared.Services.Implementations;
using GoldPC.Shared.Services.Interfaces;
using GoldPC.Shared.Services.Mocks;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.Formatting.Compact;
using Shared.Data;
using Shared.Middleware;
using Shared.Messaging;
using GoldPC.OrdersService.Background;
using GoldPC.OrdersService.Hubs;

// Включаем HTTP/2 без TLS для gRPC в development
AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);

var builder = WebApplication.CreateBuilder(args);

// === БЕЗОПАСНОСТЬ: JWT SecretKey должен поступать из переменных окружения в Production ===
if (builder.Environment.IsProduction())
{
    var jwtKey = builder.Configuration["Jwt:SecretKey"];
    if (string.IsNullOrEmpty(jwtKey) || jwtKey.Contains("Dev", StringComparison.OrdinalIgnoreCase) || jwtKey.Contains("development_secret_key", StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException(
            "КРИТИЧЕСКАЯ БЕЗОПАСНОСТЬ: Jwt:SecretKey не настроен через переменную окружения в Production. " +
            "Установите переменную окружения Jwt__SecretKey (или используйте Docker secrets).");
    }
}

// Serilog — структурированное логирование с JSON в Production, человекочитаемый формат в Development
var loggerConfig = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "GoldPC")
    .Enrich.WithProperty("Service", "OrdersService");

if (builder.Environment.IsProduction())
    loggerConfig = loggerConfig.WriteTo.Console(new CompactJsonFormatter());
else
    loggerConfig = loggerConfig.WriteTo.Console();

Log.Logger = loggerConfig
    .WriteTo.File("logs/orders-service-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Database
builder.Services.AddDbContext<OrdersDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Health Checks
builder.Services.AddHealthChecks()
    .AddNpgSql(
        builder.Configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Строка подключения 'DefaultConnection' не настроена."),
        name: "postgresql",
        failureStatus: HealthStatus.Unhealthy,
        tags: ["db", "ready"]);

// Services
builder.Services.AddScoped<IOrdersService, GoldPC.OrdersService.Services.OrdersService>();
builder.Services.AddScoped<GoldPC.OrdersService.Services.Interfaces.IPromoCodeService, GoldPC.OrdersService.Services.PromoCodeService>();

// Messaging (MassTransit/RabbitMQ)
builder.Services.AddMessaging(builder.Configuration);

// Outbox Processor
builder.Services.AddHostedService<OutboxProcessor>();

// gRPC Clients
var catalogGrpcUrl = builder.Configuration["CatalogService:GrpcUrl"];
if (string.IsNullOrWhiteSpace(catalogGrpcUrl))
{
    throw new InvalidOperationException("CatalogService:GrpcUrl не настроен для OrdersService");
}

builder.Services.AddGrpcClient<Shared.Protos.CatalogGrpc.CatalogGrpcClient>(o =>
{
    o.Address = new Uri(catalogGrpcUrl);
});

// Background Services
builder.Services.AddHostedService<GoldPC.OrdersService.BackgroundServices.OrderExpirationWorker>();

// Payment and Notification Services
if (builder.Environment.IsDevelopment() && builder.Configuration.GetValue<bool>("UseMocks", true))
{
    Log.Information("Запуск в режиме Development с Mocks");
    
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

    // Order Email Service Mock (dev mode — логирует вместо отправки)
    builder.Services.AddSingleton<GoldPC.Shared.Services.IOrderEmailService, GoldPC.Shared.Services.MockOrderEmailService>();
}
else
{
    Log.Information("Использование Production интеграций (Stripe, Twilio, SMTP)");

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

    // 4. Order Email Service (уведомления о заказах)
    builder.Services.AddScoped<GoldPC.Shared.Services.IOrderEmailService, GoldPC.Shared.Services.OrderEmailService>();

    // 5. Combined Notification Service with Logging Decorator
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

    // Поддержка JWT в строке запроса SignalR (WebSocket не может установить заголовок Authorization)
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            if (!string.IsNullOrEmpty(accessToken))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

builder.Services.AddSignalR();
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

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
        Description = "JWT Authorization header. Пример: \"Authorization: Bearer {token}\"",
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
    var allowedOrigins = builder.Configuration.GetSection("CORS:AllowedOrigins").Get<string[]>()
        ?? new[] { "http://localhost:5173", "http://localhost:3000" };
    
    // SignalR требует AllowCredentials, что конфликтует с AllowAnyOrigin
    options.AddPolicy("SignalR", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Security Headers Middleware — должен быть в начале pipeline
app.UseSecurityHeaders();

// Correlation ID middleware
app.UseCorrelationId();

// Применение миграций при запуске с использованием extension метода
app.ApplyMigrations<OrdersDbContext>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
// app.UseHttpsRedirection();
app.UseCors("SignalR");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificationsHub>("/hubs/notifications");

// Health check endpoints
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
    Predicate = _ => true
});

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
    Predicate = check => check.Tags.Contains("ready")
});

app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false
});

Log.Information("Orders Service запускается на порту 5002");
app.Run();
