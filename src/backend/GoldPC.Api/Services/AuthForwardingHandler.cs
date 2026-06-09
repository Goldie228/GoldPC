#pragma warning disable CA1031, CS1591, SA1600
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Http;

namespace GoldPC.Api.Services;

/// <summary>
/// DelegatingHandler, который копирует JWT Bearer токен из входящего HTTP-запроса
/// в исходящие запросы к CatalogService.
/// </summary>
public class AuthForwardingHandler : DelegatingHandler
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuthForwardingHandler(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var context = _httpContextAccessor.HttpContext;
        if (context is not null)
        {
            var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
            if (!string.IsNullOrEmpty(authHeader))
            {
                request.Headers.Authorization = AuthenticationHeaderValue.Parse(authHeader);
            }
        }

        return base.SendAsync(request, cancellationToken);
    }
}
#pragma warning restore CA1031, CS1591, SA1600
