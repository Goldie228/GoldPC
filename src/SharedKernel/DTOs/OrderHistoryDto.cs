// Copyright (c) GoldPC. All rights reserved.

using GoldPC.SharedKernel.Enums;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для истории изменений заказа.
/// </summary>
public class OrderHistoryDto
{
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }

    public OrderStatus PreviousStatus { get; set; }

    public OrderStatus NewStatus { get; set; }

    public string? Comment { get; set; }

    public Guid ChangedBy { get; set; }

    public DateTime ChangedAt { get; set; }
}