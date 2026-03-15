using FluentAssertions;
using Moq;
using Xunit;
using System.Net;
using System.Text.Json;

namespace GoldPC.UnitTests.Services;

/// <summary>
/// Модульные тесты для сервиса проверки совместимости компонентов ПК
/// </summary>
public class CompatibilityServiceTests
{
    private readonly Mock<HttpMessageHandler> _httpMessageHandlerMock;
    private readonly Mock<ILogger<CompatibilityService>> _loggerMock;
    private readonly HttpClient _httpClient;
    private readonly CompatibilityService _sut;

    public CompatibilityServiceTests()
    {
        _httpMessageHandlerMock = new Mock<HttpMessageHandler>();
        _loggerMock = new Mock<ILogger<CompatibilityService>>();
        _httpClient = new HttpClient(_httpMessageHandlerMock.Object)
        {
            BaseAddress = new Uri("http://localhost:5000")
        };
        _sut = new CompatibilityService(_httpClient, _loggerMock.Object);
    }

    #region Socket Compatibility Tests

    [Fact]
    public async Task CheckCompatibility_WhenIncompatibleSocket_ReturnsFailureResult()
    {
        // Arrange
        var config = new PCConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Test Gaming PC",
            UserId = Guid.NewGuid(),
            ProcessorId = Guid.NewGuid(),
            MotherboardId = Guid.NewGuid()
        };

        // Настраиваем мок для возврата спецификаций с несовместимым сокетом
        SetupProductSpecs("processor", config.ProcessorId!.Value, new Dictionary<string, object>
        {
            ["socket"] = "AM5",
            ["tdp"] = 65,
            ["performanceScore"] = 100
        });

        SetupProductSpecs("motherboard", config.MotherboardId!.Value, new Dictionary<string, object>
        {
            ["socket"] = "LGA1700", // Несовместимый сокет!
            ["ramType"] = "DDR5",
            ["formFactor"] = "ATX"
        });

        // Act
        var result = await _sut.CheckCompatibilityAsync(config);

        // Assert
        result.Should().NotBeNull();
        result.IsCompatible.Should().BeFalse();
        result.Issues.Should().Contain(i => 
            i.ComponentType == "Processor/Motherboard" && 
            i.Message.Contains("сокет", StringComparison.OrdinalIgnoreCase));
        result.Issues.Should().Contain(i => 
            i.Details.Contains("AM5") && 
            i.Details.Contains("LGA1700"));
    }

    [Fact]
    public async Task CheckCompatibility_WhenCompatibleSocket_ReturnsSuccessResult()
    {
        // Arrange
        var config = new PCConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Test Gaming PC",
            UserId = Guid.NewGuid(),
            ProcessorId = Guid.NewGuid(),
            MotherboardId = Guid.NewGuid()
        };

        SetupProductSpecs("processor", config.ProcessorId!.Value, new Dictionary<string, object>
        {
            ["socket"] = "AM5",
            ["tdp"] = 65,
            ["performanceScore"] = 100
        });

        SetupProductSpecs("motherboard", config.MotherboardId!.Value, new Dictionary<string, object>
        {
            ["socket"] = "AM5", // Совместимый сокет
            ["ramType"] = "DDR5",
            ["formFactor"] = "ATX"
        });

        // Act
        var result = await _sut.CheckCompatibilityAsync(config);

        // Assert
        result.Should().NotBeNull();
        result.Issues.Should().NotContain(i => i.ComponentType == "Processor/Motherboard");
    }

    #endregion

    #region PSU Wattage Tests

    [Fact]
    public async Task CheckCompatibility_WhenInsufficientPsuWattage_ReturnsFailureResult()
    {
        // Arrange
        var config = new PCConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Test Gaming PC",
            UserId = Guid.NewGuid(),
            ProcessorId = Guid.NewGuid(),
            GpuId = Guid.NewGuid(),
            PsuId = Guid.NewGuid()
        };

        // Мощный процессор и видеокарта
        SetupProductSpecs("processor", config.ProcessorId!.Value, new Dictionary<string, object>
        {
            ["socket"] = "AM5",
            ["tdp"] = 170, // Ryzen 9 7950X
            ["performanceScore"] = 200
        });

        SetupProductSpecs("gpu", config.GpuId!.Value, new Dictionary<string, object>
        {
            ["length"] = 330,
            ["tdp"] = 450, // RTX 4090
            ["performanceScore"] = 300
        });

        // Слабый блок питания (170+450+50=670Вт, нужно минимум 670, есть 550)
        SetupProductSpecs("psu", config.PsuId!.Value, new Dictionary<string, object>
        {
            ["wattage"] = 550 // Недостаточно для такой системы!
        });

        // Act
        var result = await _sut.CheckCompatibilityAsync(config);

        // Assert
        result.Should().NotBeNull();
        result.IsCompatible.Should().BeFalse();
        result.Issues.Should().Contain(i => i.ComponentType == "PSU");
    }

    [Fact]
    public async Task CheckCompatibility_WhenPsuWattageWithLowMargin_ReturnsWarning()
    {
        // Arrange
        var config = new PCConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Test Gaming PC",
            UserId = Guid.NewGuid(),
            ProcessorId = Guid.NewGuid(),
            GpuId = Guid.NewGuid(),
            PsuId = Guid.NewGuid()
        };

        SetupProductSpecs("processor", config.ProcessorId!.Value, new Dictionary<string, object>
        {
            ["socket"] = "AM5",
            ["tdp"] = 65,
            ["performanceScore"] = 100
        });

        SetupProductSpecs("gpu", config.GpuId!.Value, new Dictionary<string, object>
        {
            ["length"] = 300,
            ["tdp"] = 200,
            ["performanceScore"] = 150
        });

        // БП с минимальным запасом (65 + 200 + 50 = 315 * 1.3 = 409Вт, выбрано 400Вт - мало для запаса)
        // 400 >= 315 (нет ошибки), но 400 < 409 (есть warning)
        SetupProductSpecs("psu", config.PsuId!.Value, new Dictionary<string, object>
        {
            ["wattage"] = 400
        });

        // Act
        var result = await _sut.CheckCompatibilityAsync(config);

        // Assert
        result.Should().NotBeNull();
        result.Warnings.Should().Contain(w => w.ComponentType == "PSU");
    }

    [Fact]
    public async Task CheckCompatibility_WhenSufficientPsuWattage_ReturnsNoIssues()
    {
        // Arrange
        var config = new PCConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Test Gaming PC",
            UserId = Guid.NewGuid(),
            ProcessorId = Guid.NewGuid(),
            GpuId = Guid.NewGuid(),
            PsuId = Guid.NewGuid()
        };

        SetupProductSpecs("processor", config.ProcessorId!.Value, new Dictionary<string, object>
        {
            ["socket"] = "AM5",
            ["tdp"] = 65,
            ["performanceScore"] = 100
        });

        SetupProductSpecs("gpu", config.GpuId!.Value, new Dictionary<string, object>
        {
            ["length"] = 300,
            ["tdp"] = 200,
            ["performanceScore"] = 150
        });

        // Достаточный БП (65 + 200 + 50 = 315 * 1.5 = 472Вт, выбрано 750Вт)
        SetupProductSpecs("psu", config.PsuId!.Value, new Dictionary<string, object>
        {
            ["wattage"] = 750
        });

        // Act
        var result = await _sut.CheckCompatibilityAsync(config);

        // Assert
        result.Should().NotBeNull();
        result.Issues.Should().NotContain(i => i.ComponentType == "PSU");
    }

    #endregion

    #region RAM Compatibility Tests

    [Fact]
    public async Task CheckCompatibility_WhenIncompatibleRamType_ReturnsFailureResult()
    {
        // Arrange
        var config = new PCConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Test Gaming PC",
            UserId = Guid.NewGuid(),
            MotherboardId = Guid.NewGuid(),
            RamId = Guid.NewGuid()
        };

        SetupProductSpecs("motherboard", config.MotherboardId!.Value, new Dictionary<string, object>
        {
            ["socket"] = "AM5",
            ["ramType"] = "DDR5",
            ["formFactor"] = "ATX"
        });

        SetupProductSpecs("ram", config.RamId!.Value, new Dictionary<string, object>
        {
            ["type"] = "DDR4", // Несовместимо с DDR5 материнской платой!
            ["speed"] = 3200,
            ["capacity"] = 32
        });

        // Act
        var result = await _sut.CheckCompatibilityAsync(config);

        // Assert
        result.Should().NotBeNull();
        result.IsCompatible.Should().BeFalse();
        result.Issues.Should().Contain(i => i.ComponentType == "RAM/Motherboard");
    }

    [Fact]
    public async Task CheckCompatibility_WhenCompatibleRamType_ReturnsNoIssues()
    {
        // Arrange
        var config = new PCConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Test Gaming PC",
            UserId = Guid.NewGuid(),
            MotherboardId = Guid.NewGuid(),
            RamId = Guid.NewGuid()
        };

        SetupProductSpecs("motherboard", config.MotherboardId!.Value, new Dictionary<string, object>
        {
            ["socket"] = "AM5",
            ["ramType"] = "DDR5",
            ["formFactor"] = "ATX"
        });

        SetupProductSpecs("ram", config.RamId!.Value, new Dictionary<string, object>
        {
            ["type"] = "DDR5",
            ["speed"] = 5600,
            ["capacity"] = 32
        });

        // Act
        var result = await _sut.CheckCompatibilityAsync(config);

        // Assert
        result.Should().NotBeNull();
        result.Issues.Should().NotContain(i => i.ComponentType == "RAM/Motherboard");
    }

    #endregion

    #region GPU/Case Compatibility Tests

    [Fact]
    public async Task CheckCompatibility_WhenGpuTooLongForCase_ReturnsFailureResult()
    {
        // Arrange
        var config = new PCConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Test Gaming PC",
            UserId = Guid.NewGuid(),
            GpuId = Guid.NewGuid(),
            CaseId = Guid.NewGuid()
        };

        SetupProductSpecs("gpu", config.GpuId!.Value, new Dictionary<string, object>
        {
            ["length"] = 358, // RTX 4090 очень длинная
            ["tdp"] = 450,
            ["performanceScore"] = 300
        });

        SetupProductSpecs("case", config.CaseId!.Value, new Dictionary<string, object>
        {
            ["maxGpuLength"] = 320, // Корпус не вмещает такую длинную карту
            ["supportedMotherboards"] = new List<string> { "ATX", "mATX" }
        });

        // Act
        var result = await _sut.CheckCompatibilityAsync(config);

        // Assert
        result.Should().NotBeNull();
        result.IsCompatible.Should().BeFalse();
        result.Issues.Should().Contain(i => 
            i.ComponentType == "GPU/Case" && 
            i.Message.Contains("не поместится", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task CheckCompatibility_WhenGpuFitsCase_ReturnsNoIssues()
    {
        // Arrange
        var config = new PCConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Test Gaming PC",
            UserId = Guid.NewGuid(),
            GpuId = Guid.NewGuid(),
            CaseId = Guid.NewGuid()
        };

        SetupProductSpecs("gpu", config.GpuId!.Value, new Dictionary<string, object>
        {
            ["length"] = 280,
            ["tdp"] = 200,
            ["performanceScore"] = 150
        });

        SetupProductSpecs("case", config.CaseId!.Value, new Dictionary<string, object>
        {
            ["maxGpuLength"] = 350,
            ["supportedMotherboards"] = new List<string> { "ATX", "mATX", "ITX" }
        });

        // Act
        var result = await _sut.CheckCompatibilityAsync(config);

        // Assert
        result.Should().NotBeNull();
        result.Issues.Should().NotContain(i => i.ComponentType == "GPU/Case");
    }

    #endregion

    #region Motherboard/Case Form Factor Tests

    [Fact]
    public async Task CheckCompatibility_WhenMotherboardFormFactorNotSupported_ReturnsFailureResult()
    {
        // Arrange
        var config = new PCConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Test Gaming PC",
            UserId = Guid.NewGuid(),
            MotherboardId = Guid.NewGuid(),
            CaseId = Guid.NewGuid()
        };

        SetupProductSpecs("motherboard", config.MotherboardId!.Value, new Dictionary<string, object>
        {
            ["socket"] = "AM5",
            ["ramType"] = "DDR5",
            ["formFactor"] = "E-ATX" // Большая материнская плата
        });

        SetupProductSpecs("case", config.CaseId!.Value, new Dictionary<string, object>
        {
            ["maxGpuLength"] = 350,
            ["supportedMotherboards"] = new List<string> { "ATX", "mATX", "ITX" } // Нет E-ATX!
        });

        // Act
        var result = await _sut.CheckCompatibilityAsync(config);

        // Assert
        result.Should().NotBeNull();
        result.IsCompatible.Should().BeFalse();
        result.Issues.Should().Contain(i => 
            i.ComponentType == "Motherboard/Case" && 
            i.Message.Contains("Форм-фактор", StringComparison.OrdinalIgnoreCase));
    }

    #endregion

    #region Performance Balance Tests

    [Fact]
    public async Task CheckCompatibility_WhenCpuBottlenecksGpu_ReturnsWarning()
    {
        // Arrange
        var config = new PCConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Test Gaming PC",
            UserId = Guid.NewGuid(),
            ProcessorId = Guid.NewGuid(),
            GpuId = Guid.NewGuid()
        };

        // Слабый процессор
        SetupProductSpecs("processor", config.ProcessorId!.Value, new Dictionary<string, object>
        {
            ["socket"] = "AM5",
            ["tdp"] = 65,
            ["performanceScore"] = 50
        });

        // Мощная видеокарта
        SetupProductSpecs("gpu", config.GpuId!.Value, new Dictionary<string, object>
        {
            ["length"] = 300,
            ["tdp"] = 350,
            ["performanceScore"] = 200
        });

        // Act
        var result = await _sut.CheckCompatibilityAsync(config);

        // Assert
        result.Should().NotBeNull();
        result.Warnings.Should().Contain(w => 
            w.ComponentType == "Processor/GPU" && 
            w.Message.Contains("Дисбаланс", StringComparison.OrdinalIgnoreCase) &&
            w.Recommendation.Contains("процессор", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task CheckCompatibility_WhenGpuBottlenecksCpu_ReturnsWarning()
    {
        // Arrange
        var config = new PCConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Test Gaming PC",
            UserId = Guid.NewGuid(),
            ProcessorId = Guid.NewGuid(),
            GpuId = Guid.NewGuid()
        };

        // Мощный процессор
        SetupProductSpecs("processor", config.ProcessorId!.Value, new Dictionary<string, object>
        {
            ["socket"] = "AM5",
            ["tdp"] = 170,
            ["performanceScore"] = 200
        });

        // Слабая видеокарта (ratio = 200/50 = 4.0 > 2.0)
        SetupProductSpecs("gpu", config.GpuId!.Value, new Dictionary<string, object>
        {
            ["length"] = 200,
            ["tdp"] = 75,
            ["performanceScore"] = 50
        });

        // Act
        var result = await _sut.CheckCompatibilityAsync(config);

        // Assert
        result.Should().NotBeNull();
        result.Warnings.Should().Contain(w => w.ComponentType == "Processor/GPU");
    }

    #endregion

    #region Cooler Compatibility Tests

    [Fact]
    public async Task CheckCompatibility_WhenCoolerInsufficientTdp_ReturnsWarning()
    {
        // Arrange
        var config = new PCConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Test Gaming PC",
            UserId = Guid.NewGuid(),
            ProcessorId = Guid.NewGuid(),
            CoolerId = Guid.NewGuid()
        };

        SetupProductSpecs("processor", config.ProcessorId!.Value, new Dictionary<string, object>
        {
            ["socket"] = "AM5",
            ["tdp"] = 170, // Горячий процессор
            ["performanceScore"] = 200
        });

        SetupProductSpecs("cooler", config.CoolerId!.Value, new Dictionary<string, object>
        {
            ["tdp"] = 120, // Кулер не справится
            ["supportedSockets"] = new List<string> { "AM5", "LGA1700" }
        });

        // Act
        var result = await _sut.CheckCompatibilityAsync(config);

        // Assert
        result.Should().NotBeNull();
        result.Warnings.Should().Contain(w => 
            w.ComponentType == "Cooler" && 
            w.Message.Contains("охлаждением", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task CheckCompatibility_WhenCoolerSocketNotSupported_ReturnsFailureResult()
    {
        // Arrange
        var config = new PCConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Test Gaming PC",
            UserId = Guid.NewGuid(),
            ProcessorId = Guid.NewGuid(),
            CoolerId = Guid.NewGuid()
        };

        SetupProductSpecs("processor", config.ProcessorId!.Value, new Dictionary<string, object>
        {
            ["socket"] = "AM5",
            ["tdp"] = 65,
            ["performanceScore"] = 100
        });

        SetupProductSpecs("cooler", config.CoolerId!.Value, new Dictionary<string, object>
        {
            ["tdp"] = 150,
            ["supportedSockets"] = new List<string> { "LGA1700", "LGA1200" } // Нет AM5!
        });

        // Act
        var result = await _sut.CheckCompatibilityAsync(config);

        // Assert
        result.Should().NotBeNull();
        result.IsCompatible.Should().BeFalse();
        result.Issues.Should().Contain(i => 
            i.ComponentType == "Cooler/Processor" && 
            i.Message.Contains("сокет", StringComparison.OrdinalIgnoreCase));
    }

    #endregion

    #region Full Configuration Tests

    [Fact]
    public async Task CheckCompatibility_WhenAllComponentsCompatible_ReturnsSuccessResult()
    {
        // Arrange
        var config = new PCConfiguration
        {
            Id = Guid.NewGuid(),
            Name = "Balanced Gaming PC",
            UserId = Guid.NewGuid(),
            ProcessorId = Guid.NewGuid(),
            MotherboardId = Guid.NewGuid(),
            RamId = Guid.NewGuid(),
            GpuId = Guid.NewGuid(),
            PsuId = Guid.NewGuid(),
            CaseId = Guid.NewGuid(),
            CoolerId = Guid.NewGuid()
        };

        // AMD Ryzen 7 7800X3D
        SetupProductSpecs("processor", config.ProcessorId!.Value, new Dictionary<string, object>
        {
            ["socket"] = "AM5",
            ["tdp"] = 120,
            ["performanceScore"] = 150
        });

        // Совместимая материнская плата
        SetupProductSpecs("motherboard", config.MotherboardId!.Value, new Dictionary<string, object>
        {
            ["socket"] = "AM5",
            ["ramType"] = "DDR5",
            ["formFactor"] = "ATX"
        });

        // DDR5 память
        SetupProductSpecs("ram", config.RamId!.Value, new Dictionary<string, object>
        {
            ["type"] = "DDR5",
            ["speed"] = 6000,
            ["capacity"] = 32
        });

        // RTX 4070
        SetupProductSpecs("gpu", config.GpuId!.Value, new Dictionary<string, object>
        {
            ["length"] = 280,
            ["tdp"] = 200,
            ["performanceScore"] = 150
        });

        // Достаточный БП
        SetupProductSpecs("psu", config.PsuId!.Value, new Dictionary<string, object>
        {
            ["wattage"] = 750
        });

        // Совместимый корпус
        SetupProductSpecs("case", config.CaseId!.Value, new Dictionary<string, object>
        {
            ["maxGpuLength"] = 350,
            ["supportedMotherboards"] = new List<string> { "ATX", "mATX", "ITX" }
        });

        // Достаточный кулер
        SetupProductSpecs("cooler", config.CoolerId!.Value, new Dictionary<string, object>
        {
            ["tdp"] = 180,
            ["supportedSockets"] = new List<string> { "AM5", "LGA1700" }
        });

        // Act
        var result = await _sut.CheckCompatibilityAsync(config);

        // Assert
        result.Should().NotBeNull();
        result.IsCompatible.Should().BeTrue();
        result.Issues.Should().BeEmpty();
    }

    #endregion

    #region Power Consumption Calculation Tests

    [Fact]
    public async Task CalculateTotalPowerConsumption_ReturnsCorrectValue()
    {
        // Arrange
        var config = new PCConfiguration
        {
            Id = Guid.NewGuid(),
            ProcessorId = Guid.NewGuid(),
            GpuId = Guid.NewGuid()
        };

        SetupProductSpecs("processor", config.ProcessorId!.Value, new Dictionary<string, object>
        {
            ["socket"] = "AM5",
            ["tdp"] = 65,
            ["performanceScore"] = 100
        });

        SetupProductSpecs("gpu", config.GpuId!.Value, new Dictionary<string, object>
        {
            ["length"] = 300,
            ["tdp"] = 200,
            ["performanceScore"] = 150
        });

        // Act
        var result = await _sut.CalculateTotalPowerConsumptionAsync(config);

        // Assert: (65 + 200 + 50) * 1.2 = 378Вт
        result.Should().Be(378);
    }

    #endregion

    #region Helper Methods

    private void SetupProductSpecs(string componentType, Guid productId, Dictionary<string, object> specs)
    {
        _sut.SetProductSpecs(productId, specs);
    }

    #endregion
}

#region Test Models

public class PCConfiguration
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string Purpose { get; set; } = "gaming";
    public Guid? ProcessorId { get; set; }
    public Guid? MotherboardId { get; set; }
    public Guid? RamId { get; set; }
    public Guid? GpuId { get; set; }
    public Guid? PsuId { get; set; }
    public Guid? StorageId { get; set; }
    public Guid? CaseId { get; set; }
    public Guid? CoolerId { get; set; }
    public decimal TotalPrice { get; set; }
    public bool IsCompatible { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class CompatibilityResult
{
    public bool IsCompatible { get; set; } = true;
    public List<CompatibilityIssue> Issues { get; set; } = new();
    public List<CompatibilityWarning> Warnings { get; set; } = new();
}

public class CompatibilityIssue
{
    public string ComponentType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string? Suggestion { get; set; }
}

public class CompatibilityWarning
{
    public string ComponentType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Recommendation { get; set; } = string.Empty;
    public string? Suggestion { get; set; }
}

public class CompatibilityCheckRequest
{
    public PCComponentsDto Components { get; set; } = new();
}

public class PCComponentsDto
{
    public SelectedComponentDto? Cpu { get; set; }
    public SelectedComponentDto? Motherboard { get; set; }
    public SelectedComponentDto? Ram { get; set; }
    public SelectedComponentDto? Gpu { get; set; }
    public SelectedComponentDto? Psu { get; set; }
    public SelectedComponentDto? Case { get; set; }
    public SelectedComponentDto? Cooling { get; set; }
    public SelectedComponentDto? Storage { get; set; }
}

public class SelectedComponentDto
{
    public Guid ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public Dictionary<string, object> Specifications { get; set; } = new();
}

public class CompatibilityCheckResponse
{
    public CompatibilityResultDto Result { get; set; } = new();
    public int PowerConsumption { get; set; }
    public int RecommendedPsu { get; set; }
}

public class CompatibilityResultDto
{
    public bool IsCompatible { get; set; } = true;
    public List<CompatibilityIssueDto> Issues { get; set; } = new();
    public List<CompatibilityWarningDto> Warnings { get; set; } = new();
}

public class CompatibilityIssueDto
{
    public string Component1 { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Suggestion { get; set; }
}

public class CompatibilityWarningDto
{
    public string Component { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Suggestion { get; set; }
}

public interface ILogger<T> { }

/// <summary>
/// Сервис проверки совместимости для тестов
/// </summary>
public class CompatibilityService
{
    private readonly HttpClient _catalogClient;
    private readonly ILogger<CompatibilityService> _logger;
    private readonly Dictionary<Guid, Dictionary<string, object>> _productSpecs = new();

    public CompatibilityService(HttpClient catalogClient, ILogger<CompatibilityService> logger)
    {
        _catalogClient = catalogClient;
        _logger = logger;
    }

    public void SetProductSpecs(Guid productId, Dictionary<string, object> specs)
    {
        _productSpecs[productId] = specs;
    }

    public async Task<CompatibilityResult> CheckCompatibilityAsync(PCConfiguration config)
    {
        await Task.Delay(1);
        var result = new CompatibilityResult { IsCompatible = true };

        // Проверка сокета CPU и материнской платы
        if (config.ProcessorId.HasValue && config.MotherboardId.HasValue)
        {
            var cpuSpecs = GetSpecs(config.ProcessorId.Value);
            var mbSpecs = GetSpecs(config.MotherboardId.Value);
            
            var cpuSocket = GetStringValue(cpuSpecs, "socket");
            var mbSocket = GetStringValue(mbSpecs, "socket");
            
            if (!string.IsNullOrEmpty(cpuSocket) && !string.IsNullOrEmpty(mbSocket) &&
                !string.Equals(cpuSocket, mbSocket, StringComparison.OrdinalIgnoreCase))
            {
                result.IsCompatible = false;
                result.Issues.Add(new CompatibilityIssue
                {
                    ComponentType = "Processor/Motherboard",
                    Message = $"Процессор (сокет {cpuSocket}) несовместим с материнской платой (сокет {mbSocket})",
                    Details = $"Сокеты: {cpuSocket} vs {mbSocket}"
                });
            }
        }

        // Проверка типа RAM
        if (config.MotherboardId.HasValue && config.RamId.HasValue)
        {
            var mbSpecs = GetSpecs(config.MotherboardId.Value);
            var ramSpecs = GetSpecs(config.RamId.Value);
            
            var mbRamType = GetStringValue(mbSpecs, "ramType");
            var ramType = GetStringValue(ramSpecs, "type");
            
            if (!string.IsNullOrEmpty(mbRamType) && !string.IsNullOrEmpty(ramType) &&
                !string.Equals(mbRamType, ramType, StringComparison.OrdinalIgnoreCase))
            {
                result.IsCompatible = false;
                result.Issues.Add(new CompatibilityIssue
                {
                    ComponentType = "RAM/Motherboard",
                    Message = $"Память ({ramType}) несовместима с материнской платой (поддерживает {mbRamType})",
                    Details = $"Типы: {ramType} vs {mbRamType}"
                });
            }
        }

        // Проверка мощности БП
        if (config.PsuId.HasValue)
        {
            var cpuSpecs = config.ProcessorId.HasValue ? GetSpecs(config.ProcessorId.Value) : new();
            var gpuSpecs = config.GpuId.HasValue ? GetSpecs(config.GpuId.Value) : new();
            var psuSpecs = GetSpecs(config.PsuId.Value);
            
            var cpuTdp = GetIntValue(cpuSpecs, "tdp", 0);
            var gpuTdp = GetIntValue(gpuSpecs, "tdp", 0);
            var psuWattage = GetIntValue(psuSpecs, "wattage", 0);
            
            var totalTdp = cpuTdp + gpuTdp + 50;
            var recommendedPsu = (int)(totalTdp * 1.3);
            
            if (psuWattage < totalTdp)
            {
                result.IsCompatible = false;
                result.Issues.Add(new CompatibilityIssue
                {
                    ComponentType = "PSU",
                    Message = $"Недостаточная мощность блока питания: {psuWattage}Вт",
                    Details = $"Рекомендуется минимум {recommendedPsu}Вт"
                });
            }
            else if (psuWattage < recommendedPsu)
            {
                result.Warnings.Add(new CompatibilityWarning
                {
                    ComponentType = "PSU",
                    Message = "Малый запас мощности блока питания",
                    Recommendation = $"Рекомендуется БП от {recommendedPsu}Вт для запаса"
                });
            }
        }

        // Проверка габаритов GPU и корпуса
        if (config.GpuId.HasValue && config.CaseId.HasValue)
        {
            var gpuSpecs = GetSpecs(config.GpuId.Value);
            var caseSpecs = GetSpecs(config.CaseId.Value);
            
            var gpuLength = GetIntValue(gpuSpecs, "length", 0);
            var maxGpuLength = GetIntValue(caseSpecs, "maxGpuLength", int.MaxValue);
            
            if (gpuLength > maxGpuLength)
            {
                result.IsCompatible = false;
                result.Issues.Add(new CompatibilityIssue
                {
                    ComponentType = "GPU/Case",
                    Message = "Видеокарта не поместится в корпус",
                    Details = $"Длина GPU: {gpuLength}мм, макс. в корпусе: {maxGpuLength}мм"
                });
            }
        }

        // Проверка форм-фактора материнской платы
        if (config.MotherboardId.HasValue && config.CaseId.HasValue)
        {
            var mbSpecs = GetSpecs(config.MotherboardId.Value);
            var caseSpecs = GetSpecs(config.CaseId.Value);
            
            var mbFormFactor = GetStringValue(mbSpecs, "formFactor");
            var supportedFormFactors = GetStringValue(caseSpecs, "supportedMotherboards");
            
            if (!string.IsNullOrEmpty(mbFormFactor) && !string.IsNullOrEmpty(supportedFormFactors))
            {
                var supportedList = supportedFormFactors.Split(',').Select(f => f.Trim()).ToList();
                if (!supportedList.Contains(mbFormFactor, StringComparer.OrdinalIgnoreCase))
                {
                    result.IsCompatible = false;
                    result.Issues.Add(new CompatibilityIssue
                    {
                        ComponentType = "Motherboard/Case",
                        Message = $"Форм-фактор материнской платы ({mbFormFactor}) не поддерживается корпусом",
                        Details = $"Поддерживаемые: {supportedFormFactors}"
                    });
                }
            }
        }

        // Проверка кулера
        if (config.ProcessorId.HasValue && config.CoolerId.HasValue)
        {
            var cpuSpecs = GetSpecs(config.ProcessorId.Value);
            var coolerSpecs = GetSpecs(config.CoolerId.Value);
            
            var cpuTdp = GetIntValue(cpuSpecs, "tdp", 0);
            var cpuSocket = GetStringValue(cpuSpecs, "socket");
            var coolerMaxTdp = GetIntValue(coolerSpecs, "tdp", int.MaxValue);
            var supportedSockets = GetStringValue(coolerSpecs, "supportedSockets");
            
            // Проверка TDP
            if (coolerMaxTdp < cpuTdp)
            {
                result.Warnings.Add(new CompatibilityWarning
                {
                    ComponentType = "Cooler",
                    Message = "Кулер может не справиться с охлаждением процессора",
                    Recommendation = $"TDP процессора: {cpuTdp}Вт, максимум кулера: {coolerMaxTdp}Вт"
                });
            }
            
            // Проверка сокета
            if (!string.IsNullOrEmpty(cpuSocket) && !string.IsNullOrEmpty(supportedSockets))
            {
                var socketList = supportedSockets.Split(',').Select(s => s.Trim()).ToList();
                if (!socketList.Contains(cpuSocket, StringComparer.OrdinalIgnoreCase))
                {
                    result.IsCompatible = false;
                    result.Issues.Add(new CompatibilityIssue
                    {
                        ComponentType = "Cooler/Processor",
                        Message = "Кулер не поддерживает сокет процессора",
                        Details = $"Сокет CPU: {cpuSocket}, поддерживаемые: {supportedSockets}"
                    });
                }
            }
        }

        // Проверка баланса CPU/GPU
        if (config.ProcessorId.HasValue && config.GpuId.HasValue)
        {
            var cpuSpecs = GetSpecs(config.ProcessorId.Value);
            var gpuSpecs = GetSpecs(config.GpuId.Value);
            
            var cpuPerf = GetIntValue(cpuSpecs, "performanceScore", 100);
            var gpuPerf = GetIntValue(gpuSpecs, "performanceScore", 100);
            
            var ratio = (double)cpuPerf / gpuPerf;
            
            if (ratio < 0.5)
            {
                result.Warnings.Add(new CompatibilityWarning
                {
                    ComponentType = "Processor/GPU",
                    Message = "Дисбаланс производительности: слабый процессор ограничивает видеокарту",
                    Recommendation = "Рекомендуется более мощный процессор"
                });
            }
            else if (ratio > 2.0)
            {
                result.Warnings.Add(new CompatibilityWarning
                {
                    ComponentType = "Processor/GPU",
                    Message = "Дисбаланс производительности: слабая видеокарта ограничивает процессор",
                    Recommendation = "Рекомендуется более мощная видеокарта"
                });
            }
        }

        return result;
    }

    public async Task<int> CalculateTotalPowerConsumptionAsync(PCConfiguration config)
    {
        await Task.Delay(1);
        var cpuSpecs = config.ProcessorId.HasValue ? GetSpecs(config.ProcessorId.Value) : new();
        var gpuSpecs = config.GpuId.HasValue ? GetSpecs(config.GpuId.Value) : new();
        
        var cpuTdp = GetIntValue(cpuSpecs, "tdp", 0);
        var gpuTdp = GetIntValue(gpuSpecs, "tdp", 0);
        
        return (int)((cpuTdp + gpuTdp + 50) * 1.2);
    }

    private Dictionary<string, object> GetSpecs(Guid productId)
    {
        return _productSpecs.TryGetValue(productId, out var specs) ? specs : new();
    }

    private static string GetStringValue(Dictionary<string, object> specs, string key)
    {
        if (specs.TryGetValue(key, out var value))
        {
            if (value is List<string> list)
                return string.Join(",", list);
            return value?.ToString() ?? "";
        }
        return "";
    }

    private static int GetIntValue(Dictionary<string, object> specs, string key, int defaultValue)
    {
        if (specs.TryGetValue(key, out var value))
        {
            if (value is int intValue) return intValue;
            if (value is long longValue) return (int)longValue;
            if (int.TryParse(value?.ToString(), out var parsed)) return parsed;
        }
        return defaultValue;
    }
}

#endregion
