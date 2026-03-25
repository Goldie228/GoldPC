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
    private readonly ILogger<WarrantyController> _logger;

    public WarrantyController(IWarrantyService warrantyService, ILogger<WarrantyController> logger)
    {
        _warrantyService = warrantyService;
        _logger = logger;
    }

    #region Claims

    [HttpGet("claim/{id}")]
    public async Task<IActionResult> GetClaimById(Guid id)
    {
        var claim = await _warrantyService.GetClaimByIdAsync(id);
        if (claim == null) return NotFound(ApiResponse.Fail("Заявка не найдена"));
        if (!HasAccess(claim.UserId)) return Forbid();
        return Ok(ApiResponse<WarrantyClaimDto>.Ok(claim));
    }

    [HttpGet("claim/my")]
    public async Task<IActionResult> GetMyClaims([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        var result = await _warrantyService.GetClaimsByUserIdAsync(userId.Value, page, pageSize);
        return Ok(ApiResponse<PagedResult<WarrantyClaimDto>>.Ok(result));
    }

    [HttpGet("claim")]
    [Authorize(Roles = "Manager,Admin,Master")]
    public async Task<IActionResult> GetAllClaims([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] WarrantyStatus? status = null)
    {
        var result = await _warrantyService.GetAllClaimsAsync(page, pageSize, status);
        return Ok(ApiResponse<PagedResult<WarrantyClaimDto>>.Ok(result));
    }

    [HttpPost("claim")]
    public async Task<IActionResult> CreateClaim([FromBody] CreateWarrantyClaimRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        var (claim, error) = await _warrantyService.CreateClaimAsync(userId.Value, request);
        if (error != null) return BadRequest(ApiResponse.Fail(error));
        return CreatedAtAction(nameof(GetClaimById), new { id = claim!.Id }, ApiResponse<WarrantyClaimDto>.Ok(claim, "Заявка создана"));
    }

    [HttpPut("claim/{id}/status")]
    [Authorize(Roles = "Manager,Admin,Master")]
    public async Task<IActionResult> UpdateClaimStatus(Guid id, [FromBody] UpdateWarrantyStatusRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        var (claim, error) = await _warrantyService.UpdateClaimStatusAsync(id, request.Status, userId.Value, request.Comment);
        if (error != null) return BadRequest(ApiResponse.Fail(error));
        return Ok(ApiResponse<WarrantyClaimDto>.Ok(claim!));
    }

    [HttpPost("claim/{id}/resolve")]
    [Authorize(Roles = "Manager,Admin,Master")]
    public async Task<IActionResult> ResolveClaim(Guid id, [FromBody] ResolveWarrantyRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        var (claim, error) = await _warrantyService.ResolveClaimAsync(id, request.Resolution, userId.Value);
        if (error != null) return BadRequest(ApiResponse.Fail(error));
        return Ok(ApiResponse<WarrantyClaimDto>.Ok(claim!));
    }

    #endregion

    #region Cards

    [HttpGet("card/{id}")]
    public async Task<IActionResult> GetCardById(Guid id)
    {
        var card = await _warrantyService.GetCardByIdAsync(id);
        if (card == null) return NotFound(ApiResponse.Fail("Гарантийный талон не найден"));
        if (!HasAccess(card.UserId)) return Forbid();
        return Ok(ApiResponse<WarrantyDto>.Ok(card));
    }

    [HttpGet("card/number/{number}")]
    public async Task<IActionResult> GetCardByNumber(string number)
    {
        var card = await _warrantyService.GetCardByNumberAsync(number);
        if (card == null) return NotFound(ApiResponse.Fail("Гарантийный талон не найден"));
        if (!HasAccess(card.UserId)) return Forbid();
        return Ok(ApiResponse<WarrantyDto>.Ok(card));
    }

    [HttpGet("card/order/{orderId}")]
    public async Task<IActionResult> GetCardByOrderId(Guid orderId)
    {
        var card = await _warrantyService.GetCardByOrderIdAsync(orderId);
        if (card == null) return NotFound(ApiResponse.Fail("Гарантийный талон не найден"));
        if (!HasAccess(card.UserId)) return Forbid();
        return Ok(ApiResponse<WarrantyDto>.Ok(card));
    }

    [HttpGet("card/service/{serviceId}")]
    public async Task<IActionResult> GetCardByServiceId(Guid serviceId)
    {
        var card = await _warrantyService.GetCardByServiceIdAsync(serviceId);
        if (card == null) return NotFound(ApiResponse.Fail("Гарантийный талон не найден"));
        if (!HasAccess(card.UserId)) return Forbid();
        return Ok(ApiResponse<WarrantyDto>.Ok(card));
    }

    [HttpGet("card/serial/{serialNumber}")]
    public async Task<IActionResult> GetCardBySerialNumber(string serialNumber)
    {
        var card = await _warrantyService.GetCardBySerialNumberAsync(serialNumber);
        if (card == null) return NotFound(ApiResponse.Fail("Гарантийный талон не найден"));
        if (!HasAccess(card.UserId)) return Forbid();
        return Ok(ApiResponse<WarrantyDto>.Ok(card));
    }

    [HttpGet("card/my")]
    public async Task<IActionResult> GetMyCards([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        var result = await _warrantyService.GetCardsByUserIdAsync(userId.Value, page, pageSize);
        return Ok(ApiResponse<PagedResult<WarrantyDto>>.Ok(result));
    }

    [HttpPost("card")]
    [Authorize(Roles = "Manager,Admin,System")]
    public async Task<IActionResult> CreateCard([FromBody] CreateWarrantyRequest request)
    {
        var (card, error) = await _warrantyService.CreateCardAsync(request);
        if (error != null) return BadRequest(ApiResponse.Fail(error));
        return CreatedAtAction(nameof(GetCardById), new { id = card!.Id }, ApiResponse<WarrantyDto>.Ok(card, "Гарантийный талон создан"));
    }

    [HttpPost("card/{id}/annul")]
    [Authorize(Roles = "Manager,Admin")]
    public async Task<IActionResult> AnnulCard(Guid id, [FromBody] AnnulWarrantyRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        var (success, error) = await _warrantyService.AnnulCardAsync(id, request, userId.Value);
        if (!success) return BadRequest(ApiResponse.Fail(error ?? "Не удалось аннулировать гарантию"));
        return Ok(ApiResponse.Ok("Гарантия аннулирована"));
    }

    #endregion

    #region Helpers

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private bool HasAccess(Guid ownerUserId)
    {
        var currentUserId = GetCurrentUserId();
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        return currentUserId == ownerUserId || roles.Contains("Manager") || roles.Contains("Admin") || roles.Contains("Master");
    }

    #endregion
}

public record UpdateWarrantyStatusRequest(WarrantyStatus Status, string? Comment);
public record ResolveWarrantyRequest(string Resolution);
