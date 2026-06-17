#pragma warning disable CS1591, SA1600
using GoldPC.SharedKernel.DTOs;

namespace GoldPC.Shared.Services;

/// <summary>
/// Сервис отправки email-уведомлений, связанных с заказами, гарантиями и заявками на сервис.
/// Все методы работают в режиме fire-and-forget через очередь.
/// </summary>
public interface IOrderEmailService
{
    /// <summary>Отправить подтверждение заказа клиенту</summary>
    Task SendOrderConfirmationAsync(OrderDto order);

    /// <summary>Отправить уведомление о смене статуса заказа</summary>
    Task SendOrderStatusChangedAsync(OrderDto order, string oldStatus, string newStatus);

    /// <summary>Отправить уведомление о создании гарантийного талона</summary>
    Task SendWarrantyCreatedAsync(WarrantyDto card, string userEmail);

    /// <summary>Отправить напоминание об окончании гарантии</summary>
    Task SendWarrantyExpiryReminderAsync(WarrantyDto card, string userEmail);

    /// <summary>Отправить уведомление о назначении мастера на заявку</summary>
    Task SendServiceAssignedAsync(ServiceRequestDto service, string masterName, string clientEmail);
}
#pragma warning restore CS1591, SA1600
