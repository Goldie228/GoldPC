#pragma warning disable CS1591, SA1600
using GoldPC.SharedKernel.DTOs;
using Microsoft.Extensions.Logging;

namespace GoldPC.Shared.Services;

/// <summary>
/// Mock-реализация IOrderEmailService для dev-режима.
/// Логирует вместо отправки email.
/// </summary>
public class MockOrderEmailService : IOrderEmailService
{
    private readonly ILogger<MockOrderEmailService> _logger;

    public MockOrderEmailService(ILogger<MockOrderEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendOrderConfirmationAsync(OrderDto order)
    {
        _logger.LogInformation("[MOCK EMAIL] Подтверждение заказа #{OrderNumber} → {Email}", order.OrderNumber, order.CustomerEmail);
        return Task.CompletedTask;
    }

    public Task SendOrderStatusChangedAsync(OrderDto order, string oldStatus, string newStatus)
    {
        _logger.LogInformation("[MOCK EMAIL] Статус заказа #{OrderNumber}: {Old} → {New} → {Email}", order.OrderNumber, oldStatus, newStatus, order.CustomerEmail);
        return Task.CompletedTask;
    }

    public Task SendWarrantyCreatedAsync(WarrantyDto card, string userEmail)
    {
        _logger.LogInformation("[MOCK EMAIL] Гарантия #{WarrantyNumber} создана → {Email}", card.WarrantyNumber, userEmail);
        return Task.CompletedTask;
    }

    public Task SendWarrantyExpiryReminderAsync(WarrantyDto card, string userEmail)
    {
        _logger.LogInformation("[MOCK EMAIL] Напоминание: гарантия #{WarrantyNumber} истекает → {Email}", card.WarrantyNumber, userEmail);
        return Task.CompletedTask;
    }

    public Task SendServiceAssignedAsync(ServiceRequestDto service, string masterName, string clientEmail)
    {
        _logger.LogInformation("[MOCK EMAIL] Мастер {MasterName} назначен на заявку #{RequestNumber} → {Email}", masterName, service.RequestNumber, clientEmail);
        return Task.CompletedTask;
    }
}
#pragma warning restore CS1591, SA1600
