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

public class CompatibilityServiceTests
{
    private readonly CompatibilityService _service;
    private readonly Mock<HttpClient> _httpClientMock;
    private readonly Mock<ILogger<CompatibilityService>> _loggerMock;

    public CompatibilityServiceTests()
    {
        _httpClientMock = new Mock<HttpClient>();
        _loggerMock = new Mock<ILogger<CompatibilityService>>();
        _service = new CompatibilityService(_httpClientMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task CheckCompatibility_CompatibleSocket_ShouldBeCompatible()
    {
        // Arrange
        var request = new CompatibilityCheckRequest
        {
            Components = new PCComponentsDto
            {
                Cpu = new SelectedComponentDto
                {
                    Name = "AMD Ryzen 9 7950X",
                    Specifications = new Dictionary<string, object> { ["socket"] = "AM5" }
                },
                Motherboard = new SelectedComponentDto
                {
                    Name = "ASUS ROG Crosshair X670E",
                    Specifications = new Dictionary<string, object> { ["socket"] = "AM5" }
                }
            }
        };

        // Act
        var response = await _service.CheckCompatibilityAsync(request);

        // Assert
        response.Result.IsCompatible.Should().BeTrue();
        response.Result.Issues.Should().BeEmpty();
    }

    [Fact]
    public async Task CheckCompatibility_IncompatibleSocket_ShouldReturnError()
    {
        // Arrange
        var request = new CompatibilityCheckRequest
        {
            Components = new PCComponentsDto
            {
                Cpu = new SelectedComponentDto
                {
                    Name = "AMD Ryzen 9 7950X",
                    Specifications = new Dictionary<string, object> { ["socket"] = "AM5" }
                },
                Motherboard = new SelectedComponentDto
                {
                    Name = "ASUS ROG Strix Z790",
                    Specifications = new Dictionary<string, object> { ["socket"] = "LGA1700" }
                }
            }
        };

        // Act
        var response = await _service.CheckCompatibilityAsync(request);

        // Assert
        response.Result.IsCompatible.Should().BeFalse();
        response.Result.Issues.Should().Contain(i => i.Message.Contains("Incompatible Socket"));
    }

    [Fact]
    public async Task CheckCompatibility_InsufficientPsu_ShouldReturnError()
    {
        // Arrange
        var request = new CompatibilityCheckRequest
        {
            Components = new PCComponentsDto
            {
                Cpu = new SelectedComponentDto
                {
                    Name = "High TDP CPU",
                    Specifications = new Dictionary<string, object> { ["tdp"] = 250 }
                },
                Gpu = new SelectedComponentDto
                {
                    Name = "High TDP GPU",
                    Specifications = new Dictionary<string, object> { ["tdp"] = 450 }
                },
                Psu = new SelectedComponentDto
                {
                    Name = "Weak PSU",
                    Specifications = new Dictionary<string, object> { ["wattage"] = 500 }
                }
            }
        };

        // Act
        var response = await _service.CheckCompatibilityAsync(request);

        // Assert
        response.Result.IsCompatible.Should().BeFalse();
        response.Result.Issues.Should().Contain(i => i.Message.Contains("Insufficient Power Supply"));
    }

    [Fact]
    public async Task CheckCompatibility_IncompatibleRamType_ShouldReturnError()
    {
        // Arrange
        var request = new CompatibilityCheckRequest
        {
            Components = new PCComponentsDto
            {
                Motherboard = new SelectedComponentDto
                {
                    Name = "DDR5 Motherboard",
                    Specifications = new Dictionary<string, object> { ["ramType"] = "DDR5" }
                },
                Ram = new SelectedComponentDto
                {
                    Name = "DDR4 RAM",
                    Specifications = new Dictionary<string, object> { ["type"] = "DDR4" }
                }
            }
        };

        // Act
        var response = await _service.CheckCompatibilityAsync(request);

        // Assert
        response.Result.IsCompatible.Should().BeFalse();
        response.Result.Issues.Should().Contain(i => i.Message.Contains("Incompatible RAM Generation"));
    }
}
