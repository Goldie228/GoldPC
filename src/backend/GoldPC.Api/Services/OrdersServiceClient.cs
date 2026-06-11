#pragma warning disable CA1031, CS1591, SA1600
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

namespace GoldPC.Api.Services;

/// <summary>
/// HTTP-клиент для микросервиса OrdersService (порт 5002)
/// Реализует получение статистики заказов для дашборда администратора.
/// Паттерн: типизированный HttpClient с JWT forwarding через AuthForwardingHandler.
/// </summary>
public class OrdersServiceClient : IOrdersServiceClient
{
    private readonly HttpClient _http;
    private readonly ILogger<OrdersServiceClient> _logger;

    private const int RevenuePageSize = 10_000;

    public OrdersServiceClient(HttpClient http, ILogger<OrdersServiceClient> logger)
    {
        _http = http;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<int> GetTotalOrdersAsync()
    {
        try
        {
            _logger.LogDebug("GetTotalOrdersAsync");

            var response = await _http.GetAsync(new Uri("api/v1/orders?page=1&pageSize=1", UriKind.Relative));
            response.EnsureSuccessStatusCode();

            var wrapper = await response.Content.ReadFromJsonAsync<OrdersApiResponse>();
            return wrapper?.Data?.TotalCount ?? 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling OrdersService GetTotalOrders");
            return 0;
        }
    }

    /// <inheritdoc />
    public async Task<decimal> GetTotalRevenueAsync()
    {
        try
        {
            _logger.LogDebug("GetTotalRevenueAsync");

            var response = await _http.GetAsync(new Uri($"api/v1/orders?page=1&pageSize={RevenuePageSize}", UriKind.Relative));
            response.EnsureSuccessStatusCode();

            var wrapper = await response.Content.ReadFromJsonAsync<OrdersApiResponse>();
            var items = wrapper?.Data?.Items;

            if (items is null || items.Count == 0)
                return 0m;

            return items.Sum(item => item.Total);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling OrdersService GetTotalRevenue");
            return 0m;
        }
    }

    /// <inheritdoc />
    public async Task<int> GetOrdersByStatusAsync(string status)
    {
        try
        {
            _logger.LogDebug("GetOrdersByStatusAsync: status={Status}", status);

            var response = await _http.GetAsync(new Uri($"api/v1/orders?page=1&pageSize=1&status={Uri.EscapeDataString(status)}", UriKind.Relative));
            response.EnsureSuccessStatusCode();

            var wrapper = await response.Content.ReadFromJsonAsync<OrdersApiResponse>();
            return wrapper?.Data?.TotalCount ?? 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling OrdersService GetOrdersByStatus (status={Status})", status);
            return 0;
        }
    }

    /// <inheritdoc />
    public async Task<DashboardOrdersDto> GetDashboardStatsAsync()
    {
        try
        {
            _logger.LogDebug("GetDashboardStatsAsync");

            // Один запрос на большую страницу для получения TotalCount и суммирования выручки
            var response = await _http.GetAsync(new Uri($"api/v1/orders?page=1&pageSize={RevenuePageSize}", UriKind.Relative));
            response.EnsureSuccessStatusCode();

            var wrapper = await response.Content.ReadFromJsonAsync<OrdersApiResponse>();
            var data = wrapper?.Data;

            if (data is null)
                return new DashboardOrdersDto();

            var revenue = data.Items?.Sum(item => item.Total) ?? 0m;

            return new DashboardOrdersDto
            {
                TotalOrders = data.TotalCount,
                TotalRevenue = revenue
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling OrdersService GetDashboardStats");
            return new DashboardOrdersDto();
        }
    }

    // ====================================================================
    // Внутренние DTO для десериализации ответов OrdersService
    // Ответ имеет структуру: { success, data: { items, totalCount, pageNumber, pageSize } }
    // ====================================================================
    private sealed record OrdersApiResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; init; }

        [JsonPropertyName("data")]
        public OrdersPagedResult? Data { get; init; }
    }

    private sealed record OrdersPagedResult
    {
        [JsonPropertyName("items")]
        public List<OrderSummaryItem> Items { get; init; } = [];

        [JsonPropertyName("totalCount")]
        public int TotalCount { get; init; }
    }

    private sealed record OrderSummaryItem
    {
        [JsonPropertyName("total")]
        public decimal Total { get; init; }
    }
}
#pragma warning restore CA1031, CS1591, SA1600
