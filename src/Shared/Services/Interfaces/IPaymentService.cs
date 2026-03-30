namespace GoldPC.Shared.Services.Interfaces;

/// <summary>
/// Интерфейс платежного сервиса
/// </summary>
public interface IPaymentService
{
    /// <summary>
    /// Создать платёж для заказа
    /// </summary>
    /// <param name="orderId">ID заказа</param>
    /// <param name="amount">Сумма платежа</param>
    /// <returns>URL для оплаты или ошибка</returns>
    Task<(string? PaymentUrl, string? Error)> CreatePaymentAsync(Guid orderId, decimal amount);

    /// <summary>
    /// Обработать callback от платёжной системы
    /// </summary>
    /// <param name="paymentId">ID платежа</param>
    /// <param name="success">Успешность платежа</param>
    /// <returns>Результат обработки</returns>
    Task<(bool Success, string? Error)> ProcessPaymentCallbackAsync(string paymentId, bool success);
}
