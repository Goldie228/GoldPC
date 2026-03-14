using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using GoldPC.SharedKernel.Models;
using GoldPC.WarrantyService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GoldPC.WarrantyService.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class WarrantyController : ControllerBase
{
    private readonly IWarrantyService _warrantyService;
    public WarrantyController(IWarrantyService warrantyService) => _warrantyService = warrantyService;

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var claim = await _warrantyService.GetByIdAsync(id);
        if (claim == null) return NotFound(ApiResponse.Fail("Заявка не найдена"));
        if (!HasAccess(claim.UserId)) return Forbid();
        return Ok(ApiResponse<WarrantyClaimDto>.Ok(claim));
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyClaims([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        var result = await _warrantyService.GetByUserIdAsync(userId.Value, page, pageSize);
        return Ok(ApiResponse<PagedResult<WarrantyClaimDto>>.Ok(result));
    }

    [HttpGet]
    [Authorize(Roles = "Manager,Admin,Master")]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] WarrantyStatus? status = null)
    {
        var result = await _warrantyService.GetAllAsync(page, pageSize, status);
        return Ok(ApiResponse<PagedResult<WarrantyClaimDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWarrantyClaimRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        var (claim, error) = await _warrantyService.CreateAsync(userId.Value, request);
        if (error != null) return BadRequest(ApiResponse.Fail(error));
        return CreatedAtAction(nameof(GetById), new { id = claim!.Id }, ApiResponse<WarrantyClaimDto>.Ok(claim, "Заявка создана"));
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "Manager,Admin,Master")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateWarrantyStatusRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        var (claim, error) = await _warrantyService.UpdateStatusAsync(id, request.Status, userId.Value, request.Comment);
        if (error != null) return BadRequest(ApiResponse.Fail(error));
        return Ok(ApiResponse<WarrantyClaimDto>.Ok(claim!));
    }

    [HttpPost("{id}/resolve")]
    [Authorize(Roles = "Manager,Admin,Master")]
    public async Task<IActionResult> Resolve(Guid id, [FromBody] ResolveWarrantyRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        var (claim, error) = await _warrantyService.ResolveAsync(id, request.Resolution, userId.Value);
        if (error != null) return BadRequest(ApiResponse.Fail(error));
        return Ok(ApiResponse<WarrantyClaimDto>.Ok(claim!));
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private bool HasAccess(Guid claimUserId)
    {
        var currentUserId = GetCurrentUserId();
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        return currentUserId == claimUserId || roles.Contains("Manager") || roles.Contains("Admin") || roles.Contains("Master");
    }
}

public record UpdateWarrantyStatusRequest(WarrantyStatus Status, string? Comment);
public record ResolveWarrantyRequest(string Resolution);