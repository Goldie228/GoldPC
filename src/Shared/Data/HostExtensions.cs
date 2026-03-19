using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;

namespace Shared.Data;

/// <summary>
/// Методы расширения для автоматического применения миграций при запуске
/// </summary>
public static class HostExtensions
{
    /// <summary>
    /// Применяет миграции базы данных автоматически при запуске приложения.
    /// Всегда использует Migrate() для консистентности между Development и Production.
    /// </summary>
    /// <typeparam name="TContext">Тип DbContext</typeparam>
    /// <param name="host">Хост приложения</param>
    /// <param name="seedAction">Опциональное действие для заполнения начальными данными</param>
    /// <returns>Хост приложения для chaining</returns>
    public static IHost ApplyMigrations<TContext>(
        this IHost host, 
        Action<IServiceProvider>? seedAction = null) 
        where TContext : DbContext
    {
        using var scope = host.Services.CreateScope();
        var serviceProvider = scope.ServiceProvider;
        var logger = serviceProvider.GetService<ILogger<TContext>>();
        
        try
        {
            var dbContext = serviceProvider.GetRequiredService<TContext>();
            
            // Всегда используем миграции для консистентности
            // Это предотвращает рассинхронизацию между EnsureCreated и миграциями
            ApplyPendingMigrations(dbContext, logger);
            
            // Выполняем seed данных если передан
            seedAction?.Invoke(serviceProvider);
            
            Log.Information("Миграции базы данных {ContextName} успешно применены", typeof(TContext).Name);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Ошибка при применении миграций базы данных {ContextName}", typeof(TContext).Name);
            throw;
        }
        
        return host;
    }

    /// <summary>
    /// Применяет миграции с поддержкой нескольких DbContext.
    /// Всегда использует Migrate() для консистентности.
    /// </summary>
    public static IHost ApplyMigrations(
        this IHost host,
        params Type[] contextTypes)
    {
        using var scope = host.Services.CreateScope();
        var serviceProvider = scope.ServiceProvider;
        var loggerFactory = serviceProvider.GetService<ILoggerFactory>();
        var logger = loggerFactory?.CreateLogger("DatabaseMigrations");
        
        foreach (var contextType in contextTypes)
        {
            try
            {
                var dbContext = (DbContext)serviceProvider.GetRequiredService(contextType);
                
                // Всегда используем миграции для консистентности
                var pendingMigrations = dbContext.Database.GetPendingMigrations().ToList();
                if (pendingMigrations.Any())
                {
                    logger?.LogInformation("Применение {Count} pending миграций для {ContextName}...", 
                        pendingMigrations.Count, contextType.Name);
                    dbContext.Database.Migrate();
                }
                
                Log.Information("Миграции {ContextName} успешно применены", contextType.Name);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Ошибка при применении миграций {ContextName}", contextType.Name);
                throw;
            }
        }
        
        return host;
    }

    private static void ApplyPendingMigrations(DbContext dbContext, Microsoft.Extensions.Logging.ILogger? logger)
    {
        var pendingMigrations = dbContext.Database.GetPendingMigrations().ToList();
        
        if (pendingMigrations.Any())
        {
            logger?.LogInformation("Применение {Count} pending миграций...", pendingMigrations.Count);
            dbContext.Database.Migrate();
            logger?.LogInformation("Миграции успешно применены: {Migrations}", string.Join(", ", pendingMigrations));
        }
        else
        {
            logger?.LogInformation("База данных актуальна, миграции не требуются");
        }
    }
}