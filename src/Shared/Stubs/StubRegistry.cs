#pragma warning disable CS1591, SA1117, SA1201, SA1202, SA1402, SA1600, SA1616
using Microsoft.Extensions.Logging;

namespace Shared.Stubs;

/// <summary>
/// Реестр заглушек с паттерном Singleton.
/// Управляет определениями заглушек и их режимами работы.
/// </summary>
public sealed class StubRegistry
{
    private static readonly Lazy<StubRegistry> _instance = new(() => new StubRegistry());
    private readonly Dictionary<string, StubDefinition> _stubs = new(StringComparer.OrdinalIgnoreCase);
    private readonly object _lock = new();
    private ILogger? _logger;

    /// <summary>
    /// Gets получить единственный экземпляр реестра (Singleton).
    /// </summary>
    public static StubRegistry Instance => _instance.Value;

    /// <summary>
    /// Событие, возникающее при изменении режима заглушки.
    /// </summary>
    public event EventHandler<StubChangedEventArgs>? StubChanged;

    private StubRegistry()
    {
        InitializeDefaultStubs();
    }

    /// <summary>
    /// Установить логгер для реестра.
    /// </summary>
    public void SetLogger(ILogger logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Инициализировать стандартные заглушки для сервисов GoldPC.
    /// </summary>
    private void InitializeDefaultStubs()
    {
        Register(new StubDefinition
        {
            Name = "PaymentService",
            ServiceName = "Payment Service",
            Description = "Заглушка для сервиса платежей",
            Mode = StubMode.Normal,
            Chaos = StubChaosConfig.Default
        });

        Register(new StubDefinition
        {
            Name = "NotificationService",
            ServiceName = "Notification Service",
            Description = "Заглушка для сервиса уведомлений (SMS, Email)",
            Mode = StubMode.Normal,
            Chaos = StubChaosConfig.Default
        });

        Register(new StubDefinition
        {
            Name = "DeliveryService",
            ServiceName = "Delivery Service",
            Description = "Заглушка для сервиса доставки",
            Mode = StubMode.Normal,
            Chaos = StubChaosConfig.Default
        });

        Register(new StubDefinition
        {
            Name = "WarrantyService",
            ServiceName = "Warranty Service",
            Description = "Заглушка для сервиса гарантии",
            Mode = StubMode.Normal,
            Chaos = StubChaosConfig.Default
        });

        Register(new StubDefinition
        {
            Name = "CatalogService",
            ServiceName = "Catalog Service",
            Description = "Заглушка для каталога товаров",
            Mode = StubMode.Normal,
            Chaos = StubChaosConfig.Default
        });

        Register(new StubDefinition
        {
            Name = "AuthService",
            ServiceName = "Auth Service",
            Description = "Заглушка для сервиса аутентификации",
            Mode = StubMode.Normal,
            Chaos = StubChaosConfig.Default
        });
    }

    /// <summary>
    /// Зарегистрировать новую заглушку.
    /// </summary>
    public void Register(StubDefinition stub)
    {
        ArgumentNullException.ThrowIfNull(stub);

        if (string.IsNullOrWhiteSpace(stub.Name))
        {
            throw new ArgumentException("Имя заглушки не может быть пустым", nameof(stub));
        }

        lock (_lock)
        {
            _stubs[stub.Name] = stub;
            _logger?.LogInformation(
                "Зарегистрирована заглушка: {Name} для сервиса {ServiceName}",
                stub.Name, stub.ServiceName);
        }
    }

    /// <summary>
    /// Получить заглушку по имени.
    /// </summary>
    /// <returns></returns>
    public StubDefinition? Get(string name)
    {
        lock (_lock)
        {
            return _stubs.TryGetValue(name, out var stub) ? stub : null;
        }
    }

    /// <summary>
    /// Получить все зарегистрированные заглушки.
    /// </summary>
    /// <returns></returns>
    public IReadOnlyList<StubDefinition> GetAll()
    {
        lock (_lock)
        {
            return _stubs.Values.ToList().AsReadOnly();
        }
    }

    /// <summary>
    /// Проверить существование заглушки.
    /// </summary>
    /// <returns></returns>
    public bool Exists(string name)
    {
        lock (_lock)
        {
            return _stubs.ContainsKey(name);
        }
    }

    /// <summary>
    /// Настроить заглушку.
    /// </summary>
    /// <returns></returns>
    public bool Configure(string name, Action<StubDefinition> configure)
    {
        lock (_lock)
        {
            if (!_stubs.TryGetValue(name, out var stub))
            {
                _logger?.LogWarning("Попытка настройки несуществующей заглушки: {Name}", name);
                return false;
            }

            var previousMode = stub.Mode;
            configure(stub);
            stub.LastModified = DateTime.UtcNow;

            _logger?.LogInformation(
                "Заглушка {Name} изменена: режим {PreviousMode} -> {NewMode}",
                name, previousMode, stub.Mode);

            OnStubChanged(new StubChangedEventArgs
            {
                StubName = name,
                PreviousMode = previousMode,
                NewMode = stub.Mode,
                Timestamp = stub.LastModified
            });

            return true;
        }
    }

    /// <summary>
    /// Установить режим работы заглушки.
    /// </summary>
    /// <returns></returns>
    public bool SetMode(string name, StubMode mode)
    {
        return Configure(name, stub =>
        {
            stub.Mode = mode;
            stub.Chaos = mode switch
            {
                StubMode.Slow => StubChaosConfig.Slow,
                StubMode.Failing => StubChaosConfig.Failing,
                StubMode.Unstable => StubChaosConfig.Unstable,
                _ => StubChaosConfig.Default
            };
        });
    }

    /// <summary>
    /// Установить произвольную конфигурацию Chaos для заглушки.
    /// </summary>
    /// <returns></returns>
    public bool SetChaosConfig(string name, StubChaosConfig config)
    {
        return Configure(name, stub =>
        {
            stub.Chaos = config;
        });
    }

    /// <summary>
    /// Включить или отключить заглушку.
    /// </summary>
    /// <returns></returns>
    public bool SetEnabled(string name, bool enabled)
    {
        return Configure(name, stub =>
        {
            stub.IsEnabled = enabled;
        });
    }

    /// <summary>
    /// Удалить заглушку из реестра.
    /// </summary>
    /// <returns></returns>
    public bool Remove(string name)
    {
        lock (_lock)
        {
            var removed = _stubs.Remove(name);
            if (removed)
            {
                _logger?.LogInformation("Заглушка {Name} удалена из реестра", name);
            }

            return removed;
        }
    }

    /// <summary>
    /// Сбросить все заглушки в нормальный режим.
    /// </summary>
    public void ResetAll()
    {
        lock (_lock)
        {
            foreach (var stub in _stubs.Values)
            {
                stub.Mode = StubMode.Normal;
                stub.Chaos = StubChaosConfig.Default;
                stub.IsEnabled = true;
                stub.LastModified = DateTime.UtcNow;
            }

            _logger?.LogInformation("Все заглушки сброшены в нормальный режим");
        }
    }

    /// <summary>
    /// Получить статистику по заглушкам.
    /// </summary>
    /// <returns></returns>
    public StubRegistryStats GetStats()
    {
        lock (_lock)
        {
            return new StubRegistryStats
            {
                TotalCount = _stubs.Count,
                NormalCount = _stubs.Values.Count(s => s.Mode == StubMode.Normal),
                SlowCount = _stubs.Values.Count(s => s.Mode == StubMode.Slow),
                FailingCount = _stubs.Values.Count(s => s.Mode == StubMode.Failing),
                UnstableCount = _stubs.Values.Count(s => s.Mode == StubMode.Unstable),
                DisabledCount = _stubs.Values.Count(s => !s.IsEnabled)
            };
        }
    }

    private void OnStubChanged(StubChangedEventArgs e)
    {
        StubChanged?.Invoke(this, e);
    }
}

/// <summary>
/// Аргументы события изменения заглушки.
/// </summary>
public class StubChangedEventArgs : EventArgs
{
    public string StubName { get; init; } = string.Empty;

    public StubMode PreviousMode { get; init; }

    public StubMode NewMode { get; init; }

    public DateTime Timestamp { get; init; }
}

/// <summary>
/// Статистика реестра заглушек.
/// </summary>
public class StubRegistryStats
{
    public int TotalCount { get; init; }

    public int NormalCount { get; init; }

    public int SlowCount { get; init; }

    public int FailingCount { get; init; }

    public int UnstableCount { get; init; }

    public int DisabledCount { get; init; }
}
#pragma warning restore CS1591, SA1117, SA1201, SA1202, SA1402, SA1600, SA1616
