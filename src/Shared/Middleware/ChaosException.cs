namespace Shared.Middleware;

/// <summary>
/// Исключение, выбрасываемое Chaos Middleware для симуляции сбоев сервера.
/// </summary>
public class ChaosException : Exception
{
    /// <summary>
    /// Тип Chaos-воздействия.
    /// </summary>
    public ChaosActionType ActionType { get; }

    /// <summary>
    /// Создает новый экземпляр ChaosException.
    /// </summary>
    public ChaosException(string message) 
        : base(message)
    {
        ActionType = ChaosActionType.RandomFailure;
    }

    /// <summary>
    /// Создает новый экземпляр ChaosException с указанием типа воздействия.
    /// </summary>
    public ChaosException(string message, ChaosActionType actionType) 
        : base(message)
    {
        ActionType = actionType;
    }

    /// <summary>
    /// Создает новый экземпляр ChaosException с внутренним исключением.
    /// </summary>
    public ChaosException(string message, Exception innerException) 
        : base(message, innerException)
    {
        ActionType = ChaosActionType.RandomFailure;
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