using System.Net;
using System.Net.Mail;

namespace GoldPC.Api.Services;

/// <summary>
/// Конфигурация SMTP для отправки email.
/// </summary>
public class SmtpSettings
{
    public string Host { get; set; } = "smtp.gmail.com";
    public int Port { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = "noreply@goldpc.by";
    public string FromName { get; set; } = "GoldPC";
}

/// <summary>
/// Интерфейс для отправки email.
/// </summary>
public interface IEmailService
{
    Task SendEmailAsync(string recipientEmail, string subject, string body, bool isHtml = true);
    Task SendEmailAsync(List<string> recipientEmails, string subject, string body, bool isHtml = true);
}

/// <summary>
/// Реализация email-отправки через SMTP.
/// Если SMTP не настроен — логирует вместо отправки (dev mode).
/// </summary>
public class EmailService : IEmailService
{
    private readonly SmtpSettings _settings;
    private readonly ILogger<EmailService> _logger;
    private readonly bool _isConfigured;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _settings = new SmtpSettings();
        configuration.GetSection("Smtp").Bind(_settings);
        _logger = logger;
        _isConfigured = !string.IsNullOrWhiteSpace(_settings.UserName);

        if (!_isConfigured)
        {
            _logger.LogWarning("SMTP not configured — emails will be logged only. Set Smtp:UserName in appsettings.json");
        }
    }

    /// <inheritdoc/>
    public async Task SendEmailAsync(string recipientEmail, string subject, string body, bool isHtml = true)
    {
        await SendEmailAsync(new List<string> { recipientEmail }, subject, body, isHtml);
    }

    /// <inheritdoc/>
    public async Task SendEmailAsync(List<string> recipientEmails, string subject, string body, bool isHtml = true)
    {
        if (!_isConfigured)
        {
            _logger.LogInformation("Email (not sent — SMTP unconfigured): To={To}, Subject={Subject}",
                string.Join(",", recipientEmails), subject);
            return;
        }

        try
        {
            using var message = new MailMessage();
            message.From = new MailAddress(_settings.FromAddress, _settings.FromName);

            foreach (var recipient in recipientEmails)
            {
                if (!string.IsNullOrWhiteSpace(recipient))
                    message.To.Add(new MailAddress(recipient));
            }

            if (message.To.Count == 0)
            {
                _logger.LogWarning("No valid recipients for email: {Subject}", subject);
                return;
            }

            message.Subject = subject;
            message.Body = body;
            message.IsBodyHtml = isHtml;

            using var client = new SmtpClient(_settings.Host, _settings.Port)
            {
                Credentials = new NetworkCredential(_settings.UserName, _settings.Password),
                EnableSsl = _settings.EnableSsl,
                Timeout = 15000
            };

            await client.SendMailAsync(message);
            _logger.LogInformation("Email sent: To={To}, Subject={Subject}",
                string.Join(",", message.To), subject);
        }
        catch (SmtpException ex)
        {
            _logger.LogError(ex, "SMTP error sending email: To={To}, Subject={Subject}",
                string.Join(",", recipientEmails), subject);
        }
        catch (IOException ex)
        {
            _logger.LogError(ex, "IO error sending email: To={To}, Subject={Subject}",
                string.Join(",", recipientEmails), subject);
        }
#pragma warning disable CA1031 // Intentional general catch for email send failure
        catch (Exception ex)
#pragma warning restore CA1031
        {
            _logger.LogError(ex, "Failed to send email: To={To}, Subject={Subject}",
                string.Join(",", recipientEmails), subject);
        }
    }
}
