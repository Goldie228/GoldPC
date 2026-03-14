using Bogus;

namespace GoldPC.UnitTests.Fakers;

/// <summary>
/// Faker для генерации тестовых данных товара
/// </summary>
public class ProductFaker : Faker<Product>
{
    public ProductFaker()
    {
        RuleFor(p => p.Id, f => f.Random.Guid());
        RuleFor(p => p.Name, f => f.Commerce.ProductName());
        RuleFor(p => p.Sku, f => f.Commerce.Ean13());
        RuleFor(p => p.Price, f => decimal.Parse(f.Commerce.Price(100, 100000)));
        RuleFor(p => p.Stock, f => f.Random.Int(0, 100));
        RuleFor(p => p.Category, f => f.PickRandom<ProductCategory>());
        RuleFor(p => p.Specifications, f => GenerateSpecifications(f));
        RuleFor(p => p.Manufacturer, f => f.Company.CompanyName());
        RuleFor(p => p.WarrantyMonths, f => f.Random.Int(12, 36));
        RuleFor(p => p.Description, f => f.Commerce.ProductDescription());
        RuleFor(p => p.Rating, f => f.Random.Double(1, 5));
        RuleFor(p => p.IsActive, f => f.Random.Bool(0.9f)); // 90% активны
        RuleFor(p => p.CreatedAt, f => f.Date.Past(1));
        RuleFor(p => p.UpdatedAt, f => f.Date.Recent(30));
    }

    private static Dictionary<string, object> GenerateSpecifications(Faker f)
    {
        var category = f.PickRandom("cpu", "gpu", "ram", "motherboard", "psu");
        
        return category switch
        {
            "cpu" => new Dictionary<string, object>
            {
                ["socket"] = f.PickRandom("AM5", "AM4", "LGA1700", "LGA1200"),
                ["cores"] = f.Random.Int(4, 24),
                ["threads"] = f.Random.Int(8, 32),
                ["baseFrequency"] = $"{f.Random.Int(2000, 4000)} MHz",
                ["boostFrequency"] = $"{f.Random.Int(4000, 6000)} MHz",
                ["tdp"] = $"{f.Random.Int(65, 250)} W",
                ["cache"] = $"{f.Random.Int(16, 96)} MB"
            },
            "gpu" => new Dictionary<string, object>
            {
                ["memory"] = $"{f.PickRandom(8, 12, 16, 24)} GB",
                ["memoryType"] = f.PickRandom("GDDR6", "GDDR6X"),
                ["baseClock"] = $"{f.Random.Int(1000, 2000)} MHz",
                ["boostClock"] = $"{f.Random.Int(2000, 3000)} MHz",
                ["tdp"] = $"{f.Random.Int(150, 450)} W"
            },
            "ram" => new Dictionary<string, object>
            {
                ["capacity"] = $"{f.PickRandom(8, 16, 32, 64)} GB",
                ["type"] = f.PickRandom("DDR4", "DDR5"),
                ["frequency"] = $"{f.PickRandom(2666, 3200, 3600, 4800, 5600, 6000)} MHz",
                ["cas"] = f.PickRandom(16, 18, 20, 22, 28, 30),
                ["modules"] = f.PickRandom(1, 2, 4)
            },
            "motherboard" => new Dictionary<string, object>
            {
                ["socket"] = f.PickRandom("AM5", "LGA1700"),
                ["chipset"] = f.PickRandom("X670E", "B650", "Z790", "B760"),
                ["formFactor"] = f.PickRandom("ATX", "Micro-ATX", "Mini-ITX"),
                ["memorySlots"] = f.PickRandom(2, 4),
                ["maxMemory"] = $"{f.PickRandom(64, 128, 256)} GB"
            },
            "psu" => new Dictionary<string, object>
            {
                ["power"] = $"{f.PickRandom(450, 550, 650, 750, 850, 1000, 1200)} W",
                ["efficiency"] = f.PickRandom("80+ Bronze", "80+ Gold", "80+ Platinum"),
                ["modular"] = f.PickRandom("Non-Modular", "Semi-Modular", "Fully-Modular"),
                ["fanSize"] = f.PickRandom("120mm", "135mm", "140mm")
            },
            _ => new Dictionary<string, object>()
        };
    }

    /// <summary>
    /// Создать товар определённой категории
    /// </summary>
    public ProductFaker WithCategory(ProductCategory category)
    {
        RuleFor(p => p.Category, category);
        return this;
    }

    /// <summary>
    /// Создать товар с указанной ценой
    /// </summary>
    public ProductFaker WithPrice(decimal minPrice, decimal maxPrice)
    {
        RuleFor(p => p.Price, f => f.Random.Decimal(minPrice, maxPrice));
        return this;
    }

    /// <summary>
    /// Создать товар с указанным количеством на складе
    /// </summary>
    public ProductFaker WithStock(int stock)
    {
        RuleFor(p => p.Stock, stock);
        return this;
    }

    /// <summary>
    /// Создать неактивный товар
    /// </summary>
    public ProductFaker AsInactive()
    {
        RuleFor(p => p.IsActive, false);
        return this;
    }
}

/// <summary>
/// Тестовые доменные модели (заглушки)
/// </summary>
public class Product
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public ProductCategory Category { get; set; }
    public Dictionary<string, object> Specifications { get; set; } = new();
    public string Manufacturer { get; set; } = string.Empty;
    public int WarrantyMonths { get; set; }
    public string Description { get; set; } = string.Empty;
    public double Rating { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public enum ProductCategory
{
    Cpu,
    Gpu,
    Ram,
    Motherboard,
    Psu,
    Storage,
    Case,
    Cooling
}