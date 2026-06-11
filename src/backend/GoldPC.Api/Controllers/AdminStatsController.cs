using GoldPC.Api.Services;
using GoldPC.Shared.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GoldPC.Api.Controllers;

/// <summary>Контроллер статистики дашборда</summary>
[ApiController]
[Route("api/v1/admin/stats")]
public class AdminStatsController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly ICatalogServiceClient _catalogClient;
    private readonly IOrdersServiceClient _ordersClient;
    private readonly ILogger<AdminStatsController> _logger;

    public AdminStatsController(
        IAdminService adminService,
        ICatalogServiceClient catalogClient,
        IOrdersServiceClient ordersClient,
        ILogger<AdminStatsController> logger)
    {
        _adminService = adminService;
        _catalogClient = catalogClient;
        _ordersClient = ordersClient;
        _logger = logger;
    }

    // ====================================================================
    // Эндпоинты
    // ====================================================================

    /// <summary>Получить статистику дашборда</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpGet]
    [Authorize(Policy = Permissions.ReportsView)]
    [ProducesResponseType(typeof(StatsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<StatsResponse>> GetStats()
    {
        // Параллельный сбор данных из микросервисов.
        // Клиенты (CatalogServiceClient, OrdersServiceClient) уже реализуют
        // graceful degradation — при ошибке вызова возвращают 0/default и логируют предупреждение.
        var totalUsersTask = _adminService.GetTotalUsersCountAsync();
        var totalProductsTask = _catalogClient.GetTotalProductsAsync();
        var ordersTask = _ordersClient.GetDashboardStatsAsync();

        await Task.WhenAll(totalUsersTask, totalProductsTask, ordersTask);

        var totalUsers = await totalUsersTask;
        var totalProducts = await totalProductsTask;
        var ordersStats = await ordersTask;

        var stats = new DashboardStats
        {
            TotalUsers = totalUsers,
            TotalProducts = totalProducts,
            TotalOrders = ordersStats.TotalOrders,
            Revenue = ordersStats.TotalRevenue,
            UsersChange = 0,
            OrdersChange = 0,
            RevenueChange = 0
        };

        return Ok(new StatsResponse
        {
            Stats = stats,
            LastUpdated = DateTime.UtcNow.ToString("o")
        });
    }

    /// <summary>Получить данные графиков для дашборда по периоду</summary>
    /// <param name="period">Период: today, week, month, year</param>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpGet("charts")]
    [Authorize(Policy = Permissions.ReportsView)]
    [ProducesResponseType(typeof(ChartResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ChartResponseDto>> GetCharts(
        [FromQuery] string period = "month")
    {
        var validPeriods = new[] { "today", "week", "month", "year" };
        if (!validPeriods.Contains(period.ToLowerInvariant()))
            return BadRequest(new { error = $"Недопустимый период. Допустимые: {string.Join(", ", validPeriods)}" });

        var chart = await _adminService.GetChartAsync(period);
        return Ok(chart);
    }

    /// <summary>Получить спарклайны для карточек статистики</summary>
    /// <param name="period">Период: today, week, month, year</param>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpGet("sparklines")]
    [Authorize(Policy = Permissions.ReportsView)]
    [ProducesResponseType(typeof(SparklinesResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SparklinesResponseDto>> GetSparklines(
        [FromQuery] string period = "month")
    {
        var validPeriods = new[] { "today", "week", "month", "year" };
        if (!validPeriods.Contains(period.ToLowerInvariant()))
            return BadRequest(new { error = $"Недопустимый период. Допустимые: {string.Join(", ", validPeriods)}" });

        var sparklines = await _adminService.GetSparklinesAsync(period);
        return Ok(sparklines);
    }

    /// <summary>Получить ленту активности дашборда</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpGet("activity")]
    [Authorize(Policy = Permissions.ReportsView)]
    [ProducesResponseType(typeof(ActivityResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ActivityResponseDto>> GetActivity()
    {
        var activity = await _adminService.GetActivityAsync();
        return Ok(activity);
    }
}
