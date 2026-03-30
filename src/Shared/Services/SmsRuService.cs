#pragma warning disable CA1031, CA2208, CA2234, CS1591, S3928, SA1600
using System.Text.Json;
using GoldPC.Shared.Infrastructure;
using GoldPC.Shared.Services.Interfaces;
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
        _apiKey = configuration["SMS:ApiKey"] ?? throw new ArgumentNullException("SMS:ApiKey is not configured");
        _apiUrl = configuration["SMS:ApiUrl"] ?? "https://api.sms.ru";

        _retryPolicy = ResiliencePolicies.GetHttpRetryPolicy(_logger);
        _circuitBreakerPolicy = ResiliencePolicies.GetHttpCircuitBreakerPolicy(_logger);
    }

    public async Task<(bool Success, string? Error)> SendSmsAsync(string phone, string message)
    {
        try
        {
            _logger.LogInformation("Sending SMS to {Phone}: {Message}", phone, message);

            var policyWrap = Policy.WrapAsync(_retryPolicy, _circuitBreakerPolicy);

            var response = await policyWrap.ExecuteAsync(async () =>
                await _httpClient.GetAsync($"{_apiUrl}/sms/send?api_id={_apiKey}&to={phone}&msg={Uri.EscapeDataString(message)}&json=1"));

            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (root.GetProperty("status").GetString() == "OK")
            {
                var smsProperty = root.GetProperty("sms");
                var phoneProperty = smsProperty.GetProperty(phone);
                var status = phoneProperty.GetProperty("status").GetString();

                if (status == "OK")
                {
                    _logger.LogInformation("SMS sent successfully to {Phone}", phone);
                    return (true, null);
                }
                else
                {
                    var errorMessage = phoneProperty.GetProperty("status_text").GetString();
                    _logger.LogWarning("SMS.ru failed to send to {Phone}. Status: {Status}, Message: {StatusText}", phone, status, errorMessage);
                    return (false, errorMessage);
                }
            }
            else
            {
                var errorMessage = root.GetProperty("status_text").GetString();
                _logger.LogError("SMS.ru API error: {StatusText}", errorMessage);
                return (false, errorMessage);
            }
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error sending SMS to {Phone}", phone);
            return (false, "Ошибка отправки SMS");
        }
    }

    // Методы Email и Push не реализованы в этом сервисе
    public Task<(bool Success, string? Error)> SendEmailAsync(string email, string subject, string body)
    {
        _logger.LogWarning("SendEmailAsync called on SmsRuService which doesn't support emails.");
        return Task.FromResult<(bool, string?)>((false, "Email sending not supported by SMS service"));
    }

    public Task<(bool Success, string? Error)> SendPushNotificationAsync(string userId, string title, string message)
    {
        _logger.LogWarning("SendPushNotificationAsync called on SmsRuService which doesn't support push notifications.");
        return Task.FromResult<(bool, string?)>((false, "Push notification not supported by SMS service"));
    }
}
#pragma warning restore CA1031, CA2208, CA2234, CS1591, S3928, SA1600
