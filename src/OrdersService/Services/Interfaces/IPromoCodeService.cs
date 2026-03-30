using GoldPC.SharedKernel.DTOs;

namespace GoldPC.OrdersService.Services.Interfaces;

/// <summary>
/// Сервис для работы с промокодами
/// </summary>
public interface IPromoCodeService
{
    /// <summary>
    /// Валидация промокода
    /// </summary>
    /// <param name="code">Код промокода</param>
    /// <param name="orderAmount">Сумма заказа</param>
    /// <returns>Результат валидации</returns>
    Task<ValidatePromoCodeResponse> ValidatePromoCodeAsync(string code, decimal orderAmount);
}
