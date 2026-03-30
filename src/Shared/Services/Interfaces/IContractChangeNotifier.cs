#pragma warning disable CA1002, CA1716
using GoldPC.Shared.DTOs;

namespace GoldPC.Shared.Services.Interfaces;

/// <summary>
/// Интерфейс сервиса уведомлений об изменении контрактов
/// </summary>
public interface IContractChangeNotifier
{
    /// <summary>
    /// Уведомить об изменении контракта
    /// </summary>
    /// <param name="contractName">Имя контракта (например, "orders-api")</param>
    /// <param name="changeType">Тип изменения</param>
    /// <param name="newVersion">Новая версия</param>
    /// <param name="previousVersion">Предыдущая версия (опционально)</param>
    /// <param name="breakingChanges">Список критических изменений</param>
    /// <param name="affectedEndpoints">Затронутые эндпоинты</param>
    /// <param name="migrationGuide">Руководство по миграции</param>
    /// <param name="changedBy">Инициатор изменения</param>
    /// <param name="cancellationToken">Токен отмены</param>
    /// <returns>Событие изменения контракта</returns>
    Task<ContractChangeEvent> NotifyContractChangeAsync(
        string contractName,
        ContractChangeType changeType,
        string newVersion,
        string? previousVersion = null,
        List<string>? breakingChanges = null,
        List<string>? affectedEndpoints = null,
        string? migrationGuide = null,
        string? changedBy = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Получить историю изменений контракта
    /// </summary>
    /// <param name="contractName">Имя контракта</param>
    /// <param name="limit">Максимальное количество записей</param>
    /// <param name="cancellationToken">Токен отмены</param>
    /// <returns>Список событий изменений</returns>
    Task<IEnumerable<ContractChangeEvent>> GetChangeHistoryAsync(
        string contractName,
        int limit = 10,
        CancellationToken cancellationToken = default);
}
#pragma warning restore CA1002, CA1716
