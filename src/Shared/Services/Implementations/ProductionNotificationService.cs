using GoldPC.Shared.Services.Background;
using GoldPC.Shared.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace GoldPC.Shared.Services.Implementations;

/// <summary>
/// Продакшн-реализация сервиса уведомлений.
/// Использует Twilio для SMS и асинхронную очередь для Email.
/// </summary>
public class ProductionNotificationService : INotificationService
{
    private readonly TwilioSmsService _smsService;
    private readonly IEmailQueue _emailQueue;
    private readonly ILogger<ProductionNotificationService> _logger;

    public ProductionNotificationService(
        TwilioSmsService smsService,
        IEmailQueue emailQueue,
        ILogger<ProductionNotificationService> logger)
    {
        _smsService = smsService;
        _emailQueue = emailQueue;
        _logger = logger;
    }

    public async Task<(bool Success, string? Error)> SendSmsAsync(string phone, string message)
    {
        _logger.LogInformation("ProductionNotificationService: Redirecting to TwilioSmsService");
        return await _smsService.SendSmsAsync(phone, message);
    }

    public async Task<(bool Success, string? Error)> SendEmailAsync(string email, string subject, string body)
    {
        _logger.LogInformation("ProductionNotificationService: Queueing email for {Email} in background", email);
        
        try
        {
            await _emailQueue.QueueEmailAsync(new EmailJob(email, subject, body));
            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to queue email for {Email}", email);
            return (false, "Не удалось поставить письмо в очередь. Оно будет отправлено позже или потеряно.");
        }
    }

    public Task<(bool Success, string? Error)> SendPushNotificationAsync(string userId, string title, string message)
    {
        _logger.LogWarning("SendPushNotificationAsync is not implemented in ProductionNotificationService");
        return Task.FromResult<(bool, string?)>((false, "Push notifications not implemented yet"));
    }
}
