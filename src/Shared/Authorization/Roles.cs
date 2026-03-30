namespace GoldPC.Shared.Authorization;

/// <summary>
/// Статический класс, содержащий константы ролей пользователей системы.
/// </summary>
public static class Roles
{
    /// <summary>
    /// Администратор системы. Полный доступ ко всем функциям.
    /// </summary>
    public const string Admin = "Admin";

    /// <summary>
    /// Менеджер магазина. Управление товарами, заказами, просмотр отчётов.
    /// </summary>
    public const string Manager = "Manager";

    /// <summary>
    /// Сотрудник. Работа с заказами и товарами.
    /// </summary>
    public const string Employee = "Employee";

    /// <summary>
    /// Клиент (покупатель). Просмотр товаров и управление своими заказами.
    /// </summary>
    public const string Customer = "Customer";

    /// <summary>
    /// Возвращает список всех доступных ролей.
    /// </summary>
    public static readonly string[] AllRoles = { Admin, Manager, Employee, Customer };
}
