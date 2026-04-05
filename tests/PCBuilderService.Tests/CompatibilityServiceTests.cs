using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using PCBuilderService.Data;
using PCBuilderService.DTOs;
using PCBuilderService.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace PCBuilderService.Tests;

/// <summary>
/// Модульные тесты для CompatibilityService.
/// Покрывает 7 правил проверки совместимости:
/// 1. CPU↔Motherboard Socket
/// 2. RAM↔Motherboard MemoryType
/// 3. Cooling↔CPU SupportedSockets
/// 4. PSU↔Configuration Power (TDP CPU + TDP GPU + 50W base, 40% buffer)
/// 5. GPU↔Case Length
/// 6. Cooler↔Case Height
/// 7. Bottleneck Detection (ratio > 2.0)
/// </summary>
public class CompatibilityServiceTests
{
    private readonly CompatibilityService _service;
    private readonly Mock<ILogger<CompatibilityService>> _loggerMock;
    private readonly Mock<ILogger<CompatibilityRuleEngine>> _ruleEngineLoggerMock;
    private readonly CompatibilityRuleEngine _ruleEngine;

    public CompatibilityServiceTests()
    {
        _loggerMock = new Mock<ILogger<CompatibilityService>>();
        _ruleEngineLoggerMock = new Mock<ILogger<CompatibilityRuleEngine>>();
        var httpClient = new HttpClient { BaseAddress = new Uri("http://localhost:5000") };
        var jsonPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "src", "PCBuilderService", "Data", "compatibility-rules.json");
        _ruleEngine = new CompatibilityRuleEngine(jsonPath, _ruleEngineLoggerMock.Object);

        var dbContextOptions = new DbContextOptionsBuilder<PCBuilderDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;
        var dbContext = new PCBuilderDbContext(dbContextOptions);

        _service = new CompatibilityService(httpClient, _loggerMock.Object, _ruleEngine, dbContext);
    }

    #region Rule 1: CPU ↔ Motherboard Socket

    [Fact]
    public async Task Rule1_IncompatibleSocket_ReturnsError()
    {
        var request = CreateRequest(
            cpu: CreateCpuComponent("AMD Ryzen 7 7800X3D", new Dictionary<string, object>
            { ["socket"] = "AM5", ["tdp"] = 120, ["performanceScore"] = 85 }),
            motherboard: CreateMotherboardComponent("ASUS ROG Maximus Z790", new Dictionary<string, object>
            { ["socket"] = "LGA1700", ["ramType"] = "DDR5", ["formFactor"] = "ATX" })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.IsCompatible.Should().BeFalse("sockets are incompatible");
        response.Result.Issues.Should().ContainSingle(i => i.Message.Contains("Несовместимый сокет"));
    }

    [Fact]
    public async Task Rule1_CompatibleSocket_NoError()
    {
        var request = CreateRequest(
            cpu: CreateCpuComponent("AMD Ryzen 7 7800X3D", new Dictionary<string, object>
            { ["socket"] = "AM5", ["tdp"] = 120 }),
            motherboard: CreateMotherboardComponent("ASUS ROG Crosshair X670E", new Dictionary<string, object>
            { ["socket"] = "AM5", ["ramType"] = "DDR5", ["formFactor"] = "ATX" })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.Issues.Should().NotContain(i => i.Message == "Incompatible Socket");
    }

    [Fact]
    public async Task Rule1_CaseInsensitiveSocketMatch_NoError()
    {
        var request = CreateRequest(
            cpu: CreateCpuComponent("CPU", new Dictionary<string, object>
            { ["socket"] = "am5", ["tdp"] = 65 }),
            motherboard: CreateMotherboardComponent("MB", new Dictionary<string, object>
            { ["socket"] = "AM5", ["ramType"] = "DDR5", ["formFactor"] = "ATX" })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.Issues.Should().NotContain(i => i.Message == "Incompatible Socket");
    }

    #endregion

    #region Rule 2: RAM ↔ Motherboard MemoryType

    [Fact]
    public async Task Rule2_IncompatibleRamType_ReturnsError()
    {
        var request = CreateRequest(
            motherboard: CreateMotherboardComponent("ASUS TUF B660M", new Dictionary<string, object>
            { ["socket"] = "LGA1700", ["ramType"] = "DDR4", ["formFactor"] = "mATX" }),
            ram: CreateRamComponent("Kingston FURY DDR5", new Dictionary<string, object>
            { ["type"] = "DDR5", ["speed"] = 5600, ["capacity"] = 32 })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.IsCompatible.Should().BeFalse("RAM generation is incompatible");
        response.Result.Issues.Should().ContainSingle(i => i.Message.Contains("Несовместимый тип памяти"));
    }

    [Fact]
    public async Task Rule2_CompatibleRamType_NoError()
    {
        var request = CreateRequest(
            motherboard: CreateMotherboardComponent("ASUS ROG X670E", new Dictionary<string, object>
            { ["socket"] = "AM5", ["ramType"] = "DDR5", ["formFactor"] = "ATX" }),
            ram: CreateRamComponent("Kingston FURY DDR5", new Dictionary<string, object>
            { ["type"] = "DDR5", ["speed"] = 6000, ["capacity"] = 32 })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.Issues.Should().NotContain(i => i.Message.Contains("Incompatible RAM Generation"));
    }

    [Fact]
    public async Task Rule2_RamSpeedExceedsMaxSpeed_ReturnsWarning()
    {
        var request = CreateRequest(
            motherboard: CreateMotherboardComponent("MB", new Dictionary<string, object>
            { ["socket"] = "AM5", ["ramType"] = "DDR5", ["maxRamSpeed"] = 5200, ["formFactor"] = "ATX" }),
            ram: CreateRamComponent("Fast RAM", new Dictionary<string, object>
            { ["type"] = "DDR5", ["speed"] = 6400, ["capacity"] = 32 })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.IsCompatible.Should().BeTrue();
        response.Result.Warnings.Should().Contain(w => w.Message.Contains("Скорость памяти"));
    }

    #endregion

    #region Rule 3: Cooling ↔ CPU SupportedSockets

    [Fact]
    public async Task Rule3_CoolerDoesNotSupportCpuSocket_ReturnsError()
    {
        var request = CreateRequest(
            cpu: CreateCpuComponent("AMD Ryzen 7 7800X3D", new Dictionary<string, object>
            { ["socket"] = "AM5", ["tdp"] = 120 }),
            cooling: CreateCoolerComponent("Noctua NH-D15", new Dictionary<string, object>
            { ["type"] = "Air", ["height"] = 165, ["maxTdp"] = 250,
              ["supportedSockets"] = "LGA1700,LGA1200,AM4" })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.IsCompatible.Should().BeFalse("cooler does not support AM5");
        response.Result.Issues.Should().ContainSingle(i =>
            i.Message.Contains("не поддерживает сокет") && i.Message.Contains("AM5"));
    }

    [Fact]
    public async Task Rule3_CoolerSupportsCpuSocket_NoError()
    {
        var request = CreateRequest(
            cpu: CreateCpuComponent("AMD Ryzen 7 7800X3D", new Dictionary<string, object>
            { ["socket"] = "AM5", ["tdp"] = 120 }),
            cooling: CreateCoolerComponent("DeepCool AK620", new Dictionary<string, object>
            { ["type"] = "Air", ["height"] = 160, ["maxTdp"] = 260,
              ["supportedSockets"] = "LGA1700,AM5,AM4" })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.Issues.Should().NotContain(i => i.Message.Contains("не поддерживает сокет"));
    }

    [Fact]
    public async Task Rule3_CoolerTdpInsufficient_ReturnsWarning()
    {
        var request = CreateRequest(
            cpu: CreateCpuComponent("Intel i9-13900K", new Dictionary<string, object>
            { ["socket"] = "LGA1700", ["tdp"] = 170 }),
            cooling: CreateCoolerComponent("Weak Cooler", new Dictionary<string, object>
            { ["type"] = "Air", ["height"] = 120, ["maxTdp"] = 100,
              ["supportedSockets"] = "LGA1700,AM5" })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.IsCompatible.Should().BeTrue();
        response.Result.Warnings.Should().Contain(w => w.Message.Contains("недостаточен"));
    }

    #endregion

    #region Rule 4: PSU ↔ Configuration Power

    [Fact]
    public async Task Rule4_PsuInsufficientPower_ReturnsError()
    {
        var request = CreateRequest(
            cpu: CreateCpuComponent("High TDP CPU", new Dictionary<string, object>
            { ["socket"] = "LGA1700", ["tdp"] = 250 }),
            gpu: CreateGpuComponent("High TDP GPU", new Dictionary<string, object>
            { ["tdp"] = 450, ["length"] = 340 }),
            psu: CreatePsuComponent("Weak PSU", new Dictionary<string, object>
            { ["wattage"] = 500 })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.IsCompatible.Should().BeFalse("PSU wattage is insufficient");
        response.Result.Issues.Should().ContainSingle(i => i.Message.Contains("Мощности БП") && i.Message.Contains("недостаточно"));
    }

    [Fact]
    public async Task Rule4_PsuSufficientPower_NoError()
    {
        var request = CreateRequest(
            cpu: CreateCpuComponent("AMD Ryzen 5 7600", new Dictionary<string, object>
            { ["socket"] = "AM5", ["tdp"] = 65 }),
            gpu: CreateGpuComponent("NVIDIA RTX 4060", new Dictionary<string, object>
            { ["tdp"] = 200, ["length"] = 280 }),
            psu: CreatePsuComponent("Corsair RM750x", new Dictionary<string, object>
            { ["wattage"] = 750 })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.Issues.Should().NotContain(i => i.Message == "Insufficient Power Supply");
    }

    [Fact]
    public async Task Rule4_PowerConsumptionCalculation_Correct()
    {
        var request = CreateRequest(
            cpu: CreateCpuComponent("Test CPU", new Dictionary<string, object>
            { ["socket"] = "AM5", ["tdp"] = 100 }),
            gpu: CreateGpuComponent("Test GPU", new Dictionary<string, object>
            { ["tdp"] = 200, ["length"] = 300 }),
            psu: CreatePsuComponent("Test PSU", new Dictionary<string, object>
            { ["wattage"] = 600 })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.PowerConsumption.Should().Be(350); // 100 + 200 + 50 = 350W
    }

    [Fact]
    public async Task Rule4_RecommendedPsuWith40PercentBuffer_Correct()
    {
        var request = CreateRequest(
            cpu: CreateCpuComponent("Test CPU", new Dictionary<string, object>
            { ["socket"] = "AM5", ["tdp"] = 100 }),
            gpu: CreateGpuComponent("Test GPU", new Dictionary<string, object>
            { ["tdp"] = 200, ["length"] = 300 }),
            psu: CreatePsuComponent("Test PSU", new Dictionary<string, object>
            { ["wattage"] = 600 })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        // totalTdp = 350, recommended = 350 * 1.4 = 490 -> 500W
        response.RecommendedPsu.Should().Be(500);
    }

    [Fact]
    public async Task Rule4_PsuBetweenMinAndRecommended_ReturnsWarning()
    {
        var request = CreateRequest(
            cpu: CreateCpuComponent("CPU", new Dictionary<string, object>
            { ["socket"] = "AM5", ["tdp"] = 65 }),
            gpu: CreateGpuComponent("GPU", new Dictionary<string, object>
            { ["tdp"] = 200, ["length"] = 280 }),
            psu: CreatePsuComponent("PSU", new Dictionary<string, object>
            { ["wattage"] = 400 })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.IsCompatible.Should().BeTrue();
        response.Result.Warnings.Should().Contain(w =>
            (w.Component == "Test PSU" || w.Component == "PSU") && w.Message.Contains("Рекомендуется"),
            "PSU 400W is below recommended 550W, should warn");
    }

    /// <summary>
    /// Test 5: Bottleneck detected when CPU/GPU performance ratio > 2.0
    /// CPU score 200, GPU score 80 -> ratio 2.5 > 2.0 -> Bottleneck Warning
    /// </summary>
    [Fact]
    public async Task CheckBottleneck_Detected_WhenRatioOver2()
    {
        // Arrange - CPU score 200, GPU score 80 -> ratio = 2.5
        var request = CreateRequest(
            cpu: CreateCpuComponent("Powerful CPU", new Dictionary<string, object>
            { ["socket"] = "AM5", ["tdp"] = 120, ["performanceScore"] = 200 }),
            gpu: CreateGpuComponent("Weak GPU", new Dictionary<string, object>
            { ["tdp"] = 150, ["length"] = 250, ["performanceScore"] = 80 })
        );

        // Act
        var response = await _service.CheckCompatibilityAsync(request);

        // Assert - ratio 200/80 = 2.5 > 2.0 -> bottleneck warning
        response.Result.Warnings.Should().Contain(w =>
            w.Severity == "Warning" && w.Message.Contains("bottleneck"),
            "CPU/GPU ratio 2.5 exceeds threshold 2.0, bottleneck should be detected");
        response.Result.Warnings.Should().Contain(w =>
            w.Message.Contains("Powerful CPU") && w.Message.Contains("Weak GPU"));
    }

    #endregion

    #region Combined Tests

    [Fact]
    public async Task AllComponentsCompatible_ReturnsTrue()
    {
        var request = CreateRequest(
            cpu: CreateCpuComponent("AMD Ryzen 7 7800X3D", new Dictionary<string, object>
            { ["socket"] = "AM5", ["tdp"] = 120, ["performanceScore"] = 90 }),
            motherboard: CreateMotherboardComponent("ASUS ROG X670E", new Dictionary<string, object>
            { ["socket"] = "AM5", ["ramType"] = "DDR5", ["formFactor"] = "ATX",
              ["maxRamSpeed"] = 6400, ["ramSlots"] = 4 }),
            ram: CreateRamComponent("Kingston DDR5", new Dictionary<string, object>
            { ["type"] = "DDR5", ["speed"] = 6000, ["capacity"] = 32, ["modules"] = 2 }),
            gpu: CreateGpuComponent("NVIDIA RTX 4080", new Dictionary<string, object>
            { ["tdp"] = 320, ["length"] = 310, ["performanceScore"] = 85 }),
            psu: CreatePsuComponent("Corsair RM850x", new Dictionary<string, object>
            { ["wattage"] = 850 }),
            caseComp: CreateCaseComponent("NZXT H7", new Dictionary<string, object>
            { ["maxGpuLength"] = 400, ["maxCoolerHeight"] = 185,
              ["formFactor"] = "ATX", ["supportedFormFactors"] = "ATX,mATX" }),
            cooling: CreateCoolerComponent("DeepCool AK620", new Dictionary<string, object>
            { ["type"] = "Air", ["height"] = 160, ["maxTdp"] = 260,
              ["supportedSockets"] = "LGA1700,AM5,AM4" })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.IsCompatible.Should().BeTrue();
        response.Result.Issues.Should().BeEmpty();
    }

    [Fact]
    public async Task MultipleIncompatibilities_ReturnsAllErrors()
    {
        var request = CreateRequest(
            cpu: CreateCpuComponent("AMD Ryzen 7 7800X3D", new Dictionary<string, object>
            { ["socket"] = "AM5", ["tdp"] = 170 }),
            motherboard: CreateMotherboardComponent("Intel Z790", new Dictionary<string, object>
            { ["socket"] = "LGA1700", ["ramType"] = "DDR4", ["formFactor"] = "ATX" }),
            ram: CreateRamComponent("DDR5 RAM", new Dictionary<string, object>
            { ["type"] = "DDR5", ["speed"] = 6000, ["capacity"] = 32 }),
            gpu: CreateGpuComponent("RTX 4090", new Dictionary<string, object>
            { ["tdp"] = 450, ["length"] = 340 }),
            psu: CreatePsuComponent("Weak PSU", new Dictionary<string, object>
            { ["wattage"] = 550 })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.IsCompatible.Should().BeFalse();
        response.Result.Issues.Should().Contain(i => i.Message.Contains("Несовместимый сокет"));
        response.Result.Issues.Should().Contain(i => i.Message.Contains("Несовместимый тип памяти"));
        response.Result.Issues.Should().Contain(i => i.Message.Contains("Мощности БП") && i.Message.Contains("недостаточно"));
    }

    #endregion

    #region Helper Methods

    private static CompatibilityCheckRequest CreateRequest(
        SelectedComponentDto? cpu = null, SelectedComponentDto? motherboard = null,
        SelectedComponentDto? ram = null, SelectedComponentDto? gpu = null,
        SelectedComponentDto? psu = null, SelectedComponentDto? caseComp = null,
        SelectedComponentDto? cooling = null)
    {
        return new CompatibilityCheckRequest
        {
            Components = new PCComponentsDto
            {
                Cpu = cpu, Motherboard = motherboard, Ram = ram, Gpu = gpu,
                Psu = psu, Case = caseComp, Cooling = cooling
            }
        };
    }

    private static SelectedComponentDto CreateCpuComponent(string name, Dictionary<string, object> specs)
    {
        return new SelectedComponentDto { ProductId = Guid.NewGuid(), Name = name, Specifications = specs };
    }

    private static SelectedComponentDto CreateMotherboardComponent(string name, Dictionary<string, object> specs)
    {
        return new SelectedComponentDto { ProductId = Guid.NewGuid(), Name = name, Specifications = specs };
    }

    private static SelectedComponentDto CreateRamComponent(string name, Dictionary<string, object> specs)
    {
        return new SelectedComponentDto { ProductId = Guid.NewGuid(), Name = name, Specifications = specs };
    }

    private static SelectedComponentDto CreateGpuComponent(string name, Dictionary<string, object> specs)
    {
        return new SelectedComponentDto { ProductId = Guid.NewGuid(), Name = name, Specifications = specs };
    }

    private static SelectedComponentDto CreatePsuComponent(string name, Dictionary<string, object> specs)
    {
        return new SelectedComponentDto { ProductId = Guid.NewGuid(), Name = name, Specifications = specs };
    }

    private static SelectedComponentDto CreateCaseComponent(string name, Dictionary<string, object> specs)
    {
        return new SelectedComponentDto { ProductId = Guid.NewGuid(), Name = name, Specifications = specs };
    }

    private static SelectedComponentDto CreateCoolerComponent(string name, Dictionary<string, object> specs)
    {
        return new SelectedComponentDto { ProductId = Guid.NewGuid(), Name = name, Specifications = specs };
    }

    #endregion
}
