using FluentAssertions;
using Moq;
using Xunit;
using GoldPC.UnitTests.Fakers;

namespace GoldPC.UnitTests.Services;

/// <summary>
/// Модульные тесты для сервиса заказов
/// </summary>
public class OrderServiceTests
{
    private readonly Mock<IOrderRepository> _orderRepositoryMock;
    private readonly Mock<IProductService> _productServiceMock;
    private readonly Mock<INotificationService> _notificationServiceMock;
    private readonly Mock<IPaymentService> _paymentServiceMock;
    private readonly Mock<IInventoryService> _inventoryServiceMock;
    private readonly Mock<ILogger<OrderService>> _loggerMock;
    private readonly OrderService _sut;

    public OrderServiceTests()
    {
        _orderRepositoryMock = new Mock<IOrderRepository>();
        _productServiceMock = new Mock<IProductService>();
        _notificationServiceMock = new Mock<INotificationService>();
        _paymentServiceMock = new Mock<IPaymentService>();
        _inventoryServiceMock = new Mock<IInventoryService>();
        _loggerMock = new Mock<ILogger<OrderService>>();

        _sut = new OrderService(
            _orderRepositoryMock.Object,
            _productServiceMock.Object,
            _notificationServiceMock.Object,
            _paymentServiceMock.Object,
            _inventoryServiceMock.Object,
            _loggerMock.Object
        );
    }

    #region CreateOrder Tests

    [Fact]
    public async Task CreateOrder_WhenProductsAvailable_CreatesOrderAndSendsNotification()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var products = new ProductFaker().Generate(2);
        var orderDto = new CreateOrderDto
        {
            Items = products.Select(p => new OrderItemDto { ProductId = p.Id, Quantity = 1 }).ToList(),
            DeliveryMethod = DeliveryMethod.Pickup,
            PaymentMethod = PaymentMethod.Online
        };

        _productServiceMock
            .Setup(p => p.GetProductsByIdsAsync(It.IsAny<IEnumerable<Guid>>()))
            .ReturnsAsync(products);

        _inventoryServiceMock
            .Setup(i => i.CheckAvailabilityAsync(It.IsAny<Dictionary<Guid, int>>()))
            .ReturnsAsync(true);

        _orderRepositoryMock
            .Setup(r => r.CreateAsync(It.IsAny<Order>()))
            .ReturnsAsync((Order o) => o);

        // Act
        var result = await _sut.CreateOrderAsync(userId, orderDto);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be(OrderStatus.New);
        result.UserId.Should().Be(userId);
        
        _notificationServiceMock.Verify(
            n => n.SendOrderCreatedAsync(result.Id, userId),
            Times.Once
        );
    }

    [Fact]
    public async Task CreateOrder_WhenProductNotAvailable_ThrowsInsufficientStockException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var products = new ProductFaker().Generate(2);
        var orderDto = new CreateOrderDto
        {
            Items = products.Select(p => new OrderItemDto { ProductId = p.Id, Quantity = 5 }).ToList(),
            DeliveryMethod = DeliveryMethod.Pickup,
            PaymentMethod = PaymentMethod.Online
        };

        _productServiceMock
            .Setup(p => p.GetProductsByIdsAsync(It.IsAny<IEnumerable<Guid>>()))
            .ReturnsAsync(products);

        _inventoryServiceMock
            .Setup(i => i.CheckAvailabilityAsync(It.IsAny<Dictionary<Guid, int>>()))
            .ReturnsAsync(false);

        // Act
        var act = async () => await _sut.CreateOrderAsync(userId, orderDto);

        // Assert
        await act.Should().ThrowAsync<InsufficientStockException>()
            .WithMessage("*недостаточно*складе*");
    }

    [Fact]
    public async Task CreateOrder_WhenProductNotFound_ThrowsProductNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var orderDto = new CreateOrderDto
        {
            Items = new List<OrderItemDto> { new() { ProductId = Guid.NewGuid(), Quantity = 1 } },
            DeliveryMethod = DeliveryMethod.Pickup,
            PaymentMethod = PaymentMethod.Online
        };

        _productServiceMock
            .Setup(p => p.GetProductsByIdsAsync(It.IsAny<IEnumerable<Guid>>()))
            .ReturnsAsync(new List<Product>());

        // Act
        var act = async () => await _sut.CreateOrderAsync(userId, orderDto);

        // Assert
        await act.Should().ThrowAsync<ProductNotFoundException>();
    }

    [Fact]
    public async Task CreateOrder_WithEmptyItems_ThrowsValidationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var orderDto = new CreateOrderDto
        {
            Items = new List<OrderItemDto>(),
            DeliveryMethod = DeliveryMethod.Pickup,
            PaymentMethod = PaymentMethod.Online
        };

        // Act
        var act = async () => await _sut.CreateOrderAsync(userId, orderDto);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*товары*обязательны*");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-100)]
    public async Task CreateOrder_WithInvalidQuantity_ThrowsValidationException(int quantity)
    {
        // Arrange
        var userId = Guid.NewGuid();
        var orderDto = new CreateOrderDto
        {
            Items = new List<OrderItemDto> 
            { 
                new() { ProductId = Guid.NewGuid(), Quantity = quantity } 
            },
            DeliveryMethod = DeliveryMethod.Pickup,
            PaymentMethod = PaymentMethod.Online
        };

        // Act
        var act = async () => await _sut.CreateOrderAsync(userId, orderDto);

        // Assert
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*количество*должно быть положительным*");
    }

    #endregion

    #region GetOrderById Tests

    [Fact]
    public async Task GetOrderById_WhenOrderExists_ReturnsOrder()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var order = new OrderFaker()
            .ForUser(userId)
            .AsNew()
            .Generate();
        order.Id = orderId;

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(orderId))
            .ReturnsAsync(order);

        // Act
        var result = await _sut.GetOrderByIdAsync(orderId, userId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(orderId);
    }

    [Fact]
    public async Task GetOrderById_WhenOrderNotFound_ReturnsNull()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(orderId))
            .ReturnsAsync((Order?)null);

        // Act
        var result = await _sut.GetOrderByIdAsync(orderId, userId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetOrderById_WhenUserNotOwner_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var orderOwnerId = Guid.NewGuid();
        var requestingUserId = Guid.NewGuid(); // Другой пользователь
        var order = new OrderFaker()
            .ForUser(orderOwnerId)
            .Generate();
        order.Id = orderId;

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(orderId))
            .ReturnsAsync(order);

        // Act
        var act = async () => await _sut.GetOrderByIdAsync(orderId, requestingUserId);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    #endregion

    #region UpdateOrderStatus Tests

    [Fact]
    public async Task UpdateOrderStatus_WhenValidTransition_UpdatesStatus()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var order = new OrderFaker()
            .AsNew()
            .Generate();
        order.Id = orderId;

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(orderId))
            .ReturnsAsync(order);

        _orderRepositoryMock
            .Setup(r => r.UpdateAsync(It.IsAny<Order>()))
            .ReturnsAsync((Order o) => o);

        // Act
        var result = await _sut.UpdateOrderStatusAsync(orderId, OrderStatus.Processing);

        // Assert
        result.Should().NotBeNull();
        result!.Status.Should().Be(OrderStatus.Processing);
    }

    [Theory]
    [InlineData(OrderStatus.Completed, OrderStatus.New)]
    [InlineData(OrderStatus.Cancelled, OrderStatus.New)]
    public async Task UpdateOrderStatus_WhenInvalidTransition_ThrowsInvalidStatusTransitionException(
        OrderStatus from, OrderStatus to)
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var order = new OrderFaker()
            .WithStatus(from)
            .Generate();
        order.Id = orderId;

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(orderId))
            .ReturnsAsync(order);

        // Act
        var act = async () => await _sut.UpdateOrderStatusAsync(orderId, to);

        // Assert
        await act.Should().ThrowAsync<InvalidStatusTransitionException>();
    }

    #endregion

    #region CancelOrder Tests

    [Fact]
    public async Task CancelOrder_WhenNewOrProcessing_CancelsAndRestoresStock()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var order = new OrderFaker()
            .ForUser(userId)
            .AsNew()
            .Generate();
        order.Id = orderId;

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(orderId))
            .ReturnsAsync(order);

        _orderRepositoryMock
            .Setup(r => r.UpdateAsync(It.IsAny<Order>()))
            .ReturnsAsync((Order o) => o);

        // Act
        var result = await _sut.CancelOrderAsync(orderId, userId);

        // Assert
        result.Should().NotBeNull();
        result!.Status.Should().Be(OrderStatus.Cancelled);
        
        _inventoryServiceMock.Verify(
            i => i.RestoreStockAsync(It.IsAny<Dictionary<Guid, int>>()),
            Times.Once
        );
        
        _notificationServiceMock.Verify(
            n => n.SendOrderCancelledAsync(orderId, userId),
            Times.Once
        );
    }

    [Fact]
    public async Task CancelOrder_WhenAlreadyCompleted_ThrowsInvalidOperationException()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var order = new OrderFaker()
            .ForUser(userId)
            .AsCompleted()
            .Generate();
        order.Id = orderId;

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(orderId))
            .ReturnsAsync(order);

        // Act
        var act = async () => await _sut.CancelOrderAsync(orderId, userId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*нельзя отменить*");
    }

    #endregion

    #region ProcessPayment Tests

    [Fact]
    public async Task ProcessPayment_WhenSuccessful_UpdatesOrderStatus()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var order = new OrderFaker()
            .AsProcessing()
            .Generate();
        order.Id = orderId;

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(orderId))
            .ReturnsAsync(order);

        _paymentServiceMock
            .Setup(p => p.ProcessPaymentAsync(It.IsAny<PaymentRequest>()))
            .ReturnsAsync(new PaymentResult { Success = true, TransactionId = "TRX-123" });

        _orderRepositoryMock
            .Setup(r => r.UpdateAsync(It.IsAny<Order>()))
            .ReturnsAsync((Order o) => o);

        // Act
        var result = await _sut.ProcessPaymentAsync(orderId, order.TotalAmount);

        // Assert
        result.Success.Should().BeTrue();
        result.OrderStatus.Should().Be(OrderStatus.Paid);
    }

    [Fact]
    public async Task ProcessPayment_WhenFailed_ReturnsFailureResult()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var order = new OrderFaker()
            .AsProcessing()
            .Generate();
        order.Id = orderId;

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(orderId))
            .ReturnsAsync(order);

        _paymentServiceMock
            .Setup(p => p.ProcessPaymentAsync(It.IsAny<PaymentRequest>()))
            .ReturnsAsync(new PaymentResult 
            { 
                Success = false, 
                ErrorCode = "INSUFFICIENT_FUNDS",
                ErrorMessage = "Недостаточно средств"
            });

        // Act
        var result = await _sut.ProcessPaymentAsync(orderId, order.TotalAmount);

        // Assert
        result.Success.Should().BeFalse();
        result.ErrorCode.Should().Be("INSUFFICIENT_FUNDS");
        result.OrderStatus.Should().Be(OrderStatus.Processing);
    }

    #endregion

    #region GetUserOrders Tests

    [Fact]
    public async Task GetUserOrders_ReturnsUserOrders()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var orders = new OrderFaker()
            .Generate(5);
        orders.ForEach(o => o.UserId = userId);

        _orderRepositoryMock
            .Setup(r => r.GetByUserIdAsync(userId))
            .ReturnsAsync(orders);

        // Act
        var result = await _sut.GetUserOrdersAsync(userId);

        // Assert
        result.Should().HaveCount(5);
        result.All(o => o.UserId == userId).Should().BeTrue();
    }

    [Fact]
    public async Task GetUserOrders_WithStatusFilter_ReturnsFilteredOrders()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var orders = new List<Order>
        {
            new OrderFaker().ForUser(userId).AsNew().Generate(),
            new OrderFaker().ForUser(userId).AsCompleted().Generate(),
            new OrderFaker().ForUser(userId).AsCompleted().Generate(),
        };

        _orderRepositoryMock
            .Setup(r => r.GetByUserIdAsync(userId, OrderStatus.Completed))
            .ReturnsAsync(orders.Where(o => o.Status == OrderStatus.Completed).ToList());

        // Act
        var result = await _sut.GetUserOrdersAsync(userId, OrderStatus.Completed);

        // Assert
        result.Should().HaveCount(2);
        result.All(o => o.Status == OrderStatus.Completed).Should().BeTrue();
    }

    #endregion
}

#region Interfaces and DTOs (Stubs)

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid id);
    Task<List<Order>> GetByUserIdAsync(Guid userId, OrderStatus? status = null);
    Task<Order> CreateAsync(Order order);
    Task<Order> UpdateAsync(Order order);
    Task DeleteAsync(Guid id);
}

public interface IProductService
{
    Task<List<Product>> GetProductsByIdsAsync(IEnumerable<Guid> ids);
}

public interface INotificationService
{
    Task SendOrderCreatedAsync(Guid orderId, Guid userId);
    Task SendOrderCancelledAsync(Guid orderId, Guid userId);
    Task SendOrderStatusChangedAsync(Guid orderId, OrderStatus newStatus);
}

public interface IPaymentService
{
    Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request);
    Task<RefundResult> RefundAsync(Guid orderId, decimal amount);
}

public interface IInventoryService
{
    Task<bool> CheckAvailabilityAsync(Dictionary<Guid, int> items);
    Task ReserveStockAsync(Dictionary<Guid, int> items);
    Task RestoreStockAsync(Dictionary<Guid, int> items);
}

public interface ILogger<T> { }

public class OrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IProductService _productService;
    private readonly INotificationService _notificationService;
    private readonly IPaymentService _paymentService;
    private readonly IInventoryService _inventoryService;
    private readonly ILogger<OrderService> _logger;

    private static readonly Dictionary<OrderStatus, OrderStatus[]> ValidTransitions = new()
    {
        [OrderStatus.New] = new[] { OrderStatus.Processing, OrderStatus.Cancelled },
        [OrderStatus.Processing] = new[] { OrderStatus.Paid, OrderStatus.Cancelled },
        [OrderStatus.Paid] = new[] { OrderStatus.Ready },
        [OrderStatus.Ready] = new[] { OrderStatus.Completed, OrderStatus.Cancelled },
        [OrderStatus.Completed] = Array.Empty<OrderStatus>(),
        [OrderStatus.Cancelled] = Array.Empty<OrderStatus>()
    };

    public OrderService(
        IOrderRepository orderRepository,
        IProductService productService,
        INotificationService notificationService,
        IPaymentService paymentService,
        IInventoryService inventoryService,
        ILogger<OrderService> logger)
    {
        _orderRepository = orderRepository;
        _productService = productService;
        _notificationService = notificationService;
        _paymentService = paymentService;
        _inventoryService = inventoryService;
        _logger = logger;
    }

    public async Task<Order> CreateOrderAsync(Guid userId, CreateOrderDto dto)
    {
        if (dto.Items == null || !dto.Items.Any())
            throw new ValidationException("Товары обязательны для заказа");

        if (dto.Items.Any(i => i.Quantity <= 0))
            throw new ValidationException("Количество должно быть положительным");

        var productIds = dto.Items.Select(i => i.ProductId).ToList();
        var products = await _productService.GetProductsByIdsAsync(productIds);

        if (products.Count != productIds.Count)
            throw new ProductNotFoundException("Некоторые товары не найдены");

        var itemsDict = dto.Items.ToDictionary(i => i.ProductId, i => i.Quantity);
        var isAvailable = await _inventoryService.CheckAvailabilityAsync(itemsDict);

        if (!isAvailable)
            throw new InsufficientStockException("Недостаточно товаров на складе");

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = $"ORD-{Random.Shared.Next(10000, 99999)}",
            UserId = userId,
            Status = OrderStatus.New,
            Items = dto.Items.Select(i =>
            {
                var product = products.First(p => p.Id == i.ProductId);
                return new OrderItem
                {
                    Id = Guid.NewGuid(),
                    ProductId = i.ProductId,
                    ProductName = product.Name,
                    Sku = product.Sku,
                    Quantity = i.Quantity,
                    Price = product.Price
                };
            }).ToList(),
            DeliveryMethod = dto.DeliveryMethod,
            PaymentMethod = dto.PaymentMethod,
            DeliveryAddress = dto.DeliveryAddress,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _orderRepository.CreateAsync(order);
        await _notificationService.SendOrderCreatedAsync(result.Id, userId);

        return result;
    }

    public async Task<Order?> GetOrderByIdAsync(Guid orderId, Guid userId)
    {
        var order = await _orderRepository.GetByIdAsync(orderId);
        if (order == null) return null;
        if (order.UserId != userId)
            throw new UnauthorizedAccessException("У вас нет доступа к этому заказу");
        return order;
    }

    public async Task<Order?> UpdateOrderStatusAsync(Guid orderId, OrderStatus newStatus)
    {
        var order = await _orderRepository.GetByIdAsync(orderId);
        if (order == null) return null;

        var validNext = ValidTransitions[order.Status];
        if (!validNext.Contains(newStatus))
            throw new InvalidStatusTransitionException(
                $"Невозможно изменить статус с {order.Status} на {newStatus}");

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;

        return await _orderRepository.UpdateAsync(order);
    }

    public async Task<Order?> CancelOrderAsync(Guid orderId, Guid userId)
    {
        var order = await _orderRepository.GetByIdAsync(orderId);
        if (order == null) return null;
        if (order.UserId != userId)
            throw new UnauthorizedAccessException();
        if (order.Status == OrderStatus.Completed)
            throw new InvalidOperationException("Нельзя отменить завершённый заказ");

        order.Status = OrderStatus.Cancelled;
        order.UpdatedAt = DateTime.UtcNow;

        var itemsDict = order.Items.ToDictionary(i => i.ProductId, i => i.Quantity);
        await _inventoryService.RestoreStockAsync(itemsDict);
        await _notificationService.SendOrderCancelledAsync(orderId, userId);

        return await _orderRepository.UpdateAsync(order);
    }

    public async Task<ProcessPaymentResult> ProcessPaymentAsync(Guid orderId, decimal amount)
    {
        var order = await _orderRepository.GetByIdAsync(orderId);
        if (order == null)
            throw new OrderNotFoundException("Заказ не найден");

        var paymentResult = await _paymentService.ProcessPaymentAsync(new PaymentRequest
        {
            OrderId = orderId,
            Amount = amount
        });

        if (paymentResult.Success)
        {
            order.Status = OrderStatus.Paid;
            order.UpdatedAt = DateTime.UtcNow;
            await _orderRepository.UpdateAsync(order);
        }

        return new ProcessPaymentResult
        {
            Success = paymentResult.Success,
            TransactionId = paymentResult.TransactionId,
            ErrorCode = paymentResult.ErrorCode,
            ErrorMessage = paymentResult.ErrorMessage,
            OrderStatus = order.Status
        };
    }

    public async Task<List<Order>> GetUserOrdersAsync(Guid userId, OrderStatus? status = null)
    {
        return await _orderRepository.GetByUserIdAsync(userId, status);
    }
}

public class CreateOrderDto
{
    public List<OrderItemDto> Items { get; set; } = new();
    public DeliveryMethod DeliveryMethod { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public DeliveryAddress? DeliveryAddress { get; set; }
}

public class OrderItemDto
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
}

public class PaymentRequest
{
    public Guid OrderId { get; set; }
    public decimal Amount { get; set; }
}

public class PaymentResult
{
    public bool Success { get; set; }
    public string? TransactionId { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
}

public class RefundResult
{
    public bool Success { get; set; }
    public string? RefundId { get; set; }
}

public class ProcessPaymentResult : PaymentResult
{
    public OrderStatus OrderStatus { get; set; }
}

public class InsufficientStockException : Exception
{
    public InsufficientStockException(string message) : base(message) { }
}

public class ProductNotFoundException : Exception
{
    public ProductNotFoundException(string message) : base(message) { }
}

public class OrderNotFoundException : Exception
{
    public OrderNotFoundException(string message) : base(message) { }
}

public class InvalidStatusTransitionException : Exception
{
    public InvalidStatusTransitionException(string message) : base(message) { }
}

#endregion