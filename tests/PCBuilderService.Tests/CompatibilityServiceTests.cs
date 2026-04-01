using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using PCBuilderService.DTOs;
using PCBuilderService.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
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

    public CompatibilityServiceTests()
    {
        _loggerMock = new Mock<ILogger<CompatibilityService>>();
        var httpClient = new HttpClient { BaseAddress = new Uri("http://localhost:5000") };
        _service = new CompatibilityService(httpClient, _loggerMock.Object);
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
        response.Result.Issues.Should().ContainSingle(i => i.Message == "Incompatible Socket");
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
        response.Result.Issues.Should().ContainSingle(i => i.Message.Contains("Incompatible RAM Generation"));
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
        response.Result.Issues.Should().ContainSingle(i => i.Message == "Insufficient Power Supply");
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
        response.PowerConsumption.Should().Be(385); // (100 + 200 + 50) * 1.1 = 385W
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
        // totalTdp = 385, recommended = 385 * 1.4 = 539 -> 550W
        response.RecommendedPsu.Should().Be(550);
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
        response.Result.Warnings.Should().Contain(w => w.Component == "PSU" && w.Message.Contains("рекомендуется"));
    }

    #endregion

    #region Rule 5: GPU ↔ Case Length

    [Fact]
    public async Task Rule5_GpuTooLongForCase_ReturnsError()
    {
        var request = CreateRequest(
            gpu: CreateGpuComponent("NVIDIA RTX 4090", new Dictionary<string, object>
            { ["tdp"] = 450, ["length"] = 340 }),
            caseComp: CreateCaseComponent("Small Case", new Dictionary<string, object>
            { ["maxGpuLength"] = 320, ["maxCoolerHeight"] = 160,
              ["formFactor"] = "ATX", ["supportedFormFactors"] = "ATX,mATX" })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.IsCompatible.Should().BeFalse("GPU is too long for case");
        response.Result.Issues.Should().ContainSingle(i =>
            i.Message.Contains("не поместится") && i.Message.Contains("видеокарт"));
    }

    [Fact]
    public async Task Rule5_GpuFitsInCase_NoError()
    {
        var request = CreateRequest(
            gpu: CreateGpuComponent("NVIDIA RTX 4070", new Dictionary<string, object>
            { ["tdp"] = 200, ["length"] = 300 }),
            caseComp: CreateCaseComponent("Large Case", new Dictionary<string, object>
            { ["maxGpuLength"] = 380, ["maxCoolerHeight"] = 170,
              ["formFactor"] = "ATX", ["supportedFormFactors"] = "ATX,mATX,ITX" })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.Issues.Should().NotContain(i => i.Message.Contains("не поместится"));
    }

    #endregion

    #region Rule 6: Cooler ↔ Case Height

    [Fact]
    public async Task Rule6_CoolerTooTallForCase_ReturnsError()
    {
        var request = CreateRequest(
            cooling: CreateCoolerComponent("Tall Air Cooler", new Dictionary<string, object>
            { ["type"] = "Air", ["height"] = 170, ["maxTdp"] = 250,
              ["supportedSockets"] = "LGA1700,AM5" }),
            caseComp: CreateCaseComponent("Slim Case", new Dictionary<string, object>
            { ["maxGpuLength"] = 350, ["maxCoolerHeight"] = 160,
              ["formFactor"] = "ATX", ["supportedFormFactors"] = "ATX" })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.IsCompatible.Should().BeFalse("cooler is too tall for case");
        response.Result.Issues.Should().ContainSingle(i =>
            i.Message.Contains("не поместится") && i.Message.Contains("кулер"));
    }

    [Fact]
    public async Task Rule6_CoolerFitsInCase_NoError()
    {
        var request = CreateRequest(
            cooling: CreateCoolerComponent("Compact Cooler", new Dictionary<string, object>
            { ["type"] = "Air", ["height"] = 155, ["maxTdp"] = 180,
              ["supportedSockets"] = "LGA1700,AM5" }),
            caseComp: CreateCaseComponent("Regular Case", new Dictionary<string, object>
            { ["maxGpuLength"] = 350, ["maxCoolerHeight"] = 170,
              ["formFactor"] = "ATX", ["supportedFormFactors"] = "ATX" })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.Issues.Should().NotContain(i => i.Message.Contains("не поместится"));
    }

    [Fact]
    public async Task Rule6_AioCoolerNotCheckedForHeight_NoError()
    {
        var request = CreateRequest(
            cooling: CreateCoolerComponent("AIO Liquid Cooler", new Dictionary<string, object>
            { ["type"] = "AIO", ["height"] = 200, ["maxTdp"] = 300,
              ["supportedSockets"] = "LGA1700,AM5" }),
            caseComp: CreateCaseComponent("Slim Case", new Dictionary<string, object>
            { ["maxGpuLength"] = 350, ["maxCoolerHeight"] = 150,
              ["formFactor"] = "ATX", ["supportedFormFactors"] = "ATX" })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.Issues.Should().NotContain(i => i.Message.Contains("не поместится"));
    }

    #endregion

    #region Rule 7: Bottleneck Detection (ratio > 2.0)

    [Fact]
    public async Task Rule7_CpuBottleneckDetected_ReturnsWarning()
    {
        var request = CreateRequest(
            cpu: CreateCpuComponent("Powerful CPU", new Dictionary<string, object>
            { ["socket"] = "AM5", ["tdp"] = 170, ["performanceScore"] = 200 }),
            gpu: CreateGpuComponent("Weak GPU", new Dictionary<string, object>
            { ["tdp"] = 75, ["length"] = 240, ["performanceScore"] = 80 })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.Warnings.Should().Contain(w =>
            w.Severity == "Warning" && w.Message.Contains("bottleneck"));
    }

    [Fact]
    public async Task Rule7_GpuBottleneckDetected_ReturnsWarning()
    {
        var request = CreateRequest(
            cpu: CreateCpuComponent("Weak CPU", new Dictionary<string, object>
            { ["socket"] = "AM5", ["tdp"] = 65, ["performanceScore"] = 50 }),
            gpu: CreateGpuComponent("Powerful GPU", new Dictionary<string, object>
            { ["tdp"] = 350, ["length"] = 330, ["performanceScore"] = 200 })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.Warnings.Should().Contain(w =>
            w.Severity == "Warning" && w.Message.Contains("bottleneck"));
    }

    [Fact]
    public async Task Rule7_BalancedConfiguration_NoWarning()
    {
        var request = CreateRequest(
            cpu: CreateCpuComponent("Balanced CPU", new Dictionary<string, object>
            { ["socket"] = "AM5", ["tdp"] = 120, ["performanceScore"] = 100 }),
            gpu: CreateGpuComponent("Balanced GPU", new Dictionary<string, object>
            { ["tdp"] = 250, ["length"] = 300, ["performanceScore"] = 90 })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.Warnings.Should().NotContain(w => w.Message.Contains("bottleneck"));
    }

    [Fact]
    public async Task Rule7_RatioExactly2Point0_NoWarning()
    {
        var request = CreateRequest(
            cpu: CreateCpuComponent("CPU", new Dictionary<string, object>
            { ["socket"] = "AM5", ["tdp"] = 120, ["performanceScore"] = 100 }),
            gpu: CreateGpuComponent("GPU", new Dictionary<string, object>
            { ["tdp"] = 200, ["length"] = 280, ["performanceScore"] = 50 })
        );
        var response = await _service.CheckCompatibilityAsync(request);
        response.Result.Warnings.Should().NotContain(w => w.Message.Contains("bottleneck"));
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
        response.Result.Issues.Should().Contain(i => i.Message == "Incompatible Socket");
        response.Result.Issues.Should().Contain(i => i.Message.Contains("Incompatible RAM Generation"));
        response.Result.Issues.Should().Contain(i => i.Message == "Insufficient Power Supply");
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
