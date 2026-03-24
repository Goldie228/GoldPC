// Copyright (c) GoldPC. All rights reserved.

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для использованных запчастей (ServicePart).
/// </summary>
public class ServicePartDto
{
    public Guid ProductId { get; set; }

    public string ProductName { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }
}