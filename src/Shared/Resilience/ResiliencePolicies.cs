#pragma warning disable CA1716, CA2017, CS1591, SA1117, SA1600
using System;
using System.Net.Http;
using Microsoft.Extensions.Logging;
using Polly;
using Polly.CircuitBreaker;
using Polly.Extensions.Http;
using Polly.Retry;

namespace GoldPC.Shared.Resilience;

public static class ResiliencePolicies
{
    public static IAsyncPolicy<HttpResponseMessage> GetHttpRetryPolicy()
    {
        return HttpPolicyExtensions
            .HandleTransientHttpError()
            .OrResult(msg => msg.StatusCode == System.Net.HttpStatusCode.NotFound)
            .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));
    }

    public static IAsyncPolicy<HttpResponseMessage> GetHttpCircuitBreakerPolicy()
    {
        return HttpPolicyExtensions
            .HandleTransientHttpError()
            .CircuitBreakerAsync(5, TimeSpan.FromSeconds(30));
    }

    public static IAsyncPolicy GetGenericResiliencePolicy(ILogger logger, string serviceName)
    {
        return Policy.WrapAsync(
            Policy.Handle<Exception>()
                .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                    onRetry: (ex, ts, count, context) =>
                        logger.LogWarning(
                            "Retrying {ServiceName} call ({Count}/3) after {Delay}s due to: {Error}",
                            serviceName, count, ts.TotalSeconds, ex.Message)),
            Policy.Handle<Exception>()
                .CircuitBreakerAsync(5, TimeSpan.FromSeconds(30),
                    onBreak: (ex, timespan) =>
                        logger.LogError(
                            "{ServiceName} Circuit Breaker OPEN for {TimeSpan}s. Last error: {Error}",
                            serviceName, timespan.TotalSeconds, ex.Message),
                    onReset: () =>
                        logger.LogInformation("{ServiceName} Circuit Breaker CLOSED")));
    }
}
#pragma warning restore CA1716, CA2017, CS1591, SA1117, SA1600
