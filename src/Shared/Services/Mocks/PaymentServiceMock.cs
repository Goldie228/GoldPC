using GoldPC.Shared.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace GoldPC.Shared.Services.Mocks;

/// <summary>
/// Mock-реализация платежного сервиса для разработки и тестирования.
/// Симулирует успех (95%) и неудачу (5%) с случайной задержкой.
/// </summary>
public class PaymentServiceMock : IPaymentService
{
    private readonly ILogger<PaymentServiceMock> _logger;
    private readonly Random _random = new();

    /// <summary>
    /// Вероятность успешного платежа (0.0 - 1.0)
    /// </summary>
    public double SuccessRate { get; set; } = 0.95;

    /// <summary>
    /// Минимальная задержка в миллисекундах
    /// </summary>
    public int MinDelayMs { get; set; } = 100;

    /// <summary>
    /// Максимальная задержка в миллисекундах
    /// </summary>
    public int MaxDelayMs { get; set; } = 1000;

    /// <summary>
    /// Включить ли симуляцию задержки
    /// </summary>
    public bool EnableDelay { get; set; } = true;

    public PaymentServiceMock(ILogger<PaymentServiceMock> logger)
    {
        _logger = logger;
    }

    public async Task<(string? PaymentUrl, string? Error)> CreatePaymentAsync(Guid orderId, decimal amount)
    {
        // Симуляция случайной задержки
        if (EnableDelay)
        {
            var delay = _random.Next(MinDelayMs, MaxDelayMs);
            await Task.Delay(delay);
        }

        // Определение успеха/неудачи
        var isSuccess = _random.NextDouble() < SuccessRate;

        if (!isSuccess)
        {
            var error = GetRandomError();
            _logger.LogWarning(
                "[Mock PaymentService] Payment FAILED for Order {OrderId}, Amount: {Amount}. Error: {Error}",
                orderId, amount, error);
            
            return (null, error);
        }

        var paymentUrl = GeneratePaymentUrl(orderId, amount);
        var transactionId = $"TRX-{Guid.NewGuid():N}"[..16].ToUpper();
        
        _logger.LogInformation(
            "[Mock PaymentService] Payment created successfully for Order {OrderId}, Amount: {Amount}, TransactionId: {TransactionId}",
            orderId, amount, transactionId);

        return (paymentUrl, null);
    }

    public async Task<(bool Success, string? Error)> ProcessPaymentCallbackAsync(string paymentId, bool success)
    {
        // Симуляция случайной задержки
        if (EnableDelay)
        {
            var delay = _random.Next(MinDelayMs / 2, MaxDelayMs / 2);
            await Task.Delay(delay);
        }

        if (!success)
        {
            _logger.LogWarning(
                "[Mock PaymentService] Payment callback FAILED for PaymentId: {PaymentId}",
                paymentId);
            return (false, "Payment was declined by payment provider");
        }

        _logger.LogInformation(
            "[Mock PaymentService] Payment callback processed successfully for PaymentId: {PaymentId}",
            paymentId);

        return (true, null);
    }

    private string GeneratePaymentUrl(Guid orderId, decimal amount)
    {
        return $"https://mock-payment.example.com/pay/{orderId}?amount={amount}&mock=true";
    }

    private string GetRandomError()
    {
        var errors = new[]
        {
            "INSUFFICIENT_FUNDS: Недостаточно средств на карте",
            "CARD_DECLINED: Карта отклонена банком",
            "NETWORK_ERROR: Ошибка сети при обработке платежа",
            "TIMEOUT: Превышено время ожидания ответа от платёжной системы",
            "INVALID_CARD: Неверный номер карты",
            "FRAUD_DETECTED: Подозрительная транзакция заблокирована",
            "LIMIT_EXCEEDED: Превышен лимит транзакций"
        };

        return errors[_random.Next(errors.Length)];
    }
}

