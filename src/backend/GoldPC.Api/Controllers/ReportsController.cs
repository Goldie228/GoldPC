using GoldPC.Api.Services;
using GoldPC.Shared.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GoldPC.Api.Controllers;

/// <summary>
/// Контроллер прокси для отчётов — маршрутизирует запросы в ReportingService.
/// Позволяет фронтенду обращаться к отчётам через единую точку входа (gateway).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportingServiceClient _reportingClient;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(IReportingServiceClient reportingClient, ILogger<ReportsController> logger)
    {
        _reportingClient = reportingClient;
        _logger = logger;
    }

    /// <summary>
    /// Сводный финансовый отчёт за период.
    /// Проксируется в ReportingService.
    /// </summary>
    [HttpGet("financial-summary")]
    [Authorize(Policy = Permissions.ReportsView)]
    public async Task<IActionResult> GetFinancialSummary(
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

        var result = await _reportingClient.GetFinancialSummaryAsync(from.Value, to.Value);
        return Ok(result);
    }

    /// <summary>
    /// Заказы, сгруппированные по периоду.
    /// Проксируется в ReportingService.
    /// </summary>
    [HttpGet("orders-by-period")]
    [Authorize(Policy = Permissions.ReportsView)]
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

        var validGroupBy = new[] { "day", "week", "month" };
        if (!validGroupBy.Contains((groupBy ?? "day").ToLowerInvariant()))
        {
            return BadRequest(new { success = false, message = $"Параметр 'group' допустимые значения: day, week, month" });
        }

        var result = await _reportingClient.GetOrdersByPeriodAsync(from.Value, to.Value, groupBy!);
        return Ok(result);
    }

    /// <summary>
    /// Статистика по услугам сервисного центра за период.
    /// Проксируется в ReportingService.
    /// </summary>
    [HttpGet("services-by-period")]
    [Authorize(Policy = Permissions.ReportsView)]
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

        var result = await _reportingClient.GetServicesByPeriodAsync(from.Value, to.Value);
        return Ok(result);
    }

    /// <summary>
    /// Экспорт данных в CSV.
    /// Проксируется в ReportingService.
    /// </summary>
    [HttpGet("export")]
    [Authorize(Policy = Permissions.ReportsExport)]
    public async Task<IActionResult> ExportData(
        [FromQuery] string? format = "csv",
        [FromQuery] string? entity = "orders",
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        if (!string.Equals(format, "csv", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { success = false, message = "Поддерживается только формат CSV" });
        }

        var validEntities = new[] { "orders", "products" };
        if (!validEntities.Contains((entity ?? "orders").ToLowerInvariant()))
        {
            return BadRequest(new { success = false, message = $"Параметр 'entity' допустимые значения: orders, products" });
        }

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

        var effectiveFrom = from ?? DateTime.MinValue;
        var effectiveTo = to ?? DateTime.MaxValue;

        var result = await _reportingClient.ExportDataAsync(entity!, effectiveFrom, effectiveTo);
        if (result == null)
        {
            return StatusCode(StatusCodes.Status502BadGateway,
                new { success = false, message = "Сервис отчётов недоступен" });
        }

        var (csvBytes, contentType, fileName) = result.Value;
        return File(csvBytes, contentType ?? "text/csv; charset=utf-8", fileName);
    }
}
