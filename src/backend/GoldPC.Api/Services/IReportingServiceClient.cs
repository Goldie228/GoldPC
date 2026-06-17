#pragma warning disable CS1591
namespace GoldPC.Api.Services;

/// <summary>
/// HTTP-клиент для микросервиса ReportingService (порт 5008)
/// Проксирует запросы отчётов для бухгалтера.
/// </summary>
public interface IReportingServiceClient
{
    /// <summary>Сводный финансовый отчёт за период</summary>
    Task<ReportingApiResponse> GetFinancialSummaryAsync(DateTime from, DateTime to);

    /// <summary>Заказы, сгруппированные по периоду</summary>
    Task<ReportingApiResponse> GetOrdersByPeriodAsync(DateTime from, DateTime to, string groupBy);

    /// <summary>Статистика по услугам СЦ за период</summary>
    Task<ReportingApiResponse> GetServicesByPeriodAsync(DateTime from, DateTime to);

    /// <summary>Экспорт данных в CSV (возвращает байты файла)</summary>
    Task<(byte[] CsvBytes, string? ContentType, string? FileName)?> ExportDataAsync(string entity, DateTime from, DateTime to);
}

/// <summary>
/// Обёртка над ответом ReportingService
/// </summary>
public sealed record ReportingApiResponse
{
    public bool Success { get; init; }
    public object? Data { get; init; }
    public string? Message { get; init; }
}
#pragma warning restore CS1591
