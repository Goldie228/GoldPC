using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace GoldPC.Shared.Authorization;

/// <summary>
/// Методы расширения для регистрации сервисов авторизации.
/// </summary>
public static class AuthorizationServiceExtensions
{
    /// <summary>
    /// Добавляет политику авторизации на основе разрешений.
    /// </summary>
    /// <param name="services">Коллекция сервисов.</param>
    /// <param name="permission">Разрешение для политики.</param>
    /// <returns>Коллекция сервисов для цепочки вызовов.</returns>
    public static IServiceCollection AddPermissionPolicy(this IServiceCollection services, string permission)
    {
        services.AddAuthorization(options =>
        {
            options.AddPolicy(permission, policy =>
                policy.Requirements.Add(new PermissionRequirement(permission)));
        });

        return services;
    }

    /// <summary>
    /// Добавляет все политики авторизации на основе разрешений.
    /// Автоматически создаёт политики для всех разрешений, определённых в Permissions.
    /// </summary>
    /// <param name="services">Коллекция сервисов.</param>
    /// <returns>Коллекция сервисов для цепочки вызовов.</returns>
    public static IServiceCollection AddAllPermissionPolicies(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            foreach (var permission in Permissions.AllPermissions)
            {
                options.AddPolicy(permission, policy =>
                    policy.Requirements.Add(new PermissionRequirement(permission)));
            }
        });

        return services;
    }

    /// <summary>
    /// Добавляет обработчик авторизации на основе разрешений.
    /// </summary>
    /// <param name="services">Коллекция сервисов.</param>
    /// <returns>Коллекция сервисов для цепочки вызовов.</returns>
    public static IServiceCollection AddPermissionAuthorization(this IServiceCollection services)
    {
        services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();

        return services;
    }

    /// <summary>
    /// Полная настройка системы авторизации на основе разрешений.
    /// Регистрирует обработчик и создаёт политики для всех разрешений.
    /// </summary>
    /// <param name="services">Коллекция сервисов.</param>
    /// <returns>Коллекция сервисов для цепочки вызовов.</returns>
    public static IServiceCollection AddPermissionBasedAuthorization(this IServiceCollection services)
    {
        services.AddPermissionAuthorization();
        services.AddAllPermissionPolicies();

        return services;
    }
}