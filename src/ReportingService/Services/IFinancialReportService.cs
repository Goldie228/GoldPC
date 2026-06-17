using GoldPC.ReportingService.Models;

namespace GoldPC.ReportingService.Services;

/// <summary>
/// Интерфейс сервиса финансовых отчётов
/// </summary>
public interface IFinancialReportService
{
    /// <summary>
    /// Сводный финансовый отчёт за период
    /// </summary>
    Task<FinancialSummaryDto> GetFinancialSummaryAsync(DateTime from, DateTime to);

    /// <summary>
    /// Заказы, сгруппированные по периоду
    /// </summary>
    /// <param name="from">Начало периода</param>
    /// <param name="to">Конец периода</param>
    /// <param name="groupBy">Группировка: day, week, month</param>
    Task<List<OrdersByPeriodDto>> GetOrdersByPeriodAsync(DateTime from, DateTime to, string groupBy);

    /// <summary>
    /// Статистика по услугам СЦ за период
    /// </summary>
    Task<ServicesByPeriodDto> GetServicesByPeriodAsync(DateTime from, DateTime to);

    /// <summary>
    /// Экспорт данных в CSV
    /// </summary>
    /// <param name="entity">Тип сущности: orders, products</param>
    /// <param name="from">Начало периода</param>
    /// <param name="to">Конец периода</param>
    Task<(byte[] CsvBytes, string FileName)> ExportAsync(string entity, DateTime from, DateTime to);
}
