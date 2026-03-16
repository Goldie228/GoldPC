using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

namespace GoldPC.Shared.Authorization;

/// <summary>
/// Обработчик авторизации на основе разрешений.
/// Проверяет, имеет ли пользователь необходимые разрешения через свои роли.
/// </summary>
public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly ILogger<PermissionAuthorizationHandler> _logger;

    /// <summary>
    /// Инициализирует новый экземпляр обработчика авторизации.
    /// </summary>
    /// <param name="logger">Логгер.</param>
    public PermissionAuthorizationHandler(ILogger<PermissionAuthorizationHandler> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Обрабатывает требование разрешения.
    /// </summary>
    /// <param name="context">Контекст авторизации.</param>
    /// <param name="requirement">Требование разрешения.</param>
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        // Проверяем, аутентифицирован ли пользователь
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            _logger.LogWarning("Попытка авторизации неаутентифицированного пользователя");
            context.Fail();
            return Task.CompletedTask;
        }

        // Получаем все роли пользователя
        var userRoles = context.User
            .FindAll(ClaimTypes.Role)
            .Select(c => c.Value)
            .ToList();

        if (userRoles.Count == 0)
        {
            _logger.LogWarning(
                "У пользователя {UserId} нет назначенных ролей",
                context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown");
            context.Fail();
            return Task.CompletedTask;
        }

        // Проверяем каждую роль на наличие нужного разрешения
        foreach (var role in userRoles)
        {
            if (RolePermissions.HasPermission(role, requirement.Permission))
            {
                _logger.LogDebug(
                    "Разрешение {Permission} предоставлено пользователю через роль {Role}",
                    requirement.Permission,
                    role);

                context.Succeed(requirement);
                return Task.CompletedTask;
            }
        }

        _logger.LogWarning(
            "Доступ запрещён: у пользователя {UserId} нет разрешения {Permission}. Роли: {Roles}",
            context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown",
            requirement.Permission,
            string.Join(", ", userRoles));

        context.Fail();
        return Task.CompletedTask;
    }
}