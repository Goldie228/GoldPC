using GoldPC.Api.Services;
using GoldPC.Shared.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GoldPC.Api.Controllers;

/// <summary>Контроллер аудит-логов</summary>
[ApiController]
[Route("api/v1/admin/audit-logs")]
public class AdminAuditLogsController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly ILogger<AdminAuditLogsController> _logger;

    public AdminAuditLogsController(
        IAdminService adminService,
        ILogger<AdminAuditLogsController> logger)
    {
        _adminService = adminService;
        _logger = logger;
    }

    // ====================================================================
    // Эндпоинты
    // ====================================================================

    /// <summary>Получить журнал аудита</summary>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    [HttpGet]
    [Authorize(Policy = Permissions.AuditView)]
    [ProducesResponseType(typeof(PagedResult<AuditLogDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<AuditLogDto>>> GetAuditLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? actionType = null,
        [FromQuery] string? severity = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var result = await _adminService.GetAuditLogsAsync(page, pageSize, actionType, severity, startDate, endDate);
        return Ok(result);
    }
}
