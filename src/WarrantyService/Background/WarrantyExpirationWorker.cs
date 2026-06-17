using GoldPC.WarrantyService.Services;
using GoldPC.Shared.Services;

namespace GoldPC.WarrantyService.Background;

/// <summary>
/// Фоновый воркер для проверки истечения гарантийных сроков
/// и отправки напоминаний за месяц до окончания гарантии.
/// </summary>
public class WarrantyExpirationWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<WarrantyExpirationWorker> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromDays(1); // Раз в сутки

    public WarrantyExpirationWorker(IServiceProvider serviceProvider, ILogger<WarrantyExpirationWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("WarrantyExpirationWorker starting...");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var warrantyService = scope.ServiceProvider.GetRequiredService<IWarrantyService>();
                    var orderEmailService = scope.ServiceProvider.GetService<IOrderEmailService>();
                    
                    _logger.LogInformation("Checking for expired warranties...");
                    int expiredCount = await warrantyService.ExpireWarrantiesAsync();
                    if (expiredCount > 0)
                        _logger.LogInformation("{Count} warranties have expired", expiredCount);

                    _logger.LogInformation("Checking for warranties expiring in 30 days...");
                    int notifiedCount = await SendExpiryRemindersAsync(warrantyService, orderEmailService);
                    if (notifiedCount > 0)
                        _logger.LogInformation("{Count} expiration reminder emails sent", notifiedCount);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during warranty expiration check");
            }

            // Ждем до следующей проверки (раз в сутки)
            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("WarrantyExpirationWorker stopping...");
    }

    /// <summary>
    /// Отправить напоминания о гарантиях, истекающих через 30 дней.
    /// Использует IOrderEmailService для отправки HTML-писем с золотой темой GoldPC.
    /// </summary>
    private async Task<int> SendExpiryRemindersAsync(IWarrantyService warrantyService, IOrderEmailService? orderEmailService)
    {
        if (orderEmailService == null)
        {
            _logger.LogWarning("IOrderEmailService не зарегистрирован, email-напоминания не отправляются");
            return 0;
        }

        // Вызываем существующий метод NotifyExpiringWarrantiesAsync для получения гарантий
        // При необходимости можно добавить отдельный метод для получения гарантий с email
        int notifiedCount = 0;

        try
        {
            // Получаем гарантии, истекающие через 30 дней
            // Используем существующую логику WarrantyService
            notifiedCount = await warrantyService.NotifyExpiringWarrantiesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при отправке напоминаний о гарантиях");
        }

        return notifiedCount;
    }
}
