using System.Text.Json;
using Microsoft.AspNetCore.Http;

namespace GoldPC.ContractTests.Providers;

/// <summary>
/// Провайдер состояний для контрактных тестов
/// </summary>
public class CatalogProviderStateMiddleware
{
    private readonly RequestDelegate _next;
    private readonly Dictionary<string, Action> _providerStates;

    public CatalogProviderStateMiddleware(RequestDelegate next)
    {
        _next = next;

        _providerStates = new Dictionary<string, Action>
        {
            ["products exist"] = MockProductRepository.SetupProductsExist,
            ["product with id exists"] = MockProductRepository.SetupProductExists,
            ["product with id not found"] = MockProductRepository.SetupProductNotFound,
            ["empty catalog"] = MockProductRepository.SetupEmptyCatalog,
            ["products in category exist"] = MockProductRepository.SetupProductsInCategory
        };
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments("/provider-states"))
        {
            await HandleProviderStateRequest(context);
            return;
        }

        await _next(context);
    }

    private async Task HandleProviderStateRequest(HttpContext context)
    {
        using var reader = new StreamReader(context.Request.Body);
        var body = await reader.ReadToEndAsync();
        var providerState = JsonSerializer.Deserialize<ProviderState>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        context.Response.StatusCode = StatusCodes.Status200OK;

        if (providerState?.State != null && _providerStates.TryGetValue(providerState.State, out var action))
        {
            action();
        }
    }
}

public class ProviderState
{
    public string? Consumer { get; set; }
    public string? State { get; set; }
}
