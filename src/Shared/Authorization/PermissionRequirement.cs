using Microsoft.AspNetCore.Authorization;

namespace GoldPC.Shared.Authorization;

/// <summary>
/// Требование разрешения для авторизации.
/// Используется в связке с PermissionAuthorizationHandler.
/// </summary>
public class PermissionRequirement : IAuthorizationRequirement
{
    /// <summary>
    /// Инициализирует новый экземпляр требования разрешения.
    /// </summary>
    /// <param name="permission">Необходимое разрешение.</param>
    public PermissionRequirement(string permission)
    {
        Permission = permission ?? throw new ArgumentNullException(nameof(permission));
    }

    /// <summary>
    /// Получает необходимое разрешение.
    /// </summary>
    public string Permission { get; }
}