namespace Shared.Stubs;

/// <summary>
/// Определение заглушки для сервиса.
/// </summary>
public class StubDefinition
{
    /// <summary>
    /// Уникальное имя заглушки.
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// Имя сервиса, для которого предназначена заглушка.
    /// </summary>
    public string ServiceName { get; init; } = string.Empty;

    /// <summary>
    /// Описание заглушки.
    /// </summary>
    public string Description { get; init; } = string.Empty;

    /// <summary>
    /// Текущий режим работы заглушки.
    /// </summary>
    public StubMode Mode { get; set; } = StubMode.Normal;

    /// <summary>
    /// Конфигурация Chaos Engineering для заглушки.
    /// </summary>
    public StubChaosConfig? Chaos { get; set; }

    /// <summary>
    /// Предопределенные ответы для разных сценариев.
    /// Ключ - имя сценария, значение - объект ответа.
    /// </summary>
    public Dictionary<string, object> Responses { get; init; } = new();

    /// <summary>
    /// Включена ли заглушка.
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// Время последнего изменения режима.
    /// </summary>
    public DateTime LastModified { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Создает копию определения заглушки.
    /// </summary>
    public StubDefinition Clone()
    {
        return new StubDefinition
        {
            Name = Name,
            ServiceName = ServiceName,
            Description = Description,
            Mode = Mode,
            Chaos = Chaos != null ? new StubChaosConfig
            {
                FailureRate = Chaos.FailureRate,
                LatencyRate = Chaos.LatencyRate,
                MinLatencyMs = Chaos.MinLatencyMs,
                MaxLatencyMs = Chaos.MaxLatencyMs,
                FailureStatusCode = Chaos.FailureStatusCode,
                FailureMessage = Chaos.FailureMessage
            } : null,
            Responses = new Dictionary<string, object>(Responses),
            IsEnabled = IsEnabled,
            LastModified = LastModified
        };
    }
}