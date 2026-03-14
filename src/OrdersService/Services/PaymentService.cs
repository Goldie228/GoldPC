namespace GoldPC.OrdersService.Services;

/// <summary>
/// Заглушка для платёжного сервиса
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
        // Заглушка: в реальном проекте здесь вызов API платёжной системы
        _logger.LogInformation("Creating payment for order {OrderId}, amount: {Amount}", orderId, amount);
        
        // Имитация создания платежа
        var paymentUrl = $"https://payment.example.com/pay/{orderId}?amount={amount}";
        
        return Task.FromResult<(string?, string?)>((paymentUrl, null));
    }

    public Task<(bool Success, string? Error)> ProcessPaymentCallbackAsync(string paymentId, bool success)
    {
        // Заглушка: обработка callback от платёжной системы
        _logger.LogInformation("Processing payment callback: {PaymentId}, success: {Success}", paymentId, success);
        
        return Task.FromResult<(bool, string?)>((success, null));
    }
}

public interface IPaymentService
{
    Task<(string? PaymentUrl, string? Error)> CreatePaymentAsync(Guid orderId, decimal amount);
    Task<(bool Success, string? Error)> ProcessPaymentCallbackAsync(string paymentId, bool success);
}