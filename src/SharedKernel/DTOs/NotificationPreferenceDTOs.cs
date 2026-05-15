#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

namespace GoldPC.SharedKernel.DTOs;

/// <summary>
/// DTO для обновления предпочтений уведомлений.
/// </summary>
public class NotificationPreferenceRequest
{
    public bool EmailNotifications { get; set; }
    public bool SmsNotifications { get; set; }
    public bool TelegramNotifications { get; set; }
    public bool OrderStatusNotifications { get; set; }
    public bool MarketingNotifications { get; set; }
}

/// <summary>
/// DTO ответа с предпочтениями уведомлений.
/// </summary>
public class NotificationPreferenceResponse
{
    public bool EmailNotifications { get; set; }
    public bool SmsNotifications { get; set; }
    public bool TelegramNotifications { get; set; }
    public bool OrderStatusNotifications { get; set; }
    public bool MarketingNotifications { get; set; }
    public DateTime UpdatedAt { get; set; }
}