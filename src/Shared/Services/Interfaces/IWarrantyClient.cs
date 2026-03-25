using GoldPC.SharedKernel.DTOs;

namespace GoldPC.Shared.Services.Interfaces;

/// <summary>
/// Клиент для взаимодействия с микросервисом WarrantyService
/// </summary>
public interface IWarrantyClient
{
    /// <summary>
    /// Создать гарантийный талон
    /// </summary>
    Task<(bool Success, string? Error)> CreateWarrantyAsync(CreateWarrantyRequest request);
}
