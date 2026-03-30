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

        // Найти промокод
        var promoCode = await _context.PromoCodes
            .FirstOrDefaultAsync(p => p.Code.ToUpper() == code.ToUpper());

        if (promoCode == null)
        {
            _logger.LogWarning("Promo code not found: {Code}", code);
            return new ValidatePromoCodeResponse
            {
                Valid = false,
                Discount = 0,
                Message = "Промокод не найден",
                DiscountAmount = 0
            };
        }

        // Проверка активности
        if (!promoCode.IsActive)
        {
            _logger.LogWarning("Promo code is inactive: {Code}", code);
            return new ValidatePromoCodeResponse
            {
                Valid = false,
                Discount = 0,
                Message = "Промокод неактивен",
                DiscountAmount = 0
            };
        }

        // Проверка срока действия
        var now = DateTime.UtcNow;
        if (promoCode.ValidFrom.HasValue && now < promoCode.ValidFrom.Value)
        {
            _logger.LogWarning("Promo code not yet valid: {Code}", code);
            return new ValidatePromoCodeResponse
            {
                Valid = false,
                Discount = 0,
                Message = "Промокод еще не действует",
                DiscountAmount = 0
            };
        }

        if (promoCode.ValidTo.HasValue && now > promoCode.ValidTo.Value)
        {
            _logger.LogWarning("Promo code expired: {Code}", code);
            return new ValidatePromoCodeResponse
            {
                Valid = false,
                Discount = 0,
                Message = "Срок действия промокода истек",
                DiscountAmount = 0
            };
        }

        // Проверка минимальной суммы заказа
        if (promoCode.MinOrderAmount.HasValue && orderAmount < promoCode.MinOrderAmount.Value)
        {
            _logger.LogWarning("Order amount {Amount} is less than minimum {MinAmount} for promo code {Code}", 
                orderAmount, promoCode.MinOrderAmount.Value, code);
            return new ValidatePromoCodeResponse
            {
                Valid = false,
                Discount = 0,
                Message = $"Минимальная сумма заказа для этого промокода: {promoCode.MinOrderAmount.Value:N2} BYN",
                DiscountAmount = 0
            };
        }

        // Проверка лимита использований
        if (promoCode.MaxUses.HasValue && promoCode.UsedCount >= promoCode.MaxUses.Value)
        {
            _logger.LogWarning("Promo code usage limit reached: {Code}", code);
            return new ValidatePromoCodeResponse
            {
                Valid = false,
                Discount = 0,
                Message = "Промокод больше недоступен",
                DiscountAmount = 0
            };
        }

        // Промокод валиден
        var discountAmount = Math.Round(orderAmount * promoCode.DiscountPercent / 100m, 2);
        
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
}
