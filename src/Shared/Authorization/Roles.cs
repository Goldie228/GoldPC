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
    /// Бухгалтер. Финансовые отчёты и аналитика.
    /// </summary>
    public const string Accountant = "Accountant";

    /// <summary>
    /// Клиент (покупатель). Просмотр товаров и управление своими заказами.
    /// </summary>
    public const string Client = "Client";

    /// <summary>
    /// Сотрудник. Работа с заказами и товарами. (Синтаксический сахар для Accountant)
    /// </summary>
    public const string Employee = "Employee";

    /// <summary>
    /// Клиент (покупатель). (Синтаксический сахар для Client)
    /// </summary>
    public const string Customer = "Customer";

    /// <summary>
    /// Гость (неавторизованный пользователь).
    /// </summary>
    public const string Guest = "Guest";

    /// <summary>
    /// Мастер. Выполнение ремонтных и сборочных работ.
    /// </summary>
    public const string Master = "Master";

    /// <summary>
    /// Возвращает список всех доступных ролей.
    /// Соответствует enum UserRole из SharedKernel.
    /// </summary>
    public static readonly string[] AllRoles = { Client, Manager, Master, Admin, Accountant };
}
