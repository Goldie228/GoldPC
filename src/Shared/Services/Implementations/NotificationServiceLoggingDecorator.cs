using GoldPC.Shared.Services.Interfaces;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Text.Json;

namespace GoldPC.Shared.Services.Implementations;

/// <summary>
/// Декоратор для логирования всех уведомлений (SMS, Email, Push).
/// Выполняет маскирование чувствительных данных.
/// </summary>
public class NotificationServiceLoggingDecorator : INotificationService
{
    private readonly INotificationService _inner;
    private readonly ILogger<NotificationServiceLoggingDecorator> _logger;

    public NotificationServiceLoggingDecorator(
        INotificationService inner,
        ILogger<NotificationServiceLoggingDecorator> logger)
    {
        _inner = inner;
        _logger = logger;
    }

    public async Task<(bool Success, string? Error)> SendSmsAsync(string phone, string message)
    {
        var stopwatch = Stopwatch.StartNew();
        var maskedPhone = MaskPhone(phone);
        
        _logger.LogInformation("Outgoing SMS Request: To={Phone}, Message='{Message}'", 
            maskedPhone, message.Length > 20 ? message[..20] + "..." : message);

        var result = await _inner.SendSmsAsync(phone, message);
        stopwatch.Stop();

        if (result.Success)
        {
            _logger.LogInformation("SMS Response SUCCESS in {ElapsedMs}ms", stopwatch.ElapsedMilliseconds);
        }
        else
        {
            _logger.LogError("SMS Response FAILURE in {ElapsedMs}ms: {Error}", stopwatch.ElapsedMilliseconds, result.Error);
        }

        return result;
    }

    public async Task<(bool Success, string? Error)> SendEmailAsync(string email, string subject, string body)
    {
        var stopwatch = Stopwatch.StartNew();
        var maskedEmail = MaskEmail(email);

        _logger.LogInformation("Outgoing Email Request: To={Email}, Subject='{Subject}'", 
            maskedEmail, subject);

        var result = await _inner.SendEmailAsync(email, subject, body);
        stopwatch.Stop();

        if (result.Success)
        {
            _logger.LogInformation("Email Response SUCCESS in {ElapsedMs}ms", stopwatch.ElapsedMilliseconds);
        }
        else
        {
            _logger.LogError("Email Response FAILURE in {ElapsedMs}ms: {Error}", stopwatch.ElapsedMilliseconds, result.Error);
        }

        return result;
    }

    public async Task<(bool Success, string? Error)> SendPushNotificationAsync(string userId, string title, string message)
    {
        var stopwatch = Stopwatch.StartNew();
        _logger.LogInformation("Outgoing Push Request: UserId={UserId}, Title='{Title}'", userId, title);

        var result = await _inner.SendPushNotificationAsync(userId, title, message);
        stopwatch.Stop();

        if (result.Success)
        {
            _logger.LogInformation("Push Response SUCCESS in {ElapsedMs}ms", stopwatch.ElapsedMilliseconds);
        }
        else
        {
            _logger.LogError("Push Response FAILURE in {ElapsedMs}ms: {Error}", stopwatch.ElapsedMilliseconds, result.Error);
        }

        return result;
    }

    private static string MaskPhone(string phone)
    {
        if (string.IsNullOrEmpty(phone) || phone.Length < 7) return phone;
        return phone[..3] + "****" + phone[^3..];
    }

    private static string MaskEmail(string email)
    {
        if (string.IsNullOrEmpty(email) || !email.Contains('@')) return email;
        var parts = email.Split('@');
        var local = parts[0];
        if (local.Length <= 2) return "***@" + parts[1];
        return local[..2] + "***@" + parts[1];
    }
}
