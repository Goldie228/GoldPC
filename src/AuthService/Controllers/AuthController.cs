using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Models;
using GoldPC.AuthService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace GoldPC.AuthService.Controllers;

/// <summary>
/// Запрос на верификацию TOTP-кода при входе с обязательной 2FA.
/// </summary>
public class TwoFactorLoginVerifyRequest
{
    /// <summary>Токен, полученный на первом шаге входа (/api/v1/auth/login) в поле twoFactorToken.</summary>
    public string TwoFactorToken { get; set; } = string.Empty;

    /// <summary>6-значный TOTP-код из приложения-аутентификатора.</summary>
    public string Code { get; set; } = string.Empty;
}

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
    [EnableRateLimiting("RegisterPolicy")]
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
    [EnableRateLimiting("LoginPolicy")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userAgent = HttpContext.Request.Headers["User-Agent"].FirstOrDefault() ?? "unknown";
        var (response, error) = await _authService.LoginAsync(request, ipAddress, userAgent);
        
        if (error != null)
        {
            _logger.LogWarning("Failed login attempt for {Email}: {Error}", request.Email, error);
            return Unauthorized(ApiResponse.Fail(error));
        }

        _logger.LogInformation("User logged in: {Email}", request.Email);
        return Ok(ApiResponse<AuthResponse>.Ok(response!));
    }

    /// <summary>
    /// Верификация TOTP-кода при обязательной двухфакторной аутентификации (Force2FA).
    /// Вызывается после /api/v1/auth/login, если ответ содержит requiresTwoFactor: true.
    /// При успехе возвращает полноценный JWT и refresh-токен.
    /// </summary>
    [HttpPost("login/verify-2fa")]
    [EnableRateLimiting("LoginPolicy")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyTwoFactorLogin([FromBody] TwoFactorLoginVerifyRequest request)
    {
        if (string.IsNullOrEmpty(request.TwoFactorToken) || string.IsNullOrEmpty(request.Code))
        {
            return BadRequest(ApiResponse.Fail("Токен и код двухфакторной аутентификации обязательны."));
        }

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userAgent = HttpContext.Request.Headers["User-Agent"].FirstOrDefault() ?? "unknown";
        var (response, error) = await _authService.VerifyTwoFactorLoginAsync(
            request.TwoFactorToken, request.Code, ipAddress, userAgent);

        if (error != null)
        {
            _logger.LogWarning("2FA verification failed: {Error}", error);
            return BadRequest(ApiResponse.Fail(error));
        }

        _logger.LogInformation("User completed 2FA login: {Email}", response!.User.Email);
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
    /// Загрузка аватара пользователя
    /// </summary>
    [HttpPost("avatar")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadAvatar(IFormFile avatar)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        if (avatar == null || avatar.Length == 0)
        {
            return BadRequest(ApiResponse.Fail("Файл не загружен"));
        }

        var (avatarUrl, error) = await _authService.UploadAvatarAsync(userId, avatar);
        
        if (error != null)
        {
            return BadRequest(ApiResponse.Fail(error));
        }

        return Ok(ApiResponse<object>.Ok(new { avatarUrl }));
    }

    /// <summary>
    /// Удаление аватара пользователя
    /// </summary>
    [HttpDelete("avatar")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteAvatar()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var (success, error) = await _authService.DeleteAvatarAsync(userId);
        
        if (!success)
        {
            return BadRequest(ApiResponse.Fail(error!));
        }

        return Ok(ApiResponse.Ok("Аватар удалён"));
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

    /// <summary>
    /// Запрос на сброс пароля (отправляет email со ссылкой)
    /// </summary>
    [HttpPost("forgot-password")]
    [EnableRateLimiting("PasswordResetPolicy")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var scheme = Request.Scheme;
        var host = Request.Host.ToString();

        var (success, error) = await _authService.ForgotPasswordAsync(request.Email, scheme, host);
        
        if (!success)
        {
            return BadRequest(ApiResponse.Fail(error!));
        }

        // Всегда возвращаем 200 OK для защиты от перечисления email
        return Ok(ApiResponse.Ok("Если аккаунт с таким email существует, на него отправлена инструкция по восстановлению пароля."));
    }

    /// <summary>
    /// Сброс пароля по токену (из email)
    /// </summary>
    [HttpPost("reset-password")]
    [EnableRateLimiting("PasswordResetPolicy")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(ApiResponse.Fail("Токен и новый пароль обязательны."));
        }

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var (success, error) = await _authService.ResetPasswordAsync(request.Token, request.Password, ipAddress);
        
        if (!success)
        {
            return BadRequest(ApiResponse.Fail(error!));
        }

        return Ok(ApiResponse.Ok("Пароль успешно изменён. Теперь вы можете войти с новым паролем."));
    }

    /// <summary>
    /// Валидация токена сброса пароля (без мутаций).
    /// Фронтенд вызывает этот метод при загрузке страницы reset-password,
    /// чтобы сразу показать expired-экран, если ссылка недействительна.
    /// </summary>
    [HttpPost("validate-reset-token")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ValidateResetToken([FromBody] ValidateResetTokenRequest request)
    {
        if (string.IsNullOrEmpty(request.Token))
        {
            return BadRequest(ApiResponse.Fail("Токен обязателен."));
        }

        var (valid, error) = await _authService.ValidateResetTokenAsync(request.Token);

        if (!valid)
        {
            return BadRequest(ApiResponse.Fail(error!));
        }

        return Ok(ApiResponse.Ok("Токен действителен."));
    }

    /// <summary>
    /// Отправка (или повторная отправка) письма с подтверждением email.
    /// Требует авторизации — userId извлекается из JWT.
    /// </summary>
    [HttpPost("send-verification")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SendVerification()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse.Fail("Пользователь не авторизован"));
        }

        var scheme = Request.Scheme;
        var host = Request.Host.ToString();

        var (success, error) = await _authService.SendVerificationEmailAsync(userId, scheme, host);

        if (!success)
        {
            return BadRequest(ApiResponse.Fail(error!));
        }

        return Ok(ApiResponse.Ok("Письмо для подтверждения email отправлено. Проверьте почту."));
    }

    /// <summary>
    /// Подтверждение email по токену из письма.
    /// Не требует авторизации — токен одноразовый.
    /// </summary>
    [HttpPost("verify-email")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
    {
        if (string.IsNullOrEmpty(request.Token))
        {
            return BadRequest(ApiResponse.Fail("Токен обязателен."));
        }

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var (success, error) = await _authService.VerifyEmailAsync(request.Token, ipAddress);

        if (!success)
        {
            return BadRequest(ApiResponse.Fail(error!));
        }

        return Ok(ApiResponse.Ok("Email успешно подтверждён."));
    }
}