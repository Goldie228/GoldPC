using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Models;
using GoldPC.AuthService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GoldPC.AuthService.Controllers;

/// <summary>
/// Контроллер аутентификации
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Регистрация нового пользователя
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var (response, error) = await _authService.RegisterAsync(request);
        
        if (error != null)
        {
            return BadRequest(ApiResponse.Fail(error));
        }

        _logger.LogInformation("User registered: {Email}", request.Email);
        return CreatedAtAction(nameof(GetProfile), new { }, ApiResponse<AuthResponse>.Ok(response!, "Регистрация успешна"));
    }

    /// <summary>
    /// Вход в систему
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var (response, error) = await _authService.LoginAsync(request, ipAddress);
        
        if (error != null)
        {
            _logger.LogWarning("Failed login attempt for {Email}: {Error}", request.Email, error);
            return Unauthorized(ApiResponse.Fail(error));
        }

        _logger.LogInformation("User logged in: {Email}", request.Email);
        return Ok(ApiResponse<AuthResponse>.Ok(response!));
    }

    /// <summary>
    /// Обновление токена
    /// </summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var (response, error) = await _authService.RefreshTokenAsync(request.RefreshToken, ipAddress);
        
        if (error != null)
        {
            return Unauthorized(ApiResponse.Fail(error));
        }

        return Ok(ApiResponse<AuthResponse>.Ok(response!));
    }

    /// <summary>
    /// Выход из системы
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest? request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        
        if (userIdClaim != null && Guid.TryParse(userIdClaim, out var userId))
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            
            if (request?.RefreshToken != null)
            {
                await _authService.LogoutAsync(userId, request.RefreshToken, ipAddress);
            }
        }

        return Ok(ApiResponse.Ok("Выход выполнен успешно"));
    }

    /// <summary>
    /// Получение профиля пользователя
    /// </summary>
    [HttpGet("profile")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var user = await _authService.GetUserByIdAsync(userId);
        if (user == null)
        {
            return NotFound(ApiResponse.Fail("Пользователь не найден"));
        }

        return Ok(ApiResponse<UserDto>.Ok(user));
    }

    /// <summary>
    /// Обновление профиля пользователя
    /// </summary>
    [HttpPut("profile")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var (user, error) = await _authService.UpdateUserAsync(userId, request);
        
        if (error != null)
        {
            return BadRequest(ApiResponse.Fail(error));
        }

        return Ok(ApiResponse<UserDto>.Ok(user!));
    }

    /// <summary>
    /// Смена пароля
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var (success, error) = await _authService.ChangePasswordAsync(userId, request);
        
        if (!success)
        {
            return BadRequest(ApiResponse.Fail(error!));
        }

        return Ok(ApiResponse.Ok("Пароль успешно изменён"));
    }
}