using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using PagedResult = GoldPC.SharedKernel.Models.PagedResult<GoldPC.SharedKernel.DTOs.OrderDto>;

namespace GoldPC.OrdersService.Services;

public interface IOrdersService
{
    Task<OrderDto?> GetByIdAsync(Guid id);
    Task<OrderDto?> GetByNumberAsync(string orderNumber);
    Task<PagedResult> GetByUserIdAsync(Guid userId, int page, int pageSize);
    Task<PagedResult> GetAllAsync(int page, int pageSize, OrderStatus? status = null);
    Task<(OrderDto? Order, string? Error)> CreateAsync(Guid userId, CreateOrderRequest request);
    Task<(OrderDto? Order, string? Error)> UpdateStatusAsync(Guid id, OrderStatus newStatus, Guid changedBy, string? comment = null);
    Task<(bool Success, string? Error)> CancelAsync(Guid id, Guid userId);
    Task<decimal> CalculateTotalAsync(Guid orderId);
    Task<DeliveryQuoteResponse> CalculateDeliveryQuoteAsync(DeliveryQuoteRequest request);
}