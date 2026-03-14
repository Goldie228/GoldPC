using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using GoldPC.SharedKernel.Models;
using GoldPC.ServicesService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GoldPC.ServicesService.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class ServicesController : ControllerBase
{
    private readonly IServicesService _servicesService;
    private readonly ILogger<ServicesController> _logger;

    public ServicesController(IServicesService servicesService, ILogger<ServicesController> logger)
    {
        _servicesService = servicesService;
        _logger = logger;
    }

    [HttpGet("types")]
    [AllowAnonymous]
    public async Task<IActionResult> GetServiceTypes()
    {
        var types = await _servicesService.GetServiceTypesAsync();
        return Ok(ApiResponse<List<ServiceTypeDto>>.Ok(types));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var request = await _servicesService.GetByIdAsync(id);
        if (request == null)
            return NotFound(ApiResponse.Fail("Заявка не найдена"));

        if (!HasAccess(request.ClientId, request.MasterId))
            return Forbid();

        return Ok(ApiResponse<ServiceRequestDto>.Ok(request));
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyRequests([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var result = await _servicesService.GetByClientIdAsync(userId.Value, page, pageSize);
        return Ok(ApiResponse<PagedResult<ServiceRequestDto>>.Ok(result));
    }

    [HttpGet("master")]
    [Authorize(Roles = "Master")]
    public async Task<IActionResult> GetMasterRequests([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var result = await _servicesService.GetByMasterIdAsync(userId.Value, page, pageSize);
        return Ok(ApiResponse<PagedResult<ServiceRequestDto>>.Ok(result));
    }

    [HttpGet]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] ServiceRequestStatus? status = null)
    {
        var result = await _servicesService.GetAllAsync(page, pageSize, status);
        return Ok(ApiResponse<PagedResult<ServiceRequestDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateServiceRequestRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var (result, error) = await _servicesService.CreateAsync(userId.Value, request);
        if (error != null)
            return BadRequest(ApiResponse.Fail(error));

        return CreatedAtAction(nameof(GetById), new { id = result!.Id }, ApiResponse<ServiceRequestDto>.Ok(result, "Заявка создана"));
    }

    [HttpPost("{id}/assign/{masterId}")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> AssignMaster(Guid id, Guid masterId)
    {
        var (result, error) = await _servicesService.AssignMasterAsync(id, masterId);
        if (error != null)
            return BadRequest(ApiResponse.Fail(error));

        return Ok(ApiResponse<ServiceRequestDto>.Ok(result!));
    }

    [HttpPut("{id}/complete")]
    [Authorize(Roles = "Master")]
    public async Task<IActionResult> Complete(Guid id, [FromBody] UpdateServiceRequestRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var (result, error) = await _servicesService.CompleteAsync(id, userId.Value, request);
        if (error != null)
            return BadRequest(ApiResponse.Fail(error));

        return Ok(ApiResponse<ServiceRequestDto>.Ok(result!));
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));

        var (success, error) = await _servicesService.CancelAsync(id, userId.Value);
        if (!success)
            return BadRequest(ApiResponse.Fail(error!));

        return Ok(ApiResponse.Ok("Заявка отменена"));
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private bool HasAccess(Guid clientId, Guid? masterId)
    {
        var currentUserId = GetCurrentUserId();
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

        return currentUserId == clientId || 
               currentUserId == masterId ||
               roles.Contains("Manager") || 
               roles.Contains("Admin");
    }
}