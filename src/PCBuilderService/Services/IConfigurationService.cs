using PCBuilderService.DTOs;
using PCBuilderService.Models;

namespace PCBuilderService.Services;

/// <summary>
/// Интерфейс сервиса управления конфигурациями ПК
/// </summary>
public interface IConfigurationService
{
    /// <summary>Получить конфигурацию по ID</summary>
    Task<PCConfiguration?> GetConfigurationAsync(Guid id);

    /// <summary>Получить все конфигурации пользователя</summary>
    Task<IEnumerable<PCConfiguration>> GetUserConfigurationsAsync(Guid userId);

    /// <summary>Сохранить (создать или обновить) конфигурацию</summary>
    Task<PCConfiguration> SaveConfigurationAsync(PCConfiguration config);

    /// <summary>Удалить конфигурацию</summary>
    Task<bool> DeleteConfigurationAsync(Guid id);

    /// <summary>Рассчитать общую стоимость конфигурации через Catalog Service</summary>
    Task<decimal> CalculateTotalPriceAsync(PCConfigurationDto dto);

    /// <summary>
    /// Рассчитать стоимость конфигурации с учётом скидок, наличия и промокода
    /// </summary>
    /// <param name="dto">Конфигурация</param>
    /// <param name="promoCode">Промокод (опционально)</param>
    /// <returns>Детальный расчёт цены</returns>
    Task<ConfigurationPriceResult> CalculatePriceWithDetailsAsync(PCConfigurationDto dto, string? promoCode = null);

    /// <summary>
    /// Получить конфигурацию по токену публичного доступа
    /// </summary>
    /// <param name="shareToken">Токен публичного доступа</param>
    /// <returns>Конфигурация или null, если токен недействителен</returns>
    Task<PCConfiguration?> GetConfigurationByShareTokenAsync(string shareToken);

    /// <summary>
    /// Сгенерировать токен для публичного доступа к конфигурации
    /// </summary>
    /// <param name="configurationId">ID конфигурации</param>
    /// <param name="userId">ID владельца (для проверки прав)</param>
    /// <returns>Сгенерированный токен или null, если конфигурация не найдена или нет прав</returns>
    Task<string?> GenerateShareTokenAsync(Guid configurationId, Guid userId);
}
