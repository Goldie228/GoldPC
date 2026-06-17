#pragma warning disable CA1031, CS1591, SA1600
using GoldPC.Shared.Services.Background;
using GoldPC.SharedKernel.DTOs;
using Microsoft.Extensions.Logging;

namespace GoldPC.Shared.Services;

/// <summary>
/// Реализация отправки email-уведомлений для заказов, гарантий и сервисных заявок.
/// Использует IEmailQueue для асинхронной отправки (fire-and-forget).
/// HTML-шаблоны встроены в код с золотой темой GoldPC.
/// </summary>
public class OrderEmailService : IOrderEmailService
{
    private readonly IEmailQueue _emailQueue;
    private readonly ILogger<OrderEmailService> _logger;

    // === Цвета темы GoldPC ===
    private const string Gold = "#FCD535";
    private const string GoldDark = "#d4a800";
    private const string DarkBg = "#1e2329";
    private const string DarkSurface = "#2b3139";
    private const string TextPrimary = "#eaecef";
    private const string TextMuted = "#848e9c";
    private const string Border = "#363c45";
    private const string Green = "#0ecb81";
    private const string Red = "#f6465d";

    public OrderEmailService(IEmailQueue emailQueue, ILogger<OrderEmailService> logger)
    {
        _emailQueue = emailQueue;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task SendOrderConfirmationAsync(OrderDto order)
    {
        if (string.IsNullOrWhiteSpace(order.CustomerEmail))
        {
            _logger.LogWarning("Не удалось отправить подтверждение заказа {OrderNumber}: email клиента пуст", order.OrderNumber);
            return;
        }

        var itemsHtml = BuildOrderItemsHtml(order.Items);
        var subject = $"Подтверждение заказа #{order.OrderNumber} — GoldPC";

        var body = $@"
<!DOCTYPE html>
<html lang=""ru"">
<head><meta charset=""utf-8""><meta name=""viewport"" content=""width=device-width, initial-scale=1.0""></head>
<body style=""margin:0;padding:0;background-color:{DarkBg};font-family:'Segoe UI',Arial,sans-serif;color:{TextPrimary};"">
<table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:{DarkBg};padding:32px 16px;"">
<tr><td align=""center"">
<table width=""600"" cellpadding=""0"" cellspacing=""0"" style=""background-color:{DarkSurface};border-radius:12px;border:1px solid {Border};overflow:hidden;"">
  <!-- Заголовок -->
  <tr><td style=""background:linear-gradient(135deg,{Gold},{GoldDark});padding:28px 32px;text-align:center;"">
    <h1 style=""margin:0;font-size:24px;color:{DarkBg};font-weight:700;"">✅ Заказ #{order.OrderNumber}</h1>
    <p style=""margin:6px 0 0;font-size:14px;color:{DarkBg};opacity:0.8;"">Подтверждение заказа</p>
  </td></tr>

  <!-- Приветствие -->
  <tr><td style=""padding:28px 32px 16px;"">
    <p style=""margin:0;font-size:16px;color:{TextPrimary};"">Здравствуйте, {Escape(order.CustomerFirstName)}!</p>
    <p style=""margin:12px 0 0;font-size:15px;color:{TextMuted};line-height:1.6;"">
      Ваш заказ успешно создан и ожидает обработки. Ниже приведены детали вашего заказа.
    </p>
  </td></tr>

  <!-- Товары -->
  <tr><td style=""padding:0 32px 16px;"">
    <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:{DarkBg};border-radius:8px;border:1px solid {Border};"">
      <tr><td style=""padding:16px 20px;border-bottom:1px solid {Border};"">
        <h2 style=""margin:0;font-size:14px;color:{Gold};text-transform:uppercase;letter-spacing:1px;"">Состав заказа</h2>
      </td></tr>
      <tr><td style=""padding:8px 20px;"">
        {itemsHtml}
      </td></tr>
    </table>
  </td></tr>

  <!-- Итого -->
  <tr><td style=""padding:0 32px 16px;"">
    <table width=""100%"" cellpadding=""0"" cellspacing=""0"">
      <tr>
        <td style=""padding:10px 0;font-size:14px;color:{TextMuted};border-top:1px solid {Border};"">Товары ({order.Items.Count} поз.)</td>
        <td style=""padding:10px 0;font-size:14px;color:{TextPrimary};text-align:right;border-top:1px solid {Border};"" align=""right"">{order.Subtotal:N2} BYN</td>
      </tr>
      <tr>
        <td style=""padding:10px 0;font-size:14px;color:{TextMuted};"">Доставка</td>
        <td style=""padding:10px 0;font-size:14px;color:{TextPrimary};text-align:right;"" align=""right"">{order.DeliveryCost:N2} BYN</td>
      </tr>
      <tr>
        <td style=""padding:14px 0 10px;font-size:18px;font-weight:700;color:{Gold};border-top:2px solid {Gold};"">Итого</td>
        <td style=""padding:14px 0 10px;font-size:18px;font-weight:700;color:{Gold};text-align:right;border-top:2px solid {Gold};"" align=""right"">{order.Total:N2} BYN</td>
      </tr>
    </table>
  </td></tr>

  <!-- Детали -->
  <tr><td style=""padding:0 32px 24px;"">
    <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:{DarkBg};border-radius:8px;border:1px solid {Border};"">
      <tr><td style=""padding:16px 20px;"">
        <h2 style=""margin:0 0 12px;font-size:14px;color:{Gold};text-transform:uppercase;letter-spacing:1px;"">Информация о доставке</h2>
        <p style=""margin:0;font-size:14px;color:{TextMuted};line-height:1.8;"">
          Способ доставки: <strong style=""color:{TextPrimary}"">{Escape(order.DeliveryMethod)}</strong><br/>
          Способ оплаты: <strong style=""color:{TextPrimary}"">{Escape(order.PaymentMethod)}</strong><br/>
          {(string.IsNullOrEmpty(order.Address) ? "" : $"Адрес: <strong style=\"color:{TextPrimary}\">{Escape(order.Address)}</strong><br/>")}
          Дата создания: <strong style=""color:{TextPrimary}"">{order.CreatedAt:dd.MM.yyyy HH:mm}</strong>
        </p>
      </td></tr>
    </table>
  </td></tr>

  <!-- Футер -->
  <tr><td style=""background-color:{DarkBg};padding:20px 32px;border-top:1px solid {Border};text-align:center;"">
    <p style=""margin:0;font-size:12px;color:{TextMuted};line-height:1.6;"">
      Это автоматическое письмо от магазина <a href=""https://goldpc.by"" style=""color:{Gold};text-decoration:none;"">GoldPC</a>.<br/>
      Пожалуйста, не отвечайте на него. По вопросам обращайтесь: <a href=""mailto:support@goldpc.by"" style=""color:{Gold};text-decoration:none;"">support@goldpc.by</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>";

        await QueueEmailAsync(order.CustomerEmail, subject, body);
    }

    /// <inheritdoc/>
    public async Task SendOrderStatusChangedAsync(OrderDto order, string oldStatus, string newStatus)
    {
        if (string.IsNullOrWhiteSpace(order.CustomerEmail))
        {
            _logger.LogWarning("Не удалось отправить уведомление о статусе заказа {OrderNumber}: email клиента пуст", order.OrderNumber);
            return;
        }

        var subject = $"Заказ #{order.OrderNumber}: статус изменён — {newStatus}";

        var body = $@"
<!DOCTYPE html>
<html lang=""ru"">
<head><meta charset=""utf-8""><meta name=""viewport"" content=""width=device-width, initial-scale=1.0""></head>
<body style=""margin:0;padding:0;background-color:{DarkBg};font-family:'Segoe UI',Arial,sans-serif;color:{TextPrimary};"">
<table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:{DarkBg};padding:32px 16px;"">
<tr><td align=""center"">
<table width=""600"" cellpadding=""0"" cellspacing=""0"" style=""background-color:{DarkSurface};border-radius:12px;border:1px solid {Border};overflow:hidden;"">
  <!-- Заголовок -->
  <tr><td style=""background:linear-gradient(135deg,{Gold},{GoldDark});padding:28px 32px;text-align:center;"">
    <h1 style=""margin:0;font-size:24px;color:{DarkBg};font-weight:700;"">📦 Заказ #{order.OrderNumber}</h1>
    <p style=""margin:6px 0 0;font-size:14px;color:{DarkBg};opacity:0.8;"">Статус обновлён</p>
  </td></tr>

  <!-- Контент -->
  <tr><td style=""padding:28px 32px;"">
    <p style=""margin:0;font-size:16px;color:{TextPrimary};"">Здравствуйте, {Escape(order.CustomerFirstName)}!</p>
    <p style=""margin:16px 0 0;font-size:15px;color:{TextMuted};line-height:1.6;"">
      Статус вашего заказа <strong style=""color:{Gold}"">#{order.OrderNumber}</strong> был изменён.
    </p>

    <!-- Статус -->
    <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""margin-top:20px;background-color:{DarkBg};border-radius:8px;border:1px solid {Border};overflow:hidden;"">
      <tr>
        <td style=""padding:14px 20px;border-right:1px solid {Border};"">
          <span style=""font-size:11px;color:{TextMuted};text-transform:uppercase;letter-spacing:0.5px;"">Было</span><br/>
          <span style=""font-size:15px;color:{TextPrimary};font-weight:600;"">{Escape(oldStatus)}</span>
        </td>
        <td style=""padding:14px 20px;text-align:center;width:40px;"">
          <span style=""font-size:20px;color:{Gold};"">→</span>
        </td>
        <td style=""padding:14px 20px;border-left:1px solid {Border};"">
          <span style=""font-size:11px;color:{TextMuted};text-transform:uppercase;letter-spacing:0.5px;"">Стало</span><br/>
          <span style=""font-size:15px;color:{Green};font-weight:600;"">{Escape(newStatus)}</span>
        </td>
      </tr>
    </table>

    <p style=""margin:20px 0 0;font-size:14px;color:{TextMuted};line-height:1.6;"">
      Вы можете отслеживать статус вашего заказа в <a href=""https://goldpc.by/orders"" style=""color:{Gold};text-decoration:none;"">Личном кабинете</a>.
    </p>
  </td></tr>

  <!-- Футер -->
  <tr><td style=""background-color:{DarkBg};padding:20px 32px;border-top:1px solid {Border};text-align:center;"">
    <p style=""margin:0;font-size:12px;color:{TextMuted};line-height:1.6;"">
      Это автоматическое письмо от магазина <a href=""https://goldpc.by"" style=""color:{Gold};text-decoration:none;"">GoldPC</a>.<br/>
      Пожалуйста, не отвечайте на него.
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>";

        await QueueEmailAsync(order.CustomerEmail, subject, body);
    }

    /// <inheritdoc/>
    public async Task SendWarrantyCreatedAsync(WarrantyDto card, string userEmail)
    {
        if (string.IsNullOrWhiteSpace(userEmail))
        {
            _logger.LogWarning("Не удалось отправить уведомление о гарантии {WarrantyNumber}: email пуст", card.WarrantyNumber);
            return;
        }

        var subject = $"Гарантийный талон #{card.WarrantyNumber} оформлен — GoldPC";

        var body = $@"
<!DOCTYPE html>
<html lang=""ru"">
<head><meta charset=""utf-8""><meta name=""viewport"" content=""width=device-width, initial-scale=1.0""></head>
<body style=""margin:0;padding:0;background-color:{DarkBg};font-family:'Segoe UI',Arial,sans-serif;color:{TextPrimary};"">
<table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:{DarkBg};padding:32px 16px;"">
<tr><td align=""center"">
<table width=""600"" cellpadding=""0"" cellspacing=""0"" style=""background-color:{DarkSurface};border-radius:12px;border:1px solid {Border};overflow:hidden;"">
  <!-- Заголовок -->
  <tr><td style=""background:linear-gradient(135deg,{Gold},{GoldDark});padding:28px 32px;text-align:center;"">
    <h1 style=""margin:0;font-size:24px;color:{DarkBg};font-weight:700;"">🛡️ Гарантийный талон</h1>
    <p style=""margin:6px 0 0;font-size:14px;color:{DarkBg};opacity:0.8;"">{Escape(card.WarrantyNumber)}</p>
  </td></tr>

  <!-- Контент -->
  <tr><td style=""padding:28px 32px;"">
    <p style=""margin:0;font-size:15px;color:{TextMuted};line-height:1.6;"">
      На ваш товар оформлен гарантийный талон. Сохраните этот номер для обращения по гарантии.
    </p>

    <!-- Детали гарантии -->
    <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""margin-top:20px;background-color:{DarkBg};border-radius:8px;border:1px solid {Border};"">
      <tr><td style=""padding:16px 20px;border-bottom:1px solid {Border};"">
        <h2 style=""margin:0;font-size:14px;color:{Gold};text-transform:uppercase;letter-spacing:1px;"">Детали гарантии</h2>
      </td></tr>
      <tr><td style=""padding:12px 20px;"">
        <table width=""100%"" cellpadding=""0"" cellspacing=""0"">
          <tr>
            <td style=""padding:8px 0;font-size:14px;color:{TextMuted};width:40%;"">Номер талона</td>
            <td style=""padding:8px 0;font-size:14px;color:{Gold};font-weight:600;text-align:right;"" align=""right"">{Escape(card.WarrantyNumber)}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-size:14px;color:{TextMuted};"">Товар</td>
            <td style=""padding:8px 0;font-size:14px;color:{TextPrimary};text-align:right;"" align=""right"">{Escape(card.ProductName)}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-size:14px;color:{TextMuted};"">Начало гарантии</td>
            <td style=""padding:8px 0;font-size:14px;color:{TextPrimary};text-align:right;"" align=""right"">{card.StartDate:dd.MM.yyyy}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-size:14px;color:{TextMuted};"">Окончание гарантии</td>
            <td style=""padding:8px 0;font-size:14px;color:{TextPrimary};text-align:right;"" align=""right"">{card.EndDate:dd.MM.yyyy}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-size:14px;color:{TextMuted};"">Срок действия</td>
            <td style=""padding:8px 0;font-size:14px;color:{TextPrimary};text-align:right;"" align=""right"">{card.WarrantyMonths} мес.</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style=""margin:20px 0 0;font-size:14px;color:{TextMuted};line-height:1.6;"">
      По вопросам обращения по гарантии свяжитесь с нами: <a href=""mailto:support@goldpc.by"" style=""color:{Gold};text-decoration:none;"">support@goldpc.by</a>
    </p>
  </td></tr>

  <!-- Футер -->
  <tr><td style=""background-color:{DarkBg};padding:20px 32px;border-top:1px solid {Border};text-align:center;"">
    <p style=""margin:0;font-size:12px;color:{TextMuted};line-height:1.6;"">
      Это автоматическое письмо от магазина <a href=""https://goldpc.by"" style=""color:{Gold};text-decoration:none;"">GoldPC</a>.<br/>
      Пожалуйста, не отвечайте на него.
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>";

        await QueueEmailAsync(userEmail, subject, body);
    }

    /// <inheritdoc/>
    public async Task SendWarrantyExpiryReminderAsync(WarrantyDto card, string userEmail)
    {
        if (string.IsNullOrWhiteSpace(userEmail))
        {
            _logger.LogWarning("Не удалось отправить напоминание о гарантии {WarrantyNumber}: email пуст", card.WarrantyNumber);
            return;
        }

        var daysLeft = (card.EndDate.ToDateTime(TimeOnly.MinValue) - DateOnly.FromDateTime(DateTime.UtcNow).ToDateTime(TimeOnly.MinValue)).Days;
        var subject = $"⚠️ Гарантия на «{card.ProductName}» истекает через {daysLeft} дн. — GoldPC";

        var body = $@"
<!DOCTYPE html>
<html lang=""ru"">
<head><meta charset=""utf-8""><meta name=""viewport"" content=""width=device-width, initial-scale=1.0""></head>
<body style=""margin:0;padding:0;background-color:{DarkBg};font-family:'Segoe UI',Arial,sans-serif;color:{TextPrimary};"">
<table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:{DarkBg};padding:32px 16px;"">
<tr><td align=""center"">
<table width=""600"" cellpadding=""0"" cellspacing=""0"" style=""background-color:{DarkSurface};border-radius:12px;border:1px solid {Border};overflow:hidden;"">
  <!-- Заголовок -->
  <tr><td style=""background:linear-gradient(135deg,#f0b90b,#e67e22);padding:28px 32px;text-align:center;"">
    <h1 style=""margin:0;font-size:24px;color:{DarkBg};font-weight:700;"">⚠️ Гарантия истекает</h1>
    <p style=""margin:6px 0 0;font-size:14px;color:{DarkBg};opacity:0.8;"">Осталось {daysLeft} дн.</p>
  </td></tr>

  <!-- Контент -->
  <tr><td style=""padding:28px 32px;"">
    <p style=""margin:0;font-size:15px;color:{TextMuted};line-height:1.6;"">
      Срок действия гарантии на ваш товар приближается к завершению. Рекомендуем проверить работоспособность оборудования.
    </p>

    <!-- Инфобокс -->
    <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""margin-top:20px;background-color:{DarkBg};border-radius:8px;border:1px solid {Border};overflow:hidden;"">
      <tr><td style=""padding:20px;"">
        <table width=""100%"" cellpadding=""0"" cellspacing=""0"">
          <tr>
            <td style=""padding:8px 0;font-size:14px;color:{TextMuted};width:40%;"">Товар</td>
            <td style=""padding:8px 0;font-size:14px;color:{TextPrimary};font-weight:600;text-align:right;"" align=""right"">{Escape(card.ProductName)}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-size:14px;color:{TextMuted};"">Номер талона</td>
            <td style=""padding:8px 0;font-size:14px;color:{Gold};text-align:right;"" align=""right"">{Escape(card.WarrantyNumber)}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-size:14px;color:{TextMuted};"">Дата окончания</td>
            <td style=""padding:8px 0;font-size:14px;color:{Red};font-weight:600;text-align:right;"" align=""right"">{card.EndDate:dd.MM.yyyy}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-size:14px;color:{TextMuted};"">Осталось дней</td>
            <td style=""padding:8px 0;font-size:14px;color:{Red};font-weight:700;text-align:right;"" align=""right"">{daysLeft}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style=""margin:20px 0 0;font-size:14px;color:{TextMuted};line-height:1.6;"">
      Если вы обнаружили неисправность, обратитесь в сервисный центр: <a href=""https://goldpc.by/service-request"" style=""color:{Gold};text-decoration:none;"">Оставить заявку</a>
    </p>
  </td></tr>

  <!-- Футер -->
  <tr><td style=""background-color:{DarkBg};padding:20px 32px;border-top:1px solid {Border};text-align:center;"">
    <p style=""margin:0;font-size:12px;color:{TextMuted};line-height:1.6;"">
      Это автоматическое письмо от магазина <a href=""https://goldpc.by"" style=""color:{Gold};text-decoration:none;"">GoldPC</a>.<br/>
      Пожалуйста, не отвечайте на него.
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>";

        await QueueEmailAsync(userEmail, subject, body);
    }

    /// <inheritdoc/>
    public async Task SendServiceAssignedAsync(ServiceRequestDto service, string masterName, string clientEmail)
    {
        if (string.IsNullOrWhiteSpace(clientEmail))
        {
            _logger.LogWarning("Не удалось отправить уведомление о назначении мастера для заявки {RequestNumber}: email клиента пуст", service.RequestNumber);
            return;
        }

        var subject = $"Заявка #{service.RequestNumber}: назначен мастер — {masterName}";

        var body = $@"
<!DOCTYPE html>
<html lang=""ru"">
<head><meta charset=""utf-8""><meta name=""viewport"" content=""width=device-width, initial-scale=1.0""></head>
<body style=""margin:0;padding:0;background-color:{DarkBg};font-family:'Segoe UI',Arial,sans-serif;color:{TextPrimary};"">
<table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:{DarkBg};padding:32px 16px;"">
<tr><td align=""center"">
<table width=""600"" cellpadding=""0"" cellspacing=""0"" style=""background-color:{DarkSurface};border-radius:12px;border:1px solid {Border};overflow:hidden;"">
  <!-- Заголовок -->
  <tr><td style=""background:linear-gradient(135deg,{Gold},{GoldDark});padding:28px 32px;text-align:center;"">
    <h1 style=""margin:0;font-size:24px;color:{DarkBg};font-weight:700;"">🔧 Заявка #{service.RequestNumber}</h1>
    <p style=""margin:6px 0 0;font-size:14px;color:{DarkBg};opacity:0.8;"">Назначен мастер</p>
  </td></tr>

  <!-- Контент -->
  <tr><td style=""padding:28px 32px;"">
    <p style=""margin:0;font-size:15px;color:{TextMuted};line-height:1.6;"">
      На вашу заявку в сервисный центр назначен мастер. Ниже приведены детали.
    </p>

    <!-- Детали заявки -->
    <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""margin-top:20px;background-color:{DarkBg};border-radius:8px;border:1px solid {Border};overflow:hidden;"">
      <tr><td style=""padding:16px 20px;border-bottom:1px solid {Border};"">
        <h2 style=""margin:0;font-size:14px;color:{Gold};text-transform:uppercase;letter-spacing:1px;"">Детали заявки</h2>
      </td></tr>
      <tr><td style=""padding:12px 20px;"">
        <table width=""100%"" cellpadding=""0"" cellspacing=""0"">
          <tr>
            <td style=""padding:8px 0;font-size:14px;color:{TextMuted};width:40%;"">Номер заявки</td>
            <td style=""padding:8px 0;font-size:14px;color:{Gold};font-weight:600;text-align:right;"" align=""right"">{Escape(service.RequestNumber)}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-size:14px;color:{TextMuted};"">Услуга</td>
            <td style=""padding:8px 0;font-size:14px;color:{TextPrimary};text-align:right;"" align=""right"">{Escape(service.ServiceTypeName)}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-size:14px;color:{TextMuted};"">Назначен мастер</td>
            <td style=""padding:8px 0;font-size:14px;color:{Green};font-weight:700;text-align:right;"" align=""right"">👤 {Escape(masterName)}</td>
          </tr>
          {(string.IsNullOrEmpty(service.DeviceModel) ? "" : $@"<tr>
            <td style=""padding:8px 0;font-size:14px;color:{TextMuted};"">Устройство</td>
            <td style=""padding:8px 0;font-size:14px;color:{TextPrimary};text-align:right;"" align=""right"">{Escape(service.DeviceModel)}</td>
          </tr>")}
          <tr>
            <td style=""padding:8px 0;font-size:14px;color:{TextMuted};"">Описание</td>
            <td style=""padding:8px 0;font-size:14px;color:{TextPrimary};text-align:right;"" align=""right"">{Escape(service.Description)}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-size:14px;color:{TextMuted};"">Примерная стоимость</td>
            <td style=""padding:8px 0;font-size:14px;color:{TextPrimary};font-weight:600;text-align:right;"" align=""right"">{service.EstimatedCost:N2} BYN</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style=""margin:20px 0 0;font-size:14px;color:{TextMuted};line-height:1.6;"">
      Мастер свяжется с вами для уточнения деталей. Вы также можете отслеживать статус заявки в <a href=""https://goldpc.by/my-repairs"" style=""color:{Gold};text-decoration:none;"">Личном кабинете</a>.
    </p>
  </td></tr>

  <!-- Футер -->
  <tr><td style=""background-color:{DarkBg};padding:20px 32px;border-top:1px solid {Border};text-align:center;"">
    <p style=""margin:0;font-size:12px;color:{TextMuted};line-height:1.6;"">
      Это автоматическое письмо от магазина <a href=""https://goldpc.by"" style=""color:{Gold};text-decoration:none;"">GoldPC</a>.<br/>
      Пожалуйста, не отвечайте на него.
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>";

        await QueueEmailAsync(clientEmail, subject, body);
    }

    // === Вспомогательные методы ===

    /// <summary>Построить HTML-таблицу товаров заказа</summary>
    private static string BuildOrderItemsHtml(ICollection<OrderItemDto> items)
    {
        if (items.Count == 0)
            return "<p style=\"padding:12px 0;font-size:14px;color:#848e9c;\">Нет товаров</p>";

        var rows = string.Empty;
        foreach (var item in items)
        {
            rows += $@"
          <tr>
            <td style=""padding:10px 0;font-size:14px;color:{TextPrimary};border-bottom:1px solid {Border};"">
              {Escape(item.ProductName)}<br/>
              <span style=""font-size:12px;color:{TextMuted};"">× {item.Quantity} по {item.UnitPrice:N2} BYN</span>
            </td>
            <td style=""padding:10px 0;font-size:14px;color:{Gold};font-weight:600;text-align:right;border-bottom:1px solid {Border};"" align=""right"">{item.TotalPrice:N2} BYN</td>
          </tr>";
        }

        return $"<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">{rows}</table>";
    }

    /// <summary>Экранирование HTML-символов</summary>
    private static string Escape(string? text)
    {
        if (string.IsNullOrEmpty(text)) return string.Empty;
        return text
            .Replace("&", "&amp;")
            .Replace("<", "&lt;")
            .Replace(">", "&gt;")
            .Replace("\"", "&quot;");
    }

    /// <summary>Поставить email в очередь на отправку (fire-and-forget)</summary>
    private async Task QueueEmailAsync(string recipientEmail, string subject, string body)
    {
        try
        {
            await _emailQueue.QueueEmailAsync(new EmailJob(recipientEmail, subject, body, IsHtml: true));
            _logger.LogInformation("Email поставлен в очередь: Кому={Email}, Тема={Subject}", recipientEmail, subject);
        }
        catch (Exception ex)
        {
            // Fire-and-forget: ошибка очереди не должна крашить API
            _logger.LogError(ex, "Не удалось поставить email в очередь: Кому={Email}, Тема={Subject}", recipientEmail, subject);
        }
    }
}
#pragma warning restore CA1031, CS1591, SA1600
