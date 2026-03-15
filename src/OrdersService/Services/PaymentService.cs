using GoldPC.Shared.Services.Interfaces;

namespace GoldPC.OrdersService.Services;

/// <summary>
/// Заглушка для платёжного сервиса (для production)
/// В реальном проекте интегрируется с ЮKassa, Stripe и т.д.
/// </summary>
public class PaymentService : IPaymentService
{
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(ILogger<PaymentService> logger)
    {
        _logger = logger;
    }

    public Task<(string? PaymentUrl, string? Error)> CreatePaymentAsync(Guid orderId, decimal amount)
    {
        // В реальном проекте здесь вызов API платёжной системы
        _logger.LogInformation("Creating payment for order {OrderId}, amount: {Amount}", orderId, amount);
        
        var paymentUrl = $"https://payment.example.com/pay/{orderId}?amount={amount}";
        
        return Task.FromResult<(string?, string?)>((paymentUrl, null));
    }

    public Task<(bool Success, string? Error)> ProcessPaymentCallbackAsync(string paymentId, bool success)
    {
        _logger.LogInformation("Processing payment callback: {PaymentId}, success: {Success}", paymentId, success);
        
        return Task.FromResult<(bool, string?)>((success, null));
    }
}
