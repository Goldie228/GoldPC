using Microsoft.AspNetCore.Mvc;

namespace CatalogService.Controllers;

/// <summary>
/// Приём фронтенд-телеметрии для UX-метрик (engagement).
/// На первом этапе сохраняем в логи (без БД), чтобы быстро увидеть картину.
/// </summary>
[ApiController]
[Route("api/v1/catalog/telemetry")]
public class TelemetryController : ControllerBase
{
    private readonly ILogger<TelemetryController> _logger;

    public TelemetryController(ILogger<TelemetryController> logger)
    {
        _logger = logger;
    }

    [HttpPost("events")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult TrackEvents([FromBody] TelemetryBatchRequest request)
    {
        if (request.Events == null || request.Events.Count == 0)
        {
            return BadRequest(new { error = "No events provided" });
        }

        foreach (var e in request.Events)
        {
            if (string.IsNullOrWhiteSpace(e.Name)) continue;
            _logger.LogInformation("FE_TELEMETRY {Name} session={SessionId} ts={Ts} props={Props}",
                e.Name,
                request.SessionId,
                e.Ts,
                e.Props);
        }

        return NoContent();
    }
}

public sealed record TelemetryBatchRequest
{
    public string? SessionId { get; init; }
    public List<TelemetryEvent> Events { get; init; } = new();
}

public sealed record TelemetryEvent
{
    public string Name { get; init; } = string.Empty;
    public DateTimeOffset Ts { get; init; } = DateTimeOffset.UtcNow;
    public Dictionary<string, object?>? Props { get; init; }
}

