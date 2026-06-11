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
}
