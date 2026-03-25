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
    Task<string> ExportOrdersToXmlAsync(DateTime from, DateTime to);

    /// <summary>
    /// Экспорт заказов в CSV
    /// </summary>
    Task<string> ExportOrdersToCsvAsync(DateTime from, DateTime to);

    /// <summary>
    /// Импорт остатков товаров из XML
    /// </summary>
    Task<(bool Success, string? Error)> ImportStockFromXmlAsync(string xmlContent);

    /// <summary>
    /// Проверка авторизации для 1С
    /// </summary>
    bool ValidateOneCApiKey(string apiKey);
}
