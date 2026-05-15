#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

using System;

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO элемента истории входа.
/// </summary>
public class LoginHistoryItem
{
    public Guid Id { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string? UserAgent { get; set; }
    public DateTime Timestamp { get; set; }
    public bool Success { get; set; }
    public string? FailureReason { get; set; }
}