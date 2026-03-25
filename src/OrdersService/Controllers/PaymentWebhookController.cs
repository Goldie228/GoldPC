using GoldPC.OrdersService.Services;
using GoldPC.SharedKernel.Enums;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace GoldPC.OrdersService.Controllers;

/// <summary>
/// Обработчик вебхуков для платежной системы Stripe
/// </summary>
[ApiController]
[Route("api/webhooks/payment/stripe")]
public class PaymentWebhookController : ControllerBase
{
    private readonly ILogger<PaymentWebhookController> _logger;
    private readonly IConfiguration _configuration;
    private readonly IOrdersService _ordersService;
    private readonly string _webhookSecret;

    public PaymentWebhookController(ILogger<PaymentWebhookController> logger, IConfiguration configuration, IOrdersService ordersService)
    {
        _logger = logger;
        _configuration = configuration;
        _ordersService = ordersService;
        _webhookSecret = _configuration["Stripe:WebhookSecret"] ?? throw new ArgumentNullException("Stripe:WebhookSecret is not configured");
    }

    [HttpPost]
    public async Task<IActionResult> HandleWebhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        try
        {
            var stripeEvent = EventUtility.ConstructEvent(json,
                Request.Headers["Stripe-Signature"], _webhookSecret);

            _logger.LogInformation("Processing Stripe Webhook: {EventType}, Id: {EventId}", stripeEvent.Type, stripeEvent.Id);

            // Handle the event
            if (stripeEvent.Type == "checkout.session.completed")
            {
                var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
                if (session == null)
                {
                    _logger.LogWarning("Empty session object in Stripe Event {EventId}", stripeEvent.Id);
                    return BadRequest();
                }

                _logger.LogInformation("Checkout Session Completed: {SessionId} for Order {OrderId}", session.Id, session.ClientReferenceId);

                if (Guid.TryParse(session.ClientReferenceId, out Guid orderId))
                {
                    // Обновляем статус заказа на "Оплачено" (Paid)
                    var result = await _ordersService.UpdateStatusAsync(orderId, OrderStatus.Paid, Guid.Empty, "Оплата получена через Stripe");
                    if (result.Error != null)
                    {
                        _logger.LogError("Failed to update order status {OrderId} to Paid: {Error}", orderId, result.Error);
                        return StatusCode(500, result.Error);
                    }
                }
                else
                {
                    _logger.LogWarning("Invalid OrderId {OrderId} in Stripe Session {SessionId}", session.ClientReferenceId, session.Id);
                }
            }
            else if (stripeEvent.Type == "checkout.session.expired" || stripeEvent.Type == "payment_intent.payment_failed")
            {
                var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
                if (session != null && Guid.TryParse(session.ClientReferenceId, out Guid orderId))
                {
                    _logger.LogWarning("Payment failed or session expired for order {OrderId}. Stripe Event: {EventType}", orderId, stripeEvent.Type);
                    // Мы не отменяем заказ автоматически здесь, так как пользователь может попробовать оплатить снова.
                    // Но мы можем добавить запись в историю.
                    await _ordersService.UpdateStatusAsync(orderId, OrderStatus.New, Guid.Empty, $"Попытка оплаты не удалась: {stripeEvent.Type}");
                }
            }

            return Ok();
        }
        catch (StripeException e)
        {
            _logger.LogError(e, "Stripe exception processing webhook event");
            return BadRequest();
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Unexpected error processing Stripe webhook event");
            return StatusCode(500);
        }
    }
}
