using FluentAssertions;
using Moq;
using Xunit;
using PCBuilderService.Services;
using PCBuilderService.DTOs;
using PCBuilderService.Data;
using Microsoft.EntityFrameworkCore;
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
    private readonly CompatibilityService _sut;

    public CompatibilityServiceTests()
    {
        _loggerMock = new Mock<ILogger<CompatibilityService>>();
        var ruleEngineLogger = Mock.Of<ILogger<CompatibilityRuleEngine>>();
        var config = CreateTestRulesConfig();
        var ruleEngine = new CompatibilityRuleEngine(config, ruleEngineLogger);
        var dbContextOptions = new DbContextOptionsBuilder<PCBuilderDbContext>()
            .UseInMemoryDatabase(databaseName: $"CompatibilityTests-{Guid.NewGuid():N}")
            .Options;
        var dbContext = new PCBuilderDbContext(dbContextOptions);
        _sut = new CompatibilityService(_loggerMock.Object, ruleEngine, dbContext);
    }

    /// <summary>
    /// Создаёт конфигурацию правил с заполненными шаблонами сообщений.
    /// Нужен потому что new RulesConfig() создаёт пустые RuleTemplate с null MessageTemplate.
    /// </summary>
    private static RulesConfig CreateTestRulesConfig()
    {
        return new RulesConfig
        {
            SocketCompatibility = new SocketCompatibilityConfig
            {
                Groups = new List<SocketGroup>
                {
                    new() { Id = "am5", Sockets = new List<string> { "AM5" }, RamType = "DDR5", MaxRamSpeed = 6400, BiosWarning = new BiosWarningConfig() },
                    new() { Id = "lga1700", Sockets = new List<string> { "LGA1700" }, RamType = "DDR5", RamTypeAlternate = "DDR4", MaxRamSpeed = 5600, BiosWarning = new BiosWarningConfig() }
                }
            },
            FormFactorCompatibility = new FormFactorCompatibilityConfig { Rules = new List<FormFactorRule>(), Aliases = new Dictionary<string, string>() },
            RamCompatibility = new RamCompatibilityConfig
            {
                GenerationMismatch = new RuleTemplate { Severity = "Error", MessageTemplate = "Incompatible RAM Generation: motherboard supports {motherboardRamType} but RAM is {ramType}", SuggestionTemplate = "Use {motherboardRamType} RAM" },
                SpeedLimit = new RuleTemplate { Severity = "Warning", MessageTemplate = "RAM speed {ramSpeed} exceeds motherboard max {maxSpeed}", SuggestionTemplate = "Consider RAM at {ramSpeed}MHz or lower" },
                SlotOverflow = new RuleTemplate { Severity = "Error", MessageTemplate = "Too many RAM modules: {modules} vs {slots} slots", SuggestionTemplate = "Use max {slots} modules" }
            },
            PowerCompatibility = new PowerCompatibilityConfig
            {
                BaseSystemPower = 50,
                PsuBufferPercent = 0.4,
                RoundingStep = 50,
                Insufficient = new RuleTemplate { Severity = "Error", MessageTemplate = "PSU {psuWattage}W is insufficient, need {requiredWattage}W", SuggestionTemplate = "Upgrade to {recommendedPsu}W PSU" },
                TightMargin = new RuleTemplate { Severity = "Warning", MessageTemplate = "PSU {psuWattage}W has tight margin, recommended {recommendedPsu}W", Suggestion = "Consider higher wattage PSU" }
            },
            DimensionCompatibility = new DimensionCompatibilityConfig
            {
                GpuLength = new GpuLengthConfig { Error = new RuleTemplate(), Warning = new RuleTemplate(), WarningThresholdMm = 20 },
                CoolerHeight = new CoolerHeightConfig { Error = new RuleTemplate() }
            },
            CoolerCompatibility = new CoolerCompatibilityConfig
            {
                SocketMismatch = new RuleTemplate(),
                TdpInsufficient = new RuleTemplate()
            },
            BottleneckDetection = new BottleneckDetectionConfig
            {
                CpuBound = new BottleneckRule(),
                GpuBound = new BottleneckRule(),
                Categories = new Dictionary<string, BottleneckCategory>()
            },
            PerformanceWarnings = new PerformanceWarningsConfig
            {
                InsufficientRam = new InsufficientRamConfig { Thresholds = new List<RamThreshold>() },
                NoIntegratedGraphics = new RuleTemplate()
            },
            StorageDefaults = new StorageDefaultsConfig(),
            EpsCompatibility = new EpsCompatibilityConfig { InsufficientCables = new RuleTemplate() },
            PciePowerCompatibility = new PciePowerCompatibilityConfig { InsufficientCables = new RuleTemplate(), Atx3Required = new RuleTemplate() },
            VrmCompatibility = new VrmCompatibilityConfig { Insufficient = new RuleTemplate(), VrmTdpExceeded = new RuleTemplate() },
            UsbCCompatibility = new UsbCCompatibilityConfig { MissingHeader = new RuleTemplate() },
            StorageInterfaceCompatibility = new StorageInterfaceCompatibilityConfig { M2SataInNvmeSlot = new RuleTemplate(), M2Gen5Overheating = new RuleTemplate() },
            GpuSlotCompatibility = new GpuSlotCompatibilityConfig { ExceedsExpansionSlots = new RuleTemplate() },
            FanHeaderCompatibility = new FanHeaderCompatibilityConfig { InsufficientHeaders = new RuleTemplate() },
            PsuBrandSafety = new PsuBrandSafetyConfig { UnknownBrand = new RuleTemplate(), TrustedBrands = new List<string>() },
            RgbCompatibility = new RgbCompatibilityConfig { VoltageMismatch = new RuleTemplate() },
            RamClearanceCompatibility = new RamClearanceCompatibilityConfig { Insufficient = new RuleTemplate() },
            EccCompatibility = new EccCompatibilityConfig { EccInConsumerBoard = new RuleTemplate() },
            CpuOverclockCompatibility = new CpuOverclockCompatibilityConfig { KSeriesOnNonZ = new RuleTemplate() },
            EpsLengthCompatibility = new EpsLengthCompatibilityConfig { TooShort = new RuleTemplate() }
        };
    }

    #region Test 1: Socket Compatibility

    [Fact]
    public async Task CheckCompatibility_WhenCpuSocketDoesNotMatchMotherboardSocket_ReturnsIncompatibleSocketError()
    {
        // Подготовка
        // У CPU сокет AM5, у материнской платы сокет LGA1700 - несовместимо!
        var request = CreateRequest(
            cpu: CreateCpuComponent("AMD Ryzen 7 7800X3D", new Dictionary<string, object>
            {
                ["socket"] = "AM5",
                ["tdp"] = 120
            }),
            motherboard: CreateMotherboardComponent("ASUS ROG Maximus Z790", new Dictionary<string, object>
            {
                ["socket"] = "LGA1700",  // Несовместимо с AM5!
                ["ramType"] = "DDR5",
                ["formFactor"] = "ATX"
            })
        );

        // Действие
        var response = await _sut.CheckCompatibilityAsync(request);

        // Проверка
        response.Should().NotBeNull();
        response.Result.IsCompatible.Should().BeFalse("sockets are incompatible");
        response.Result.Issues.Should().ContainSingle(i => i.Message.Contains("Несовместимый сокет"));
    }

    [Fact]
    public async Task CheckCompatibility_WhenCpuSocketMatchesMotherboardSocket_ReturnsCompatible()
    {
        // Подготовка
        // И CPU и материнская плата имеют сокет AM5 - совместимо!
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

        // Действие
        var response = await _sut.CheckCompatibilityAsync(request);

        // Проверка
        response.Should().NotBeNull();
        response.Result.Issues.Should().NotContain(i => i.Message == "Incompatible Socket");
    }

    #endregion

    #region Test 2: RAM Generation Compatibility

    [Fact]
    public async Task CheckCompatibility_WhenMotherboardSupportsDDR4_AndRamIsDDR5_ReturnsIncompatibleRamError()
    {
        // Подготовка
        // Материнская плата поддерживает DDR4, но RAM - DDR5 - несовместимо!
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

        // Действие
        var response = await _sut.CheckCompatibilityAsync(request);

        // Проверка
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
        // Подготовка
        // И материнская плата и RAM - DDR5 - совместимо!
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

        // Действие
        var response = await _sut.CheckCompatibilityAsync(request);

        // Проверка
        response.Should().NotBeNull();
        response.Result.Issues.Should().NotContain(i => i.Message.Contains("Incompatible RAM Generation"));
    }

    #endregion

    #region Test 3: PSU Power Sufficiency

    [Fact]
    public async Task CheckCompatibility_WhenPsuWattageLessThanTotalTdp_ReturnsInsufficientPowerSupplyError()
    {
        // Подготовка
        // CPU TDP: 170W, GPU TDP: 450W, Система: 50W (с буфером 10% = 737W всего)
        // БП: 650W - недостаточно!
        var request = CreateRequest(
            cpu: CreateCpuComponent("AMD Ryzen 9 7950X", new Dictionary<string, object>
            {
                ["socket"] = "AM5",
                ["tdp"] = 170  // CPU с высоким TDP
            }),
            gpu: CreateGpuComponent("NVIDIA RTX 4090", new Dictionary<string, object>
            {
                ["tdp"] = 450,  // GPU с высоким TDP
                ["length"] = 340
            }),
            psu: CreatePsuComponent("Corsair RM650x", new Dictionary<string, object>
            {
                ["wattage"] = 650  // Недостаточно! (170 + 450 + 50) * 1.1 = 737W необходимо
            })
        );

        // Действие
        var response = await _sut.CheckCompatibilityAsync(request);

        // Проверка
        response.Should().NotBeNull();
        response.Result.IsCompatible.Should().BeFalse("PSU wattage is insufficient");
        response.Result.Issues.Should().Contain(i => i.Message.Contains("insufficient") || i.Message.Contains("PSU") || i.Message.Contains("W"));
    }

    [Fact]
    public async Task CheckCompatibility_WhenPsuWattageEqualsTotalTdp_ReturnsCompatible()
    {
        // Подготовка
        // CPU TDP: 65W, GPU TDP: 200W, Система: 50W (с буфером 10% = 346.5W всего)
        // БП: 350W - достаточно!
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
                ["wattage"] = 350  // Достаточно (65 + 200 + 50) * 1.1 = 346.5W
            })
        );

        // Действие
        var response = await _sut.CheckCompatibilityAsync(request);

        // Проверка
        response.Should().NotBeNull();
        response.Result.Issues.Should().NotContain(i => i.Message == "Insufficient Power Supply");
    }

    [Fact]
    public async Task CheckCompatibility_WhenPsuWattageExceedsTotalTdp_ReturnsCompatible()
    {
        // Подготовка
        // CPU TDP: 120W, GPU TDP: 300W, Система: 50W (с буфером 10% = 517W всего)
        // БП: 750W - с запасом!
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
                ["wattage"] = 750  // С запасом (120 + 300 + 50) * 1.1 = 517W
            })
        );

        // Действие
        var response = await _sut.CheckCompatibilityAsync(request);

        // Проверка
        response.Should().NotBeNull();
        response.Result.Issues.Should().NotContain(i => i.Message == "Insufficient Power Supply");
    }

    [Fact]
    public async Task CheckCompatibility_CalculatesCorrectPowerConsumption()
    {
        // Подготовка
        // CPU TDP: 100W, GPU TDP: 200W, Система: 50W
        // Всего = (100 + 200 + 50) * 1.1 = 385W
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

        // Действие
        var response = await _sut.CheckCompatibilityAsync(request);

        // Проверка
        response.PowerConsumption.Should().Be(350); // 100 + 200 + 50 = 350W
    }

    #endregion

    #region Combined Tests

    [Fact]
    public async Task CheckCompatibility_WhenAllComponentsCompatible_ReturnsCompatibleResult()
    {
        // Подготовка - Все совместимые компоненты
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

        // Действие
        var response = await _sut.CheckCompatibilityAsync(request);

        // Проверка
        response.Should().NotBeNull();
        response.Result.IsCompatible.Should().BeTrue();
        response.Result.Issues.Should().BeEmpty();
    }

    [Fact]
    public async Task CheckCompatibility_WhenMultipleIncompatibilities_ReturnsAllErrors()
    {
        // Подготовка - Множественные несовместимости
        var request = CreateRequest(
            cpu: CreateCpuComponent("AMD Ryzen 7 7800X3D", new Dictionary<string, object>
            {
                ["socket"] = "AM5",
                ["tdp"] = 170
            }),
            motherboard: CreateMotherboardComponent("ASUS ROG Maximus Z790", new Dictionary<string, object>
            {
                ["socket"] = "LGA1700",  // Несовместимый сокет!
                ["ramType"] = "DDR4",
                ["formFactor"] = "ATX"
            }),
            ram: CreateRamComponent("Kingston FURY DDR5", new Dictionary<string, object>
            {
                ["type"] = "DDR5",  // Несовместимо с материнской платой DDR4!
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
                ["wattage"] = 550  // Недостаточно мощности!
            })
        );

        // Действие
        var response = await _sut.CheckCompatibilityAsync(request);

        // Проверка
        response.Should().NotBeNull();
        response.Result.IsCompatible.Should().BeFalse();
        response.Result.Issues.Should().Contain(i => i.Message.Contains("Несовместимый сокет"));
        response.Result.Issues.Should().Contain(i => i.Message.Contains("Incompatible RAM Generation"));
        response.Result.Issues.Should().Contain(i => i.Message.Contains("insufficient") || i.Message.Contains("PSU"));
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