using GoldPC.ServicesService.Data;
using GoldPC.ServicesService.Entities;
using GoldPC.ServicesService.Services;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;
using Xunit;
using Moq;
using Microsoft.Extensions.Logging;
using GoldPC.Shared.Services.Interfaces;

namespace GoldPC.ServicesService.Tests;

public class ServicesServiceUnitTests
{
    private readonly ServicesDbContext _context;
    private readonly ServicesService.Services.ServicesService _servicesService;

    public ServicesServiceUnitTests()
    {
        var options = new DbContextOptionsBuilder<ServicesDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ServicesDbContext(options);
        _servicesService = new ServicesService.Services.ServicesService(
            _context, 
            Mock.Of<ILogger<ServicesService.Services.ServicesService>>(),
            Mock.Of<INotificationService>());
        
        // Seed service types
        _context.ServiceTypes.Add(new ServiceType { Id = Guid.NewGuid(), Name = "Диагностика", BasePrice = 50, EstimatedDurationMinutes = 60 });
        _context.SaveChanges();
    }

    [Fact]
    public async Task CreateServiceRequest_ValidRequest_ShouldCreate()
    {
        // Arrange
        var clientId = Guid.NewGuid();
        var serviceType = await _context.ServiceTypes.FirstAsync();
        var request = new CreateServiceRequestRequest
        {
            ServiceTypeId = serviceType.Id,
            Description = "Компьютер не включается",
            DeviceModel = "Dell XPS 15"
        };

        // Act
        var (result, error) = await _servicesService.CreateAsync(clientId, request);

        // Assert
        error.Should().BeNull();
        result.Should().NotBeNull();
        result!.RequestNumber.Should().StartWith("SR-");
        result.Status.Should().Be(ServiceRequestStatus.Submitted);
    }

    [Fact]
    public async Task AssignMaster_NewRequest_ShouldAssign()
    {
        // Arrange
        var clientId = Guid.NewGuid();
        var masterId = Guid.NewGuid();
        var serviceType = await _context.ServiceTypes.FirstAsync();
        var request = new CreateServiceRequestRequest { ServiceTypeId = serviceType.Id, Description = "Test" };
        var (serviceRequest, _) = await _servicesService.CreateAsync(clientId, request);

        // Act
        var (result, error) = await _servicesService.AssignMasterAsync(serviceRequest!.Id, masterId);

        // Assert
        error.Should().BeNull();
        result!.MasterId.Should().Be(masterId);
        result.Status.Should().Be(ServiceRequestStatus.InProgress);
    }

    [Fact]
    public async Task Complete_ServiceRequest_ShouldMarkAsReadyForPickup()
    {
        // Arrange
        var clientId = Guid.NewGuid();
        var masterId = Guid.NewGuid();
        var serviceType = await _context.ServiceTypes.FirstAsync();
        var request = new CreateServiceRequestRequest { ServiceTypeId = serviceType.Id, Description = "Test" };
        var (serviceRequest, _) = await _servicesService.CreateAsync(clientId, request);
        await _servicesService.AssignMasterAsync(serviceRequest!.Id, masterId);

        var completeRequest = new UpdateServiceRequestRequest
        {
            MasterComment = "Работы выполнены",
            ActualCost = 100
        };

        // Act
        var (result, error) = await _servicesService.CompleteAsync(serviceRequest.Id, masterId, completeRequest);

        // Assert
        error.Should().BeNull();
        result!.Status.Should().Be(ServiceRequestStatus.ReadyForPickup);
    }

    [Fact]
    public async Task Cancel_NewRequest_ShouldCancel()
    {
        // Arrange
        var clientId = Guid.NewGuid();
        var serviceType = await _context.ServiceTypes.FirstAsync();
        var request = new CreateServiceRequestRequest { ServiceTypeId = serviceType.Id, Description = "Test" };
        var (serviceRequest, _) = await _servicesService.CreateAsync(clientId, request);

        // Act
        var (success, error) = await _servicesService.CancelAsync(serviceRequest!.Id, clientId);

        // Assert
        success.Should().BeTrue();
        var cancelled = await _servicesService.GetByIdAsync(serviceRequest.Id);
        cancelled!.Status.Should().Be(ServiceRequestStatus.Cancelled);
    }
}