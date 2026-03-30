#pragma warning disable CA1716, SA1616, SA1651
using GoldPC.SharedKernel.DTOs;

namespace GoldPC.Shared.Services.Interfaces;

/// <summary>
/// Интерфейс для интеграции с 1С:Предприятие
/// </summary>
public interface IOneCIntegrationService
{
    /// <summary>
    /// Экспорт заказов в XML (CommerceML)
    /// </summary>
    /// <returns><placeholder>A <see cref="Task"/> representing the asynchronous operation.</placeholder></returns>
    Task<string> ExportOrdersToXmlAsync(DateTime from, DateTime to);

    /// <summary>
    /// Экспорт заказов в CSV
    /// </summary>
    /// <returns><placeholder>A <see cref="Task"/> representing the asynchronous operation.</placeholder></returns>
    Task<string> ExportOrdersToCsvAsync(DateTime from, DateTime to);

    /// <summary>
    /// Импорт остатков товаров из XML
    /// </summary>
    /// <returns><placeholder>A <see cref="Task"/> representing the asynchronous operation.</placeholder></returns>
    Task<(bool Success, string? Error)> ImportStockFromXmlAsync(string xmlContent);

    /// <summary>
    /// Проверка авторизации для 1С
    /// </summary>
    /// <returns></returns>
    bool ValidateOneCApiKey(string apiKey);
}
#pragma warning restore CA1716, SA1616, SA1651
