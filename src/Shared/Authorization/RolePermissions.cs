namespace GoldPC.Shared.Authorization;

/// <summary>
/// Статический класс, содержащий маппинг ролей к разрешениям.
/// Определяет какие разрешения имеет каждая роль в системе.
/// </summary>
public static class RolePermissions
{
    /// <summary>
    /// Словарь маппинга ролей к массиву разрешений.
    /// </summary>
    public static readonly Dictionary<string, string[]> Mapping = new()
    {
        // Admin - полный доступ ко всем функциям системы
        [Roles.Admin] = new[]
        {
            // Products
            Permissions.ProductsView,
            Permissions.ProductsCreate,
            Permissions.ProductsEdit,
            Permissions.ProductsDelete,

            // Orders
            Permissions.OrdersView,
            Permissions.OrdersManage,
            Permissions.OrdersCancel,
            Permissions.OrdersCreate,

            // Users
            Permissions.UsersView,
            Permissions.UsersManage,
            Permissions.UsersViewRoles,
            Permissions.UsersManageRoles,

            // Reports
            Permissions.ReportsView,
            Permissions.ReportsExport,
            Permissions.AuditView,

            // Categories
            Permissions.CategoriesView,
            Permissions.CategoriesManage,

            // Services
            Permissions.ServicesView,
            Permissions.ServicesManage,

            // PC Builder
            Permissions.PcBuilderUse,
            Permissions.PcBuilderManage,

            // Warranty
            Permissions.WarrantyView,
            Permissions.WarrantyManage
        },

        // Manager - управление товарами, заказами, просмотр отчётов
        [Roles.Manager] = new[]
        {
            // Products
            Permissions.ProductsView,
            Permissions.ProductsCreate,
            Permissions.ProductsEdit,

            // Orders
            Permissions.OrdersView,
            Permissions.OrdersManage,
            Permissions.OrdersCancel,
            Permissions.OrdersCreate,

            // Users (только просмотр)
            Permissions.UsersView,

            // Reports
            Permissions.ReportsView,
            Permissions.ReportsExport,

            // Categories
            Permissions.CategoriesView,
            Permissions.CategoriesManage,

            // Services
            Permissions.ServicesView,
            Permissions.ServicesManage,

            // PC Builder
            Permissions.PcBuilderUse,
            Permissions.PcBuilderManage,

            // Warranty
            Permissions.WarrantyView,
            Permissions.WarrantyManage
        },

        // Employee - работа с заказами и товарами
        [Roles.Employee] = new[]
        {
            // Products
            Permissions.ProductsView,

            // Orders
            Permissions.OrdersView,
            Permissions.OrdersManage,
            Permissions.OrdersCreate,

            // Categories
            Permissions.CategoriesView,

            // Services
            Permissions.ServicesView,

            // PC Builder
            Permissions.PcBuilderUse,

            // Warranty
            Permissions.WarrantyView
        },

        // Customer - базовые права клиента
        [Roles.Customer] = new[]
        {
            // Products
            Permissions.ProductsView,

            // Orders (только свои заказы)
            Permissions.OrdersView,
            Permissions.OrdersCancel,
            Permissions.OrdersCreate,

            // Categories
            Permissions.CategoriesView,

            // Services
            Permissions.ServicesView,

            // PC Builder
            Permissions.PcBuilderUse,

            // Warranty
            Permissions.WarrantyView
        }
    };

    /// <summary>
    /// Проверяет, имеет ли указанная роль указанное разрешение.
    /// </summary>
    /// <param name="role">Название роли.</param>
    /// <param name="permission">Название разрешения.</param>
    /// <returns>True, если роль имеет разрешение, иначе false.</returns>
    public static bool HasPermission(string role, string permission)
    {
        if (!Mapping.TryGetValue(role, out var permissions))
        {
            return false;
        }

        return permissions.Contains(permission);
    }

    /// <summary>
    /// Возвращает все разрешения для указанной роли.
    /// </summary>
    /// <param name="role">Название роли.</param>
    /// <returns>Массив разрешений или пустой массив, если роль не найдена.</returns>
    public static string[] GetPermissionsForRole(string role)
    {
        return Mapping.TryGetValue(role, out var permissions) ? permissions : Array.Empty<string>();
    }

    /// <summary>
    /// Проверяет, существует ли указанная роль в системе.
    /// </summary>
    /// <param name="role">Название роли.</param>
    /// <returns>True, если роль существует, иначе false.</returns>
    public static bool RoleExists(string role)
    {
        return Mapping.ContainsKey(role);
    }
}