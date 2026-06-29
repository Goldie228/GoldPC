using GoldPC.WarrantyService.Data;
using GoldPC.WarrantyService.Entities;
using GoldPC.WarrantyService.Services;
using GoldPC.SharedKernel.Enums;
using GoldPC.SharedKernel.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;
using Xunit;

namespace GoldPC.WarrantyService.Tests;

public class WarrantyServiceUnitTests
{
    private readonly WarrantyDbContext _context;
    private readonly Mock<ILogger<Services.WarrantyService>> _loggerMock;
    private readonly Services.WarrantyService _warrantyService;

    public WarrantyServiceUnitTests()
    {
        var options = new DbContextOptionsBuilder<WarrantyDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new WarrantyDbContext(options);
        _loggerMock = new Mock<ILogger<Services.WarrantyService>>();
        _warrantyService = new Services.WarrantyService(_context, _loggerMock.Object);
    }

    [Fact]
    public async Task CreateClaim_ValidRequest_ShouldCreateClaim()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = new CreateWarrantyClaimRequest
        {
            OrderId = Guid.NewGuid(),
            ProductId = Guid.NewGuid(),
            ProductName = "Test Product",
            Description = "Defect description",
            PurchaseDate = DateTime.UtcNow.AddMonths(-1),
            WarrantyPeriodMonths = 12
        };

        // Act
        var (claim, error) = await _warrantyService.CreateClaimAsync(userId, request);

        // Assert
        error.Should().BeNull();
        claim.Should().NotBeNull();
        claim!.ProductName.Should().Be(request.ProductName);
        claim.Status.Should().Be(WarrantyStatus.New);
        claim.ClaimNumber.Should().StartWith($"WC-{DateTime.UtcNow.Year}-");
    }

    [Fact]
    public async Task UpdateClaimStatus_ExistingClaim_ShouldUpdate()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var (claim, _) = await _warrantyService.CreateClaimAsync(userId, new CreateWarrantyClaimRequest
        {
            ProductName = "Test Product",
            PurchaseDate = DateTime.UtcNow,
            WarrantyPeriodMonths = 12
        });

        // Act
        var (updatedClaim, error) = await _warrantyService.UpdateClaimStatusAsync(claim!.Id, WarrantyStatus.InProgress, Guid.NewGuid(), "Started processing");

        // Assert
        error.Should().BeNull();
        updatedClaim!.Status.Should().Be(WarrantyStatus.InProgress);
        
        var history = await _context.WarrantyHistory.Where(h => h.WarrantyClaimId == claim.Id).ToListAsync();
        history.Should().Contain(h => h.NewStatus == WarrantyStatus.InProgress && h.Comment == "Started processing");
    }

    [Fact]
    public async Task CreateCard_ValidRequest_ShouldCreateCard()
    {
        // Arrange
        var request = new CreateWarrantyRequest
        {
            OrderId = Guid.NewGuid(),
            ProductId = Guid.NewGuid(),
            ProductName = "GPU RTX 4090",
            SerialNumber = "SN-123456789",
            UserId = Guid.NewGuid(),
            WarrantyMonths = 36
        };

        // Act
        var (warranty, error) = await _warrantyService.CreateCardAsync(request);

        // Assert
        error.Should().BeNull();
        warranty.Should().NotBeNull();
        warranty!.WarrantyNumber.Should().StartWith($"W-{DateTime.UtcNow.Year}-");
        warranty.Status.Should().Be(WarrantyStatus.Active);
        warranty.EndDate.Should().Be(DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(36)));
    }

    [Fact]
    public async Task AnnulCard_ExistingActiveCard_ShouldAnnul()
    {
        // Arrange
        var (warranty, _) = await _warrantyService.CreateCardAsync(new CreateWarrantyRequest
        {
            ProductName = "Test",
            UserId = Guid.NewGuid(),
            WarrantyMonths = 12
        });

        var annulRequest = new AnnulWarrantyRequest { Reason = "Fraud detected" };
        var adminId = Guid.NewGuid();

        // Act
        var (success, error) = await _warrantyService.AnnulCardAsync(warranty!.Id, annulRequest, adminId);

        // Assert
        success.Should().BeTrue();
        error.Should().BeNull();
        
        var card = await _context.WarrantyCards.FindAsync(warranty.Id);
        card!.Status.Should().Be(WarrantyStatus.Annulled);
        card.CancellationReason.Should().Be("Fraud detected");
    }

    [Fact]
    public async Task ExpireWarranties_ExpiringCards_ShouldUpdateStatus()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var card = new WarrantyCard
        {
            Id = Guid.NewGuid(),
            WarrantyNumber = "W-2023-000001",
            UserId = userId,
            ProductName = "Old Product",
            StartDate = DateTime.UtcNow.AddMonths(-13),
            EndDate = DateTime.UtcNow.AddDays(-1), // Expired yesterday
            Status = WarrantyStatus.Active
        };
        _context.WarrantyCards.Add(card);
        await _context.SaveChangesAsync();

        // Act
        var expiredCount = await _warrantyService.ExpireWarrantiesAsync();

        // Assert
        expiredCount.Should().Be(1);
        var updatedCard = await _context.WarrantyCards.FindAsync(card.Id);
        updatedCard!.Status.Should().Be(WarrantyStatus.Expired);
    }
}
