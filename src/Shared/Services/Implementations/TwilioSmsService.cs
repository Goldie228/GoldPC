using System.Collections.Concurrent;
using GoldPC.Shared.Services.Interfaces;
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
                    onReset: () => _logger.LogInformation("Twilio Circuit Breaker CLOSED")
                )
        );
    }

    public async Task<(bool Success, string? Error)> SendSmsAsync(string phone, string message)
    {
        if (string.IsNullOrEmpty(phone)) return (false, "Phone number is empty");

        // Anti-spam check (FT-2.5.2.3)
        if (IsRateLimited(phone))
        {
            _logger.LogWarning("SMS rate limit exceeded for {Phone}", phone);
            return (false, "Превышен лимит отправки SMS. Попробуйте позже.");
        }

        _logger.LogInformation("Sending SMS to {Phone}", phone);

        try
        {
            return await _resiliencePolicy.ExecuteAsync<(bool Success, string? Error)>(async () =>
            {
                var fromNumber = _configuration["Twilio:FromNumber"] ?? "+1234567890";
                var result = await MessageResource.CreateAsync(
                    body: message,
                    from: new PhoneNumber(fromNumber),
                    to: new PhoneNumber(phone)
                );

                if (result.ErrorCode != null)
                {
                    _logger.LogError("Twilio error {Code}: {Message}", result.ErrorCode, result.ErrorMessage);
                    return (false, result.ErrorMessage);
                }

                _logger.LogInformation("SMS sent successfully to {Phone}. SID: {Sid}", phone, result.Sid);
                return (true, null);
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SMS to {Phone} after retries", phone);
            return (false, "Ошибка отправки SMS. Сервис временно недоступен.");
        }
    }

    // Эти методы реализуются в EmailService (NotificationServiceMock объединяет их, но в продакшене лучше разделять)
    public Task<(bool Success, string? Error)> SendEmailAsync(string email, string subject, string body) 
        => Task.FromResult<(bool, string?)>((false, "TwilioSmsService handles only SMS"));

    public Task<(bool Success, string? Error)> SendPushNotificationAsync(string userId, string title, string message)
        => Task.FromResult<(bool, string?)>((false, "TwilioSmsService handles only SMS"));

    private bool IsRateLimited(string phone)
    {
        var now = DateTime.UtcNow;
        var limitTime = now.AddHours(-1);

        var history = _rateLimiter.GetOrAdd(phone, _ => new List<DateTime>());
        lock (history)
        {
            // Убираем старые записи
            history.RemoveAll(t => t < limitTime);
            
            if (history.Count >= MaxSmsPerHourPerNumber) return true;
            
            history.Add(now);
            return false;
        }
    }
}
