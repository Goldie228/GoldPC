using GoldPC.OrdersService.Data;
using GoldPC.OrdersService.Entities;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using GoldPC.SharedKernel.Models;
using Microsoft.EntityFrameworkCore;

namespace GoldPC.OrdersService.Services;

public class OrdersService : IOrdersService
{
    private readonly OrdersDbContext _context;
    private readonly ILogger<OrdersService> _logger;

    public OrdersService(OrdersDbContext context, ILogger<OrdersService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<OrderDto?> GetByIdAsync(Guid id)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .Include(o => o.History)
            .FirstOrDefaultAsync(o => o.Id == id);
        
        return order != null ? MapToDto(order) : null;
    }

    public async Task<OrderDto?> GetByNumberAsync(string orderNumber)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .Include(o => o.History)
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);
        
        return order != null ? MapToDto(order) : null;
    }

    public async Task<PagedResult<OrderDto>> GetByUserIdAsync(Guid userId, int page, int pageSize)
    {
        var query = _context.Orders
            .Include(o => o.Items)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<OrderDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<PagedResult<OrderDto>> GetAllAsync(int page, int pageSize, OrderStatus? status = null)
    {
        var query = _context.Orders
            .Include(o => o.Items)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(o => o.Status == status.Value);
        }

        query = query.OrderByDescending(o => o.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<OrderDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<(OrderDto? Order, string? Error)> CreateAsync(Guid userId, CreateOrderRequest request)
    {
        // Генерация номера заказа
        var year = DateTime.UtcNow.Year;
        var lastOrder = await _context.Orders
            .Where(o => o.OrderNumber.StartsWith($"GP-{year}-"))
            .OrderByDescending(o => o.OrderNumber)
            .FirstOrDefaultAsync();
        
        var nextNumber = lastOrder != null 
            ? int.Parse(lastOrder.OrderNumber.Split('-')[2]) + 1 
            : 1;
        
        var orderNumber = $"GP-{year}-{nextNumber:D6}";

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = orderNumber,
            UserId = userId,
            Status = OrderStatus.New,
            DeliveryMethod = request.DeliveryMethod,
            PaymentMethod = request.PaymentMethod,
            Address = request.Address,
            Comment = request.Comment,
            CreatedAt = DateTime.UtcNow
        };

        _context.Orders.Add(order);

        // Добавляем запись в историю
        var history = new OrderHistory
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            PreviousStatus = OrderStatus.New,
            NewStatus = OrderStatus.New,
            Comment = "Заказ создан",
            ChangedBy = userId,
            ChangedAt = DateTime.UtcNow
        };
        _context.OrderHistory.Add(history);

        await _context.SaveChangesAsync();

        _logger.LogInformation("Order created: {OrderNumber} for user {UserId}", orderNumber, userId);

        return (MapToDto(order), null);
    }

    public async Task<(OrderDto? Order, string? Error)> UpdateStatusAsync(Guid id, OrderStatus newStatus, Guid changedBy, string? comment = null)
    {
        var order = await _context.Orders
            .Include(o => o.History)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return (null, "Заказ не найден");
        }

        var previousStatus = order.Status;
        
        // Валидация перехода статуса
        if (!IsValidStatusTransition(previousStatus, newStatus))
        {
            return (null, $"Невозможно изменить статус с {previousStatus} на {newStatus}");
        }

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;

        if (newStatus == OrderStatus.Paid)
        {
            order.IsPaid = true;
            order.PaidAt = DateTime.UtcNow;
        }

        // Добавляем запись в историю
        var history = new OrderHistory
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            Comment = comment,
            ChangedBy = changedBy,
            ChangedAt = DateTime.UtcNow
        };
        _context.OrderHistory.Add(history);

        await _context.SaveChangesAsync();

        _logger.LogInformation("Order {OrderId} status changed: {PreviousStatus} -> {NewStatus}", 
            id, previousStatus, newStatus);

        return (MapToDto(order), null);
    }

    public async Task<(bool Success, string? Error)> CancelAsync(Guid id, Guid userId)
    {
        var order = await _context.Orders.FindAsync(id);

        if (order == null)
        {
            return (false, "Заказ не найден");
        }

        if (order.Status != OrderStatus.New && order.Status != OrderStatus.Processing)
        {
            return (false, "Заказ нельзя отменить в текущем статусе");
        }

        var previousStatus = order.Status;
        order.Status = OrderStatus.Cancelled;
        order.UpdatedAt = DateTime.UtcNow;

        var history = new OrderHistory
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            PreviousStatus = previousStatus,
            NewStatus = OrderStatus.Cancelled,
            Comment = "Заказ отменён",
            ChangedBy = userId,
            ChangedAt = DateTime.UtcNow
        };
        _context.OrderHistory.Add(history);

        await _context.SaveChangesAsync();

        _logger.LogInformation("Order {OrderId} cancelled by {UserId}", id, userId);

        return (true, null);
    }

    public async Task<decimal> CalculateTotalAsync(Guid orderId)
    {
        var items = await _context.OrderItems
            .Where(oi => oi.OrderId == orderId)
            .ToListAsync();

        return items.Sum(oi => oi.TotalPrice);
    }

    private static bool IsValidStatusTransition(OrderStatus from, OrderStatus to)
    {
        return from switch
        {
            OrderStatus.New => to == OrderStatus.Processing || to == OrderStatus.Cancelled,
            OrderStatus.Processing => to == OrderStatus.Paid || to == OrderStatus.Cancelled,
            OrderStatus.Paid => to == OrderStatus.InProgress || to == OrderStatus.Cancelled,
            OrderStatus.InProgress => to == OrderStatus.Ready,
            OrderStatus.Ready => to == OrderStatus.Completed,
            OrderStatus.Completed => false,
            OrderStatus.Cancelled => false,
            _ => false
        };
    }

    private static OrderDto MapToDto(Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            UserId = order.UserId,
            OrderNumber = order.OrderNumber,
            Status = order.Status,
            Total = order.Total,
            DeliveryMethod = order.DeliveryMethod,
            PaymentMethod = order.PaymentMethod,
            Address = order.Address,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
            Items = order.Items?.Select(oi => new OrderItemDto
            {
                Id = oi.Id,
                ProductId = oi.ProductId,
                ProductName = oi.ProductName,
                Quantity = oi.Quantity,
                UnitPrice = oi.UnitPrice,
                TotalPrice = oi.TotalPrice
            }).ToList() ?? new List<OrderItemDto>()
        };
    }
}