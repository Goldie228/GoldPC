#pragma warning disable CA1031, CS1591, SA1600
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

namespace GoldPC.Api.Services;

/// <summary>
/// HTTP-клиент для микросервиса ReportingService (порт 5008).
/// Проксирует запросы финансовых отчётов с JWT forwarding.
/// </summary>
public class ReportingServiceClient : IReportingServiceClient
{
    private readonly HttpClient _http;
    private readonly ILogger<ReportingServiceClient> _logger;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public ReportingServiceClient(HttpClient http, ILogger<ReportingServiceClient> logger)
    {
        _http = http;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<ReportingApiResponse> GetFinancialSummaryAsync(DateTime from, DateTime to)
    {
        try
        {
            _logger.LogDebug("GetFinancialSummaryAsync: from={From}, to={To}", from, to);

            var query = $"api/reports/financial-summary?from={from:O}&to={to:O}";
            _logger.LogWarning("Proxy → ReportingService: GET {Query}", query);
            var response = await _http.GetAsync(new Uri(query, UriKind.Relative));
            _logger.LogWarning("Proxy ← ReportingService: {StatusCode}", response.StatusCode);
            var body = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("Proxy ← body: {Body}", body.Length > 500 ? body[..500] : body);
            response.EnsureSuccessStatusCode();

            return await DeserializeResponseAsync(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка вызова ReportingService GetFinancialSummary: {Msg}", ex.Message);
            return new ReportingApiResponse { Success = false, Message = $"Сервис отчётов: {ex.Message}" };
        }
    }

    /// <inheritdoc />
    public async Task<ReportingApiResponse> GetOrdersByPeriodAsync(DateTime from, DateTime to, string groupBy)
    {
        try
        {
            _logger.LogDebug("GetOrdersByPeriodAsync: from={From}, to={To}, groupBy={GroupBy}", from, to, groupBy);

            var query = $"api/reports/orders-by-period?from={from:O}&to={to:O}&groupBy={Uri.EscapeDataString(groupBy)}";
            var response = await _http.GetAsync(new Uri(query, UriKind.Relative));
            response.EnsureSuccessStatusCode();

            return await DeserializeResponseAsync(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка вызова ReportingService GetOrdersByPeriod");
            return new ReportingApiResponse { Success = false, Message = "Сервис отчётов недоступен" };
        }
    }

    /// <inheritdoc />
    public async Task<ReportingApiResponse> GetServicesByPeriodAsync(DateTime from, DateTime to)
    {
        try
        {
            _logger.LogDebug("GetServicesByPeriodAsync: from={From}, to={To}", from, to);

            var query = $"api/reports/services-by-period?from={from:O}&to={to:O}";
            var response = await _http.GetAsync(new Uri(query, UriKind.Relative));
            response.EnsureSuccessStatusCode();

            return await DeserializeResponseAsync(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка вызова ReportingService GetServicesByPeriod");
            return new ReportingApiResponse { Success = false, Message = "Сервис отчётов недоступен" };
        }
    }

    /// <inheritdoc />
    public async Task<(byte[] CsvBytes, string? ContentType, string? FileName)?> ExportDataAsync(string entity, DateTime from, DateTime to)
    {
        try
        {
            _logger.LogDebug("ExportDataAsync: entity={Entity}, from={From}, to={To}", entity, from, to);

            var query = $"api/reports/export?format=csv&entity={Uri.EscapeDataString(entity)}&from={from:O}&to={to:O}";
            var response = await _http.GetAsync(new Uri(query, UriKind.Relative));
            response.EnsureSuccessStatusCode();

            var csvBytes = await response.Content.ReadAsByteArrayAsync();
            var contentType = response.Content.Headers.ContentType?.MediaType;
            var fileName = GetFileNameFromResponse(response) ?? $"export_{entity}_{DateTime.Now:yyyyMMdd}.csv";

            return (csvBytes, contentType, fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка вызова ReportingService ExportData");
            return null;
        }
    }

    /// <summary>
    /// Десериализация стандартного ответа ReportingService: { success, data, message }
    /// </summary>
    private async Task<ReportingApiResponse> DeserializeResponseAsync(HttpResponseMessage response)
    {
        var json = await response.Content.ReadAsStringAsync();
        var wrapper = JsonSerializer.Deserialize<ReportingServiceWrapper>(json, JsonOpts);

        return new ReportingApiResponse
        {
            Success = wrapper?.Success ?? false,
            Data = wrapper?.Data,
            Message = wrapper?.Message
        };
    }

    /// <summary>
    /// Извлечение имени файла из Content-Disposition заголовка
    /// </summary>
    private static string? GetFileNameFromResponse(HttpResponseMessage response)
    {
        var disposition = response.Content.Headers.ContentDisposition;
        return disposition?.FileNameStar ?? disposition?.FileName?.Trim('"');
    }

    // Внутренние DTO для десериализации
    private sealed record ReportingServiceWrapper
    {
        [JsonPropertyName("success")]
        public bool Success { get; init; }

        [JsonPropertyName("data")]
        public object? Data { get; init; }

        [JsonPropertyName("message")]
        public string? Message { get; init; }
    }
}
#pragma warning restore CA1031, CS1591, SA1600
