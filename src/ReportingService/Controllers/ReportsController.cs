using System.Globalization;
using CsvHelper;
using GoldPC.ReportingService.Data;
using GoldPC.ReportingService.Models;
using GoldPC.ReportingService.Services;
using GoldPC.Shared.Authorization;
using GoldPC.SharedKernel.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GoldPC.ReportingService.Controllers;

/// <summary>
/// Контроллер отчётов — эндпоинты для бухгалтера и аналитики
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly ReportingDbContext _context;
    private readonly IFinancialReportService _reportService;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(
        ReportingDbContext context,
        IFinancialReportService reportService,
        ILogger<ReportsController> logger)
    {
        _context = context;
        _reportService = reportService;
        _logger = logger;
    }

    // ========================================================================
    // Существующие эндпоинты (без изменений)
    // ========================================================================

    [HttpGet("sales")]
    [Authorize(Policy = Permissions.ReportsView)]
    public async Task<ActionResult<IEnumerable<SalesPerformanceReport>>> GetSalesPerformance([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var query = _context.SalesPerformance.AsQueryable();

        if (from.HasValue)
            query = query.Where(r => r.Date >= from.Value);

        if (to.HasValue)
            query = query.Where(r => r.Date <= to.Value);

        return await query.OrderByDescending(r => r.Date).ToListAsync();
    }

    [HttpGet("services")]
    [Authorize(Policy = Permissions.ReportsView)]
    public async Task<ActionResult<IEnumerable<ServiceEfficiencyReport>>> GetServiceEfficiency()
    {
        return await _context.ServiceEfficiency.ToListAsync();
    }

    [HttpGet("inventory")]
    [Authorize(Policy = Permissions.ReportsView)]
    public async Task<ActionResult<IEnumerable<InventoryAnalyticsReport>>> GetInventoryAnalytics()
    {
        return await _context.InventoryAnalytics.ToListAsync();
    }

    [HttpGet("export/csv/{type}")]
    [Authorize(Policy = Permissions.ReportsExport)]
    public async Task<IActionResult> ExportToCsv(string type)
    {
        IEnumerable<object> data = type.ToLower() switch
        {
            "sales" => await _context.SalesPerformance.ToListAsync(),
            "services" => await _context.ServiceEfficiency.ToListAsync(),
            "inventory" => await _context.InventoryAnalytics.ToListAsync(),
            _ => throw new ArgumentException("Invalid report type")
        };

        using var memoryStream = new MemoryStream();
        using (var writer = new StreamWriter(memoryStream))
        using (var csv = new CsvWriter(writer, CultureInfo.InvariantCulture))
        {
            await csv.WriteRecordsAsync(data);
        }

        return File(memoryStream.ToArray(), "text/csv", $"report_{type}_{DateTime.Now:yyyyMMdd}.csv");
    }

    [HttpGet("audit")]
    [Authorize(Policy = Permissions.AuditView)]
    public async Task<ActionResult<IEnumerable<AuditEntry>>> GetAuditLog()
    {
        var auditLog = await _context.Database.SqlQuery<AuditEntry>($@"
            SELECT 
                id as Id,
                'OrdersService' as ServiceName,
                'StatusChange' as Action,
                'Order' as EntityName,
                order_id as EntityId,
                'User ' || changed_by::text as ChangedBy,
                changed_at as ChangedAt,
                comment as Details
            FROM fdw_orders.order_history
            ORDER BY changed_at DESC
            LIMIT 100
        ").ToListAsync();

        return auditLog;
    }

    // ========================================================================
    // Новые эндпоинты для бухгалтера
    // ========================================================================

    /// <summary>
    /// Сводный финансовый отчёт за период.
    /// Включает выручку, количество заказов, средний чек, количество услуг, прибыль.
    /// </summary>
    /// <param name="from">Начало периода (обязательно)</param>
    /// <param name="to">Конец периода (обязательно)</param>
    [HttpGet("financial-summary")]
    [Authorize(Policy = Permissions.ReportsView)]
    [ProducesResponseType(typeof(ApiResponse<FinancialSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFinancialSummary(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        // Валидация обязательных параметров
        if (!from.HasValue || !to.HasValue)
        {
            return BadRequest(new { success = false, message = "Параметры 'from' и 'to' обязательны" });
        }

        if (from.Value >= to.Value)
        {
            return BadRequest(new { success = false, message = "Параметр 'from' должен быть меньше 'to'" });
        }

        var result = await _reportService.GetFinancialSummaryAsync(from.Value, to.Value);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Заказы, сгруппированные по периоду (день, неделя, месяц).
    /// </summary>
    /// <param name="from">Начало периода (обязательно)</param>
    /// <param name="to">Конец периода (обязательно)</param>
    /// <param name="groupBy">Группировка: day | week | month (по умолчанию day)</param>
    [HttpGet("orders-by-period")]
    [Authorize(Policy = Permissions.ReportsView)]
    [ProducesResponseType(typeof(ApiResponse<List<OrdersByPeriodDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrdersByPeriod(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string? groupBy = "day")
    {
        if (!from.HasValue || !to.HasValue)
        {
            return BadRequest(new { success = false, message = "Параметры 'from' и 'to' обязательны" });
        }

        if (from.Value >= to.Value)
        {
            return BadRequest(new { success = false, message = "Параметр 'from' должен быть меньше 'to'" });
        }

        // Валидация groupBy
        var validGroupBy = new[] { "day", "week", "month" };
        if (!validGroupBy.Contains((groupBy ?? "day").ToLowerInvariant()))
        {
            return BadRequest(new { success = false, message = $"Параметр 'group' допустимые значения: day, week, month" });
        }

        var result = await _reportService.GetOrdersByPeriodAsync(from.Value, to.Value, groupBy!);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Статистика по услугам сервисного центра за период.
    /// </summary>
    /// <param name="from">Начало периода (обязательно)</param>
    /// <param name="to">Конец периода (обязательно)</param>
    [HttpGet("services-by-period")]
    [Authorize(Policy = Permissions.ReportsView)]
    [ProducesResponseType(typeof(ApiResponse<ServicesByPeriodDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetServicesByPeriod(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        if (!from.HasValue || !to.HasValue)
        {
            return BadRequest(new { success = false, message = "Параметры 'from' и 'to' обязательны" });
        }

        if (from.Value >= to.Value)
        {
            return BadRequest(new { success = false, message = "Параметр 'from' должен быть меньше 'to'" });
        }

        var result = await _reportService.GetServicesByPeriodAsync(from.Value, to.Value);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Экспорт данных в CSV.
    /// Поддерживает экспорт заказов и товаров.
    /// </summary>
    /// <param name="format">Формат файла (только csv)</param>
    /// <param name="entity">Тип сущности: orders | products</param>
    /// <param name="from">Начало периода (обязательно)</param>
    /// <param name="to">Конец периода (обязательно)</param>
    [HttpGet("export")]
    [Authorize(Policy = Permissions.ReportsExport)]
    public async Task<IActionResult> ExportData(
        [FromQuery] string? format = "csv",
        [FromQuery] string? entity = "orders",
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        // Валидация формата
        if (!string.Equals(format, "csv", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { success = false, message = "Поддерживается только формат CSV" });
        }

        // Валидация типа сущности
        var validEntities = new[] { "orders", "products" };
        if (!validEntities.Contains((entity ?? "orders").ToLowerInvariant()))
        {
            return BadRequest(new { success = false, message = $"Параметр 'entity' допустимые значения: orders, products" });
        }

        // Для orders период обязателен
        if (string.Equals(entity, "orders", StringComparison.OrdinalIgnoreCase))
        {
            if (!from.HasValue || !to.HasValue)
            {
                return BadRequest(new { success = false, message = "Для экспорта заказов параметры 'from' и 'to' обязательны" });
            }

            if (from.Value >= to.Value)
            {
                return BadRequest(new { success = false, message = "Параметр 'from' должен быть меньше 'to'" });
            }
        }

        // Для products период не нужен — экспортируем всё
        var effectiveFrom = from ?? DateTime.MinValue;
        var effectiveTo = to ?? DateTime.MaxValue;

        try
        {
            var (csvBytes, fileName) = await _reportService.ExportAsync(entity!, effectiveFrom, effectiveTo);
            return File(csvBytes, "text/csv; charset=utf-8", fileName);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}
