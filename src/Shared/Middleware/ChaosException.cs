#pragma warning disable CA1716, CS1591, SA1201, SA1600
namespace Shared.Middleware;

/// <summary>
/// Исключение, выбрасываемое Chaos Middleware для симуляции сбоев сервера.
/// </summary>
public class ChaosException : Exception
{
    /// <summary>
    /// Gets тип Chaos-воздействия.
    /// </summary>
    public ChaosActionType ActionType { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="ChaosException"/> class.
    /// Создает новый экземпляр ChaosException.
    /// </summary>
    public ChaosException(string message)
        : base(message)
    {
        ActionType = ChaosActionType.RandomFailure;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="ChaosException"/> class.
    /// Создает новый экземпляр ChaosException с указанием типа воздействия.
    /// </summary>
    public ChaosException(string message, ChaosActionType actionType)
        : base(message)
    {
        ActionType = actionType;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="ChaosException"/> class.
    /// Создает новый экземпляр ChaosException с внутренним исключением.
    /// </summary>
    public ChaosException(string message, Exception innerException)
        : base(message, innerException)
    {
        ActionType = ChaosActionType.RandomFailure;
    }

    public ChaosException()
    {
    }
}

/// <summary>
/// Типы Chaos-воздействий.
/// </summary>
public enum ChaosActionType
{
    /// <summary>
    /// Случайное исключение (simulate server error).
    /// </summary>
    RandomFailure,

    /// <summary>
    /// Задержка ответа (simulate slow network).
    /// </summary>
    Latency,

    /// <summary>
    /// Сервис недоступен (503 Service Unavailable).
    /// </summary>
    ServiceOutage,

    /// <summary>
    /// Таймаут запроса.
    /// </summary>
    Timeout,

    /// <summary>
    /// Ошибка подключения к базе данных.
    /// </summary>
    DatabaseFailure,

    /// <summary>
    /// Ошибка внешнего сервиса.
    /// </summary>
    ExternalServiceFailure
}
#pragma warning restore CA1716, CS1591, SA1201, SA1600
