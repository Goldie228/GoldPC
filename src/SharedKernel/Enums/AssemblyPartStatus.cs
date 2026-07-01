namespace GoldPC.SharedKernel.Enums;

/// <summary>
/// Статус комплектующей в заявке на сборку ПК
/// </summary>
public enum AssemblyPartStatus
{
    /// <summary>
    /// Требуется - комплектующая запрошена, ещё не получена
    /// </summary>
    Required = 0,

    /// <summary>
    /// Получена - мастер забрал комплектующую со склада
    /// </summary>
    Collected = 1,

    /// <summary>
    /// Установлена - комплектующая установлена в ПК
    /// </summary>
    Installed = 2
}
