// Copyright (c) GoldPC. All rights reserved.

using GoldPC.SharedKernel.Enums;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO заказа для обмена между сервисами.
/// </summary>
public class OrderDto
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string OrderNumber { get; set; } = string.Empty;

    public OrderStatus Status { get; set; }

    public decimal Total { get; set; }

    public decimal Subtotal { get; set; }

    public decimal DeliveryCost { get; set; }

    public string DeliveryMethod { get; set; } = string.Empty;

    public string PaymentMethod { get; set; } = string.Empty;

    public string? Address { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public ICollection<OrderItemDto> Items { get; set; } = new List<OrderItemDto>();
}