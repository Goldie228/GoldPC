#pragma warning disable CA1716, CS1591, SA1402, SA1600, SA1616
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Shared.Stubs.DTOs;

namespace Shared.Stubs.Controllers;

/// <summary>
/// API контроллер для управления заглушками (внутреннее использование).
/// Маршрут: /api/internal/stubs
/// </summary>
[ApiController]
[Route("api/internal/stubs")]
[Produces("application/json")]
public class StubsController : ControllerBase
{
    private readonly StubRegistry _registry;

    /// <summary>
    /// Initializes a new instance of the <see cref="StubsController"/> class.
    /// Создать новый экземпляр контроллера.
    /// </summary>
    public StubsController()
    {
        _registry = StubRegistry.Instance;
    }

    /// <summary>
    /// Получить список всех заглушек.
    /// </summary>
    /// <remarks>
    /// GET /api/internal/stubs
    /// </remarks>
    /// <returns></returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<StubResponse>), StatusCodes.Status200OK)]
    public IActionResult GetAll()
    {
        var stubs = _registry.GetAll();
        var response = stubs.Select(MapToResponse);
        return Ok(response);
    }

    /// <summary>
    /// Получить статистику по заглушкам.
    /// </summary>
    /// <remarks>
    /// GET /api/internal/stubs/stats
    /// </remarks>
    /// <returns></returns>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(StubRegistryStatsResponse), StatusCodes.Status200OK)]
    public IActionResult GetStats()
    {
        var stats = _registry.GetStats();
        var response = new StubRegistryStatsResponse
        {
            TotalCount = stats.TotalCount,
            NormalCount = stats.NormalCount,
            SlowCount = stats.SlowCount,
            FailingCount = stats.FailingCount,
            UnstableCount = stats.UnstableCount,
            DisabledCount = stats.DisabledCount
        };
        return Ok(response);
    }

    /// <summary>
    /// Получить заглушку по имени.
    /// </summary>
    /// <remarks>
    /// GET /api/internal/stubs/{name}
    /// </remarks>
    /// <returns></returns>
    [HttpGet("{name}")]
    [ProducesResponseType(typeof(StubResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(StubErrorResponse), StatusCodes.Status404NotFound)]
    public IActionResult Get(string name)
    {
        var stub = _registry.Get(name);
        if (stub == null)
        {
            return NotFound(new StubErrorResponse
            {
                Error = "NOT_FOUND",
                Message = $"Заглушка '{name}' не найдена"
            });
        }

        return Ok(MapToResponse(stub));
    }

    /// <summary>
    /// Обновить конфигурацию заглушки.
    /// </summary>
    /// <remarks>
    /// PATCH /api/internal/stubs/{name}
    /// 
    /// Пример запроса:
    /// {
    ///   "mode": "Failing",
    ///   "isEnabled": true,
    ///   "chaos": {
    ///     "failureRate": 0.5,
    ///     "latencyRate": 0.2
    ///   }
    /// }
    /// </remarks>
    /// <returns></returns>
    [HttpPatch("{name}")]
    [ProducesResponseType(typeof(StubResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(StubErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(StubErrorResponse), StatusCodes.Status400BadRequest)]
    public IActionResult Configure(string name, [FromBody] StubConfigurationRequest request)
    {
        if (!_registry.Exists(name))
        {
            return NotFound(new StubErrorResponse
            {
                Error = "NOT_FOUND",
                Message = $"Заглушка '{name}' не найдена"
            });
        }

        var success = _registry.Configure(name, stub =>
        {
            stub.Mode = request.Mode;

            if (request.IsEnabled.HasValue)
            {
                stub.IsEnabled = request.IsEnabled.Value;
            }

            if (request.Chaos != null)
            {
                stub.Chaos = new StubChaosConfig
                {
                    FailureRate = request.Chaos.FailureRate ?? stub.Chaos?.FailureRate ?? 0.05,
                    LatencyRate = request.Chaos.LatencyRate ?? stub.Chaos?.LatencyRate ?? 0.1,
                    MinLatencyMs = request.Chaos.MinLatencyMs ?? stub.Chaos?.MinLatencyMs ?? 100,
                    MaxLatencyMs = request.Chaos.MaxLatencyMs ?? stub.Chaos?.MaxLatencyMs ?? 3000,
                    FailureStatusCode = request.Chaos.FailureStatusCode ?? stub.Chaos?.FailureStatusCode ?? 500,
                    FailureMessage = request.Chaos.FailureMessage ?? stub.Chaos?.FailureMessage ?? "Service unavailable"
                };
            }
            else
            {
                // Автоматически применить предустановленную конфигурацию на основе режима
                stub.Chaos = request.Mode switch
                {
                    StubMode.Slow => StubChaosConfig.Slow,
                    StubMode.Failing => StubChaosConfig.Failing,
                    StubMode.Unstable => StubChaosConfig.Unstable,
                    _ => StubChaosConfig.Default
                };
            }
        });

        if (!success)
        {
            return BadRequest(new StubErrorResponse
            {
                Error = "CONFIGURATION_FAILED",
                Message = $"Не удалось настроить заглушку '{name}'"
            });
        }

        var updatedStub = _registry.Get(name);
        return Ok(MapToResponse(updatedStub!));
    }

    /// <summary>
    /// Установить режим работы заглушки.
    /// </summary>
    /// <remarks>
    /// PUT /api/internal/stubs/{name}/mode
    /// 
    /// Пример запроса:
    /// "Failing"
    /// 
    /// Доступные режимы: Normal, Slow, Failing, Unstable
    /// </remarks>
    /// <returns></returns>
    [HttpPut("{name}/mode")]
    [ProducesResponseType(typeof(StubResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(StubErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(StubErrorResponse), StatusCodes.Status400BadRequest)]
    public IActionResult SetMode(string name, [FromBody] string mode)
    {
        if (!Enum.TryParse<StubMode>(mode, ignoreCase: true, out var stubMode))
        {
            return BadRequest(new StubErrorResponse
            {
                Error = "INVALID_MODE",
                Message = $"Недопустимый режим '{mode}'. Доступные режимы: Normal, Slow, Failing, Unstable"
            });
        }

        if (!_registry.SetMode(name, stubMode))
        {
            return NotFound(new StubErrorResponse
            {
                Error = "NOT_FOUND",
                Message = $"Заглушка '{name}' не найдена"
            });
        }

        var updatedStub = _registry.Get(name);
        return Ok(MapToResponse(updatedStub!));
    }

    /// <summary>
    /// Включить или отключить заглушку.
    /// </summary>
    /// <remarks>
    /// PUT /api/internal/stubs/{name}/enabled
    /// 
    /// Пример запроса:
    /// true
    /// </remarks>
    /// <returns></returns>
    [HttpPut("{name}/enabled")]
    [ProducesResponseType(typeof(StubResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(StubErrorResponse), StatusCodes.Status404NotFound)]
    public IActionResult SetEnabled(string name, [FromBody] bool enabled)
    {
        if (!_registry.SetEnabled(name, enabled))
        {
            return NotFound(new StubErrorResponse
            {
                Error = "NOT_FOUND",
                Message = $"Заглушка '{name}' не найдена"
            });
        }

        var updatedStub = _registry.Get(name);
        return Ok(MapToResponse(updatedStub!));
    }

    /// <summary>
    /// Сбросить все заглушки в нормальный режим.
    /// </summary>
    /// <remarks>
    /// POST /api/internal/stubs/reset
    /// </remarks>
    /// <returns></returns>
    [HttpPost("reset")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult ResetAll()
    {
        _registry.ResetAll();
        return Ok(new { message = "Все заглушки сброшены в нормальный режим" });
    }

    /// <summary>
    /// Зарегистрировать новую заглушку.
    /// </summary>
    /// <remarks>
    /// POST /api/internal/stubs
    /// 
    /// Пример запроса:
    /// {
    ///   "name": "MyService",
    ///   "serviceName": "My Service",
    ///   "description": "Заглушка для My Service",
    ///   "mode": "Normal"
    /// }
    /// </remarks>
    /// <returns></returns>
    [HttpPost]
    [ProducesResponseType(typeof(StubResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(StubErrorResponse), StatusCodes.Status400BadRequest)]
    public IActionResult Register([FromBody] StubDefinitionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new StubErrorResponse
            {
                Error = "INVALID_NAME",
                Message = "Имя заглушки обязательно"
            });
        }

        if (_registry.Exists(request.Name))
        {
            return BadRequest(new StubErrorResponse
            {
                Error = "ALREADY_EXISTS",
                Message = $"Заглушка '{request.Name}' уже существует"
            });
        }

        var stub = new StubDefinition
        {
            Name = request.Name,
            ServiceName = request.ServiceName ?? request.Name,
            Description = request.Description ?? string.Empty,
            Mode = request.Mode,
            Chaos = request.Mode switch
            {
                StubMode.Slow => StubChaosConfig.Slow,
                StubMode.Failing => StubChaosConfig.Failing,
                StubMode.Unstable => StubChaosConfig.Unstable,
                _ => StubChaosConfig.Default
            }
        };

        _registry.Register(stub);

        return CreatedAtAction(nameof(Get), new { name = stub.Name }, MapToResponse(stub));
    }

    /// <summary>
    /// Удалить заглушку.
    /// </summary>
    /// <remarks>
    /// DELETE /api/internal/stubs/{name}
    /// </remarks>
    /// <returns></returns>
    [HttpDelete("{name}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(StubErrorResponse), StatusCodes.Status404NotFound)]
    public IActionResult Remove(string name)
    {
        if (!_registry.Remove(name))
        {
            return NotFound(new StubErrorResponse
            {
                Error = "NOT_FOUND",
                Message = $"Заглушка '{name}' не найдена"
            });
        }

        return NoContent();
    }

    /// <summary>
    /// Преобразовать определение заглушки в ответ API.
    /// </summary>
    private static StubResponse MapToResponse(StubDefinition stub)
    {
        return new StubResponse
        {
            Name = stub.Name,
            ServiceName = stub.ServiceName,
            Description = stub.Description,
            Mode = stub.Mode.ToString(),
            IsEnabled = stub.IsEnabled,
            LastModified = stub.LastModified,
            Chaos = stub.Chaos != null ? new StubChaosConfigResponse
            {
                FailureRate = stub.Chaos.FailureRate,
                LatencyRate = stub.Chaos.LatencyRate,
                MinLatencyMs = stub.Chaos.MinLatencyMs,
                MaxLatencyMs = stub.Chaos.MaxLatencyMs,
                FailureStatusCode = stub.Chaos.FailureStatusCode,
                FailureMessage = stub.Chaos.FailureMessage
            }
            : null
        };
    }
}

/// <summary>
/// Запрос на создание новой заглушки.
/// </summary>
public class StubDefinitionRequest
{
    public string Name { get; set; } = string.Empty;

    public string? ServiceName { get; set; }

    public string? Description { get; set; }

    public StubMode Mode { get; set; } = StubMode.Normal;
}
#pragma warning restore CA1716, CS1591, SA1402, SA1600, SA1616
