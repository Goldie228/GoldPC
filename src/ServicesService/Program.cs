using System.Text;
using GoldPC.ServicesService.Data;
using GoldPC.ServicesService.Hubs;
using GoldPC.ServicesService.Services;
using GoldPC.Shared.Services;
using GoldPC.Shared.Services.Interfaces;
using GoldPC.Shared.Services.Mocks;
using GoldPC.Shared.Services.Implementations;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Shared.Middleware;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/services-service-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddDbContext<ServicesDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IServicesService, ServicesService>();

// Production Notifications (SMTP, Twilio, Mocks support)
builder.Services.AddProductionNotifications(builder.Configuration, builder.Environment);

// Warranty Service Client
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddSingleton<IWarrantyClient>(sp =>
    {
        var logger = sp.GetRequiredService<ILogger<WarrantyClientMock>>();
        return new WarrantyClientMock(logger);
    });
}
else
{
    builder.Services.AddHttpClient<IWarrantyClient, WarrantyClient>(client =>
    {
        client.BaseAddress = new Uri(builder.Configuration["Services:WarrantyService"] ?? "http://warranty-service:5004");
    });
}

var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? "development_secret_key_32_chars_long!!";

builder.Services.AddSignalR();
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

    // SignalR WebSockets передают токен через query string (?access_token=)
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/chat", StringComparison.OrdinalIgnoreCase))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "GoldPC Services Service", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
    });
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

// Security Headers Middleware - должен быть в начале pipeline
app.UseSecurityHeaders();

try
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ServicesDbContext>();
        Log.Information("Applying database migrations...");
        dbContext.Database.Migrate();
        Log.Information("Database migrations applied successfully");

        // Update assembly service slug to match frontend URL (/services/assembly)
        var assemblyService = dbContext.ServiceTypes
            .FirstOrDefault(st => st.Name == "Сборка ПК на заказ");
        if (assemblyService != null && assemblyService.Slug != "assembly")
        {
            assemblyService.Slug = "assembly";
            dbContext.SaveChanges();
            Log.Information("Updated assembly service slug to 'assembly'");
        }
    }
}
catch (Exception ex)
{
    Log.Warning(ex, "Database migration failed — continuing startup. Will retry on first request.");
    // Не блокируем запуск сервиса из-за миграции
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// UseHttpsRedirection отключён в Docker/Development — HTTPS terminated на nginx
// if (!app.Environment.IsDevelopment())
// {
//     app.UseHttpsRedirection();
// }

// Serve uploaded files (chat attachments, etc.)
app.UseStaticFiles();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/health", () => Results.Ok());
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

Log.Information("Services Service starting on port 5003");
app.Run();