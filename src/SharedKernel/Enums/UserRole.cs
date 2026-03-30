namespace GoldPC.SharedKernel.Enums;

/// <summary>
/// Роли пользователей в системе GoldPC
/// </summary>
public enum UserRole
{
    /// <summary>
    /// Клиент - зарегистрированный покупатель
    /// </summary>
    Client = 0,

    /// <summary>
    /// Менеджер - обработка заказов и управление товарами
    /// </summary>
    Manager = 1,

    /// <summary>
    /// Мастер - выполнение ремонтных и сборочных работ
    /// </summary>
    Master = 2,

    /// <summary>
    /// Администратор - полное управление системой
    /// </summary>
    Admin = 3,

    /// <summary>
    /// Бухгалтер - финансовые отчёты
    /// </summary>
    Accountant = 4
}
