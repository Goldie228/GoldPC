#pragma warning disable S1135, S125
using GoldPC.Shared.DTOs;
using GoldPC.Shared.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace GoldPC.Shared.Services;

/// <summary>
/// Сервис уведомлений об изменении контрактов
/// Используется для координации между агентами при изменении API контрактов
/// </summary>
public class ContractChangeNotifier : IContractChangeNotifier
{
    private readonly ILogger<ContractChangeNotifier> _logger;
    private readonly List<ContractChangeEvent> _eventHistory = new();

    /// <summary>
    /// Initializes a new instance of the <see cref="ContractChangeNotifier"/> class.
    /// Создать экземпляр сервиса уведомлений об изменении контрактов
    /// </summary>
    /// <param name="logger">Логгер</param>
    public ContractChangeNotifier(ILogger<ContractChangeNotifier> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public Task<ContractChangeEvent> NotifyContractChangeAsync(
        string contractName,
        ContractChangeType changeType,
        string newVersion,
        string? previousVersion = null,
        List<string>? breakingChanges = null,
        List<string>? affectedEndpoints = null,
        string? migrationGuide = null,
        string? changedBy = null,
        CancellationToken cancellationToken = default)
    {
        var changeEvent = new ContractChangeEvent
        {
            ContractName = contractName,
            ChangeType = changeType,
            NewVersion = newVersion,
            PreviousVersion = previousVersion,
            BreakingChanges = breakingChanges ?? new List<string>(),
            AffectedEndpoints = affectedEndpoints ?? new List<string>(),
            MigrationGuide = migrationGuide,
            ChangedBy = changedBy,
            CreatedAt = DateTime.UtcNow
        };

        // Сохраняем в историю
        _eventHistory.Add(changeEvent);

        // Логируем уведомление (симуляция отправки)
        LogContractChange(changeEvent);

        // Симуляция отправки webhook координатору
        SimulateWebhookNotification(changeEvent);

        return Task.FromResult(changeEvent);
    }

    /// <inheritdoc />
    public Task<IEnumerable<ContractChangeEvent>> GetChangeHistoryAsync(
        string contractName,
        int limit = 10,
        CancellationToken cancellationToken = default)
    {
        var history = _eventHistory
            .Where(e => e.ContractName.Equals(contractName, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(e => e.CreatedAt)
            .Take(limit)
            .AsEnumerable();

        return Task.FromResult(history);
    }

    /// <summary>
    /// Логирование изменения контракта
    /// </summary>
    private void LogContractChange(ContractChangeEvent changeEvent)
    {
        var changeTypeIcon = changeEvent.ChangeType switch
        {
            ContractChangeType.Breaking => "🚨",
            ContractChangeType.NonBreaking => "📢",
            ContractChangeType.Patch => "🔧",
            _ => "📋"
        };

        _logger.LogInformation(
            "{Icon} [CONTRACT CHANGE] Контракт '{ContractName}' изменён: {PreviousVersion} → {NewVersion} ({ChangeType})",
            changeTypeIcon,
            changeEvent.ContractName,
            changeEvent.PreviousVersion ?? "none",
            changeEvent.NewVersion,
            changeEvent.ChangeType);

        if (changeEvent.BreakingChanges.Count > 0)
        {
            _logger.LogWarning(
                "⚠️ Breaking changes для '{ContractName}':\n{BreakingChanges}",
                changeEvent.ContractName,
                string.Join("\n  - ", changeEvent.BreakingChanges));
        }

        if (changeEvent.AffectedEndpoints.Count > 0)
        {
            _logger.LogInformation(
                "🔗 Затронутые эндпоинты для '{ContractName}':\n{AffectedEndpoints}",
                changeEvent.ContractName,
                string.Join("\n  - ", changeEvent.AffectedEndpoints));
        }

        if (!string.IsNullOrEmpty(changeEvent.MigrationGuide))
        {
            _logger.LogInformation(
                "📖 Руководство по миграции: {MigrationGuide}",
                changeEvent.MigrationGuide);
        }

        // Вывод в консоль для наглядности (симуляция уведомления агентов)
        Console.WriteLine();
        Console.WriteLine(new string('═', 70));
        Console.WriteLine($"  {changeTypeIcon} CONTRACT CHANGE NOTIFICATION");
        Console.WriteLine(new string('═', 70));
        Console.WriteLine($"  Contract:     {changeEvent.ContractName}");
        Console.WriteLine($"  Version:      {changeEvent.PreviousVersion ?? "N/A"} → {changeEvent.NewVersion}");
        Console.WriteLine($"  Change Type:  {changeEvent.ChangeType}");
        Console.WriteLine($"  Changed By:   {changeEvent.ChangedBy ?? "Unknown"}");
        Console.WriteLine($"  Event ID:     {changeEvent.EventId}");
        Console.WriteLine($"  Timestamp:    {changeEvent.CreatedAt:yyyy-MM-dd HH:mm:ss} UTC");

        if (changeEvent.BreakingChanges.Count > 0)
        {
            Console.WriteLine();
            Console.WriteLine("  ⚠️  BREAKING CHANGES:");
            foreach (var change in changeEvent.BreakingChanges)
            {
                Console.WriteLine($"      - {change}");
            }
        }

        if (changeEvent.AffectedEndpoints.Count > 0)
        {
            Console.WriteLine();
            Console.WriteLine("  🔗 AFFECTED ENDPOINTS:");
            foreach (var endpoint in changeEvent.AffectedEndpoints)
            {
                Console.WriteLine($"      - {endpoint}");
            }
        }

        if (!string.IsNullOrEmpty(changeEvent.MigrationGuide))
        {
            Console.WriteLine();
            Console.WriteLine($"  📖 MIGRATION GUIDE: {changeEvent.MigrationGuide}");
        }

        Console.WriteLine(new string('═', 70));
        Console.WriteLine();
    }

    /// <summary>
    /// Симуляция отправки webhook уведомления координатору
    /// В будущем будет заменена на реальную интеграцию с Coordinator Dashboard
    /// </summary>
    private void SimulateWebhookNotification(ContractChangeEvent changeEvent)
    {
        // Симуляция webhook вызова
        _logger.LogDebug(
            "🔔 Симуляция webhook: POST /api/coordinator/contract-changes " +
            "[Contract={ContractName}, Version={NewVersion}, Type={ChangeType}]",
            changeEvent.ContractName,
            changeEvent.NewVersion,
            changeEvent.ChangeType);

        // TODO: Реализовать реальный webhook вызов к Coordinator Dashboard
        // POST https://coordinator-dashboard/api/contract-changes
        // Body: changeEvent (JSON)

        // Пример будущего кода:
        // await _httpClient.PostAsJsonAsync(
        //     "https://coordinator-dashboard/api/contract-changes",
        //     changeEvent,
        //     cancellationToken);
    }
}
#pragma warning restore S1135, S125
