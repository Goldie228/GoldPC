using GoldPC.OrdersService.Services;
using GoldPC.SharedKernel.Enums;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace GoldPC.OrdersService.Controllers.Webhooks;

[ApiController]
[Route("api/v1/webhooks/stripe")]
public class StripeWebhookController : ControllerBase
{
    private readonly IOrdersService _ordersService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<StripeWebhookController> _logger;

    public StripeWebhookController(
        IOrdersService ordersService,
        IConfiguration configuration,
        ILogger<StripeWebhookController> logger)
    {
        _ordersService = ordersService;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> Handle()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        try
        {
            var webhookSecret = _configuration["Stripe:WebhookSecret"];
            if (string.IsNullOrEmpty(webhookSecret))
            {
                _logger.LogWarning("Stripe WebhookSecret not configured");
                return BadRequest();
            }

            var stripeEvent = EventUtility.ConstructEvent(json, Request.Headers["Stripe-Signature"], webhookSecret);
            if (stripeEvent.Type == "checkout.session.completed")
            {
                var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
                await HandleCheckoutSessionCompleted(session);
            }
            else if (stripeEvent.Type == "payment_intent.payment_failed")
            {
                var intent = stripeEvent.Data.Object as PaymentIntent;
                await HandlePaymentFailed(intent);
            }
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe webhook error");
            return BadRequest();
        }

        return Ok();
    }

    [HttpGet("simulate")]
    public IActionResult Simulate(Guid orderId, decimal amount)
    {
        var html = $@"
            <html>
                <body style='font-family: sans-serif; text-align: center; padding: 50px;'>
                    <h2>Симулятор оплаты Stripe</h2>
                    <p>Заказ: <strong>{orderId}</strong></p>
                    <p>Сумма: <strong>{amount:N2} RUB</strong></p>
                    <button onclick='pay(true)' style='background: #32CD32; color: white; border: none; padding: 10px 20px; font-size: 16px; cursor: pointer; border-radius: 5px; margin-right: 10px;'>Оплатить успешно</button>
                    <button onclick='pay(false)' style='background: #FF4500; color: white; border: none; padding: 10px 20px; font-size: 16px; cursor: pointer; border-radius: 5px;'>Ошибка оплаты</button>
                    
                    <script>
                        async function pay(success) {{
                            const response = await fetch('/api/v1/webhooks/stripe', {{
                                method: 'POST',
                                headers: {{ 'Content-Type': 'application/json' }},
                                body: JSON.stringify({{
                                    type: success ? 'checkout.session.completed' : 'payment_intent.payment_failed',
                                    data: {{
                                        object: success ? 
                                            {{ client_reference_id: '{orderId}' }} : 
                                            {{ metadata: {{ OrderId: '{orderId}' }} }}
                                    }}
                                }})
                            }});
                            if (response.ok) {{
                                alert('Сигнал отправлен! Проверьте статус заказа.');
                                window.location.href = '/payment-success?orderId={orderId}';
                            }} else {{
                                alert('Ошибка при отправке сигнала.');
                            }}
                        }}
                    </script>
                </body>
            </html>";
        return Content(html, "text/html");
    }

    private async Task HandleCheckoutSessionCompleted(Stripe.Checkout.Session? session)
    {
        if (session == null || string.IsNullOrEmpty(session.ClientReferenceId)) return;

        if (Guid.TryParse(session.ClientReferenceId, out var orderId))
        {
            _logger.LogInformation("Payment successful for Order {OrderId}", orderId);
            await _ordersService.UpdateStatusAsync(orderId, OrderStatus.Paid, Guid.Empty, "Оплата через Stripe подтверждена");
        }
    }

    private async Task HandlePaymentFailed(PaymentIntent? intent)
    {
        if (intent == null || !intent.Metadata.TryGetValue("OrderId", out var orderIdStr)) return;

        if (Guid.TryParse(orderIdStr, out var orderId))
        {
            _logger.LogWarning("Payment failed for Order {OrderId}", orderId);
            // Можно добавить уведомление пользователю или смену статуса на какой-то специфичный
        }
    }
}
