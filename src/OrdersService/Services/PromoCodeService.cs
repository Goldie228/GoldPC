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

        var now = DateTime.UtcNow;
        var upperCode = code.ToUpper();

        var promoCode = await _context.PromoCodes
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Code.ToUpper() == upperCode);

        var reason = GetRejectionReason(promoCode, now, orderAmount);
        if (reason != null)
        {
            _logger.LogWarning("Promo code validation failed: {Code} - {Reason}", code, reason);
            return new ValidatePromoCodeResponse
            {
                Valid = false,
                Discount = 0,
                Message = reason,
                DiscountAmount = 0
            };
        }

        var discountAmount = Math.Round(orderAmount * promoCode!.DiscountPercent / 100m, 2);

        _logger.LogInformation("Promo code {Code} is valid. Discount: {Discount}%, Amount: {DiscountAmount}",
            code, promoCode.DiscountPercent, discountAmount);

        return new ValidatePromoCodeResponse
        {
            Valid = true,
            Discount = promoCode.DiscountPercent,
            Message = $"Скидка {promoCode.DiscountPercent}%",
            DiscountAmount = discountAmount
        };
    }

    /// <inheritdoc />
    public async Task<ValidatePromoCodeResponse?> UsePromoCodeAsync(string code, decimal orderAmount)
    {
        // Атомарная операция: проверка всех условий + инкремент UsedCount в одном UPDATE.
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
            var promoCode = await _context.PromoCodes
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Code.ToUpper() == upperCode);

            var reason = GetRejectionReason(promoCode, now, orderAmount);
            _logger.LogWarning("UsePromoCode failed: {Code} - {Reason}", code, reason ?? "unknown");

            return null;
        }

        var claimed = await _context.PromoCodes
            .AsNoTracking()
            .FirstAsync(p => p.Code.ToUpper() == upperCode);

        var discountAmount = Math.Round(orderAmount * claimed.DiscountPercent / 100m, 2);

        _logger.LogInformation("Promo code {Code} applied. Discount: {Discount}%, Amount: {DiscountAmount}",
            code, claimed.DiscountPercent, discountAmount);

        return new ValidatePromoCodeResponse
        {
            Valid = true,
            Discount = claimed.DiscountPercent,
            Message = $"Скидка {claimed.DiscountPercent}%",
            DiscountAmount = discountAmount
        };
    }

    private static string? GetRejectionReason(Entities.PromoCode? promoCode, DateTime now, decimal orderAmount)
    {
        if (promoCode == null)
            return "Промокод не найден";
        if (!promoCode.IsActive)
            return "Промокод неактивен";
        if (promoCode.ValidFrom.HasValue && now < promoCode.ValidFrom.Value)
            return "Промокод еще не действует";
        if (promoCode.ValidTo.HasValue && now > promoCode.ValidTo.Value)
            return "Срок действия промокода истек";
        if (promoCode.MinOrderAmount.HasValue && orderAmount < promoCode.MinOrderAmount.Value)
            return $"Минимальная сумма заказа для этого промокода: {promoCode.MinOrderAmount.Value:N2} BYN";
        if (promoCode.MaxUses.HasValue && promoCode.UsedCount >= promoCode.MaxUses.Value)
            return "Промокод больше недоступен";
        return null;
    }
}
