#pragma warning disable CA1031, CA2208, CA2234, CS1591, S3928, SA1600
using System.Text.Json;
using GoldPC.Shared.Entities;
using GoldPC.Shared.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Polly;
using Polly.CircuitBreaker;
using Polly.Retry;

namespace GoldPC.Shared.Services;

/// <summary>
/// Реализация отправки SMS через сервис SMS.ru
/// </summary>
public class SmsRuService : INotificationService
{
    private readonly ILogger<SmsRuService> _logger;
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _apiUrl;
    private readonly AsyncRetryPolicy<HttpResponseMessage> _retryPolicy;
    private readonly AsyncCircuitBreakerPolicy<HttpResponseMessage> _circuitBreakerPolicy;

    public SmsRuService(ILogger<SmsRuService> logger, HttpClient httpClient, IConfiguration configuration)
    {
        _logger = logger;
        _httpClient = httpClient;
        _apiKey = configuration["SMS:ApiKey"] ?? throw new ArgumentNullException(nameof(configuration), "SMS:ApiKey is not configured");
        _apiUrl = configuration["SMS:ApiUrl"] ?? "https://api.sms.ru";

        _retryPolicy = ResiliencePolicies.GetHttpRetryPolicy(_logger);
        _circuitBreakerPolicy = ResiliencePolicies.GetHttpCircuitBreakerPolicy(_logger);
    }

    public Task<Notification> CreateNotificationAsync(Notification notification)
    {
        _logger.LogDebug("SmsRuService CreateNotificationAsync called");
        return Task.FromResult(notification);
    }

    public Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid userId, bool unreadOnly = false, int limit = 50)
    {
        _logger.LogDebug("SmsRuService GetUserNotificationsAsync called - not supported");
        return Task.FromResult(Enumerable.Empty<Notification>());
    }

    public Task MarkAsReadAsync(Guid notificationId)
    {
        _logger.LogDebug("SmsRuService MarkAsReadAsync called - not supported");
        return Task.CompletedTask;
    }

    public Task MarkAllAsReadAsync(Guid userId)
    {
        _logger.LogDebug("SmsRuService MarkAllAsReadAsync called - not supported");
        return Task.CompletedTask;
    }

    public Task DeleteNotificationAsync(Guid notificationId)
    {
        _logger.LogDebug("SmsRuService DeleteNotificationAsync called - not supported");
        return Task.CompletedTask;
    }

    public async Task SendNotificationAsync(Notification notification)
    {
        _logger.LogDebug("SmsRuService SendNotificationAsync called for notification {Id}", notification.Id);

        _logger.LogInformation("Processing notification {Id} via SMS.ru service", notification.Id);

        // TODO: Extract phone number from notification recipient
        _logger.LogWarning("SMS sending logic not fully implemented for new Notification entity");
    }

    public Task SendNotificationToRoleAsync(string role, Notification notification)
    {
        _logger.LogDebug("SmsRuService SendNotificationToRoleAsync called - not supported");
        return Task.CompletedTask;
    }

    public Task BroadcastNotificationAsync(Notification notification)
    {
        _logger.LogDebug("SmsRuService BroadcastNotificationAsync called - not supported");
        return Task.CompletedTask;
    }
}
#pragma warning restore CA1031, CA2208, CA2234, CS1591, S3928, SA1600
