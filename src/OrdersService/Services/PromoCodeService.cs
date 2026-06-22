using GoldPC.OrdersService.Data;
using GoldPC.OrdersService.Services.Interfaces;
using GoldPC.SharedKernel.DTOs;
using Microsoft.EntityFrameworkCore;

namespace GoldPC.OrdersService.Services;

/// <summary>
/// Реализация сервиса для работы с промокодами
/// </summary>
public class PromoCodeService : IPromoCodeService
{
    private readonly OrdersDbContext _context;
    private readonly ILogger<PromoCodeService> _logger;

    public PromoCodeService(OrdersDbContext context, ILogger<PromoCodeService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ValidatePromoCodeResponse> ValidatePromoCodeAsync(string code, decimal orderAmount)
    {
        _logger.LogInformation("Validating promo code: {Code} for order amount: {Amount}", code, orderAmount);

        // Атомарная операция: инкремент UsedCount + проверка всех условий в одном UPDATE.
        // Исключает race condition, когда два параллельных запроса оба проходят проверку MaxUses.
        var now = DateTime.UtcNow;
        var upperCode = code.ToUpper();
        var rowsUpdated = await _context.PromoCodes
            .Where(p => p.Code.ToUpper() == upperCode)
            .Where(p => p.IsActive)
            .Where(p => !p.ValidFrom.HasValue || p.ValidFrom.Value <= now)
            .Where(p => !p.ValidTo.HasValue || p.ValidTo.Value >= now)
            .Where(p => p.MinOrderAmount == null || orderAmount >= p.MinOrderAmount.Value)
            .Where(p => p.MaxUses == null || p.UsedCount < p.MaxUses.Value)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(p => p.UsedCount, p => p.UsedCount + 1));

        if (rowsUpdated == 0)
        {
            // Определяем причину отказа для логирования и сообщения
            var promoCode = await _context.PromoCodes
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Code.ToUpper() == upperCode);

            string message;
            if (promoCode == null)
            {
                message = "Промокод не найден";
                _logger.LogWarning("Promo code not found: {Code}", code);
            }
            else if (!promoCode.IsActive)
            {
                message = "Промокод неактивен";
                _logger.LogWarning("Promo code is inactive: {Code}", code);
            }
            else if (promoCode.ValidFrom.HasValue && now < promoCode.ValidFrom.Value)
            {
                message = "Промокод еще не действует";
                _logger.LogWarning("Promo code not yet valid: {Code}", code);
            }
            else if (promoCode.ValidTo.HasValue && now > promoCode.ValidTo.Value)
            {
                message = "Срок действия промокода истек";
                _logger.LogWarning("Promo code expired: {Code}", code);
            }
            else if (promoCode.MinOrderAmount.HasValue && orderAmount < promoCode.MinOrderAmount.Value)
            {
                message = $"Минимальная сумма заказа для этого промокода: {promoCode.MinOrderAmount.Value:N2} BYN";
                _logger.LogWarning("Order amount {Amount} < min {MinAmount} for {Code}", orderAmount, promoCode.MinOrderAmount.Value, code);
            }
            else
            {
                message = "Промокод больше недоступен";
                _logger.LogWarning("Promo code usage limit reached: {Code}", code);
            }

            return new ValidatePromoCodeResponse
            {
                Valid = false,
                Discount = 0,
                Message = message,
                DiscountAmount = 0
            };
        }

        // Промокод успешно зачтён — загружаем данные для расчёта скидки
        var claimed = await _context.PromoCodes
            .AsNoTracking()
            .FirstAsync(p => p.Code.ToUpper() == upperCode);

        var discountAmount = Math.Round(orderAmount * claimed.DiscountPercent / 100m, 2);

        _logger.LogInformation("Promo code {Code} is valid. Discount: {Discount}%, Amount: {DiscountAmount}",
            code, claimed.DiscountPercent, discountAmount);

        return new ValidatePromoCodeResponse
        {
            Valid = true,
            Discount = claimed.DiscountPercent,
            Message = $"Скидка {claimed.DiscountPercent}%",
            DiscountAmount = discountAmount
        };
    }
}
