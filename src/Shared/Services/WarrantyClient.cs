#pragma warning disable CA1031, CS1591, SA1117, SA1402, SA1600
using System.Net.Http.Json;
using GoldPC.Shared.Services.Interfaces;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Models;
using Microsoft.Extensions.Logging;

namespace GoldPC.Shared.Services;

/// <summary>
/// Реализация клиента для микросервиса WarrantyService через HTTP
/// </summary>
public class WarrantyClient : IWarrantyClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<WarrantyClient> _logger;

    public WarrantyClient(HttpClient httpClient, ILogger<WarrantyClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<(bool Success, string? Error)> CreateWarrantyAsync(CreateWarrantyRequest request)
    {
        try
        {
            _logger.LogInformation(
                "Sending request to create warranty for Product {ProductId}, User {UserId}",
                request.ProductId, request.UserId);

            var response = await _httpClient.PostAsJsonAsync("api/v1/warranty/card", request);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Warranty created successfully for Product {ProductId}", request.ProductId);
                return (true, null);
            }

            var error = await response.Content.ReadFromJsonAsync<ApiError>();
            _logger.LogError("Failed to create warranty: {Error}", error?.Message);
            return (false, error?.Message ?? "Неизвестная ошибка при создании гарантии");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling WarrantyService");
            return (false, "Ошибка подключения к сервису гарантии");
        }
    }
}

/// <summary>
/// Mock реализация клиента для разработки
/// </summary>
public class WarrantyClientMock : IWarrantyClient
{
    private readonly ILogger<WarrantyClientMock> _logger;

    public WarrantyClientMock(ILogger<WarrantyClientMock> logger)
    {
        _logger = logger;
    }

    public Task<(bool Success, string? Error)> CreateWarrantyAsync(CreateWarrantyRequest request)
    {
        _logger.LogInformation(
            "[MOCK] Automatically creating warranty: Product={ProductId}, User={UserId}, Order={OrderId}, Service={ServiceId}",
            request.ProductId, request.UserId, request.OrderId, request.ServiceRequestId);

        return Task.FromResult((true, (string?)null));
    }
}
#pragma warning restore CA1031, CS1591, SA1117, SA1402, SA1600
