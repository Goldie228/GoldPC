#pragma warning disable CA2227, CS1591, SA1600
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

    public string CustomerFirstName { get; set; } = string.Empty;

    public string CustomerLastName { get; set; } = string.Empty;

    public string CustomerPhone { get; set; } = string.Empty;

    public string CustomerEmail { get; set; } = string.Empty;

    public OrderStatus Status { get; set; }

    public decimal Total { get; set; }

    public decimal Subtotal { get; set; }

    public decimal DeliveryCost { get; set; }

    public string DeliveryMethod { get; set; } = string.Empty;

    public string PaymentMethod { get; set; } = string.Empty;

    public string? Address { get; set; }

    public string? PromoCode { get; set; }

    public decimal DiscountAmount { get; set; }

    public string? DeliveryDate { get; set; }

    public string? DeliveryTimeSlot { get; set; }

    public string? TrackingNumber { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public ICollection<OrderItemDto> Items { get; set; } = new List<OrderItemDto>();
}
#pragma warning restore CA2227, CS1591, SA1600
