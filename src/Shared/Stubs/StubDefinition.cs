#pragma warning disable SA1616
namespace Shared.Stubs;

/// <summary>
/// Определение заглушки для сервиса.
/// </summary>
public class StubDefinition
{
    /// <summary>
    /// Gets уникальное имя заглушки.
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// Gets имя сервиса, для которого предназначена заглушка.
    /// </summary>
    public string ServiceName { get; init; } = string.Empty;

    /// <summary>
    /// Gets описание заглушки.
    /// </summary>
    public string Description { get; init; } = string.Empty;

    /// <summary>
    /// Gets or sets текущий режим работы заглушки.
    /// </summary>
    public StubMode Mode { get; set; } = StubMode.Normal;

    /// <summary>
    /// Gets or sets конфигурация Chaos Engineering для заглушки.
    /// </summary>
    public StubChaosConfig? Chaos { get; set; }

    /// <summary>
    /// Gets предопределенные ответы для разных сценариев.
    /// Ключ - имя сценария, значение - объект ответа.
    /// </summary>
    public Dictionary<string, object> Responses { get; init; } = new();

    /// <summary>
    /// Gets or sets a value indicating whether включена ли заглушка.
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// Gets or sets время последнего изменения режима.
    /// </summary>
    public DateTime LastModified { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Создает копию определения заглушки.
    /// </summary>
    /// <returns></returns>
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
            }
            : null,
            Responses = new Dictionary<string, object>(Responses),
            IsEnabled = IsEnabled,
            LastModified = LastModified
        };
    }
}
#pragma warning restore SA1616
