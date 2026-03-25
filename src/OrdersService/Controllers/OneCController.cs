using GoldPC.Shared.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GoldPC.OrdersService.Controllers;

/// <summary>
/// Контроллер для интеграции с 1С:Предприятие
/// </summary>
[ApiController]
[Route("api/integration/1c")]
public class OneCController : ControllerBase
{
    private readonly ILogger<OneCController> _logger;
    private readonly IOneCIntegrationService _oneCService;

    public OneCController(ILogger<OneCController> logger, IOneCIntegrationService oneCService)
    {
        _logger = logger;
        _oneCService = oneCService;
    }

    [HttpGet("export/xml")]
    public async Task<IActionResult> ExportXml([FromQuery] string apiKey, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        if (!_oneCService.ValidateOneCApiKey(apiKey))
        {
            _logger.LogWarning("Invalid API key for 1C integration request");
            return Unauthorized();
        }

        var fromDate = from ?? DateTime.UtcNow.AddDays(-1);
        var toDate = to ?? DateTime.UtcNow;

        var xml = await _oneCService.ExportOrdersToXmlAsync(fromDate, toDate);
        return Content(xml, "application/xml");
    }

    [HttpGet("export/csv")]
    public async Task<IActionResult> ExportCsv([FromQuery] string apiKey, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        if (!_oneCService.ValidateOneCApiKey(apiKey))
        {
            _logger.LogWarning("Invalid API key for 1C integration request");
            return Unauthorized();
        }

        var fromDate = from ?? DateTime.UtcNow.AddDays(-1);
        var toDate = to ?? DateTime.UtcNow;

        var csv = await _oneCService.ExportOrdersToCsvAsync(fromDate, toDate);
        return Content(csv, "text/csv");
    }

    [HttpPost("import/stock")]
    public async Task<IActionResult> ImportStock([FromQuery] string apiKey)
    {
        if (!_oneCService.ValidateOneCApiKey(apiKey))
        {
            _logger.LogWarning("Invalid API key for 1C integration request");
            return Unauthorized();
        }

        using var reader = new StreamReader(Request.Body);
        var xmlContent = await reader.ReadToEndAsync();
        
        var result = await _oneCService.ImportStockFromXmlAsync(xmlContent);
        if (!result.Success)
        {
            return BadRequest(result.Error);
        }

        return Ok();
    }
}
