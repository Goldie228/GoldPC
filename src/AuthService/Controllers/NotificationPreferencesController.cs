#pragma warning disable CS1591, SA1600
// Copyright (c) GoldPC. All rights reserved.

using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Models;
using GoldPC.AuthService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GoldPC.AuthService.Controllers;

/// <summary>
/// Контроллер управления предпочтениями уведомлений пользователя
/// </summary>
[ApiController]
[Route("api/v1/auth/notifications")]
[Authorize]
public class NotificationPreferencesController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<NotificationPreferencesController> _logger;

    public NotificationPreferencesController(IAuthService authService, ILogger<NotificationPreferencesController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Получение текущих предпочтений уведомлений пользователя
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<NotificationPreferenceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetNotificationPreferences()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var (response, error) = await _authService.GetNotificationPreferencesAsync(userId);

        if (error != null)
        {
            _logger.LogWarning("Failed to get notification preferences for user {UserId}: {Error}", userId, error);
            return BadRequest(ApiResponse.Fail(error));
        }

        return Ok(ApiResponse<NotificationPreferenceResponse>.Ok(response!));
    }

    /// <summary>
    /// Обновление предпочтений уведомлений пользователя
    /// </summary>
    [HttpPut]
    [ProducesResponseType(typeof(ApiResponse<NotificationPreferenceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateNotificationPreferences([FromBody] NotificationPreferenceRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var (response, error) = await _authService.UpdateNotificationPreferencesAsync(userId, request);

        if (error != null)
        {
            _logger.LogWarning("Failed to update notification preferences for user {UserId}: {Error}", userId, error);
            return BadRequest(ApiResponse.Fail(error));
        }

        return Ok(ApiResponse<NotificationPreferenceResponse>.Ok(response!));
    }
}