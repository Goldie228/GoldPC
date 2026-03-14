using Bogus;

namespace GoldPC.UnitTests.Fakers;

/// <summary>
/// Faker для генерации тестовых данных заказа
/// </summary>
public class OrderFaker : Faker<Order>
{
    public OrderFaker()
    {
        RuleFor(o => o.Id, f => f.Random.Guid());
        RuleFor(o => o.OrderNumber, f => $"ORD-{f.Random.Int(10000, 99999)}");
        RuleFor(o => o.UserId, f => f.Random.Guid());
        RuleFor(o => o.Status, f => f.PickRandom<OrderStatus>());
        RuleFor(o => o.Items, f => GenerateItems(f));
        RuleFor(o => o.DeliveryMethod, f => f.PickRandom<DeliveryMethod>());
        RuleFor(o => o.PaymentMethod, f => f.PickRandom<PaymentMethod>());
        RuleFor(o => o.DeliveryAddress, (f, o) => o.DeliveryMethod == DeliveryMethod.Delivery ? GenerateAddress(f) : null);
        RuleFor(o => o.Notes, f => f.Lorem.Sentence(3));
        RuleFor(o => o.CreatedAt, f => f.Date.Past(1));
        RuleFor(o => o.UpdatedAt, f => f.Date.Recent(14));
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
                ProductName = f.Commerce.ProductName(),
                Quantity = f.Random.Int(1, 3),
                Price = decimal.Parse(f.Commerce.Price(100, 50000)),
                Sku = f.Commerce.Ean13()
            });
        }
        
        return items;
    }

    private static DeliveryAddress GenerateAddress(Faker f)
    {
        return new DeliveryAddress
        {
            City = f.Address.City(),
            Street = f.Address.StreetAddress(),
            House = f.Random.Int(1, 200).ToString(),
            Apartment = f.Random.Int(1, 500).ToString(),
            PostalCode = f.Address.ZipCode()
        };
    }

    /// <summary>
    /// Создать заказ для указанного пользователя
    /// </summary>
    public OrderFaker ForUser(Guid userId)
    {
        RuleFor(o => o.UserId, userId);
        return this;
    }

    /// <summary>
    /// Создать заказ с указанным статусом
    /// </summary>
    public OrderFaker WithStatus(OrderStatus status)
    {
        RuleFor(o => o.Status, status);
        return this;
    }

    /// <summary>
    /// Создать новый заказ
    /// </summary>
    public OrderFaker AsNew()
    {
        RuleFor(o => o.Status, OrderStatus.New);
        return this;
    }

    /// <summary>
    /// Создать заказ в обработке
    /// </summary>
    public OrderFaker AsProcessing()
    {
        RuleFor(o => o.Status, OrderStatus.Processing);
        return this;
    }

    /// <summary>
    /// Создать оплаченный заказ
    /// </summary>
    public OrderFaker AsPaid()
    {
        RuleFor(o => o.Status, OrderStatus.Paid);
        return this;
    }

    /// <summary>
    /// Создать завершённый заказ
    /// </summary>
    public OrderFaker AsCompleted()
    {
        RuleFor(o => o.Status, OrderStatus.Completed);
        return this;
    }

    /// <summary>
    /// Создать отменённый заказ
    /// </summary>
    public OrderFaker AsCancelled()
    {
        RuleFor(o => o.Status, OrderStatus.Cancelled);
        return this;
    }

    /// <summary>
    /// Создать заказ с самовывозом
    /// </summary>
    public OrderFaker WithPickup()
    {
        RuleFor(o => o.DeliveryMethod, DeliveryMethod.Pickup);
        RuleFor(o => o.DeliveryAddress, (DeliveryAddress?)null);
        return this;
    }

    /// <summary>
    /// Создать заказ с доставкой
    /// </summary>
    public OrderFaker WithDelivery()
    {
        RuleFor(o => o.DeliveryMethod, DeliveryMethod.Delivery);
        RuleFor(o => o.DeliveryAddress, f => GenerateAddress(f));
        return this;
    }

    /// <summary>
    /// Создать заказ с конкретными товарами
    /// </summary>
    public OrderFaker WithItems(List<OrderItem> items)
    {
        RuleFor(o => o.Items, items);
        return this;
    }

    /// <summary>
    /// Создать заказ с минимальной суммой
    /// </summary>
    public OrderFaker WithMinimumAmount(decimal minimumAmount)
    {
        RuleFor(o => o.Items, f => new List<OrderItem>
        {
            new()
            {
                Id = f.Random.Guid(),
                ProductId = f.Random.Guid(),
                ProductName = f.Commerce.ProductName(),
                Quantity = 1,
                Price = minimumAmount,
                Sku = f.Commerce.Ean13()
            }
        });
        return this;
    }
}

/// <summary>
/// Тестовая модель заказа
/// </summary>
public class Order
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public OrderStatus Status { get; set; }
    public List<OrderItem> Items { get; set; } = new();
    public DeliveryMethod DeliveryMethod { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public DeliveryAddress? DeliveryAddress { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    public decimal TotalAmount => Items.Sum(i => i.Price * i.Quantity);
    public int TotalItems => Items.Sum(i => i.Quantity);
}

/// <summary>
/// Элемент заказа
/// </summary>
public class OrderItem
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}

/// <summary>
/// Адрес доставки
/// </summary>
public class DeliveryAddress
{
    public string City { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string House { get; set; } = string.Empty;
    public string? Apartment { get; set; }
    public string PostalCode { get; set; } = string.Empty;
    
    public string FullAddress => $"{City}, {Street}, д. {House}{(Apartment != null ? $", кв. {Apartment}" : "")}";
}

public enum OrderStatus
{
    New,
    Processing,
    Paid,
    Ready,
    Completed,
    Cancelled
}

public enum DeliveryMethod
{
    Pickup,
    Delivery
}

public enum PaymentMethod
{
    Online,
    OnReceipt
}