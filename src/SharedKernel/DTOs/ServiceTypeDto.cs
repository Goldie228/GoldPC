#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO типа услуги.
/// </summary>
public class ServiceTypeDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal BasePrice { get; set; }

    public int EstimatedDurationMinutes { get; set; }
}
#pragma warning restore CS1591, SA1600
