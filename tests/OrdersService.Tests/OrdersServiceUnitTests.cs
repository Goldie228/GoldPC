using GoldPC.OrdersService.Data;
using GoldPC.OrdersService.Entities;
using GoldPC.OrdersService.Services;
using GoldPC.SharedKernel.DTOs;
using GoldPC.SharedKernel.Enums;
using Microsoft.EntityFrameworkCore;
using FluentAssertions;
using Xunit;

namespace GoldPC.OrdersService.Tests;

public class OrdersServiceUnitTests
{
    private readonly OrdersDbContext _context;
    private readonly OrdersService.Services.OrdersService _ordersService;

    public OrdersServiceUnitTests()
    {
        var options = new DbContextOptionsBuilder<OrdersDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new OrdersDbContext(options);
        _ordersService = new OrdersService.Services.OrdersService(_context, Mock.Of<ILogger<OrdersService.Services.OrdersService>>());
    }

    [Fact]
    public async Task CreateOrder_ValidRequest_ShouldCreateOrder()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = new CreateOrderRequest
        {
            DeliveryMethod = "Pickup",
            PaymentMethod = "Online",
            Comment = "Test order"
        };

        // Act
        var (order, error) = await _ordersService.CreateAsync(userId, request);

        // Assert
        error.Should().BeNull();
        order.Should().NotBeNull();
        order!.OrderNumber.Should().StartWith("GP-");
        order.UserId.Should().Be(userId);
        order.Status.Should().Be(OrderStatus.New);
    }

    [Fact]
    public async Task UpdateStatus_FromNewToProcessing_ShouldUpdate()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = new CreateOrderRequest { DeliveryMethod = "Pickup", PaymentMethod = "Online" };
        var (order, _) = await _ordersService.CreateAsync(userId, request);

        // Act
        var (updated, error) = await _ordersService.UpdateStatusAsync(order!.Id, OrderStatus.Processing, Guid.NewGuid());

        // Assert
        error.Should().BeNull();
        updated!.Status.Should().Be(OrderStatus.Processing);
    }

    [Fact]
    public async Task CancelOrder_InNewStatus_ShouldCancel()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var request = new CreateOrderRequest { DeliveryMethod = "Pickup", PaymentMethod = "Online" };
        var (order, _) = await _ordersService.CreateAsync(userId, request);

        // Act
        var (success, error) = await _ordersService.CancelAsync(order!.Id, userId);

        // Assert
        success.Should().BeTrue();
        error.Should().BeNull();
        
        var cancelledOrder = await _ordersService.GetByIdAsync(order.Id);
        cancelledOrder!.Status.Should().Be(OrderStatus.Cancelled);
    }

    [Fact]
    public async Task GetAll_ShouldReturnPagedResults()
    {
        // Arrange
        var userId = Guid.NewGuid();
        for (int i = 0; i < 15; i++)
        {
            await _ordersService.CreateAsync(userId, new CreateOrderRequest { DeliveryMethod = "Pickup", PaymentMethod = "Online" });
        }

        // Act
        var result = await _ordersService.GetAllAsync(1, 10);

        // Assert
        result.TotalCount.Should().BeGreaterOrEqualTo(15);
        result.Items.Count.Should().Be(10);
    }

    [Fact]
    public async Task GetByUserId_ShouldReturnOnlyUserOrders()
    {
        // Arrange
        var userId1 = Guid.NewGuid();
        var userId2 = Guid.NewGuid();
        
        await _ordersService.CreateAsync(userId1, new CreateOrderRequest { DeliveryMethod = "Pickup", PaymentMethod = "Online" });
        await _ordersService.CreateAsync(userId1, new CreateOrderRequest { DeliveryMethod = "Delivery", PaymentMethod = "OnReceipt" });
        await _ordersService.CreateAsync(userId2, new CreateOrderRequest { DeliveryMethod = "Pickup", PaymentMethod = "Online" });

        // Act
        var result = await _ordersService.GetByUserIdAsync(userId1, 1, 10);

        // Assert
        result.Items.All(o => o.UserId == userId1).Should().BeTrue();
        result.TotalCount.Should().Be(2);
    }
}