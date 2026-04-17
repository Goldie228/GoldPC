#pragma warning disable CA1031, CA1859, CS1591, SA1117, SA1203, SA1204, SA1600
using System.Collections.Concurrent;
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
    private readonly IConfiguration _configuration;
    private readonly IAsyncPolicy _resiliencePolicy;

    // Простой in-memory tracker для rate-limiting (по номеру телефона)
    private static readonly ConcurrentDictionary<string, List<DateTime>> _rateLimiter = new();
    private const int MaxSmsPerHourPerNumber = 5;

    public TwilioSmsService(
        ILogger<TwilioSmsService> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;

        var accountSid = _configuration["Twilio:AccountSid"] ?? "AC_MOCK_SID_123";
        var authToken = _configuration["Twilio:AuthToken"] ?? "MOCK_TOKEN_123";
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

        // TODO: Extract phone number from notification recipient
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

    private static bool IsRateLimited(string phone)
    {
        var now = DateTime.UtcNow;
        if (!_rateLimiter.TryGetValue(phone, out var timestamps))
        {
            timestamps = new List<DateTime>();
            _rateLimiter[phone] = timestamps;
        }

        timestamps.RemoveAll(t => t < now.AddHours(-1));

        if (timestamps.Count >= MaxSmsPerHourPerNumber)
        {
            return true;
        }

        timestamps.Add(now);
        return false;
    }
}
#pragma warning restore CA1031, CA1859, CS1591, SA1117, SA1203, SA1204, SA1600
