#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Models;
using GoldPC.AuthService.Services;
using PagedResultLoginHistory = GoldPC.SharedKernel.Models.PagedResult<GoldPC.SharedKernel.DTOs.LoginHistoryItem>;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GoldPC.AuthService.Controllers;

/// <summary>
/// Контроллер настроек безопасности (2FA, история входа)
/// </summary>
[ApiController]
[Route("api/v1/auth/security")]
[Authorize]
public class SecurityController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<SecurityController> _logger;

    public SecurityController(IAuthService authService, ILogger<SecurityController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Получение истории входа текущего пользователя (пагинация)
    /// </summary>
    [HttpGet("login-history")]
    [ProducesResponseType(typeof(ApiResponse<PagedResultLoginHistory>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetLoginHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var (items, totalCount, error) = await _authService.GetLoginHistoryAsync(userId, page, pageSize);

        if (error != null)
        {
            _logger.LogWarning("Failed to get login history for user {UserId}: {Error}", userId, error);
            return BadRequest(ApiResponse.Fail(error));
        }

        var result = new PagedResultLoginHistory
        {
            Items = items ?? new List<LoginHistoryItem>(),
            TotalCount = totalCount,
            PageNumber = page,
            PageSize = pageSize
        };

        return Ok(ApiResponse<PagedResultLoginHistory>.Ok(result));
    }

    /// <summary>
    /// Включение двухфакторной аутентификации (генерация TOTP-секрета и QR-кода)
    /// </summary>
    [HttpPost("2fa/enable")]
    [ProducesResponseType(typeof(ApiResponse<TwoFactorStatusResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> EnableTwoFactor()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var (response, error) = await _authService.EnableTwoFactorAsync(userId);

        if (error != null)
        {
            _logger.LogWarning("Failed to enable 2FA for user {UserId}: {Error}", userId, error);
            return BadRequest(ApiResponse.Fail(error));
        }

        return Ok(ApiResponse<TwoFactorStatusResponse>.Ok(response!));
    }

    /// <summary>
    /// Подтверждение включения двухфакторной аутентификации (верификация TOTP-кода)
    /// </summary>
    [HttpPost("2fa/verify")]
    [ProducesResponseType(typeof(ApiResponse<TwoFactorStatusResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> VerifyTwoFactor([FromBody] TwoFactorVerifyRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var (response, error) = await _authService.VerifyTwoFactorAsync(userId, request);

        if (error != null)
        {
            _logger.LogWarning("Failed to verify 2FA for user {UserId}: {Error}", userId, error);
            return BadRequest(ApiResponse.Fail(error));
        }

        return Ok(ApiResponse<TwoFactorStatusResponse>.Ok(response!));
    }

    /// <summary>
    /// Отключение двухфакторной аутентификации
    /// </summary>
    [HttpPost("2fa/disable")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DisableTwoFactor([FromBody] TwoFactorDisableRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var (success, error) = await _authService.DisableTwoFactorAsync(userId, request);

        if (!success)
        {
            _logger.LogWarning("Failed to disable 2FA for user {UserId}: {Error}", userId, error);
            return BadRequest(ApiResponse.Fail(error!));
        }

        return Ok(ApiResponse.Ok("Двухфакторная аутентификация отключена"));
    }
}