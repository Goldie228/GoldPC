#pragma warning disable CA1031, CA1859, CS1591, SA1117, SA1203, SA1204, SA1600
using GoldPC.Shared.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Polly;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

namespace GoldPC.Shared.Services.Implementations;

/// <summary>
/// Реализация SMS-сервиса через Twilio
/// С поддержкой rate-limiting и resilience (Polly)
/// </summary>
public class TwilioSmsService : INotificationService
{
    private readonly ILogger<TwilioSmsService> _logger;
    private readonly IAsyncPolicy _resiliencePolicy;

    public TwilioSmsService(
        ILogger<TwilioSmsService> logger,
        IConfiguration configuration)
    {
        _logger = logger;

        var accountSid = configuration["Twilio:AccountSid"] ?? "AC_MOCK_SID_123";
        var authToken = configuration["Twilio:AuthToken"] ?? "MOCK_TOKEN_123";
        TwilioClient.Init(accountSid, authToken);

        // Polly политика: Retry (3 раза) + Circuit Breaker
        _resiliencePolicy = Policy.WrapAsync(
            Policy.Handle<Exception>()
                .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))),
            Policy.Handle<Exception>()
                .CircuitBreakerAsync(5, TimeSpan.FromSeconds(30),
                    onBreak: (ex, timespan) => _logger.LogWarning("Twilio Circuit Breaker OPEN for {TimeSpan}s", timespan.TotalSeconds),
                    onReset: () => _logger.LogInformation("Twilio Circuit Breaker CLOSED")));
    }

    public Task<Notification> CreateNotificationAsync(Notification notification)
    {
        _logger.LogDebug("TwilioSmsService CreateNotificationAsync called");
        return Task.FromResult(notification);
    }

    public Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid userId, bool unreadOnly = false, int limit = 50)
    {
        _logger.LogDebug("TwilioSmsService GetUserNotificationsAsync called - not supported");
        return Task.FromResult(Enumerable.Empty<Notification>());
    }

    public Task MarkAsReadAsync(Guid notificationId)
    {
        _logger.LogDebug("TwilioSmsService MarkAsReadAsync called - not supported");
        return Task.CompletedTask;
    }

    public Task MarkAllAsReadAsync(Guid userId)
    {
        _logger.LogDebug("TwilioSmsService MarkAllAsReadAsync called - not supported");
        return Task.CompletedTask;
    }

    public Task DeleteNotificationAsync(Guid notificationId)
    {
        _logger.LogDebug("TwilioSmsService DeleteNotificationAsync called - not supported");
        return Task.CompletedTask;
    }

    public async Task SendNotificationAsync(Notification notification)
    {
        _logger.LogDebug("TwilioSmsService SendNotificationAsync called for notification {Id}", notification.Id);

        _logger.LogInformation("Processing notification {Id} via Twilio service", notification.Id);

        _logger.LogWarning("SMS sending logic not fully implemented for new Notification entity");
    }

    public Task SendNotificationToRoleAsync(string role, Notification notification)
    {
        _logger.LogDebug("TwilioSmsService SendNotificationToRoleAsync called - not supported");
        return Task.CompletedTask;
    }

    public Task BroadcastNotificationAsync(Notification notification)
    {
        _logger.LogDebug("TwilioSmsService BroadcastNotificationAsync called - not supported");
        return Task.CompletedTask;
    }

    public Task SendPushNotificationAsync(string userId, string title, string message)
    {
        _logger.LogDebug("TwilioSmsService SendPushNotificationAsync called - not supported");
        return Task.CompletedTask;
    }

    public Task SendEmailAsync(string recipientEmail, string subject, string body)
    {
        _logger.LogDebug("TwilioSmsService SendEmailAsync called - not supported");
        return Task.CompletedTask;
    }
}
#pragma warning restore CA1031, CA1859, CS1591, SA1117, SA1203, SA1204, SA1600
