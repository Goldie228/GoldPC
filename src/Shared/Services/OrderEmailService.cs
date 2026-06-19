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
<html lang=""ru"" xmlns=""http://www.w3.org/1999/xhtml"" xmlns:v=""urn:schemas-microsoft-com:vml"" xmlns:o=""urn:schemas-microsoft-com:office:office"">
<head>
<meta charset=""utf-8"">
<meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
<meta http-equiv=""X-UA-Compatible"" content=""IE=edge"">
<meta name=""x-apple-disable-message-reformatting"">
<title>Подтверждение заказа #{order.OrderNumber}</title>
<!--[if mso]>
<noscript><xml>
<o:OfficeDocumentSettings>
<o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml></noscript>
<![endif]-->
<style>
@media only screen and (max-width:620px){{
  .email-container{{width:100%!important;max-width:100%!important;}}
  .fluid{{max-width:100%!important;height:auto!important;}}
  .stack-column,.stack-column-center{{display:block!important;width:100%!important;max-width:100%!important;direction:ltr!important;}}
  .mobile-padding{{padding-left:16px!important;padding-right:16px!important;}}
  .mobile-center{{text-align:center!important;}}
  .mobile-hide{{display:none!important;}}
}}
</style>
</head>
<body style=""margin:0;padding:0;word-spacing:normal;background-color:{DarkBg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;"">
<div style=""display:none;font-size:1px;color:{DarkBg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;"">
  Заказ #{order.OrderNumber} подтверждён &mdash; GoldPC
</div>
<table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""background-color:{DarkBg};margin:0;padding:0;"">
<tr><td align=""center"" style=""padding:32px 8px;"">
<!--[if mso]><table role=""presentation"" width=""600"" cellpadding=""0"" cellspacing=""0"" border=""0"" align=""center""><tr><td><![endif]-->
<table role=""presentation"" class=""email-container"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""max-width:600px;margin:0 auto;background-color:{DarkSurface};border-radius:8px;overflow:hidden;"">

  <!-- HEADER -->
  <tr><td style=""background-color:{Gold};padding:28px 32px 24px;text-align:center;"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr>
      <td style=""font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;color:{DarkBg};text-align:center;letter-spacing:0.5px;"">GoldPC</td>
    </tr>
    </table>
  </td></tr>

  <!-- TITLE BAR -->
  <tr><td style=""background-color:{DarkSurface};padding:24px 32px 20px;border-bottom:1px solid {Border};"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr>
      <td style=""font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:{TextPrimary};"">Заказ #{order.OrderNumber}</td>
    </tr>
    <tr>
      <td style=""font-family:Arial,Helvetica,sans-serif;font-size:13px;color:{TextMuted};padding-top:4px;"">Подтверждение заказа</td>
    </tr>
    </table>
  </td></tr>

  <!-- GREETING -->
  <tr><td style=""padding:28px 32px 16px;"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:16px;color:{TextPrimary};line-height:1.5;"">
      Здравствуйте, {Escape(order.CustomerFirstName)}!
    </td></tr>
    <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};line-height:1.6;padding-top:12px;"">
      Ваш заказ успешно создан и ожидает обработки. Ниже приведены детали вашего заказа.
    </td></tr>
    </table>
  </td></tr>

  <!-- ITEMS TABLE -->
  <tr><td style=""padding:0 32px 20px;"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""background-color:{DarkBg};border-radius:6px;border:1px solid {Border};"">
      <tr><td style=""padding:14px 20px;border-bottom:1px solid {Border};"">
        <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
        <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:{Gold};text-transform:uppercase;letter-spacing:1.2px;"">Состав заказа</td></tr>
        </table>
      </td></tr>
      <tr><td style=""padding:4px 20px 12px;"">
        {itemsHtml}
      </td></tr>
    </table>
  </td></tr>

  <!-- TOTALS -->
  <tr><td style=""padding:0 32px 20px;"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
      <tr>
        <td style=""padding:10px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};border-top:1px solid {Border};"">Товары ({order.Items.Count} поз.)</td>
        <td style=""padding:10px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextPrimary};border-top:1px solid {Border};text-align:right;"">{order.Subtotal:N2} BYN</td>
      </tr>
      <tr>
        <td style=""padding:10px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};"">Доставка</td>
        <td style=""padding:10px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextPrimary};text-align:right;"">{order.DeliveryCost:N2} BYN</td>
      </tr>
      <tr>
        <td style=""padding:14px 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:{Gold};border-top:2px solid {Gold};"">Итого</td>
        <td style=""padding:14px 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:{Gold};border-top:2px solid {Gold};text-align:right;"">{order.Total:N2} BYN</td>
      </tr>
    </table>
  </td></tr>

  <!-- CTA BUTTON -->
  <tr><td style=""padding:0 32px 24px;text-align:center;"" class=""mobile-padding"">
    <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""margin:0 auto;"">
    <tr><td>
      <!--[if mso]><v:roundrect xmlns:v=""urn:schemas-microsoft-com:vml"" xmlns:w=""urn:schemas-microsoft-com:office:word"" href=""https://goldpc.by/orders"" style=""height:48px;v-text-anchor:middle;width:240px;"" arcsize=""13%"" strokecolor=""{Gold}"" fillcolor=""{Gold}""><w:anchorlock/><center style=""color:{DarkBg};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;"">Мой заказ</center></v:roundrect><![endif]-->
      <!--[if !mso]><!-->
      <a href=""https://goldpc.by/orders"" target=""_blank"" style=""display:inline-block;background-color:{Gold};color:{DarkBg};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-decoration:none;text-align:center;padding:14px 40px;border-radius:6px;border:1px solid {Gold};-webkit-text-size-adjust:none;mso-hide:all;"">Мой заказ</a>
      <!--<![endif]-->
    </td></tr>
    </table>
  </td></tr>

  <!-- DELIVERY INFO -->
  <tr><td style=""padding:0 32px 24px;"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""background-color:{DarkBg};border-radius:6px;border:1px solid {Border};"">
      <tr><td style=""padding:14px 20px;border-bottom:1px solid {Border};"">
        <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
        <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:{Gold};text-transform:uppercase;letter-spacing:1.2px;"">Информация о доставке</td></tr>
        </table>
      </td></tr>
      <tr><td style=""padding:14px 20px;"">
        <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
        <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};line-height:2;"">
          Способ доставки: <strong style=""color:{TextPrimary}"">{Escape(order.DeliveryMethod)}</strong><br>
          Способ оплаты: <strong style=""color:{TextPrimary}"">{Escape(order.PaymentMethod)}</strong><br>
          {(string.IsNullOrEmpty(order.Address) ? "" : $"Адрес: <strong style=\"color:{TextPrimary}\">{Escape(order.Address)}</strong><br>")}
          Дата создания: <strong style=""color:{TextPrimary}"">{order.CreatedAt:dd.MM.yyyy HH:mm}</strong>
        </td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style=""background-color:{DarkBg};border-top:1px solid {Border};padding:24px 32px;text-align:center;"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:12px;color:{TextMuted};line-height:1.7;"">
      Это автоматическое письмо от магазина <a href=""https://goldpc.by"" style=""color:{Gold};text-decoration:none;"">GoldPC</a>.<br>
      Пожалуйста, не отвечайте на него.<br>
      <a href=""https://goldpc.by/unsubscribe"" style=""color:{TextMuted};text-decoration:underline;"">Отписаться от уведомлений</a>
    </td></tr>
    </table>
  </td></tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->
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
<html lang=""ru"" xmlns=""http://www.w3.org/1999/xhtml"" xmlns:v=""urn:schemas-microsoft-com:vml"" xmlns:o=""urn:schemas-microsoft-com:office:office"">
<head>
<meta charset=""utf-8"">
<meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
<meta http-equiv=""X-UA-Compatible"" content=""IE=edge"">
<meta name=""x-apple-disable-message-reformatting"">
<title>Заказ #{order.OrderNumber}: статус изменён</title>
<!--[if mso]>
<noscript><xml>
<o:OfficeDocumentSettings>
<o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml></noscript>
<![endif]-->
<style>
@media only screen and (max-width:620px){{
  .email-container{{width:100%!important;max-width:100%!important;}}
  .fluid{{max-width:100%!important;height:auto!important;}}
  .stack-column,.stack-column-center{{display:block!important;width:100%!important;max-width:100%!important;direction:ltr!important;}}
  .mobile-padding{{padding-left:16px!important;padding-right:16px!important;}}
  .mobile-center{{text-align:center!important;}}
  .mobile-hide{{display:none!important;}}
}}
</style>
</head>
<body style=""margin:0;padding:0;word-spacing:normal;background-color:{DarkBg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;"">
<div style=""display:none;font-size:1px;color:{DarkBg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;"">
  Заказ #{order.OrderNumber}: статус изменён &mdash; GoldPC
</div>
<table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""background-color:{DarkBg};margin:0;padding:0;"">
<tr><td align=""center"" style=""padding:32px 8px;"">
<!--[if mso]><table role=""presentation"" width=""600"" cellpadding=""0"" cellspacing=""0"" border=""0"" align=""center""><tr><td><![endif]-->
<table role=""presentation"" class=""email-container"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""max-width:600px;margin:0 auto;background-color:{DarkSurface};border-radius:8px;overflow:hidden;"">

  <!-- HEADER -->
  <tr><td style=""background-color:{Gold};padding:28px 32px 24px;text-align:center;"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr>
      <td style=""font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;color:{DarkBg};text-align:center;letter-spacing:0.5px;"">GoldPC</td>
    </tr>
    </table>
  </td></tr>

  <!-- TITLE BAR -->
  <tr><td style=""background-color:{DarkSurface};padding:24px 32px 20px;border-bottom:1px solid {Border};"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr>
      <td style=""font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:{TextPrimary};"">Заказ #{order.OrderNumber}</td>
    </tr>
    <tr>
      <td style=""font-family:Arial,Helvetica,sans-serif;font-size:13px;color:{TextMuted};padding-top:4px;"">Статус обновлён</td>
    </tr>
    </table>
  </td></tr>

  <!-- GREETING -->
  <tr><td style=""padding:28px 32px 16px;"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:16px;color:{TextPrimary};line-height:1.5;"">
      Здравствуйте, {Escape(order.CustomerFirstName)}!
    </td></tr>
    <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};line-height:1.6;padding-top:12px;"">
      Статус вашего заказа <strong style=""color:{Gold}"">#{order.OrderNumber}</strong> был изменён.
    </td></tr>
    </table>
  </td></tr>

  <!-- STATUS CHANGE -->
  <tr><td style=""padding:0 32px 20px;"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""background-color:{DarkBg};border-radius:6px;border:1px solid {Border};"">
      <tr>
        <td style=""padding:16px 20px;border-right:1px solid {Border};width:45%;vertical-align:top;"">
          <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
          <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:11px;color:{TextMuted};text-transform:uppercase;letter-spacing:0.5px;padding-bottom:6px;"">Было</td></tr>
          <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:15px;color:{TextPrimary};font-weight:600;"">{Escape(oldStatus)}</td></tr>
          </table>
        </td>
        <td style=""padding:16px 10px;text-align:center;width:10%;vertical-align:middle;"">
          <span style=""font-family:Arial,Helvetica,sans-serif;font-size:20px;color:{Gold};"">&rarr;</span>
        </td>
        <td style=""padding:16px 20px;border-left:1px solid {Border};width:45%;vertical-align:top;"">
          <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
          <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:11px;color:{TextMuted};text-transform:uppercase;letter-spacing:0.5px;padding-bottom:6px;"">Стало</td></tr>
          <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:15px;color:{Green};font-weight:600;"">{Escape(newStatus)}</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- CTA BUTTON -->
  <tr><td style=""padding:0 32px 24px;text-align:center;"" class=""mobile-padding"">
    <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""margin:0 auto;"">
    <tr><td>
      <!--[if mso]><v:roundrect xmlns:v=""urn:schemas-microsoft-com:vml"" xmlns:w=""urn:schemas-microsoft-com:office:word"" href=""https://goldpc.by/orders"" style=""height:48px;v-text-anchor:middle;width:240px;"" arcsize=""13%"" strokecolor=""{Gold}"" fillcolor=""{Gold}""><w:anchorlock/><center style=""color:{DarkBg};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;"">Мой заказ</center></v:roundrect><![endif]-->
      <!--[if !mso]><!-->
      <a href=""https://goldpc.by/orders"" target=""_blank"" style=""display:inline-block;background-color:{Gold};color:{DarkBg};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-decoration:none;text-align:center;padding:14px 40px;border-radius:6px;border:1px solid {Gold};-webkit-text-size-adjust:none;mso-hide:all;"">Мой заказ</a>
      <!--<![endif]-->
    </td></tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style=""background-color:{DarkBg};border-top:1px solid {Border};padding:24px 32px;text-align:center;"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:12px;color:{TextMuted};line-height:1.7;"">
      Это автоматическое письмо от магазина <a href=""https://goldpc.by"" style=""color:{Gold};text-decoration:none;"">GoldPC</a>.<br>
      Пожалуйста, не отвечайте на него.<br>
      <a href=""https://goldpc.by/unsubscribe"" style=""color:{TextMuted};text-decoration:underline;"">Отписаться от уведомлений</a>
    </td></tr>
    </table>
  </td></tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->
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
<html lang=""ru"" xmlns=""http://www.w3.org/1999/xhtml"" xmlns:v=""urn:schemas-microsoft-com:vml"" xmlns:o=""urn:schemas-microsoft-com:office:office"">
<head>
<meta charset=""utf-8"">
<meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
<meta http-equiv=""X-UA-Compatible"" content=""IE=edge"">
<meta name=""x-apple-disable-message-reformatting"">
<title>Гарантийный талон #{card.WarrantyNumber}</title>
<!--[if mso]>
<noscript><xml>
<o:OfficeDocumentSettings>
<o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml></noscript>
<![endif]-->
<style>
@media only screen and (max-width:620px){{
  .email-container{{width:100%!important;max-width:100%!important;}}
  .fluid{{max-width:100%!important;height:auto!important;}}
  .stack-column,.stack-column-center{{display:block!important;width:100%!important;max-width:100%!important;direction:ltr!important;}}
  .mobile-padding{{padding-left:16px!important;padding-right:16px!important;}}
  .mobile-center{{text-align:center!important;}}
  .mobile-hide{{display:none!important;}}
}}
</style>
</head>
<body style=""margin:0;padding:0;word-spacing:normal;background-color:{DarkBg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;"">
<div style=""display:none;font-size:1px;color:{DarkBg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;"">
  Гарантийный талон #{card.WarrantyNumber} оформлен &mdash; GoldPC
</div>
<table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""background-color:{DarkBg};margin:0;padding:0;"">
<tr><td align=""center"" style=""padding:32px 8px;"">
<!--[if mso]><table role=""presentation"" width=""600"" cellpadding=""0"" cellspacing=""0"" border=""0"" align=""center""><tr><td><![endif]-->
<table role=""presentation"" class=""email-container"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""max-width:600px;margin:0 auto;background-color:{DarkSurface};border-radius:8px;overflow:hidden;"">

  <!-- HEADER -->
  <tr><td style=""background-color:{Gold};padding:28px 32px 24px;text-align:center;"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr>
      <td style=""font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;color:{DarkBg};text-align:center;letter-spacing:0.5px;"">GoldPC</td>
    </tr>
    </table>
  </td></tr>

  <!-- TITLE BAR -->
  <tr><td style=""background-color:{DarkSurface};padding:24px 32px 20px;border-bottom:1px solid {Border};"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr>
      <td style=""font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:{TextPrimary};"">Гарантийный талон</td>
    </tr>
    <tr>
      <td style=""font-family:Arial,Helvetica,sans-serif;font-size:13px;color:{Gold};padding-top:4px;font-weight:600;"">{Escape(card.WarrantyNumber)}</td>
    </tr>
    </table>
  </td></tr>

  <!-- GREETING -->
  <tr><td style=""padding:28px 32px 16px;"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};line-height:1.6;"">
      На ваш товар оформлен гарантийный талон. Сохраните этот номер для обращения по гарантии.
    </td></tr>
    </table>
  </td></tr>

  <!-- WARRANTY DETAILS -->
  <tr><td style=""padding:0 32px 20px;"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""background-color:{DarkBg};border-radius:6px;border:1px solid {Border};"">
      <tr><td style=""padding:14px 20px;border-bottom:1px solid {Border};"">
        <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
        <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:{Gold};text-transform:uppercase;letter-spacing:1.2px;"">Детали гарантии</td></tr>
        </table>
      </td></tr>
      <tr><td style=""padding:4px 20px 12px;"">
        <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
          <tr>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};width:40%;"">Номер талона</td>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{Gold};font-weight:600;text-align:right;"" align=""right"">{Escape(card.WarrantyNumber)}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};"">Товар</td>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextPrimary};text-align:right;"" align=""right"">{Escape(card.ProductName)}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};"">Начало гарантии</td>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextPrimary};text-align:right;"" align=""right"">{card.StartDate:dd.MM.yyyy}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};"">Окончание гарантии</td>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextPrimary};text-align:right;"" align=""right"">{card.EndDate:dd.MM.yyyy}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};"">Срок действия</td>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextPrimary};text-align:right;"" align=""right"">{card.WarrantyMonths} мес.</td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  <!-- CTA BUTTON -->
  <tr><td style=""padding:0 32px 24px;"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""background-color:{DarkBg};border-radius:6px;border:1px solid {Border};"">
      <tr><td style=""padding:16px 20px;"">
        <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
        <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};line-height:1.6;"">
          По вопросам обращения по гарантии свяжитесь с нами: <a href=""mailto:support@goldpc.by"" style=""color:{Gold};text-decoration:none;"">support@goldpc.by</a>
        </td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style=""background-color:{DarkBg};border-top:1px solid {Border};padding:24px 32px;text-align:center;"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:12px;color:{TextMuted};line-height:1.7;"">
      Это автоматическое письмо от магазина <a href=""https://goldpc.by"" style=""color:{Gold};text-decoration:none;"">GoldPC</a>.<br>
      Пожалуйста, не отвечайте на него.<br>
      <a href=""https://goldpc.by/unsubscribe"" style=""color:{TextMuted};text-decoration:underline;"">Отписаться от уведомлений</a>
    </td></tr>
    </table>
  </td></tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->
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
<html lang=""ru"" xmlns=""http://www.w3.org/1999/xhtml"" xmlns:v=""urn:schemas-microsoft-com:vml"" xmlns:o=""urn:schemas-microsoft-com:office:office"">
<head>
<meta charset=""utf-8"">
<meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
<meta http-equiv=""X-UA-Compatible"" content=""IE=edge"">
<meta name=""x-apple-disable-message-reformatting"">
<title>Гарантия на {Escape(card.ProductName)} истекает</title>
<!--[if mso]>
<noscript><xml>
<o:OfficeDocumentSettings>
<o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml></noscript>
<![endif]-->
<style>
@media only screen and (max-width:620px){{
  .email-container{{width:100%!important;max-width:100%!important;}}
  .fluid{{max-width:100%!important;height:auto!important;}}
  .stack-column,.stack-column-center{{display:block!important;width:100%!important;max-width:100%!important;direction:ltr!important;}}
  .mobile-padding{{padding-left:16px!important;padding-right:16px!important;}}
  .mobile-center{{text-align:center!important;}}
  .mobile-hide{{display:none!important;}}
}}
</style>
</head>
<body style=""margin:0;padding:0;word-spacing:normal;background-color:{DarkBg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;"">
<div style=""display:none;font-size:1px;color:{DarkBg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;"">
  Гарантия на {Escape(card.ProductName)} истекает через {daysLeft} дн. &mdash; GoldPC
</div>
<table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""background-color:{DarkBg};margin:0;padding:0;"">
<tr><td align=""center"" style=""padding:32px 8px;"">
<!--[if mso]><table role=""presentation"" width=""600"" cellpadding=""0"" cellspacing=""0"" border=""0"" align=""center""><tr><td><![endif]-->
<table role=""presentation"" class=""email-container"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""max-width:600px;margin:0 auto;background-color:{DarkSurface};border-radius:8px;overflow:hidden;"">

  <!-- HEADER -->
  <tr><td style=""background-color:{Red};padding:28px 32px 24px;text-align:center;"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr>
      <td style=""font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;color:#ffffff;text-align:center;letter-spacing:0.5px;"">GoldPC</td>
    </tr>
    </table>
  </td></tr>

  <!-- TITLE BAR -->
  <tr><td style=""background-color:{DarkSurface};padding:24px 32px 20px;border-bottom:1px solid {Border};"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr>
      <td style=""font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:{Red};"">Гарантия истекает</td>
    </tr>
    <tr>
      <td style=""font-family:Arial,Helvetica,sans-serif;font-size:13px;color:{TextMuted};padding-top:4px;"">Осталось {daysLeft} дн.</td>
    </tr>
    </table>
  </td></tr>

  <!-- GREETING -->
  <tr><td style=""padding:28px 32px 16px;"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};line-height:1.6;"">
      Срок действия гарантии на ваш товар приближается к завершению. Рекомендуем проверить работоспособность оборудования.
    </td></tr>
    </table>
  </td></tr>

  <!-- WARRANTY DETAILS -->
  <tr><td style=""padding:0 32px 20px;"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""background-color:{DarkBg};border-radius:6px;border:1px solid {Border};"">
      <tr><td style=""padding:14px 20px;border-bottom:1px solid {Border};"">
        <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
        <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:{Gold};text-transform:uppercase;letter-spacing:1.2px;"">Детали гарантии</td></tr>
        </table>
      </td></tr>
      <tr><td style=""padding:4px 20px 12px;"">
        <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
          <tr>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};width:40%;"">Товар</td>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextPrimary};font-weight:600;text-align:right;"" align=""right"">{Escape(card.ProductName)}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};"">Номер талона</td>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{Gold};text-align:right;"" align=""right"">{Escape(card.WarrantyNumber)}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};"">Дата окончания</td>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{Red};font-weight:600;text-align:right;"" align=""right"">{card.EndDate:dd.MM.yyyy}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};"">Осталось дней</td>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{Red};font-weight:700;text-align:right;"" align=""right"">{daysLeft}</td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  <!-- CTA BUTTON -->
  <tr><td style=""padding:0 32px 24px;text-align:center;"" class=""mobile-padding"">
    <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""margin:0 auto;"">
    <tr><td>
      <!--[if mso]><v:roundrect xmlns:v=""urn:schemas-microsoft-com:vml"" xmlns:w=""urn:schemas-microsoft-com:office:word"" href=""https://goldpc.by/service-request"" style=""height:48px;v-text-anchor:middle;width:280px;"" arcsize=""13%"" strokecolor=""{Gold}"" fillcolor=""{Gold}""><w:anchorlock/><center style=""color:{DarkBg};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;"">Оставить заявку</center></v:roundrect><![endif]-->
      <!--[if !mso]><!-->
      <a href=""https://goldpc.by/service-request"" target=""_blank"" style=""display:inline-block;background-color:{Gold};color:{DarkBg};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-decoration:none;text-align:center;padding:14px 40px;border-radius:6px;border:1px solid {Gold};-webkit-text-size-adjust:none;mso-hide:all;"">Оставить заявку</a>
      <!--<![endif]-->
    </td></tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style=""background-color:{DarkBg};border-top:1px solid {Border};padding:24px 32px;text-align:center;"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:12px;color:{TextMuted};line-height:1.7;"">
      Это автоматическое письмо от магазина <a href=""https://goldpc.by"" style=""color:{Gold};text-decoration:none;"">GoldPC</a>.<br>
      Пожалуйста, не отвечайте на него.<br>
      <a href=""https://goldpc.by/unsubscribe"" style=""color:{TextMuted};text-decoration:underline;"">Отписаться от уведомлений</a>
    </td></tr>
    </table>
  </td></tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->
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
<html lang=""ru"" xmlns=""http://www.w3.org/1999/xhtml"" xmlns:v=""urn:schemas-microsoft-com:vml"" xmlns:o=""urn:schemas-microsoft-com:office:office"">
<head>
<meta charset=""utf-8"">
<meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
<meta http-equiv=""X-UA-Compatible"" content=""IE=edge"">
<meta name=""x-apple-disable-message-reformatting"">
<title>Заявка #{service.RequestNumber}: назначен мастер</title>
<!--[if mso]>
<noscript><xml>
<o:OfficeDocumentSettings>
<o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml></noscript>
<![endif]-->
<style>
@media only screen and (max-width:620px){{
  .email-container{{width:100%!important;max-width:100%!important;}}
  .fluid{{max-width:100%!important;height:auto!important;}}
  .stack-column,.stack-column-center{{display:block!important;width:100%!important;max-width:100%!important;direction:ltr!important;}}
  .mobile-padding{{padding-left:16px!important;padding-right:16px!important;}}
  .mobile-center{{text-align:center!important;}}
  .mobile-hide{{display:none!important;}}
}}
</style>
</head>
<body style=""margin:0;padding:0;word-spacing:normal;background-color:{DarkBg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;"">
<div style=""display:none;font-size:1px;color:{DarkBg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;"">
  Заявка #{service.RequestNumber}: назначен мастер &mdash; GoldPC
</div>
<table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""background-color:{DarkBg};margin:0;padding:0;"">
<tr><td align=""center"" style=""padding:32px 8px;"">
<!--[if mso]><table role=""presentation"" width=""600"" cellpadding=""0"" cellspacing=""0"" border=""0"" align=""center""><tr><td><![endif]-->
<table role=""presentation"" class=""email-container"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""max-width:600px;margin:0 auto;background-color:{DarkSurface};border-radius:8px;overflow:hidden;"">

  <!-- HEADER -->
  <tr><td style=""background-color:{Gold};padding:28px 32px 24px;text-align:center;"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr>
      <td style=""font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;color:{DarkBg};text-align:center;letter-spacing:0.5px;"">GoldPC</td>
    </tr>
    </table>
  </td></tr>

  <!-- TITLE BAR -->
  <tr><td style=""background-color:{DarkSurface};padding:24px 32px 20px;border-bottom:1px solid {Border};"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr>
      <td style=""font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:{TextPrimary};"">Заявка #{service.RequestNumber}</td>
    </tr>
    <tr>
      <td style=""font-family:Arial,Helvetica,sans-serif;font-size:13px;color:{Green};padding-top:4px;font-weight:600;"">Назначен мастер</td>
    </tr>
    </table>
  </td></tr>

  <!-- GREETING -->
  <tr><td style=""padding:28px 32px 16px;"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};line-height:1.6;"">
      На вашу заявку в сервисный центр назначен мастер. Ниже приведены детали.
    </td></tr>
    </table>
  </td></tr>

  <!-- SERVICE DETAILS -->
  <tr><td style=""padding:0 32px 20px;"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""background-color:{DarkBg};border-radius:6px;border:1px solid {Border};"">
      <tr><td style=""padding:14px 20px;border-bottom:1px solid {Border};"">
        <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
        <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:{Gold};text-transform:uppercase;letter-spacing:1.2px;"">Детали заявки</td></tr>
        </table>
      </td></tr>
      <tr><td style=""padding:4px 20px 12px;"">
        <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
          <tr>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};width:40%;"">Номер заявки</td>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{Gold};font-weight:600;text-align:right;"" align=""right"">{Escape(service.RequestNumber)}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};"">Услуга</td>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextPrimary};text-align:right;"" align=""right"">{Escape(service.ServiceTypeName)}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};"">Назначен мастер</td>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{Green};font-weight:700;text-align:right;"" align=""right"">{Escape(masterName)}</td>
          </tr>
          {(string.IsNullOrEmpty(service.DeviceModel) ? "" : $@"<tr>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};"">Устройство</td>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextPrimary};text-align:right;"" align=""right"">{Escape(service.DeviceModel)}</td>
          </tr>")}
          <tr>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};"">Описание</td>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextPrimary};text-align:right;"" align=""right"">{Escape(service.Description)}</td>
          </tr>
          <tr>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextMuted};"">Примерная стоимость</td>
            <td style=""padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:{TextPrimary};font-weight:600;text-align:right;"" align=""right"">{service.EstimatedCost:N2} BYN</td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  <!-- CTA BUTTON -->
  <tr><td style=""padding:0 32px 24px;text-align:center;"" class=""mobile-padding"">
    <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""margin:0 auto;"">
    <tr><td>
      <!--[if mso]><v:roundrect xmlns:v=""urn:schemas-microsoft-com:vml"" xmlns:w=""urn:schemas-microsoft-com:office:word"" href=""https://goldpc.by/my-repairs"" style=""height:48px;v-text-anchor:middle;width:280px;"" arcsize=""13%"" strokecolor=""{Gold}"" fillcolor=""{Gold}""><w:anchorlock/><center style=""color:{DarkBg};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;"">Мои ремонты</center></v:roundrect><![endif]-->
      <!--[if !mso]><!-->
      <a href=""https://goldpc.by/my-repairs"" target=""_blank"" style=""display:inline-block;background-color:{Gold};color:{DarkBg};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;text-decoration:none;text-align:center;padding:14px 40px;border-radius:6px;border:1px solid {Gold};-webkit-text-size-adjust:none;mso-hide:all;"">Мои ремонты</a>
      <!--<![endif]-->
    </td></tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style=""background-color:{DarkBg};border-top:1px solid {Border};padding:24px 32px;text-align:center;"" class=""mobile-padding"">
    <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"">
    <tr><td style=""font-family:Arial,Helvetica,sans-serif;font-size:12px;color:{TextMuted};line-height:1.7;"">
      Это автоматическое письмо от магазина <a href=""https://goldpc.by"" style=""color:{Gold};text-decoration:none;"">GoldPC</a>.<br>
      Пожалуйста, не отвечайте на него.<br>
      <a href=""https://goldpc.by/unsubscribe"" style=""color:{TextMuted};text-decoration:underline;"">Отписаться от уведомлений</a>
    </td></tr>
    </table>
  </td></tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->
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
