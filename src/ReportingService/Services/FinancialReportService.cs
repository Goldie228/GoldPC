using System.Globalization;
using System.Text;
using CsvHelper;
using GoldPC.ReportingService.Data;
using GoldPC.ReportingService.Models;
using Microsoft.EntityFrameworkCore;

namespace GoldPC.ReportingService.Services;

/// <summary>
/// Сервис финансовых отчётов для бухгалтера.
/// Использует postgres_fdw для запросов к данным заказов и услуг.
/// </summary>
public class FinancialReportService : IFinancialReportService
{
    private readonly ReportingDbContext _context;
    private readonly ILogger<FinancialReportService> _logger;

    // Маржа по умолчанию 20%, используется когда нет данных о себестоимости
    private const decimal DefaultMarginPercent = 20m;

    public FinancialReportService(ReportingDbContext context, ILogger<FinancialReportService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<FinancialSummaryDto> GetFinancialSummaryAsync(DateTime from, DateTime to)
    {
        _logger.LogDebug("GetFinancialSummaryAsync: from={From}, to={To}", from, to);

        // Заказы за период в статусах, считающихся выручкой
        var ordersQuery = _context.Database.SqlQueryRaw<FinancialOrderRow>(@"
            SELECT 
                total AS ""Total"",
                status AS ""Status""
            FROM fdw_orders.orders
            WHERE created_at >= @from 
              AND created_at < @to
              AND status IN ('Completed', 'Ready', 'Paid')
        ", from, to);

        var orders = await ordersQuery.ToListAsync();

        var revenue = orders.Sum(o => o.Total);
        var ordersCount = orders.Count;
        var averageCheck = ordersCount > 0 ? revenue / ordersCount : 0m;

        // Количество оказанных услуг за период
        var servicesCount = await _context.Database.SqlQueryRaw<int>(@"
            SELECT COUNT(*) AS ""Value""
            FROM fdw_services.service_requests
            WHERE created_at >= @from 
              AND created_at < @to
        ", from, to).FirstOrDefaultAsync();

        var profit = revenue * DefaultMarginPercent / 100m;

        return new FinancialSummaryDto
        {
            Revenue = revenue,
            OrdersCount = ordersCount,
            AverageCheck = Math.Round(averageCheck, 2),
            ServicesCount = servicesCount,
            Profit = Math.Round(profit, 2),
            MarginPercent = DefaultMarginPercent
        };
    }

    /// <inheritdoc />
    public async Task<List<OrdersByPeriodDto>> GetOrdersByPeriodAsync(DateTime from, DateTime to, string groupBy)
    {
        _logger.LogDebug("GetOrdersByPeriodAsync: from={From}, to={To}, groupBy={GroupBy}", from, to, groupBy);

        // Определяем функцию группировки PostgreSQL в зависимости от параметра
        var truncUnit = groupBy.ToLowerInvariant() switch
        {
            "week" => "week",
            "month" => "month",
            _ => "day" // по умолчанию — по дням
        };

        var results = await _context.Database.SqlQueryRaw<OrdersByPeriodDto>(@"
            SELECT 
                date_trunc(@truncUnit, created_at) AS ""PeriodStart"",
                COUNT(*) AS ""OrdersCount"",
                COALESCE(SUM(total), 0) AS ""TotalAmount""
            FROM fdw_orders.orders
            WHERE created_at >= @from 
              AND created_at < @to
              AND status IN ('Completed', 'Ready', 'Paid')
            GROUP BY date_trunc(@truncUnit, created_at)
            ORDER BY date_trunc(@truncUnit, created_at) ASC
        ", truncUnit, from, to).ToListAsync();

        return results;
    }

    /// <inheritdoc />
    public async Task<ServicesByPeriodDto> GetServicesByPeriodAsync(DateTime from, DateTime to)
    {
        _logger.LogDebug("GetServicesByPeriodAsync: from={From}, to={To}", from, to);

        // Статистика по статусам заявок за период
        var stats = await _context.Database.SqlQueryRaw<ServiceStatsRow>(@"
            SELECT 
                COUNT(*) AS ""TotalRequests"",
                COUNT(*) FILTER (WHERE status = 'Completed') AS ""CompletedRequests"",
                COUNT(*) FILTER (WHERE status = 'Cancelled') AS ""CancelledRequests"",
                COALESCE(SUM(actual_cost), 0) AS ""TotalRevenue"",
                COALESCE(AVG(NULLIF(actual_cost, 0)), 0) AS ""AverageServiceCost""
            FROM fdw_services.service_requests
            WHERE created_at >= @from 
              AND created_at < @to
        ", from, to).FirstOrDefaultAsync();

        // Выручка по типам услуг
        var byType = await _context.Database.SqlQueryRaw<ServiceTypeRevenueDto>(@"
            SELECT 
                COALESCE(st.name, 'Неизвестно') AS ""ServiceTypeName"",
                COUNT(sr.id) AS ""RequestsCount"",
                COALESCE(SUM(sr.actual_cost), 0) AS ""Revenue""
            FROM fdw_services.service_requests sr
            LEFT JOIN fdw_services.service_types st ON sr.service_type_id = st.id
            WHERE sr.created_at >= @from 
              AND sr.created_at < @to
            GROUP BY st.name
            ORDER BY ""Revenue"" DESC
        ", from, to).ToListAsync();

        return new ServicesByPeriodDto
        {
            TotalRequests = stats?.TotalRequests ?? 0,
            CompletedRequests = stats?.CompletedRequests ?? 0,
            CancelledRequests = stats?.CancelledRequests ?? 0,
            TotalRevenue = stats?.TotalRevenue ?? 0m,
            AverageServiceCost = stats?.AverageServiceCost ?? 0m,
            ByServiceType = byType
        };
    }

    /// <inheritdoc />
    public async Task<(byte[] CsvBytes, string FileName)> ExportAsync(string entity, DateTime from, DateTime to)
    {
        _logger.LogDebug("ExportAsync: entity={Entity}, from={From}, to={To}", from, to);

        var entityLower = entity.ToLowerInvariant();
        var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
        IEnumerable<object> data;
        string fileName;

        switch (entityLower)
        {
            case "orders":
                data = (await ExportOrdersAsync(from, to)).Cast<object>();
                fileName = $"orders_{timestamp}.csv";
                break;
            case "products":
                data = (await ExportProductsAsync()).Cast<object>();
                fileName = $"products_{timestamp}.csv";
                break;
            default:
                throw new ArgumentException($"Неизвестный тип сущности для экспорта: {entity}. Допустимые: orders, products");
        }

        using var memoryStream = new MemoryStream();
        using (var writer = new StreamWriter(memoryStream, Encoding.UTF8))
        using (var csv = new CsvWriter(writer, CultureInfo.InvariantCulture))
        {
            await csv.WriteRecordsAsync(data);
        }

        return (memoryStream.ToArray(), fileName);
    }

    /// <summary>
    /// Экспорт заказов за период в CSV
    /// </summary>
    private async Task<List<CsvOrderRow>> ExportOrdersAsync(DateTime from, DateTime to)
    {
        return await _context.Database.SqlQueryRaw<CsvOrderRow>(@"
            SELECT 
                order_number AS ""OrderNumber"",
                customer_first_name || ' ' || COALESCE(customer_last_name, '') AS ""CustomerName"",
                customer_phone AS ""CustomerPhone"",
                customer_email AS ""CustomerEmail"",
                status AS ""Status"",
                total AS ""Total"",
                payment_method AS ""PaymentMethod"",
                delivery_method AS ""DeliveryMethod"",
                created_at AS ""CreatedAt""
            FROM fdw_orders.orders
            WHERE created_at >= @from 
              AND created_at < @to
            ORDER BY created_at DESC
        ", from, to).ToListAsync();
    }

    /// <summary>
    /// Экспорт всех товаров каталога в CSV
    /// </summary>
    private async Task<List<CsvProductRow>> ExportProductsAsync()
    {
        return await _context.Database.SqlQueryRaw<CsvProductRow>(@"
            SELECT 
                id AS ""Id"",
                name AS ""Name"",
                sku AS ""Sku"",
                price AS ""Price"",
                stock AS ""Stock"",
                COALESCE(description, '') AS ""Description""
            FROM fdw_catalog.products
            ORDER BY name ASC
        ").ToListAsync();
    }
}

/// <summary>
/// Внутренняя DTO для строковой выборки заказов из FDW
/// </summary>
public sealed class FinancialOrderRow
{
    public decimal Total { get; set; }
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// Внутренняя DTO для агрегированной статистики услуг
/// </summary>
public sealed class ServiceStatsRow
{
    public int TotalRequests { get; set; }
    public int CompletedRequests { get; set; }
    public int CancelledRequests { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageServiceCost { get; set; }
}

/// <summary>
/// Строка CSV для заказа
/// </summary>
public sealed class CsvOrderRow
{
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string DeliveryMethod { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Строка CSV для товара
/// </summary>
public sealed class CsvProductRow
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public string Description { get; set; } = string.Empty;
}
