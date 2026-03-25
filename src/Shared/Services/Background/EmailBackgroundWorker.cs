using GoldPC.Shared.Services.Implementations;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace GoldPC.Shared.Services.Background;

public class EmailBackgroundWorker : BackgroundService
{
    private readonly IEmailQueue _queue;
    private readonly SmtpEmailService _emailService;
    private readonly ILogger<EmailBackgroundWorker> _logger;

    public EmailBackgroundWorker(
        IEmailQueue queue,
        SmtpEmailService emailService,
        ILogger<EmailBackgroundWorker> logger)
    {
        _queue = queue;
        _emailService = emailService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Email Background Worker is starting.");

        await foreach (var job in _queue.DequeueAllAsync(stoppingToken))
        {
            try
            {
                _logger.LogInformation("Processing email job for {Recipient}", job.Recipient);
                var (success, error) = await _emailService.SendEmailAsync(job.Recipient, job.Subject, job.Body, job.IsHtml);
                
                if (!success)
                {
                    _logger.LogWarning("Failed to send email in background to {Recipient}: {Error}", job.Recipient, error);
                    // Можно реализовать повторную очередь или DLQ (Dead Letter Queue)
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error processing email job for {Recipient}", job.Recipient);
            }
        }

        _logger.LogInformation("Email Background Worker is stopping.");
    }
}
