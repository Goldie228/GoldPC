namespace GoldPC.Shared.Authorization;

/// <summary>
/// Статический класс, содержащий константы разрешений для системы авторизации.
/// Используется для тонкой настройки прав доступа.
/// </summary>
public static class Permissions
{
    #region Products (Товары)

    /// <summary>
    /// Просмотр товаров и каталога.
    /// </summary>
    public const string ProductsView = "products:view";

    /// <summary>
    /// Создание новых товаров.
    /// </summary>
    public const string ProductsCreate = "products:create";

    /// <summary>
    /// Редактирование существующих товаров.
    /// </summary>
    public const string ProductsEdit = "products:edit";

    /// <summary>
    /// Удаление товаров.
    /// </summary>
    public const string ProductsDelete = "products:delete";

    #endregion

    #region Orders (Заказы)

    /// <summary>
    /// Просмотр заказов.
    /// </summary>
    public const string OrdersView = "orders:view";

    /// <summary>
    /// Управление заказами (изменение статуса, редактирование).
    /// </summary>
    public const string OrdersManage = "orders:manage";

    /// <summary>
    /// Отмена заказов.
    /// </summary>
    public const string OrdersCancel = "orders:cancel";

    /// <summary>
    /// Создание новых заказов.
    /// </summary>
    public const string OrdersCreate = "orders:create";

    #endregion

    #region Users (Пользователи)

    /// <summary>
    /// Просмотр списка пользователей.
    /// </summary>
    public const string UsersView = "users:view";

    /// <summary>
    /// Управление пользователями (создание, редактирование, удаление).
    /// </summary>
    public const string UsersManage = "users:manage";

    /// <summary>
    /// Просмотр ролей и разрешений пользователей.
    /// </summary>
    public const string UsersViewRoles = "users:view-roles";

    /// <summary>
    /// Управление ролями и разрешениями пользователей.
    /// </summary>
    public const string UsersManageRoles = "users:manage-roles";

    #endregion

    #region Reports (Отчёты)

    /// <summary>
    /// Просмотр отчётов и аналитики.
    /// </summary>
    public const string ReportsView = "reports:view";

    /// <summary>
    /// Экспорт отчётов.
    /// </summary>
    public const string ReportsExport = "reports:export";

    #endregion

    #region Categories (Категории)

    /// <summary>
    /// Просмотр категорий товаров.
    /// </summary>
    public const string CategoriesView = "categories:view";

    /// <summary>
    /// Управление категориями товаров.
    /// </summary>
    public const string CategoriesManage = "categories:manage";

    #endregion

    #region Services (Услуги)

    /// <summary>
    /// Просмотр услуг сервиса.
    /// </summary>
    public const string ServicesView = "services:view";

    /// <summary>
    /// Управление услугами сервиса.
    /// </summary>
    public const string ServicesManage = "services:manage";

    #endregion

    #region PC Builder (Конфигуратор ПК)

    /// <summary>
    /// Использование конфигуратора ПК.
    /// </summary>
    public const string PcBuilderUse = "pcbuilder:use";

    /// <summary>
    /// Управление конфигурациями совместимости.
    /// </summary>
    public const string PcBuilderManage = "pcbuilder:manage";

    #endregion

    #region Warranty (Гарантия)

    /// <summary>
    /// Просмотр гарантийных обязательств.
    /// </summary>
    public const string WarrantyView = "warranty:view";

    /// <summary>
    /// Управление гарантийными заявками.
    /// </summary>
    public const string WarrantyManage = "warranty:manage";

    #endregion

    /// <summary>
    /// Возвращает список всех разрешений.
    /// </summary>
    public static readonly string[] AllPermissions =
    {
        // Products
        ProductsView, ProductsCreate, ProductsEdit, ProductsDelete,

        // Orders
        OrdersView, OrdersManage, OrdersCancel, OrdersCreate,

        // Users
        UsersView, UsersManage, UsersViewRoles, UsersManageRoles,

        // Reports
        ReportsView, ReportsExport,

        // Categories
        CategoriesView, CategoriesManage,

        // Services
        ServicesView, ServicesManage,

        // PC Builder
        PcBuilderUse, PcBuilderManage,

        // Warranty
        WarrantyView, WarrantyManage
    };
}