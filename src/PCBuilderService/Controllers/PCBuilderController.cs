using Microsoft.AspNetCore.Mvc;
using PCBuilderService.DTOs;
using PCBuilderService.Models;
using PCBuilderService.Services;

namespace PCBuilderService.Controllers;

/// <summary>
/// Контроллер конструктора ПК
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
public class PCBuilderController : ControllerBase
{
    private readonly ICompatibilityService _compatibilityService;
    private readonly IConfigurationService _configurationService;
    private readonly ILogger<PCBuilderController> _logger;

    public PCBuilderController(
        ICompatibilityService compatibilityService,
        IConfigurationService configurationService,
        ILogger<PCBuilderController> logger)
    {
        _compatibilityService = compatibilityService;
        _configurationService = configurationService;
        _logger = logger;
    }

    /// <summary>
    /// Проверить совместимость компонентов конфигурации (новый endpoint по OpenAPI контракту)
    /// </summary>
    /// <remarks>
    /// Принимает список компонентов с их спецификациями и возвращает детальный результат проверки совместимости.
    /// Соответствует OpenAPI спецификации: POST /api/v1/pcbuilder/check-compatibility
    /// </remarks>
    /// <param name="request">Запрос с компонентами конфигурации</param>
    /// <returns>Результат проверки совместимости с проблемами, предупреждениями и расчётом мощности</returns>
    [HttpPost("check-compatibility")]
    [ProducesResponseType(typeof(CompatibilityCheckResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CompatibilityCheckResponse>> CheckCompatibility([FromBody] CompatibilityCheckRequest request)
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
        
        _logger.LogInformation("Результат проверки: IsCompatible={IsCompatible}, Issues={IssueCount}, Warnings={WarningCount}",
            result.Result.IsCompatible, result.Result.Issues.Count, result.Result.Warnings.Count);
        
        return Ok(result);
    }

    /// <summary>
    /// Проверить совместимость конфигурации (старый endpoint для обратной совместимости)
    /// </summary>
    /// <remarks>
    /// Устаревший endpoint. Используйте POST check-compatibility с новым форматом запроса.
    /// </remarks>
    [Obsolete("Используйте POST check-compatibility с CompatibilityCheckRequest")]
    [HttpPost("check-compatibility-legacy")]
    [ProducesResponseType(typeof(CompatibilityResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<CompatibilityResult>> CheckCompatibilityLegacy([FromBody] PCConfigurationDto dto)
    {
        var config = MapToConfiguration(dto);
        var result = await _compatibilityService.CheckCompatibilityAsync(config);
        return Ok(result);
    }

    /// <summary>
    /// Получить совместимые материнские платы для выбранного процессора
    /// </summary>
    [HttpGet("compatible-motherboards/{processorId:guid}")]
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
    [ProducesResponseType(typeof(PowerConsumptionResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<PowerConsumptionResult>> CalculatePowerConsumption([FromBody] PCConfigurationDto dto)
    {
        var config = MapToConfiguration(dto);
        var totalPower = await _compatibilityService.CalculateTotalPowerConsumptionAsync(config);
        
        return Ok(new PowerConsumptionResult
        {
            TotalPowerConsumption = totalPower,
            RecommendedPsuWattage = (int)(totalPower * 1.4), // 40% запас
            MinPsuWattage = (int)(totalPower * 1.2)  // 20% минимум
        });
    }

    /// <summary>
    /// Сохранить конфигурацию (для авторизованных пользователей)
    /// </summary>
    [HttpPost("configurations")]
    [ProducesResponseType(typeof(PCConfigurationDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<PCConfigurationDto>> SaveConfiguration([FromBody] PCConfigurationDto dto)
    {
        // TODO: Получить userId из JWT токена после интеграции с Auth
        var userId = Guid.Parse("00000000-0000-0000-0000-000000000000"); // Заглушка
        
        var config = MapToConfiguration(dto);
        config.UserId = userId;
        
        // Проверяем совместимость
        var compatibility = await _compatibilityService.CheckCompatibilityAsync(config);
        config.IsCompatible = compatibility.IsCompatible;
        
        var saved = await _configurationService.SaveConfigurationAsync(config);
        
        return CreatedAtAction(nameof(GetConfiguration), new { id = saved.Id }, MapToDto(saved));
    }

    /// <summary>
    /// Получить сохранённую конфигурацию
    /// </summary>
    [HttpGet("configurations/{id:guid}")]
    [ProducesResponseType(typeof(PCConfigurationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PCConfigurationDto>> GetConfiguration(Guid id)
    {
        var config = await _configurationService.GetConfigurationAsync(id);
        if (config == null)
        {
            return NotFound(new { error = "Конфигурация не найдена", id });
        }
        return Ok(MapToDto(config));
    }

    /// <summary>
    /// Получить конфигурации пользователя
    /// </summary>
    [HttpGet("configurations")]
    [ProducesResponseType(typeof(IEnumerable<PCConfigurationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PCConfigurationDto>>> GetUserConfigurations()
    {
        // TODO: Получить userId из JWT токена
        var userId = Guid.Parse("00000000-0000-0000-0000-000000000000"); // Заглушка
        
        var configurations = await _configurationService.GetUserConfigurationsAsync(userId);
        return Ok(configurations.Select(MapToDto));
    }

    /// <summary>
    /// Удалить конфигурацию
    /// </summary>
    [HttpDelete("configurations/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteConfiguration(Guid id)
    {
        var deleted = await _configurationService.DeleteConfigurationAsync(id);
        if (!deleted)
        {
            return NotFound(new { error = "Конфигурация не найдена", id });
        }
        return NoContent();
    }

    /// <summary>
    /// Рассчитать стоимость конфигурации (интеграция с Catalog Service)
    /// </summary>
    [HttpPost("calculate-price")]
    [ProducesResponseType(typeof(ConfigurationPriceResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<ConfigurationPriceResult>> CalculatePrice([FromBody] PCConfigurationDto dto)
    {
        // Заглушка - в реальности будет запрос к Catalog Service
        // для получения цен компонентов по их ID
        
        var result = new ConfigurationPriceResult
        {
            TotalPrice = await _configurationService.CalculateTotalPriceAsync(dto),
            Components = new List<ComponentPrice>
            {
                // Пример заглушки
            }
        };
        
        return Ok(result);
    }

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
            CreatedAt = config.CreatedAt
        };
    }

    #endregion
}

/// <summary>
/// DTO для конфигурации ПК
/// </summary>
public record PCConfigurationDto
{
    public Guid? Id { get; init; }
    public string? Name { get; init; }
    public string? Purpose { get; init; }
    public Guid? ProcessorId { get; init; }
    public Guid? MotherboardId { get; init; }
    public Guid? RamId { get; init; }
    public Guid? GpuId { get; init; }
    public Guid? PsuId { get; init; }
    public Guid? StorageId { get; init; }
    public Guid? CaseId { get; init; }
    public Guid? CoolerId { get; init; }
    public decimal? TotalPrice { get; init; }
    public bool? IsCompatible { get; init; }
    public DateTime? CreatedAt { get; init; }
}

/// <summary>
/// Результат расчёта энергопотребления
/// </summary>
public record PowerConsumptionResult
{
    public int TotalPowerConsumption { get; init; }
    public int RecommendedPsuWattage { get; init; }
    public int MinPsuWattage { get; init; }
}

/// <summary>
/// Результат расчёта стоимости
/// </summary>
public record ConfigurationPriceResult
{
    public decimal TotalPrice { get; init; }
    public List<ComponentPrice> Components { get; init; } = new();
}

/// <summary>
/// Цена компонента
/// </summary>
public record ComponentPrice
{
    public Guid ProductId { get; init; }
    public string ComponentType { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public decimal Price { get; init; }
}

/// <summary>
/// Интерфейс сервиса управления конфигурациями
/// </summary>
public interface IConfigurationService
{
    Task<PCConfiguration?> GetConfigurationAsync(Guid id);
    Task<IEnumerable<PCConfiguration>> GetUserConfigurationsAsync(Guid userId);
    Task<PCConfiguration> SaveConfigurationAsync(PCConfiguration config);
    Task<bool> DeleteConfigurationAsync(Guid id);
    Task<decimal> CalculateTotalPriceAsync(PCConfigurationDto dto);
}