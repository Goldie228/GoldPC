#pragma warning disable CS1591, SA1600
using GoldPC.Shared.Services.Implementations;
using GoldPC.Shared.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace GoldPC.Shared.Services;

/// <summary>
/// Композитный сервис уведомлений, объединяющий SMS и Email
/// </summary>
public class CompositeNotificationService : INotificationService
{
    private readonly ILogger<CompositeNotificationService> _logger;
    private readonly SmsRuService _smsService;
    private readonly SmtpEmailService _emailService;

    public CompositeNotificationService(ILogger<CompositeNotificationService> logger, SmsRuService smsService, SmtpEmailService emailService)
    {
        _logger = logger;
        _smsService = smsService;
        _emailService = emailService;
    }

    public async Task<(bool Success, string? Error)> SendSmsAsync(string phone, string message)
    {
        _logger.LogInformation("Routing SMS to {Phone} via SmsRuService", phone);
        return await _smsService.SendSmsAsync(phone, message);
    }

    public async Task<(bool Success, string? Error)> SendEmailAsync(string email, string subject, string body)
    {
        _logger.LogInformation("Routing Email to {Email} via SmtpEmailService", email);
        return await _emailService.SendEmailAsync(email, subject, body);
    }

    public Task<(bool Success, string? Error)> SendPushNotificationAsync(string userId, string title, string message)
    {
        _logger.LogWarning("Push notifications not implemented yet. {UserId}, {Title}, {Message}", userId, title, message);
        return Task.FromResult<(bool, string?)>((false, "Push notifications not implemented"));
    }
}
#pragma warning restore CS1591, SA1600
