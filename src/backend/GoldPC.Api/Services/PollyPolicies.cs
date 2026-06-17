#pragma warning disable CA1031, CS1591, SA1600
using System.Net;
using Microsoft.Extensions.Http.Resilience;
using Polly;
using Polly.Timeout;

namespace GoldPC.Api.Services;

/// <summary>
/// Общие Polly retry policies для межсервисных HTTP-вызовов Gateway.
/// Все policies используют exponential backoff: 2s → 4s → 8s (3 попытки).
/// Ловит: HttpRequestException, TimeoutRejectedException, 5xx, 429.
/// Не retry на 4xx (кроме 429).
/// </summary>
public static class PollyPolicies
{
    private const int MaxRetryAttempts = 3;

    /// <summary>
    /// Конфигурирует resilience pipeline для HTTP-клиентов.
    /// Используйте с AddResilienceHandler (Polly v8):
    /// <code>
    /// .AddResilienceHandler("retry", PollyPolicies.ConfigureRetryPipeline);
    /// </code>
    /// </summary>
    /// <param name="builder">Строитель resilience pipeline.</param>
    public static void ConfigureRetryPipeline(ResiliencePipelineBuilder<HttpResponseMessage> builder)
    {
        // Retry strategy с exponential backoff: 2^1=2s, 2^2=4s, 2^3=8s
        builder.AddRetry(new HttpRetryStrategyOptions
        {
            MaxRetryAttempts = MaxRetryAttempts,
            BackoffType = DelayBackoffType.Exponential,
            Delay = TimeSpan.FromSeconds(2),
            // Ловим сетевые ошибки, 5xx серверные ошибки и 429 Too Many Requests
            ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                .Handle<HttpRequestException>()
                .Handle<TimeoutRejectedException>()
                .HandleResult(r =>
                    (int)r.StatusCode >= (int)HttpStatusCode.InternalServerError
                    || r.StatusCode == HttpStatusCode.TooManyRequests),
            // Логирование каждой retry-попытки
            OnRetry = args =>
            {
                var reason = args.Outcome.Exception?.Message
                    ?? args.Outcome.Result?.StatusCode.ToString()
                    ?? "неизвестно";

                // Логирование через стандартный ILogger будет настроено в Program.cs
                return ValueTask.CompletedTask;
            }
        });
    }

    /// <summary>
    /// Конфигурирует resilience pipeline с логированием через ILogger.
    /// </summary>
    /// <param name="builder">Строитель resilience pipeline.</param>
    /// <param name="logger">ILogger для логирования retry-попыток.</param>
    public static void ConfigureRetryPipeline(
        ResiliencePipelineBuilder<HttpResponseMessage> builder,
        ILogger logger)
    {
        builder.AddRetry(new HttpRetryStrategyOptions
        {
            MaxRetryAttempts = MaxRetryAttempts,
            BackoffType = DelayBackoffType.Exponential,
            Delay = TimeSpan.FromSeconds(2),
            ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                .Handle<HttpRequestException>()
                .Handle<TimeoutRejectedException>()
                .HandleResult(r =>
                    (int)r.StatusCode >= (int)HttpStatusCode.InternalServerError
                    || r.StatusCode == HttpStatusCode.TooManyRequests),
            OnRetry = args =>
            {
                var reason = args.Outcome.Exception?.Message
                    ?? args.Outcome.Result?.StatusCode.ToString()
                    ?? "неизвестно";

                logger.LogWarning(
                    "Polly retry {RetryCount}/{MaxRetries}. " +
                    "Задержка: {Delay}s. Причина: {Reason}",
                    args.AttemptNumber,
                    MaxRetryAttempts,
                    2 * Math.Pow(2, args.AttemptNumber),
                    reason);

                return ValueTask.CompletedTask;
            }
        });
    }
}
#pragma warning restore CA1031, CS1591, SA1600
