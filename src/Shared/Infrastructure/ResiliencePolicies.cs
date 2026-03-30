#pragma warning disable CA1716, SA1117, SA1616
using System.Net.Http;
using Microsoft.Extensions.Logging;
using Polly;
using Polly.CircuitBreaker;
using Polly.Retry;

namespace GoldPC.Shared.Infrastructure;

/// <summary>
/// Общие политики устойчивости для внешних API
/// </summary>
public static class ResiliencePolicies
{
    /// <summary>
    /// Создает политику повторов для HttpClient
    /// </summary>
    /// <returns></returns>
    public static AsyncRetryPolicy<HttpResponseMessage> GetHttpRetryPolicy(ILogger logger)
    {
        return Policy<HttpResponseMessage>
            .Handle<HttpRequestException>()
            .OrResult(msg => (int)msg.StatusCode >= 500 || msg.StatusCode == System.Net.HttpStatusCode.RequestTimeout)
            .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                (outcome, timespan, retryAttempt, context) =>
                {
                    logger.LogWarning(
                        "Delaying for {Delay}ms, then making retry {RetryAttempt}. Source: {Source}",
                        timespan.TotalMilliseconds, retryAttempt, context.PolicyKey);
                });
    }

    /// <summary>
    /// Создает политику разрыва цепи (Circuit Breaker)
    /// </summary>
    /// <returns></returns>
    public static AsyncCircuitBreakerPolicy<HttpResponseMessage> GetHttpCircuitBreakerPolicy(ILogger logger)
    {
        return Policy<HttpResponseMessage>
            .Handle<HttpRequestException>()
            .OrResult(msg => (int)msg.StatusCode >= 500)
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: 5,
                durationOfBreak: TimeSpan.FromMinutes(1),
                onBreak: (outcome, timespan) =>
                {
                    logger.LogError(
                        "Circuit breaker opened for {Delay}ms due to {Exception}",
                        timespan.TotalMilliseconds, outcome.Exception?.Message ?? outcome.Result.ReasonPhrase);
                },
                onReset: () => logger.LogInformation("Circuit breaker reset"),
                onHalfOpen: () => logger.LogInformation("Circuit breaker half-open"));
    }
}
#pragma warning restore CA1716, SA1117, SA1616
