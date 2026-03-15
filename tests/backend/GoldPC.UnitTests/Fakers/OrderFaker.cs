using Bogus;
using GoldPC.SharedKernel.Entities;
using GoldPC.SharedKernel.Enums;

namespace GoldPC.UnitTests.Fakers;

/// <summary>
/// Элемент заказа (тестовая модель)
/// </summary>
public class OrderItem
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice => UnitPrice * Quantity;
}

/// <summary>
/// История изменений статусов заказа (тестовая модель)
/// </summary>
public class OrderHistory
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public OrderStatus PreviousStatus { get; set; }
    public OrderStatus NewStatus { get; set; }
    public string? Comment { get; set; }
    public Guid ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Заказ (тестовая модель)
/// </summary>
public class Order : BaseEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.New;
    public decimal Total { get; set; }
    public string DeliveryMethod { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Comment { get; set; }
    public bool IsPaid { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? PaymentId { get; set; }
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public ICollection<OrderHistory> History { get; set; } = new List<OrderHistory>();
    
    public decimal TotalAmount => Items.Sum(i => i.UnitPrice * i.Quantity);
    public int TotalItems => Items.Sum(i => i.Quantity);
}

/// <summary>
/// Faker для генерации тестовых данных заказа
/// </summary>
public class OrderFaker : Faker<Order>
{
    public OrderFaker()
    {
        RuleFor(o => o.Id, f => f.Random.Guid());
        RuleFor(o => o.OrderNumber, f => GenerateOrderNumber(f));
        RuleFor(o => o.UserId, f => f.Random.Guid());
        RuleFor(o => o.Status, f => f.PickRandom<OrderStatus>());
        RuleFor(o => o.Total, 0m);
        RuleFor(o => o.DeliveryMethod, f => f.PickRandom("Pickup", "Delivery"));
        RuleFor(o => o.PaymentMethod, f => f.PickRandom("Online", "OnReceipt"));
        RuleFor(o => o.Address, (f, o) => o.DeliveryMethod == "Delivery" ? GenerateAddress(f) : null);
        RuleFor(o => o.Comment, f => f.Lorem.Sentence(3));
        RuleFor(o => o.IsPaid, (f, o) => o.Status >= OrderStatus.Paid);
        RuleFor(o => o.PaidAt, (f, o) => o.IsPaid ? f.Date.Recent(30) : null);
        RuleFor(o => o.PaymentId, (f, o) => o.IsPaid ? $"PAY-{f.Random.AlphaNumeric(12).ToUpper()}" : null);
        RuleFor(o => o.CreatedAt, f => f.Date.Past(1));
        RuleFor(o => o.UpdatedAt, f => f.Date.Recent(14));
        RuleFor(o => o.Items, f => GenerateItems(f));
        RuleFor(o => o.History, _ => new List<OrderHistory>());
    }

    private static string GenerateOrderNumber(Faker f)
    {
        var year = DateTime.Now.Year;
        var number = f.Random.Int(1, 999999).ToString("D6");
        return $"GP-{year}-{number}";
    }

    private static string GenerateAddress(Faker f)
    {
        var city = f.PickRandom(BelarusianCities);
        var street = f.Address.StreetAddress();
        var apartment = f.Random.Int(1, 200);
        return $"{city}, {street}, кв. {apartment}";
    }

    private static List<OrderItem> GenerateItems(Faker f)
    {
        var itemCount = f.Random.Int(1, 5);
        var items = new List<OrderItem>();
        
        for (int i = 0; i < itemCount; i++)
        {
            items.Add(new OrderItem
            {
                Id = f.Random.Guid(),
                ProductId = f.Random.Guid(),
                ProductName = GenerateProductName(f),
                Quantity = f.Random.Int(1, 3),
                UnitPrice = decimal.Parse(f.Commerce.Price(100, 50000))
            });
        }
        
        return items;
    }

    private static string GenerateProductName(Faker f)
    {
        var products = new[]
        {
            "AMD Ryzen 9 7950X",
            "Intel Core i9-14900K",
            "NVIDIA GeForce RTX 4090",
            "AMD Radeon RX 7900 XTX",
            "Kingston DDR5-6000 32GB",
            "Samsung 990 Pro 2TB",
            "ASUS ROG Strix RTX 4080",
            "Corsair RM1000x PSU",
            "NZXT H7 Flow Case",
            "Noctua NH-D15 Cooler"
        };
        
        return f.PickRandom(products);
    }

    private static readonly string[] BelarusianCities =
    {
        "Минск", "Брест", "Витебск", "Гомель", "Гродно", "Могилёв",
        "Бобруйск", "Барановичи", "Борисов", "Орша", "Пинск", "Мозырь"
    };

    #region Fluent Builder Methods

    public OrderFaker ForUser(Guid userId)
    {
        RuleFor(o => o.UserId, userId);
        return this;
    }

    public OrderFaker WithStatus(OrderStatus status)
    {
        RuleFor(o => o.Status, status);
        RuleFor(o => o.IsPaid, status >= OrderStatus.Paid);
        RuleFor(o => o.PaidAt, (f, o) => o.IsPaid ? f.Date.Recent(30) : null);
        return this;
    }

    public OrderFaker AsNew()
    {
        RuleFor(o => o.Status, OrderStatus.New);
        RuleFor(o => o.IsPaid, false);
        RuleFor(o => o.PaidAt, (DateTime?)null);
        return this;
    }

    public OrderFaker AsProcessing()
    {
        RuleFor(o => o.Status, OrderStatus.Processing);
        RuleFor(o => o.IsPaid, false);
        return this;
    }

    public OrderFaker AsPaid()
    {
        RuleFor(o => o.Status, OrderStatus.Paid);
        RuleFor(o => o.IsPaid, true);
        RuleFor(o => o.PaidAt, f => f.Date.Recent(7));
        RuleFor(o => o.PaymentId, f => $"PAY-{f.Random.AlphaNumeric(12).ToUpper()}");
        return this;
    }

    public OrderFaker AsInProgress()
    {
        RuleFor(o => o.Status, OrderStatus.InProgress);
        RuleFor(o => o.IsPaid, true);
        RuleFor(o => o.PaidAt, f => f.Date.Recent(14));
        return this;
    }

    public OrderFaker AsReady()
    {
        RuleFor(o => o.Status, OrderStatus.Ready);
        RuleFor(o => o.IsPaid, true);
        RuleFor(o => o.PaidAt, f => f.Date.Recent(21));
        return this;
    }

    public OrderFaker AsCompleted()
    {
        RuleFor(o => o.Status, OrderStatus.Completed);
        RuleFor(o => o.IsPaid, true);
        RuleFor(o => o.PaidAt, f => f.Date.Recent(30));
        return this;
    }

    public OrderFaker AsCancelled()
    {
        RuleFor(o => o.Status, OrderStatus.Cancelled);
        RuleFor(o => o.IsPaid, false);
        RuleFor(o => o.Comment, f => $"Отменён: {f.PickRandom("по просьбе клиента", "неоплата", "нет в наличии")}");
        return this;
    }

    public OrderFaker WithPickup()
    {
        RuleFor(o => o.DeliveryMethod, "Pickup");
        RuleFor(o => o.Address, (string?)null);
        return this;
    }

    public OrderFaker WithDelivery()
    {
        RuleFor(o => o.DeliveryMethod, "Delivery");
        RuleFor(o => o.Address, f => GenerateAddress(f));
        return this;
    }

    public OrderFaker WithItems(List<OrderItem> items)
    {
        RuleFor(o => o.Items, items);
        return this;
    }

    public OrderFaker WithMinimumAmount(decimal minimumAmount)
    {
        RuleFor(o => o.Items, f => new List<OrderItem>
        {
            new()
            {
                Id = f.Random.Guid(),
                ProductId = f.Random.Guid(),
                ProductName = GenerateProductName(f),
                Quantity = 1,
                UnitPrice = minimumAmount
            }
        });
        return this;
    }

    public OrderFaker WithHistory()
    {
        RuleFor(o => o.History, (f, o) => GenerateHistory(f, o));
        return this;
    }

    private static List<OrderHistory> GenerateHistory(Faker f, Order order)
    {
        var history = new List<OrderHistory>();
        var statuses = Enum.GetValues<OrderStatus>().Where(s => s <= order.Status).ToList();
        
        OrderStatus previousStatus = default;
        foreach (var status in statuses)
        {
            history.Add(new OrderHistory
            {
                Id = f.Random.Guid(),
                OrderId = order.Id,
                PreviousStatus = previousStatus,
                NewStatus = status,
                Comment = GetStatusChangeComment(f, status),
                ChangedBy = order.UserId,
                ChangedAt = f.Date.Past(1)
            });
            previousStatus = status;
        }
        
        return history;
    }

    private static string? GetStatusChangeComment(Faker f, OrderStatus status)
    {
        return status switch
        {
            OrderStatus.New => "Заказ создан",
            OrderStatus.Processing => f.PickRandom("Обработка начата", "Менеджер назначен"),
            OrderStatus.Paid => "Оплата подтверждена",
            OrderStatus.InProgress => f.PickRandom("Передан в сборку", "Начат ремонт"),
            OrderStatus.Ready => "Заказ готов к выдаче",
            OrderStatus.Completed => "Заказ выдан клиенту",
            OrderStatus.Cancelled => "Заказ отменён",
            _ => null
        };
    }

    public OrderFaker WithOnlinePayment()
    {
        RuleFor(o => o.PaymentMethod, "Online");
        return this;
    }

    public OrderFaker WithPaymentOnReceipt()
    {
        RuleFor(o => o.PaymentMethod, "OnReceipt");
        return this;
    }

    public OrderFaker WithItemsCount(int count)
    {
        RuleFor(o => o.Items, f =>
        {
            var items = new List<OrderItem>();
            for (int i = 0; i < count; i++)
            {
                items.Add(new OrderItem
                {
                    Id = f.Random.Guid(),
                    ProductId = f.Random.Guid(),
                    ProductName = GenerateProductName(f),
                    Quantity = f.Random.Int(1, 3),
                    UnitPrice = decimal.Parse(f.Commerce.Price(100, 50000))
                });
            }
            return items;
        });
        return this;
    }

    public OrderFaker WithTotalAmount(decimal totalAmount)
    {
        RuleFor(o => o.Items, f => new List<OrderItem>
        {
            new()
            {
                Id = f.Random.Guid(),
                ProductId = f.Random.Guid(),
                ProductName = GenerateProductName(f),
                Quantity = 1,
                UnitPrice = totalAmount
            }
        });
        return this;
    }

    #endregion
}

/// <summary>
/// Расширения для OrderFaker
/// </summary>
public static class OrderFakerExtensions
{
    public static List<Order> GenerateAllStatuses(this OrderFaker faker)
    {
        return new List<Order>
        {
            new OrderFaker().AsNew().Generate(),
            new OrderFaker().AsProcessing().Generate(),
            new OrderFaker().AsPaid().Generate(),
            new OrderFaker().AsInProgress().Generate(),
            new OrderFaker().AsReady().Generate(),
            new OrderFaker().AsCompleted().Generate(),
            new OrderFaker().AsCancelled().Generate()
        };
    }

    public static List<Order> GenerateForUser(this OrderFaker faker, Guid userId, int count)
    {
        return new OrderFaker()
            .ForUser(userId)
            .Generate(count);
    }
}