using GoldPC.Shared.Services.Interfaces;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace GoldPC.Shared.Services.Implementations;

/// <summary>
/// Декоратор для логирования всех платежных операций.
/// </summary>
public class PaymentServiceLoggingDecorator : IPaymentService
{
    private readonly IPaymentService _inner;
    private readonly ILogger<PaymentServiceLoggingDecorator> _logger;

    public PaymentServiceLoggingDecorator(
        IPaymentService inner,
        ILogger<PaymentServiceLoggingDecorator> logger)
    {
        _inner = inner;
        _logger = logger;
    }

    public async Task<(string? PaymentUrl, string? Error)> CreatePaymentAsync(Guid orderId, decimal amount)
    {
        var stopwatch = Stopwatch.StartNew();
        _logger.LogInformation("Outgoing Payment Request: OrderId={OrderId}, Amount={Amount}", 
            orderId, amount);

        var result = await _inner.CreatePaymentAsync(orderId, amount);
        stopwatch.Stop();

        if (result.Error == null)
        {
            _logger.LogInformation("Payment Response SUCCESS in {ElapsedMs}ms. URL: {Url}", 
                stopwatch.ElapsedMilliseconds, result.PaymentUrl);
        }
        else
        {
            _logger.LogError("Payment Response FAILURE in {ElapsedMs}ms: {Error}", 
                stopwatch.ElapsedMilliseconds, result.Error);
        }

        return result;
    }

    public async Task<(bool Success, string? Error)> ProcessPaymentCallbackAsync(string paymentId, bool success)
    {
        var stopwatch = Stopwatch.StartNew();
        _logger.LogInformation("Outgoing Payment Callback Request: PaymentId={PaymentId}, Success={Success}", 
            paymentId, success);

        var result = await _inner.ProcessPaymentCallbackAsync(paymentId, success);
        stopwatch.Stop();

        if (result.Success)
        {
            _logger.LogInformation("Payment Callback Response SUCCESS in {ElapsedMs}ms", 
                stopwatch.ElapsedMilliseconds);
        }
        else
        {
            _logger.LogError("Payment Callback Response FAILURE in {ElapsedMs}ms: {Error}", 
                stopwatch.ElapsedMilliseconds, result.Error);
        }

        return result;
    }
}
