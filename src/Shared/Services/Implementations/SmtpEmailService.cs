#pragma warning disable CA1031, CA1859, CS1591, SA1600
using System.Net.Mail;
using HandlebarsDotNet;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using Polly;

namespace GoldPC.Shared.Services.Implementations;

public class SmtpEmailService
{
    private readonly ILogger<SmtpEmailService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IAsyncPolicy _resiliencePolicy;

    public SmtpEmailService(
        ILogger<SmtpEmailService> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;

        _resiliencePolicy = Policy.Handle<Exception>()
            .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));
    }

    public async Task<(bool Success, string? Error)> SendEmailAsync(string email, string subject, string body, bool isHtml = true)
    {
        _logger.LogInformation("Sending Email to {Email} with subject {Subject}", email, subject);

        try
        {
            return await _resiliencePolicy.ExecuteAsync<(bool Success, string? Error)>(async () =>
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(
                    _configuration["Smtp:FromName"] ?? "GoldPC",
                    _configuration["Smtp:FromEmail"] ?? "no-reply@goldpc.example.com"));
                message.To.Add(new MailboxAddress(string.Empty, email));
                message.Subject = subject;

                message.Body = new TextPart(isHtml ? "html" : "plain")
                {
                    Text = body
                };

                using var client = new MailKit.Net.Smtp.SmtpClient();

                var host = _configuration["Smtp:Host"] ?? "localhost";
                var port = _configuration.GetValue<int>("Smtp:Port", 587);
                var user = _configuration["Smtp:Username"];
                var pass = _configuration["Smtp:Password"];

                await client.ConnectAsync(host, port, SecureSocketOptions.Auto);

                if (!string.IsNullOrEmpty(user))
                {
                    await client.AuthenticateAsync(user, pass);
                }

                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation("Email sent successfully to {Email}", email);
                return (true, null);
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Email to {Email}", email);
            return (false, "Ошибка отправки Email.");
        }
    }

    public string RenderTemplate(string templateName, object data)
    {
        var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Templates", $"{templateName}.hbs");

        if (!File.Exists(templatePath))
        {
            _logger.LogWarning("Template not found: {TemplatePath}. Using simple text representation.", templatePath);
            return data.ToString() ?? string.Empty;
        }

        var source = File.ReadAllText(templatePath);
        var template = Handlebars.Compile(source);
        return template(data);
    }
}
#pragma warning restore CA1031, CA1859, CS1591, SA1600
