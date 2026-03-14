using GoldPC.WarrantyService.Data;
using GoldPC.WarrantyService.Entities;
using GoldPC.WarrantyService.Services;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;
using Xunit;

namespace GoldPC.WarrantyService.Tests;

public class WarrantyServiceUnitTests
{
    private readonly WarrantyDbContext _context;
    private readonly WarrantyService.Services.WarrantyService _warrantyService;

    public WarrantyServiceUnitTests()
    {
        var options = new DbContextOptionsBuilder<WarrantyDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new WarrantyDbContext(options);
        _warrantyService = new WarrantyService.Services.WarrantyService(_context, Mock.Of<ILogger<WarrantyService.Services.WarrantyService>>());
    }

    [Fact]
    public async Task CreateClaim_ValidRequest_ShouldCreate()
    {
        var userId = Guid.NewGuid();
        var request = new CreateWarrantyClaimRequest
        {
            OrderId = Guid.NewGuid(),
            ProductId = Guid.NewGuid(),
            ProductName = "RTX 4070",
            Description = "Видео card artifacts",
            PurchaseDate = DateTime.UtcNow.AddDays(-30),
            WarrantyPeriodMonths = 24
        };

        var (result, error) = await _warrantyService.CreateAsync(userId, request);

        error.Should().BeNull();
        result.Should().NotBeNull();
        result!.ClaimNumber.Should().StartWith("WC-");
        result.Status.Should().Be(WarrantyStatus.New);
    }

    [Fact]
    public async Task ResolveClaim_ValidRequest_ShouldResolve()
    {
        var userId = Guid.NewGuid();
        var request = new CreateWarrantyClaimRequest
        {
                OrderId = Guid.NewGuid(),
                ProductId = Guid.NewGuid(),
                ProductName = "Test Product",
                Description = "Test",
                PurchaseDate = DateTime.UtcNow.AddDays(-30),
                WarrantyPeriodMonths = 12
            };

        var (claim, _) = await _warrantyService.CreateAsync(userId, request);
        await _warrantyService.UpdateStatusAsync(claim!.Id, WarrantyStatus.InProgress, Guid.NewGuid());

        var (result, error) = await _warrantyService.ResolveAsync(claim!.Id, "Replaced", Guid.NewGuid());

        error.Should().BeNull();
        result!.Status.Should().Be(WarrantyStatus.Resolved);
        result.Resolution.Should().Be("Replaced");
    }

    [Fact]
    public async Task GetByUserId_ShouldReturnOnlyUserClaims()
    {
        var userId1 = Guid.NewGuid();
        var userId2 = Guid.NewGuid();

        await _warrantyService.CreateAsync(userId1, new CreateWarrantyClaimRequest
        {
            OrderId = Guid.NewGuid(), ProductId = Guid.NewGuid(), ProductName = "Product 1",
            Description = "Test 1", PurchaseDate = DateTime.UtcNow, WarrantyPeriodMonths = 12
        });

        await _warrantyService.CreateAsync(userId2, new CreateWarrantyClaimRequest
        {
            OrderId = Guid.NewGuid(), ProductId = Guid.NewGuid(), ProductName = "Product 2",
            Description = "Test 2", PurchaseDate = DateTime.UtcNow, WarrantyPeriodMonths = 12
        });

        var result = await _warrantyService.GetByUserIdAsync(userId1, 1, 10);

        result.Items.Should().HaveCount(1);
        result.Items[0].ProductName.Should().Be("Product 1");
    }
}