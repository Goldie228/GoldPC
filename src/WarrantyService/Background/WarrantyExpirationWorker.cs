using GoldPC.WarrantyService.Services;

namespace GoldPC.WarrantyService.Background;

/// <summary>
/// Фоновый воркер для проверки истечения гарантийных сроков
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
                    
                    _logger.LogInformation("Checking for expired warranties...");
                    int expiredCount = await warrantyService.ExpireWarrantiesAsync();
                    if (expiredCount > 0)
                        _logger.LogInformation("{Count} warranties have expired", expiredCount);

                    _logger.LogInformation("Checking for warranties expiring in 30 days...");
                    int notifiedCount = await warrantyService.NotifyExpiringWarrantiesAsync();
                    if (notifiedCount > 0)
                        _logger.LogInformation("{Count} expiration notifications sent", notifiedCount);
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
}
