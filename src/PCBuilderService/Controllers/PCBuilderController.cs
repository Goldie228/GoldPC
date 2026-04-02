using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PCBuilderService.DTOs;
using PCBuilderService.Models;
using PCBuilderService.Services;
using System.Security.Claims;

namespace PCBuilderService.Controllers;

/// <summary>
/// Контроллер конструктора ПК
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Tags("PCBuilder")]
public class PCBuilderController : ControllerBase
{
    private readonly ICompatibilityService _compatibilityService;
    private readonly IConfigurationService _configurationService;
    private readonly IFpsCalculationService _fpsCalculationService;
    private readonly ILogger<PCBuilderController> _logger;

    public PCBuilderController(
        ICompatibilityService compatibilityService,
        IConfigurationService configurationService,
        IFpsCalculationService fpsCalculationService,
        ILogger<PCBuilderController> logger)
    {
        _compatibilityService = compatibilityService;
        _configurationService = configurationService;
        _fpsCalculationService = fpsCalculationService;
        _logger = logger;
    }

    // ========================================================================
    // POST /api/v1/pcbuilder/check-compatibility
    // ========================================================================

    /// <summary>
    /// Проверить совместимость компонентов конфигурации
    /// </summary>
    /// <remarks>
    /// Принимает список компонентов с их спецификациями и возвращает детальный
    /// результат проверки совместимости. Соответствует OpenAPI: POST /api/v1/pcbuilder/check-compatibility
    /// </remarks>
    /// <param name="request">Запрос с компонентами конфигурации</param>
    /// <returns>Результат проверки совместимости с проблемами, предупреждениями и расчётом мощности</returns>
    /// <response code="200">Результат проверки совместимости</response>
    /// <response code="400">Некорректный запрос</response>
    [HttpPost("check-compatibility")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CompatibilityCheckResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CompatibilityCheckResponse>> CheckCompatibility(
        [FromBody] CompatibilityCheckRequest request)
    {
        if (request?.Components == null)
        {
            return BadRequest(new ValidationProblemDetails
            {
                Title = "Некорректный запрос",
                Detail = "Компоненты конфигурации не указаны"
            });
        }

        _logger.LogInformation("Проверка совместимости конфигурации");

        var result = await _compatibilityService.CheckCompatibilityAsync(request);

        _logger.LogInformation(
            "Результат проверки: IsCompatible={IsCompatible}, Issues={IssueCount}, Warnings={WarningCount}",
            result.Result.IsCompatible, result.Result.Issues.Count, result.Result.Warnings.Count);

        return Ok(result);
    }

    // ========================================================================
    // POST /api/v1/pcbuilder/configurations
    // ========================================================================

    /// <summary>
    /// Сохранить конфигурацию
    /// </summary>
    /// <remarks>
    /// Создаёт новую или обновляет существующую конфигурацию ПК.
    /// Автоматически проверяет совместимость компонентов.
    /// Соответствует OpenAPI: POST /api/v1/pcbuilder/configurations
    /// </remarks>
    /// <param name="dto">Данные конфигурации</param>
    /// <returns>Сохранённая конфигурация</returns>
    /// <response code="201">Конфигурация сохранена</response>
    /// <response code="400">Ошибка валидации</response>
    /// <response code="401">Неавторизован</response>
    [HttpPost("configurations")]
    [Authorize]
    [ProducesResponseType(typeof(PCConfigurationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PCConfigurationDto>> SaveConfiguration(
        [FromBody] PCConfigurationDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { error = "Пользователь не авторизован" });
        }

        var config = MapToConfiguration(dto);
        config.UserId = userId;

        // Проверяем совместимость
        var compatibility = await _compatibilityService.CheckCompatibilityAsync(config);
        config.IsCompatible = compatibility.IsCompatible;

        var saved = await _configurationService.SaveConfigurationAsync(config);

        return CreatedAtAction(nameof(GetConfiguration), new { id = saved.Id }, MapToDto(saved));
    }

    // ========================================================================
    // GET /api/v1/pcbuilder/configurations
    // ========================================================================

    /// <summary>
    /// Получить конфигурации пользователя
    /// </summary>
    /// <remarks>
    /// Возвращает список всех сохранённых конфигураций текущего авторизованного пользователя.
    /// Соответствует OpenAPI: GET /api/v1/pcbuilder/configurations
    /// </remarks>
    /// <param name="page">Номер страницы (по умолчанию 1)</param>
    /// <param name="pageSize">Размер страницы (по умолчанию 20)</param>
    /// <returns>Список конфигураций пользователя</returns>
    /// <response code="200">Список конфигураций</response>
    /// <response code="401">Неавторизован</response>
    [HttpGet("configurations")]
    [Authorize]
    [ProducesResponseType(typeof(IEnumerable<PCConfigurationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<PCConfigurationDto>>> GetUserConfigurations(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { error = "Пользователь не авторизован" });
        }

        var configurations = await _configurationService.GetUserConfigurationsAsync(userId);
        var paged = configurations
            .Skip((page - 1) * pageSize)
            .Take(pageSize);

        return Ok(paged.Select(MapToDto));
    }

    // ========================================================================
    // GET /api/v1/pcbuilder/configurations/{id}
    // ========================================================================

    /// <summary>
    /// Получить сохранённую конфигурацию по ID
    /// </summary>
    /// <param name="id">Идентификатор конфигурации</param>
    /// <returns>Детали конфигурации</returns>
    /// <response code="200">Детали конфигурации</response>
    /// <response code="401">Неавторизован</response>
    /// <response code="404">Конфигурация не найдена</response>
    [HttpGet("configurations/{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(PCConfigurationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PCConfigurationDto>> GetConfiguration(Guid id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized(new { error = "Пользователь не авторизован" });
        }

        var config = await _configurationService.GetConfigurationAsync(id);
        if (config == null)
        {
            return NotFound(new { error = "Конфигурация не найдена", id });
        }

        // Проверка прав доступа - пользователь может видеть только свои конфигурации
        if (config.UserId != currentUserId)
        {
            return Forbid();
        }

        return Ok(MapToDto(config));
    }

    // ========================================================================
    // DELETE /api/v1/pcbuilder/configurations/{id}
    // ========================================================================

    /// <summary>
    /// Удалить конфигурацию
    /// </summary>
    /// <param name="id">Идентификатор конфигурации</param>
    /// <response code="204">Конфигурация удалена</response>
    /// <response code="401">Неавторизован</response>
    /// <response code="404">Конфигурация не найдена</response>
    [HttpDelete("configurations/{id:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteConfiguration(Guid id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var currentUserId))
        {
            return Unauthorized(new { error = "Пользователь не авторизован" });
        }

        var config = await _configurationService.GetConfigurationAsync(id);
        if (config == null)
        {
            return NotFound(new { error = "Конфигурация не найдена", id });
        }

        // Проверка прав доступа - пользователь может удалять только свои конфигурации
        if (config.UserId != currentUserId)
        {
            return Forbid();
        }

        var deleted = await _configurationService.DeleteConfigurationAsync(id);
        if (!deleted)
        {
            return NotFound(new { error = "Конфигурация не найдена", id });
        }
        return NoContent();
    }

    // ========================================================================
    // POST /api/v1/pcbuilder/configurations/{id}/share
    // ========================================================================

    /// <summary>
    /// Сгенерировать ссылку для публичного доступа к конфигурации
    /// </summary>
    /// <remarks>
    /// Генерирует уникальный токен для публичного доступа к конфигурации.
    /// Токен позволяет просматривать конфигурацию без авторизации.
    /// Соответствует OpenAPI: POST /api/v1/pcbuilder/configurations/{id}/share
    /// </remarks>
    /// <param name="id">Идентификатор конфигурации</param>
    /// <returns>Токен для публичного доступа</returns>
    /// <response code="200">Токен успешно сгенерирован</response>
    /// <response code="401">Неавторизован</response>
    /// <response code="404">Конфигурация не найдена</response>
    [HttpPost("configurations/{id:guid}/share")]
    [Authorize]
    [ProducesResponseType(typeof(ShareTokenResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ShareTokenResponse>> GenerateShareToken(Guid id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { error = "Пользователь не авторизован" });
        }

        var shareToken = await _configurationService.GenerateShareTokenAsync(id, userId);
        if (shareToken == null)
        {
            return NotFound(new { error = "Конфигурация не найдена или нет прав доступа", id });
        }

        var shareUrl = $"/pcbuilder/share/{shareToken}";

        _logger.LogInformation("Сгенерирован share-токен для конфигурации {ConfigId}", id);

        return Ok(new ShareTokenResponse
        {
            ShareToken = shareToken,
            ShareUrl = shareUrl
        });
    }

    // ========================================================================
    // GET /api/v1/pcbuilder/share/{token}
    // ========================================================================

    /// <summary>
    /// Получить конфигурацию по токену публичного доступа
    /// </summary>
    /// <remarks>
    /// Возвращает конфигурацию ПК по публичному токену без необходимости авторизации.
    /// Используется для просмотра shared конфигураций.
    /// Соответствует OpenAPI: GET /api/v1/pcbuilder/share/{token}
    /// </remarks>
    /// <param name="token">Токен публичного доступа</param>
    /// <returns>Детали конфигурации</returns>
    /// <response code="200">Детали конфигурации</response>
    /// <response code="404">Конфигурация не найдена или токен недействителен</response>
    [HttpGet("share/{token}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PCConfigurationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PCConfigurationDto>> GetSharedConfiguration(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return BadRequest(new { error = "Токен не указан" });
        }

        var config = await _configurationService.GetConfigurationByShareTokenAsync(token);
        if (config == null)
        {
            return NotFound(new { error = "Конфигурация не найдена или токен недействителен", token });
        }

        _logger.LogInformation("Доступ к shared конфигурации {ConfigId} по токену", config.Id);

        return Ok(MapToDto(config));
    }

    // ========================================================================
    // Вспомогательные endpoints
    // ========================================================================

    /// <summary>
    /// Получить совместимые материнские платы для выбранного процессора
    /// </summary>
    [HttpGet("compatible-motherboards/{processorId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<Guid>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<Guid>>> GetCompatibleMotherboards(Guid processorId)
    {
        var motherboards = await _compatibilityService.GetCompatibleMotherboardsAsync(processorId);
        return Ok(motherboards);
    }

    /// <summary>
    /// Получить совместимую память для выбранной материнской платы
    /// </summary>
    [HttpGet("compatible-ram/{motherboardId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<Guid>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<Guid>>> GetCompatibleRam(Guid motherboardId)
    {
        var ram = await _compatibilityService.GetCompatibleRamAsync(motherboardId);
        return Ok(ram);
    }

    /// <summary>
    /// Рассчитать энергопотребление конфигурации
    /// </summary>
    [HttpPost("calculate-power")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PowerConsumptionResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<PowerConsumptionResult>> CalculatePowerConsumption(
        [FromBody] PCConfigurationDto dto)
    {
        var config = MapToConfiguration(dto);
        var totalPower = await _compatibilityService.CalculateTotalPowerConsumptionAsync(config);

        return Ok(new PowerConsumptionResult
        {
            TotalPowerConsumption = totalPower,
            RecommendedPsuWattage = (int)(totalPower * 1.4),
            MinPsuWattage = (int)(totalPower * 1.2)
        });
    }

    /// <summary>
    /// Рассчитать стоимость конфигурации (интеграция с Catalog Service)
    /// </summary>
    /// <remarks>
    /// Рассчитывает итоговую стоимость с учётом скидок, наличия и промокода.
    /// </remarks>
    [HttpPost("calculate-price")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ConfigurationPriceResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<ConfigurationPriceResult>> CalculatePrice(
        [FromBody] CalculatePriceRequest request)
    {
        var result = await _configurationService.CalculatePriceWithDetailsAsync(
            request.Configuration, request.PromoCode);
        return Ok(result);
    }

    // ========================================================================
    // POST /api/v1/pcbuilder/calculate-fps
    // ========================================================================

    /// <summary>
    /// Рассчитать примерный FPS для конфигурации ПК по заданным CPU/GPU/RAM
    /// </summary>
    /// <remarks>
    /// Возвращает оценку FPS для популярных игр при разных разрешениях.
    /// Использует эвристическую модель на основе tiers GPU/CPU из локального файла.
    /// Если CpuId и GpuId оба null — возвращает нулевые значения.
    /// </remarks>
    /// <param name="request">Запрос с ID CPU/GPU и параметрами RAM</param>
    /// <returns>Оценка FPS для каждой игры и разрешений</returns>
    /// <response code="200">Результат расчёта FPS</response>
    /// <response code="400">Некорректный запрос</response>
    [HttpPost("calculate-fps")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(FpsCalculationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<FpsCalculationResponse>> CalculateFps(
        [FromBody] FpsCalculationRequest request)
    {
        if (request == null)
        {
            return BadRequest(new ValidationProblemDetails
            {
                Title = "Некорректный запрос",
                Detail = "Тело запроса не указано"
            });
        }

        _logger.LogInformation(
            "Расчёт FPS: CpuId={CpuId}, GpuId={GpuId}, RamCapacity={RamCapacity}",
            request.CpuId, request.GpuId, request.RamCapacity);

        var result = await _fpsCalculationService.CalculateFpsAsync(request);

        _logger.LogInformation(
            "Расчёт FPS: OverallScore={OverallScore}, Bottleneck={Bottleneck}",
            result.OverallScore, result.Bottleneck);

        return Ok(result);
    }

    // ========================================================================
    // Mapping
    // ========================================================================

    #region Mapping

    private static PCConfiguration MapToConfiguration(PCConfigurationDto dto)
    {
        return new PCConfiguration
        {
            Id = dto.Id ?? Guid.Empty,
            Name = dto.Name ?? "Новая конфигурация",
            Purpose = dto.Purpose ?? "gaming",
            ProcessorId = dto.ProcessorId,
            MotherboardId = dto.MotherboardId,
            RamId = dto.RamId,
            GpuId = dto.GpuId,
            PsuId = dto.PsuId,
            StorageId = dto.StorageId,
            CaseId = dto.CaseId,
            CoolerId = dto.CoolerId
        };
    }

    private static PCConfigurationDto MapToDto(PCConfiguration config)
    {
        return new PCConfigurationDto
        {
            Id = config.Id,
            Name = config.Name,
            Purpose = config.Purpose,
            ProcessorId = config.ProcessorId,
            MotherboardId = config.MotherboardId,
            RamId = config.RamId,
            GpuId = config.GpuId,
            PsuId = config.PsuId,
            StorageId = config.StorageId,
            CaseId = config.CaseId,
            CoolerId = config.CoolerId,
            TotalPrice = config.TotalPrice,
            IsCompatible = config.IsCompatible,
            ShareToken = config.ShareToken,
            CreatedAt = config.CreatedAt
        };
    }

    #endregion
}
