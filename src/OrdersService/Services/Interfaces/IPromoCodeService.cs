using GoldPC.SharedKernel.DTOs;

namespace GoldPC.OrdersService.Services.Interfaces;

/// <summary>
/// Сервис для работы с промокодами
/// </summary>
public interface IPromoCodeService
{
    /// <summary>
    /// Валидация промокода (read-only, без инкремента счётчика)
    /// </summary>
    /// <param name="code">Код промокода</param>
    /// <param name="orderAmount">Сумма заказа</param>
    /// <returns>Результат валидации</returns>
    Task<ValidatePromoCodeResponse> ValidatePromoCodeAsync(string code, decimal orderAmount);

    /// <summary>
    /// Атомарно проверяет и зачёркивает промокод (инкремент UsedCount).
    /// Возвращает null, если промокод недействителен.
    /// Вызывать при создании заказа, а не при валидации на клиенте.
    /// </summary>
    Task<ValidatePromoCodeResponse?> UsePromoCodeAsync(string code, decimal orderAmount);
}
