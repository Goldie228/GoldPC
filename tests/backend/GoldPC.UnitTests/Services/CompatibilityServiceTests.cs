using FluentAssertions;
using Moq;
using Xunit;
using PCBuilderService.Services;
using PCBuilderService.DTOs;
using Microsoft.Extensions.Logging;

namespace GoldPC.UnitTests.Services;

/// <summary>
/// Модульные тесты для сервиса проверки совместимости компонентов ПК
/// Покрывают три основных сценария:
/// 1. Socket Check - проверка совместимости сокетов CPU и Motherboard
/// 2. RAM Generation - проверка совместимости типа памяти
/// 3. PSU Power - проверка достаточности мощности блока питания
/// </summary>
public class CompatibilityServiceTests
{
    private readonly Mock<ILogger<CompatibilityService>> _loggerMock;
    private readonly HttpClient _httpClient;
    private readonly CompatibilityService _sut;

    public CompatibilityServiceTests()
    {
        _loggerMock = new Mock<ILogger<CompatibilityService>>();
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri("http://localhost:5000")
        };
        _sut = new CompatibilityService(_httpClient, _loggerMock.Object);
    }

    #region Test 1: Socket Compatibility

    [Fact]
    public async Task CheckCompatibility_WhenCpuSocketDoesNotMatchMotherboardSocket_ReturnsIncompatibleSocketError()
    {
        // Arrange
        // CPU has AM5 socket, Motherboard has LGA1700 socket - incompatible!
        var request = CreateRequest(
            cpu: CreateCpuComponent("AMD Ryzen 7 7800X3D", new Dictionary<string, object>
            {
                ["socket"] = "AM5",
                ["tdp"] = 120
            }),
            motherboard: CreateMotherboardComponent("ASUS ROG Maximus Z790", new Dictionary<string, object>
            {
                ["socket"] = "LGA1700",  // Incompatible with AM5!
                ["ramType"] = "DDR5",
                ["formFactor"] = "ATX"
            })
        );

        // Act
        var response = await _sut.CheckCompatibilityAsync(request);

        // Assert
        response.Should().NotBeNull();
        response.Result.IsCompatible.Should().BeFalse("sockets are incompatible");
        response.Result.Issues.Should().ContainSingle(i => i.Message == "Incompatible Socket");
    }

    [Fact]
    public async Task CheckCompatibility_WhenCpuSocketMatchesMotherboardSocket_ReturnsCompatible()
    {
        // Arrange
        // Both CPU and Motherboard have AM5 socket - compatible!
        var request = CreateRequest(
            cpu: CreateCpuComponent("AMD Ryzen 7 7800X3D", new Dictionary<string, object>
            {
                ["socket"] = "AM5",
                ["tdp"] = 120
            }),
            motherboard: CreateMotherboardComponent("ASUS ROG Crosshair X670E", new Dictionary<string, object>
            {
                ["socket"] = "AM5",  // Compatible!
                ["ramType"] = "DDR5",
                ["formFactor"] = "ATX"
            })
        );

        // Act
        var response = await _sut.CheckCompatibilityAsync(request);

        // Assert
        response.Should().NotBeNull();
        response.Result.Issues.Should().NotContain(i => i.Message == "Incompatible Socket");
    }

    #endregion

    #region Test 2: RAM Generation Compatibility

    [Fact]
    public async Task CheckCompatibility_WhenMotherboardSupportsDDR4_AndRamIsDDR5_ReturnsIncompatibleRamError()
    {
        // Arrange
        // Motherboard supports DDR4, but RAM is DDR5 - incompatible!
        var request = CreateRequest(
            motherboard: CreateMotherboardComponent("ASUS TUF B660M", new Dictionary<string, object>
            {
                ["socket"] = "LGA1700",
                ["ramType"] = "DDR4",  // Motherboard supports DDR4
                ["formFactor"] = "mATX"
            }),
            ram: CreateRamComponent("Kingston FURY DDR5", new Dictionary<string, object>
            {
                ["type"] = "DDR5",  // RAM is DDR5 - incompatible with DDR4 motherboard!
                ["speed"] = 5600,
                ["capacity"] = 32
            })
        );

        // Act
        var response = await _sut.CheckCompatibilityAsync(request);

        // Assert
        response.Should().NotBeNull();
        response.Result.IsCompatible.Should().BeFalse("RAM generation is incompatible");
        response.Result.Issues.Should().ContainSingle(i => 
            i.Message.Contains("Incompatible RAM Generation") && 
            i.Message.Contains("DDR4") && 
            i.Message.Contains("DDR5"));
    }

    [Fact]
    public async Task CheckCompatibility_WhenRamTypeMatchesMotherboard_ReturnsCompatible()
    {
        // Arrange
        // Both Motherboard and RAM are DDR5 - compatible!
        var request = CreateRequest(
            motherboard: CreateMotherboardComponent("ASUS ROG Crosshair X670E", new Dictionary<string, object>
            {
                ["socket"] = "AM5",
                ["ramType"] = "DDR5",  // Motherboard supports DDR5
                ["formFactor"] = "ATX"
            }),
            ram: CreateRamComponent("Kingston FURY DDR5", new Dictionary<string, object>
            {
                ["type"] = "DDR5",  // RAM is DDR5 - compatible!
                ["speed"] = 6000,
                ["capacity"] = 32
            })
        );

        // Act
        var response = await _sut.CheckCompatibilityAsync(request);

        // Assert
        response.Should().NotBeNull();
        response.Result.Issues.Should().NotContain(i => i.Message.Contains("Incompatible RAM Generation"));
    }

    #endregion

    #region Test 3: PSU Power Sufficiency

    [Fact]
    public async Task CheckCompatibility_WhenPsuWattageLessThanTotalTdp_ReturnsInsufficientPowerSupplyError()
    {
        // Arrange
        // CPU TDP: 170W, GPU TDP: 450W, System: 50W (with 10% buffer = 737W total)
        // PSU: 650W - insufficient!
        var request = CreateRequest(
            cpu: CreateCpuComponent("AMD Ryzen 9 7950X", new Dictionary<string, object>
            {
                ["socket"] = "AM5",
                ["tdp"] = 170  // High TDP CPU
            }),
            gpu: CreateGpuComponent("NVIDIA RTX 4090", new Dictionary<string, object>
            {
                ["tdp"] = 450,  // High TDP GPU
                ["length"] = 340
            }),
            psu: CreatePsuComponent("Corsair RM650x", new Dictionary<string, object>
            {
                ["wattage"] = 650  // Insufficient! (170 + 450 + 50) * 1.1 = 737W needed
            })
        );

        // Act
        var response = await _sut.CheckCompatibilityAsync(request);

        // Assert
        response.Should().NotBeNull();
        response.Result.IsCompatible.Should().BeFalse("PSU wattage is insufficient");
        response.Result.Issues.Should().ContainSingle(i => i.Message == "Insufficient Power Supply");
    }

    [Fact]
    public async Task CheckCompatibility_WhenPsuWattageEqualsTotalTdp_ReturnsCompatible()
    {
        // Arrange
        // CPU TDP: 65W, GPU TDP: 200W, System: 50W (with 10% buffer = 346.5W total)
        // PSU: 350W - just enough!
        var request = CreateRequest(
            cpu: CreateCpuComponent("AMD Ryzen 5 7600", new Dictionary<string, object>
            {
                ["socket"] = "AM5",
                ["tdp"] = 65
            }),
            gpu: CreateGpuComponent("NVIDIA RTX 4060", new Dictionary<string, object>
            {
                ["tdp"] = 200,
                ["length"] = 280
            }),
            psu: CreatePsuComponent("Corsair RM350x", new Dictionary<string, object>
            {
                ["wattage"] = 350  // Just enough (65 + 200 + 50) * 1.1 = 346.5W
            })
        );

        // Act
        var response = await _sut.CheckCompatibilityAsync(request);

        // Assert
        response.Should().NotBeNull();
        response.Result.Issues.Should().NotContain(i => i.Message == "Insufficient Power Supply");
    }

    [Fact]
    public async Task CheckCompatibility_WhenPsuWattageExceedsTotalTdp_ReturnsCompatible()
    {
        // Arrange
        // CPU TDP: 120W, GPU TDP: 300W, System: 50W (with 10% buffer = 517W total)
        // PSU: 750W - plenty of power!
        var request = CreateRequest(
            cpu: CreateCpuComponent("AMD Ryzen 7 7800X3D", new Dictionary<string, object>
            {
                ["socket"] = "AM5",
                ["tdp"] = 120
            }),
            gpu: CreateGpuComponent("NVIDIA RTX 4080", new Dictionary<string, object>
            {
                ["tdp"] = 300,
                ["length"] = 320
            }),
            psu: CreatePsuComponent("Corsair RM750x", new Dictionary<string, object>
            {
                ["wattage"] = 750  // Plenty of power (120 + 300 + 50) * 1.1 = 517W
            })
        );

        // Act
        var response = await _sut.CheckCompatibilityAsync(request);

        // Assert
        response.Should().NotBeNull();
        response.Result.Issues.Should().NotContain(i => i.Message == "Insufficient Power Supply");
    }

    [Fact]
    public async Task CheckCompatibility_CalculatesCorrectPowerConsumption()
    {
        // Arrange
        // CPU TDP: 100W, GPU TDP: 200W, System: 50W
        // Total = (100 + 200 + 50) * 1.1 = 385W
        var request = CreateRequest(
            cpu: CreateCpuComponent("Test CPU", new Dictionary<string, object>
            {
                ["socket"] = "AM5",
                ["tdp"] = 100
            }),
            gpu: CreateGpuComponent("Test GPU", new Dictionary<string, object>
            {
                ["tdp"] = 200,
                ["length"] = 300
            }),
            psu: CreatePsuComponent("Test PSU", new Dictionary<string, object>
            {
                ["wattage"] = 500
            })
        );

        // Act
        var response = await _sut.CheckCompatibilityAsync(request);

        // Assert
        response.PowerConsumption.Should().Be(385); // (100 + 200 + 50) * 1.1 = 385W
    }

    #endregion

    #region Combined Tests

    [Fact]
    public async Task CheckCompatibility_WhenAllComponentsCompatible_ReturnsCompatibleResult()
    {
        // Arrange - All compatible components
        var request = CreateRequest(
            cpu: CreateCpuComponent("AMD Ryzen 7 7800X3D", new Dictionary<string, object>
            {
                ["socket"] = "AM5",
                ["tdp"] = 120
            }),
            motherboard: CreateMotherboardComponent("ASUS ROG Crosshair X670E", new Dictionary<string, object>
            {
                ["socket"] = "AM5",
                ["ramType"] = "DDR5",
                ["formFactor"] = "ATX"
            }),
            ram: CreateRamComponent("Kingston FURY DDR5", new Dictionary<string, object>
            {
                ["type"] = "DDR5",
                ["speed"] = 6000,
                ["capacity"] = 32
            }),
            gpu: CreateGpuComponent("NVIDIA RTX 4080", new Dictionary<string, object>
            {
                ["tdp"] = 300,
                ["length"] = 320
            }),
            psu: CreatePsuComponent("Corsair RM850x", new Dictionary<string, object>
            {
                ["wattage"] = 850
            })
        );

        // Act
        var response = await _sut.CheckCompatibilityAsync(request);

        // Assert
        response.Should().NotBeNull();
        response.Result.IsCompatible.Should().BeTrue();
        response.Result.Issues.Should().BeEmpty();
    }

    [Fact]
    public async Task CheckCompatibility_WhenMultipleIncompatibilities_ReturnsAllErrors()
    {
        // Arrange - Multiple incompatibilities
        var request = CreateRequest(
            cpu: CreateCpuComponent("AMD Ryzen 7 7800X3D", new Dictionary<string, object>
            {
                ["socket"] = "AM5",
                ["tdp"] = 170
            }),
            motherboard: CreateMotherboardComponent("ASUS ROG Maximus Z790", new Dictionary<string, object>
            {
                ["socket"] = "LGA1700",  // Incompatible socket!
                ["ramType"] = "DDR4",
                ["formFactor"] = "ATX"
            }),
            ram: CreateRamComponent("Kingston FURY DDR5", new Dictionary<string, object>
            {
                ["type"] = "DDR5",  // Incompatible with DDR4 motherboard!
                ["speed"] = 6000,
                ["capacity"] = 32
            }),
            gpu: CreateGpuComponent("NVIDIA RTX 4090", new Dictionary<string, object>
            {
                ["tdp"] = 450,
                ["length"] = 340
            }),
            psu: CreatePsuComponent("Corsair RM550x", new Dictionary<string, object>
            {
                ["wattage"] = 550  // Insufficient power!
            })
        );

        // Act
        var response = await _sut.CheckCompatibilityAsync(request);

        // Assert
        response.Should().NotBeNull();
        response.Result.IsCompatible.Should().BeFalse();
        response.Result.Issues.Should().Contain(i => i.Message == "Incompatible Socket");
        response.Result.Issues.Should().Contain(i => i.Message.Contains("Incompatible RAM Generation"));
        response.Result.Issues.Should().Contain(i => i.Message == "Insufficient Power Supply");
    }

    #endregion

    #region Helper Methods

    private static CompatibilityCheckRequest CreateRequest(
        SelectedComponentDto? cpu = null,
        SelectedComponentDto? motherboard = null,
        SelectedComponentDto? ram = null,
        SelectedComponentDto? gpu = null,
        SelectedComponentDto? psu = null,
        SelectedComponentDto? @case = null,
        SelectedComponentDto? cooling = null)
    {
        return new CompatibilityCheckRequest
        {
            Components = new PCComponentsDto
            {
                Cpu = cpu,
                Motherboard = motherboard,
                Ram = ram,
                Gpu = gpu,
                Psu = psu,
                Case = @case,
                Cooling = cooling
            }
        };
    }

    private static SelectedComponentDto CreateCpuComponent(string name, Dictionary<string, object> specs)
    {
        return new SelectedComponentDto
        {
            ProductId = Guid.NewGuid(),
            Name = name,
            Specifications = specs
        };
    }

    private static SelectedComponentDto CreateMotherboardComponent(string name, Dictionary<string, object> specs)
    {
        return new SelectedComponentDto
        {
            ProductId = Guid.NewGuid(),
            Name = name,
            Specifications = specs
        };
    }

    private static SelectedComponentDto CreateRamComponent(string name, Dictionary<string, object> specs)
    {
        return new SelectedComponentDto
        {
            ProductId = Guid.NewGuid(),
            Name = name,
            Specifications = specs
        };
    }

    private static SelectedComponentDto CreateGpuComponent(string name, Dictionary<string, object> specs)
    {
        return new SelectedComponentDto
        {
            ProductId = Guid.NewGuid(),
            Name = name,
            Specifications = specs
        };
    }

    private static SelectedComponentDto CreatePsuComponent(string name, Dictionary<string, object> specs)
    {
        return new SelectedComponentDto
        {
            ProductId = Guid.NewGuid(),
            Name = name,
            Specifications = specs
        };
    }

    private static SelectedComponentDto CreateCaseComponent(string name, Dictionary<string, object> specs)
    {
        return new SelectedComponentDto
        {
            ProductId = Guid.NewGuid(),
            Name = name,
            Specifications = specs
        };
    }

    #endregion
}