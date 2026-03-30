#pragma warning disable SA1651
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
    /// <returns><placeholder>A <see cref="Task"/> representing the asynchronous operation.</placeholder></returns>
    Task<(bool Success, string? Error)> CreateWarrantyAsync(CreateWarrantyRequest request);
}
#pragma warning restore SA1651
