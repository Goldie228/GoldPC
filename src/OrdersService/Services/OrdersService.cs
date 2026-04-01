using GoldPC.OrdersService.Data;
using GoldPC.OrdersService.Entities;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using GoldPC.SharedKernel.Models;
using GoldPC.Shared.Services.Interfaces;
using PagedResult = GoldPC.SharedKernel.Models.PagedResult<GoldPC.SharedKernel.DTOs.OrderDto>;
using Shared.Protos;
using Microsoft.EntityFrameworkCore;
using MassTransit;
using SharedKernel.Events;
using System.Text.Json;

namespace GoldPC.OrdersService.Services;

/// <summary>
/// Сервис управления заказами
/// Реализует бизнес-логику модуля "Заказы" (ФТ-3.1 - ФТ-3.13)
/// </summary>
public class OrdersService : IOrdersService
{
    private readonly OrdersDbContext _context;
    private readonly ILogger<OrdersService> _logger;
    private readonly CatalogGrpc.CatalogGrpcClient _catalogClient;
    
    private const int MaxItemQuantity = 5;

    public OrdersService(
        OrdersDbContext context, 
        ILogger<OrdersService> logger, 
        CatalogGrpc.CatalogGrpcClient catalogClient)
    {
        _context = context;
        _logger = logger;
        _catalogClient = catalogClient;
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

    public async Task<PagedResult> GetByUserIdAsync(Guid userId, int page, int pageSize)
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

        return new PagedResult
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<PagedResult> GetAllAsync(int page, int pageSize, OrderStatus? status = null)
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

        return new PagedResult
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };
    }

    public async Task<(OrderDto? Order, string? Error)> CreateAsync(Guid userId, CreateOrderRequest request)
    {
        // Валидация позиций заказа (ФТ-3.11 - ограничение количества до 5 единиц)
        if (request.Items == null || request.Items.Count == 0)
        {
            return (null, "Заказ должен содержать минимум одну позицию");
        }

        // Валидация каждой позиции заказа
        foreach (var item in request.Items)
        {
            // Проверка количества каждого товара (ФТ-3.11)
            if (item.Quantity > MaxItemQuantity)
            {
                return (null, $"Количество товара '{item.ProductName}' превышает максимально допустимое ({MaxItemQuantity} единиц)");
            }

            // Проверка отрицательной цены единицы товара
            if (item.UnitPrice < 0)
            {
                return (null, $"Цена товара '{item.ProductName}' не может быть отрицательной");
            }

            // Проверка отрицательного количества
            if (item.Quantity <= 0)
            {
                return (null, $"Количество товара '{item.ProductName}' должно быть положительным числом");
            }
        }

        // Валидация способа доставки (ФТ-3.3)
        if (request.DeliveryMethod != "Pickup" && request.DeliveryMethod != "Delivery")
        {
            return (null, "Неверный способ получения. Допустимые значения: Pickup, Delivery");
        }

        // Если доставка - адрес обязателен
        if (request.DeliveryMethod == "Delivery" && string.IsNullOrWhiteSpace(request.Address))
        {
            return (null, "При доставке необходимо указать адрес");
        }

        // Валидация способа оплаты (ФТ-3.2)
        if (request.PaymentMethod != "Online" && request.PaymentMethod != "OnReceipt")
        {
            return (null, "Неверный способ оплаты. Допустимые значения: Online, OnReceipt");
        }

        // Генерация уникального номера заказа (ФТ-3.5)
        // Формат: ORD-YYYY-XXXX (например, ORD-2026-0001)
        var year = DateTime.UtcNow.Year;
        var lastOrder = await _context.Orders
            .Where(o => o.OrderNumber.StartsWith($"ORD-{year}-"))
            .OrderByDescending(o => o.OrderNumber)
            .FirstOrDefaultAsync();
        
        var nextNumber = 1;
        if (lastOrder != null)
        {
            var parts = lastOrder.OrderNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[2], out var parsedNumber) && parsedNumber > 0)
            {
                nextNumber = parsedNumber + 1;
            }
            else
            {
                _logger.LogWarning("Некорректный формат OrderNumber '{OrderNumber}', номер заказа будет начат заново", lastOrder.OrderNumber);
            }
        }
        
        var orderNumber = $"ORD-{year}-{nextNumber:D4}";

        // Расчёт стоимости товаров и доставки
        var subtotal = request.Items.Sum(i => i.Quantity * i.UnitPrice);
        var deliveryCost = CalculateDeliveryCost(request.DeliveryMethod, subtotal, request.City);
        
        // Применение скидки по промокоду
        var discountAmount = request.DiscountAmount;
        var total = subtotal - discountAmount + deliveryCost;
        
        // Валидация общей стоимости
        if (total < 0)
        {
            return (null, "Общая стоимость заказа не может быть отрицательной");
        }

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = orderNumber,
            UserId = userId,
            CustomerFirstName = request.FirstName,
            CustomerLastName = request.LastName ?? string.Empty,
            CustomerPhone = request.Phone,
            CustomerEmail = request.Email,
            Status = OrderStatus.New,
            DeliveryMethod = request.DeliveryMethod,
            PaymentMethod = request.PaymentMethod,
            Address = request.Address,
            Comment = request.Comment,
            PromoCode = request.PromoCode,
            DiscountAmount = discountAmount,
            DeliveryDate = request.DeliveryDate,
            DeliveryTimeSlot = request.DeliveryTimeSlot,
            Subtotal = subtotal,
            DeliveryCost = deliveryCost,
            Total = total,
            CreatedAt = DateTime.UtcNow
        };

        _context.Orders.Add(order);

        // Добавление позиций заказа
        var reserveRequest = new ReserveStockRequest();
        foreach (var itemRequest in request.Items)
        {
            var orderItem = new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                ProductId = itemRequest.ProductId,
                ProductName = itemRequest.ProductName,
                Quantity = itemRequest.Quantity,
                UnitPrice = itemRequest.UnitPrice
            };
            _context.OrderItems.Add(orderItem);
            
            reserveRequest.Items.Add(new StockItem 
            { 
                ProductId = itemRequest.ProductId.ToString(), 
                Quantity = itemRequest.Quantity 
            });
        }

        // Резервирование товара в каталоге (ФТ-3.5)
        try
        {
            var stockResponse = await _catalogClient.ReserveStockAsync(reserveRequest);
            if (!stockResponse.Success)
            {
                return (null, stockResponse.ErrorMessage ?? "Ошибка при резервировании товара в каталоге");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при вызове CatalogService для резервирования товара");
            return (null, "Сервис каталога временно недоступен. Пожалуйста, попробуйте позже.");
        }

        // Добавляем запись в историю (ФТ-3.12 - ведение истории)
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

        _logger.LogInformation("Order created: {OrderNumber} for user {UserId} with {ItemCount} items, total: {Total}", 
            orderNumber, userId, request.Items.Count, total);

        // Publish OrderPlacedEvent (ФТ-3.13 - уведомление внешних систем) - via Outbox
        SaveToOutbox(new OrderPlacedEvent
        {
            OrderId = order.Id,
            CustomerId = userId,
            TotalAmount = total,
            Items = request.Items.Select(i => new OrderItemEventDto
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Quantity = i.Quantity,
                Price = i.UnitPrice
            }).ToList()
        });

        // Загружаем позиции для маппинга
        order.Items = await _context.OrderItems.Where(oi => oi.OrderId == order.Id).ToListAsync();

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

            // Publish OrderPaidEvent - via Outbox
            SaveToOutbox(new OrderPaidEvent
            {
                OrderId = order.Id,
                AmountPaid = order.Total,
                Items = order.Items.Select(i => new OrderItemEventDto
                {
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    Quantity = i.Quantity,
                    Price = i.UnitPrice
                }).ToList()
            });
        }

        if (newStatus == OrderStatus.Cancelled)
        {
            await ReleaseOrderStockAsync(order);
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
        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return (false, "Заказ не найден");
        }

        if (order.Status == OrderStatus.Completed || order.Status == OrderStatus.Cancelled)
        {
            return (false, "Заказ уже завершён или отменён");
        }

        var previousStatus = order.Status;
        order.Status = OrderStatus.Cancelled;
        order.UpdatedAt = DateTime.UtcNow;

        await ReleaseOrderStockAsync(order);

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

    private async Task ReleaseOrderStockAsync(Order order)
    {
        var releaseRequest = new ReleaseStockRequest();
        foreach (var item in order.Items)
        {
            releaseRequest.Items.Add(new StockItem 
            { 
                ProductId = item.ProductId.ToString(), 
                Quantity = item.Quantity 
            });
        }

        try
        {
            var policy = GoldPC.Shared.Resilience.ResiliencePolicies.GetGenericResiliencePolicy(_logger, "CatalogService (gRPC)");
            await policy.ExecuteAsync(async () =>
            {
                var stockResponse = await _catalogClient.ReleaseStockAsync(releaseRequest);
                if (!stockResponse.Success)
                {
                    _logger.LogError("Ошибка при возврате товара на склад для заказа {OrderNumber}: {Error}", 
                        order.OrderNumber, stockResponse.ErrorMessage);
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при вызове CatalogService для возврата товара на склад для заказа {OrderNumber}", 
                order.OrderNumber);
        }
    }

    public async Task<decimal> CalculateTotalAsync(Guid orderId)
    {
        var items = await _context.OrderItems
            .Where(oi => oi.OrderId == orderId)
            .ToListAsync();

        return items.Sum(oi => oi.TotalPrice);
    }

    public Task<DeliveryQuoteResponse> CalculateDeliveryQuoteAsync(DeliveryQuoteRequest request)
    {
        var deliveryCost = CalculateDeliveryCost(request.DeliveryMethod, request.Subtotal, request.City);
        return Task.FromResult(new DeliveryQuoteResponse
        {
            Subtotal = request.Subtotal,
            DeliveryCost = deliveryCost,
            Total = request.Subtotal + deliveryCost
        });
    }

    private static decimal CalculateDeliveryCost(string deliveryMethod, decimal subtotal, string? city)
    {
        if (deliveryMethod == "Pickup")
        {
            return 0m;
        }

        if (deliveryMethod != "Delivery")
        {
            return 0m;
        }

        // Бесплатная доставка при заказе от 200 BYN
        if (subtotal >= 200m)
        {
            return 0m;
        }

        var cityNormalized = city?.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(cityNormalized))
        {
            return 10m;
        }

        // Минск: 5 BYN, другие города: 10 BYN
        return cityNormalized == "минск" || cityNormalized == "minsk" ? 5m : 10m;
    }

    private static bool IsValidStatusTransition(OrderStatus from, OrderStatus to)
    {
        return from switch
        {
            OrderStatus.New => to == OrderStatus.Processing || to == OrderStatus.Paid || to == OrderStatus.Cancelled,
            OrderStatus.Processing => to == OrderStatus.Paid || to == OrderStatus.Cancelled,
            OrderStatus.Paid => to == OrderStatus.InProgress || to == OrderStatus.Cancelled,
            OrderStatus.InProgress => to == OrderStatus.Ready || to == OrderStatus.Cancelled,
            OrderStatus.Ready => to == OrderStatus.Completed || to == OrderStatus.Cancelled,
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
            CustomerFirstName = order.CustomerFirstName,
            CustomerLastName = order.CustomerLastName,
            CustomerPhone = order.CustomerPhone,
            CustomerEmail = order.CustomerEmail,
            Status = order.Status,
            Total = order.Total,
            Subtotal = order.Subtotal,
            DeliveryCost = order.DeliveryCost,
            DiscountAmount = order.DiscountAmount,
            DeliveryMethod = order.DeliveryMethod,
            PaymentMethod = order.PaymentMethod,
            Address = order.Address,
            PromoCode = order.PromoCode,
            DeliveryDate = order.DeliveryDate,
            DeliveryTimeSlot = order.DeliveryTimeSlot,
            TrackingNumber = order.TrackingNumber,
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

    private void SaveToOutbox<T>(T message) where T : class
    {
        var outboxMessage = new OutboxMessage
        {
            Id = Guid.NewGuid(),
            Type = typeof(T).AssemblyQualifiedName ?? typeof(T).Name,
            Content = JsonSerializer.Serialize(message),
            CreatedAt = DateTime.UtcNow
        };

        _context.OutboxMessages.Add(outboxMessage);
    }
}
