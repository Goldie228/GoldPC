namespace Shared.Stubs;

/// <summary>
/// Режим работы заглушки.
/// </summary>
public enum StubMode
{
    /// <summary>
    /// Обычная работа - заглушка возвращает корректные ответы.
    /// </summary>
    Normal = 0,

    /// <summary>
    /// Медленные ответы - имитация медленного сетевого соединения.
    /// </summary>
    Slow = 1,

    /// <summary>
    /// Возврат ошибок - заглушка возвращает ошибки.
    /// </summary>
    Failing = 2,

    /// <summary>
    /// Нестабильная работа - случайное поведение (то работает, то нет).
    /// </summary>
    Unstable = 3
}
