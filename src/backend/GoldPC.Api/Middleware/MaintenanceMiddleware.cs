using GoldPC.Api.Controllers;
using GoldPC.Api.Services;

namespace GoldPC.Api.Middleware;

/// <summary>
/// Middleware, проверяющий флаг "Режим обслуживания" в настройках сайта
/// и блокирующий публичные запросы (кроме /health, /api/v1/admin/, /api/auth/, /swagger/)
/// статусом 503 Service Unavailable, когда режим включён.
///
/// Потокобезопасное кэширование на 30 секунд (SemaphoreSlim + статический флаг)
/// для избежания чтения JSON-файла настроек при каждом запросе.
/// </summary>
public sealed class MaintenanceMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MaintenanceMiddleware> _logger;

    // Кэш с 30-секундным сроком жизни
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(30);
    private static readonly SemaphoreSlim CacheLock = new(1, 1);

    private static readonly PathString HealthPath = "/health";
    private static readonly PathString AdminPath = "/api/v1/admin";
    private static readonly PathString AuthPath = "/api/auth";
    private static readonly PathString SwaggerPath = "/swagger";

    // Mutable cache state wrapped in a class to satisfy S2696 (no static field modification from instance methods)
    private sealed class CacheState
    {
        public bool? MaintenanceMode { get; set; }
        public DateTime LastCheck { get; set; } = DateTime.MinValue;
    }

    private static readonly CacheState _cache = new();

    public MaintenanceMiddleware(RequestDelegate next, IServiceScopeFactory scopeFactory, ILogger<MaintenanceMiddleware> logger)
    {
        ArgumentNullException.ThrowIfNull(next);
        ArgumentNullException.ThrowIfNull(scopeFactory);

        _next = next;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Пропускаем исключённые пути без проверки режима
        if (IsExcludedPath(context.Request.Path))
        {
            await _next(context);
            return;
        }

        if (await IsMaintenanceModeAsync())
        {
            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            context.Response.ContentType = "text/html; charset=utf-8";

            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "maintenance.html");
            if (File.Exists(filePath))
            {
                await context.Response.SendFileAsync(filePath);
            }
            else
            {
                await context.Response.WriteAsync(
                    "<!DOCTYPE html><html lang=\"ru\"><head><meta charset=\"utf-8\">" +
                    "<title>GoldPC — Ведутся технические работы</title>" +
                    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
                    "<style>body{font-family:sans-serif;display:flex;justify-content:center;" +
                    "align-items:center;min-height:100vh;margin:0;background:#f5f5f5}" +
                    ".card{text-align:center;padding:2rem;background:#fff;border-radius:12px;" +
                    "box-shadow:0 2px 20px rgba(0,0,0,.1)}h1{color:#e53935}</style>" +
                    "</head><body><div class=\"card\"><h1>🔧 GoldPC</h1>" +
                    "<p>Ведутся технические работы. Пожалуйста, зайдите позже.</p>" +
                    "</div></body></html>");
            }

            return;
        }

        await _next(context);
    }

    /// <summary>
    /// Определяет, нужно ли пропустить путь без проверки режима обслуживания.
    /// </summary>
    private static bool IsExcludedPath(PathString path)
    {
        return path.StartsWithSegments(HealthPath, StringComparison.OrdinalIgnoreCase)
            || path.StartsWithSegments(AdminPath, StringComparison.OrdinalIgnoreCase)
            || path.StartsWithSegments(AuthPath, StringComparison.OrdinalIgnoreCase)
            || path.StartsWithSegments(SwaggerPath, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Возвращает текущее значение флага MaintenanceMode с кэшированием.
    /// </summary>
    private async Task<bool> IsMaintenanceModeAsync()
    {
        // Быстрый путь: кэш ещё актуален
        if (_cache.MaintenanceMode.HasValue
            && DateTime.UtcNow - _cache.LastCheck < CacheDuration)
        {
            return _cache.MaintenanceMode.Value;
        }

        await CacheLock.WaitAsync();

        try
        {
            // Double-check после захвата блокировки
            if (_cache.MaintenanceMode.HasValue
                && DateTime.UtcNow - _cache.LastCheck < CacheDuration)
            {
                return _cache.MaintenanceMode.Value;
            }

            using var scope = _scopeFactory.CreateScope();
            var adminService = scope.ServiceProvider.GetRequiredService<IAdminService>();
            var settings = await adminService.GetSettingsAsync();

            _cache.MaintenanceMode = settings.MaintenanceMode;
            _cache.LastCheck = DateTime.UtcNow;

            return _cache.MaintenanceMode.Value;
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to resolve maintenance mode, defaulting to off");
            return false;
        }
#pragma warning disable CA1031 // Intentional general catch for fail-open maintenance check
        catch (Exception ex)
#pragma warning restore CA1031
        {
            _logger.LogWarning(ex, "Unexpected error checking maintenance mode, defaulting to off");
            return false;
        }
        finally
        {
            CacheLock.Release();
        }
    }
}
