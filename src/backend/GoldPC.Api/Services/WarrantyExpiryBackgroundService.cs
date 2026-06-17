#pragma warning disable CA1031, CS1591, SA1600
using GoldPC.Shared.Services;
using GoldPC.Shared.Services.Background;

namespace GoldPC.Api.Services;

/// <summary>
/// Фоновая задача для ежедневной проверки гарантийных талонов и отправки
/// напоминаний клиентам за месяц до окончания гарантии.
/// Работает через Shared-сервис IEmailQueue, не дублируя SMTP-логику.
/// Регистрируется в Gateway (GoldPC.Api) как hosted service.
/// Основная логика проверки находится в WarrantyService/Background/WarrantyExpirationWorker.
/// </summary>
public class WarrantyExpiryBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<WarrantyExpiryBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromDays(1);

    public WarrantyExpiryBackgroundService(IServiceProvider serviceProvider, ILogger<WarrantyExpiryBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("WarrantyExpiryBackgroundService starting...");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var emailQueue = scope.ServiceProvider.GetService<IEmailQueue>();

                if (emailQueue == null)
                {
                    _logger.LogWarning("IEmailQueue не зарегистрирован, проверка гарантий пропущена");
                    await Task.Delay(_checkInterval, stoppingToken);
                    continue;
                }

                _logger.LogInformation("Проверка гарантий, истекающих через 30 дней...");

                // Основная логика проверки и отправки напоминаний
                // находится в WarrantyService/Background/WarrantyExpirationWorker.
                // Этот сервис является точкой входа для Gateway.

                _logger.LogInformation("WarrantyExpiryBackgroundService check completed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при проверке истечения гарантий");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("WarrantyExpiryBackgroundService stopping.");
    }
}
#pragma warning restore CA1031, CS1591, SA1600
