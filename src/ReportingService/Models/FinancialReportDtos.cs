namespace GoldPC.ReportingService.Models;

/// <summary>
/// Сводный финансовый отчёт за период
/// </summary>
public class FinancialSummaryDto
{
    /// <summary>Выручка за период (сумма заказов в статусе Completed/Ready/Paid)</summary>
    public decimal Revenue { get; set; }

    /// <summary>Количество заказов за период</summary>
    public int OrdersCount { get; set; }

    /// <summary>Средний чек</summary>
    public decimal AverageCheck { get; set; }

    /// <summary>Количество оказанных услуг СЦ</summary>
    public int ServicesCount { get; set; }

    /// <summary>Прибыль (выручка × маржа)</summary>
    public decimal Profit { get; set; }

    /// <summary>Процент маржи, использованный для расчёта</summary>
    public decimal MarginPercent { get; set; }
}

/// <summary>
/// Группировка заказов по периоду (день, неделя, месяц)
/// </summary>
public class OrdersByPeriodDto
{
    /// <summary>Начало периода</summary>
    public DateTime PeriodStart { get; set; }

    /// <summary>Количество заказов в периоде</summary>
    public int OrdersCount { get; set; }

    /// <summary>Сумма заказов в периоде</summary>
    public decimal TotalAmount { get; set; }
}

/// <summary>
/// Статистика по услугам СЦ за период
/// </summary>
public class ServicesByPeriodDto
{
    /// <summary>Общее количество заявок</summary>
    public int TotalRequests { get; set; }

    /// <summary>Количество завершённых заявок</summary>
    public int CompletedRequests { get; set; }

    /// <summary>Количество отменённых заявок</summary>
    public int CancelledRequests { get; set; }

    /// <summary>Суммарная выручка по услугам</summary>
    public decimal TotalRevenue { get; set; }

    /// <summary>Средняя стоимость услуги</summary>
    public decimal AverageServiceCost { get; set; }

    /// <summary>Выручка по типам услуг</summary>
    public List<ServiceTypeRevenueDto> ByServiceType { get; set; } = [];
}

/// <summary>
/// Выручка по конкретному типу услуги
/// </summary>
public class ServiceTypeRevenueDto
{
    /// <summary>Название типа услуги</summary>
    public string ServiceTypeName { get; set; } = string.Empty;

    /// <summary>Количество заявок</summary>
    public int RequestsCount { get; set; }

    /// <summary>Выручка</summary>
    public decimal Revenue { get; set; }
}

/// <summary>
/// Параметры запроса финансового отчёта
/// </summary>
public class ReportDateRange
{
    /// <summary>Начало периода (обязательно)</summary>
    public DateTime From { get; set; }

    /// <summary>Конец периода (обязательно)</summary>
    public DateTime To { get; set; }
}

/// <summary>
/// Параметры запроса заказов по периоду
/// </summary>
public class OrdersByPeriodQuery : ReportDateRange
{
    /// <summary>Группировка: day, week, month</summary>
    public string GroupBy { get; set; } = "day";
}

/// <summary>
/// Тип сущности для экспорта
/// </summary>
public enum ExportEntityType
{
    Orders,
    Products,
    Users
}
