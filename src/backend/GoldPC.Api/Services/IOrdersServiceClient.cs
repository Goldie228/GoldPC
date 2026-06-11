#pragma warning disable CS1591
namespace GoldPC.Api.Services;

/// <summary>
/// HTTP-клиент для микросервиса OrdersService (порт 5002)
/// </summary>
public interface IOrdersServiceClient
{
    /// <summary>Общее количество заказов</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    Task<int> GetTotalOrdersAsync();

    /// <summary>Общая выручка по всем заказам</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    Task<decimal> GetTotalRevenueAsync();

    /// <summary>Количество заказов по статусу</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    Task<int> GetOrdersByStatusAsync(string status);

    /// <summary>Сводная статистика для дашборда (total + revenue комбинированно)</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    Task<DashboardOrdersDto> GetDashboardStatsAsync();
}

/// <summary>Статистика заказов для дашборда администратора</summary>
public record DashboardOrdersDto
{
    public int TotalOrders { get; init; }
    public decimal TotalRevenue { get; init; }
}
#pragma warning restore CS1591
