using GoldPC.Shared.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Stripe;
using Stripe.Checkout;

namespace GoldPC.OrdersService.Services;

/// <summary>
/// Реализация платежного сервиса через Stripe
/// </summary>
public class StripePaymentService : IPaymentService
{
    private readonly ILogger<StripePaymentService> _logger;
    private readonly IConfiguration _configuration;
    private readonly string _apiKey;
    private readonly string _webhookSecret;
    private readonly string _successUrl;
    private readonly string _cancelUrl;

    public StripePaymentService(ILogger<StripePaymentService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
        _apiKey = _configuration["Stripe:SecretKey"] ?? throw new ArgumentNullException("Stripe:SecretKey is not configured");
        _webhookSecret = _configuration["Stripe:WebhookSecret"] ?? throw new ArgumentNullException("Stripe:WebhookSecret is not configured");
        _successUrl = _configuration["Stripe:SuccessUrl"] ?? "https://localhost:3000/order/success/{CHECKOUT_SESSION_ID}";
        _cancelUrl = _configuration["Stripe:CancelUrl"] ?? "https://localhost:3000/order/cancel";
        
        StripeConfiguration.ApiKey = _apiKey;
    }

    public async Task<(string? PaymentUrl, string? Error)> CreatePaymentAsync(Guid orderId, decimal amount)
    {
        try
        {
            if (_configuration.GetValue<bool>("Stripe:UseSimulator", true))
            {
                var baseUrl = _configuration["BaseUrl"] ?? "http://localhost:5002";
                var mockPaymentUrl = $"{baseUrl}/api/v1/webhooks/stripe/simulate?orderId={orderId}&amount={amount}";
                _logger.LogInformation("Using Stripe Simulator for order {OrderId}. URL: {MockUrl}", orderId, mockPaymentUrl);
                return (mockPaymentUrl, null);
            }

            _logger.LogInformation("Creating Stripe Checkout Session for order {OrderId}, amount: {Amount}", orderId, amount);

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            UnitAmount = (long)(amount * 100), // Stripe uses cents
                            Currency = "usd", // Можно вынести в конфиг
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = $"Заказ GoldPC #{orderId}",
                                Description = $"Оплата заказа в магазине GoldPC",
                            },
                        },
                        Quantity = 1,
                    },
                },
                Mode = "payment",
                SuccessUrl = _successUrl.Replace("{CHECKOUT_SESSION_ID}", "{CHECKOUT_SESSION_ID}"),
                CancelUrl = _cancelUrl,
                ClientReferenceId = orderId.ToString(),
                Metadata = new Dictionary<string, string>
                {
                    { "OrderId", orderId.ToString() }
                }
            };

            var service = new SessionService();
            Session session = await service.CreateAsync(options);

            _logger.LogInformation("Stripe Checkout Session created: {SessionId} for Order {OrderId}", session.Id, orderId);

            return (session.Url, null);
        }
        catch (StripeException e)
        {
            _logger.LogError(e, "Stripe error creating payment for order {OrderId}", orderId);
            return (null, $"Ошибка платежной системы: {e.Message}");
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Unexpected error creating payment for order {OrderId}", orderId);
            return (null, "Произошла внутренняя ошибка при создании платежа");
        }
    }

    public async Task<(bool Success, string? Error)> ProcessPaymentCallbackAsync(string paymentId, bool success)
    {
        // В случае Stripe мы полагаемся на Webhooks для обновления статуса.
        // Этот метод может быть использован для ручной проверки статуса сессии.
        try
        {
            var service = new SessionService();
            Session session = await service.GetAsync(paymentId);

            if (session.PaymentStatus == "paid")
            {
                return (true, null);
            }

            return (false, $"Статус платежа: {session.PaymentStatus}");
        }
        catch (StripeException e)
        {
            _logger.LogError(e, "Stripe error retrieving session {SessionId}", paymentId);
            return (false, e.Message);
        }
    }
}
