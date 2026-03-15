using Bogus;
using GoldPC.SharedKernel.Entities;

namespace GoldPC.UnitTests.Fakers;

/// <summary>
/// Тип компонента для совместимости в конструкторе ПК
/// </summary>
public enum ComponentType
{
    Processor = 1,
    Motherboard = 2,
    Ram = 3,
    Gpu = 4,
    Psu = 5,
    Storage = 6,
    Case = 7,
    Cooler = 8,
    Periphery = 9,
    Monitor = 10,
    Accessories = 11
}

/// <summary>
/// Товар в каталоге (тестовая модель)
/// </summary>
public class Product : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid CategoryId { get; set; }
    public Category? Category { get; set; }
    public Guid? ManufacturerId { get; set; }
    public Manufacturer? Manufacturer { get; set; }
    public decimal Price { get; set; }
    public decimal? OldPrice { get; set; }
    public int Stock { get; set; }
    public Dictionary<string, object> Specifications { get; set; } = new();
    public int WarrantyMonths { get; set; } = 12;
    public double Rating { get; set; }
    public int ReviewCount { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; } = false;
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}

/// <summary>
/// Категория товара
/// </summary>
public class Category
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ParentId { get; set; }
    public ComponentType? ComponentType { get; set; }
    public int Order { get; set; }
}

/// <summary>
/// Производитель
/// </summary>
public class Manufacturer
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Country { get; set; }
}

/// <summary>
/// Изображение товара
/// </summary>
public class ProductImage
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public bool IsPrimary { get; set; }
    public int SortOrder { get; set; }
}

/// <summary>
/// Отзыв на товар
/// </summary>
public class Review
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Title { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsVerified { get; set; }
    public bool IsApproved { get; set; }
}

/// <summary>
/// Faker для генерации тестовых данных товара (компьютерные комплектующие)
/// </summary>
public class ProductFaker : Faker<Product>
{
    public ProductFaker()
    {
        RuleFor(p => p.Id, f => f.Random.Guid());
        RuleFor(p => p.Name, f => GenerateProductName(f));
        RuleFor(p => p.Sku, f => f.Commerce.Ean13());
        RuleFor(p => p.Price, f => decimal.Parse(f.Commerce.Price(100, 100000)));
        RuleFor(p => p.OldPrice, (f, p) => f.Random.Bool(0.3f) ? p.Price * 1.2m : null);
        RuleFor(p => p.Stock, f => f.Random.Int(0, 100));
        RuleFor(p => p.CategoryId, f => f.Random.Guid());
        RuleFor(p => p.Category, (f, p) => new Category
        {
            Id = p.CategoryId,
            Name = f.PickRandom(CategoryNames),
            Slug = f.Lorem.Slug(2),
            ComponentType = f.PickRandom<ComponentType?>(),
            Order = f.Random.Int(1, 10)
        });
        RuleFor(p => p.ManufacturerId, f => f.Random.Guid());
        RuleFor(p => p.Manufacturer, (f, p) => new Manufacturer
        {
            Id = p.ManufacturerId!.Value,
            Name = f.PickRandom(ManufacturerNames),
            Country = f.Address.Country()
        });
        RuleFor(p => p.Specifications, f => GenerateSpecifications(f));
        RuleFor(p => p.WarrantyMonths, f => f.PickRandom(12, 24, 36));
        RuleFor(p => p.Description, f => f.Lorem.Paragraphs(2));
        RuleFor(p => p.Rating, f => Math.Round(f.Random.Double(3.0, 5.0), 1));
        RuleFor(p => p.ReviewCount, f => f.Random.Int(0, 500));
        RuleFor(p => p.IsActive, f => f.Random.Bool(0.9f));
        RuleFor(p => p.IsFeatured, f => f.Random.Bool(0.1f));
        RuleFor(p => p.CreatedAt, f => f.Date.Past(1));
        RuleFor(p => p.UpdatedAt, f => f.Date.Recent(30));
        RuleFor(p => p.Images, f => GenerateImages(f));
        RuleFor(p => p.Reviews, _ => new List<Review>());
    }

    private static string GenerateProductName(Faker f)
    {
        var componentType = f.PickRandom("cpu", "gpu", "ram", "motherboard", "psu", "storage", "case", "cooler");
        
        return componentType switch
        {
            "cpu" => GenerateCpuName(f),
            "gpu" => GenerateGpuName(f),
            "ram" => GenerateRamName(f),
            "motherboard" => GenerateMotherboardName(f),
            "psu" => GeneratePsuName(f),
            "storage" => GenerateStorageName(f),
            "case" => GenerateCaseName(f),
            "cooler" => GenerateCoolerName(f),
            _ => f.Commerce.ProductName()
        };
    }

    private static string GenerateCpuName(Faker f)
    {
        var brand = f.PickRandom("AMD", "Intel");
        return brand switch
        {
            "AMD" => $"AMD Ryzen {f.PickRandom(3, 5, 7, 9)} {f.Random.Int(5000, 9000)}{f.PickRandom("", "X", "XT")}",
            "Intel" => $"Intel Core {f.PickRandom("i3", "i5", "i7", "i9")}-{f.Random.Int(12000, 14900)}{f.PickRandom("", "K", "KF", "KS")}",
            _ => f.Commerce.ProductName()
        };
    }

    private static string GenerateGpuName(Faker f)
    {
        var brand = f.PickRandom("NVIDIA", "AMD");
        return brand switch
        {
            "NVIDIA" => $"NVIDIA GeForce RTX {f.PickRandom(3050, 3060, 3070, 3080, 4060, 4070, 4080, 4090)} {f.PickRandom("", "Ti", "SUPER")}".Trim(),
            "AMD" => $"AMD Radeon RX {f.PickRandom(6600, 6700, 6800, 6900, 7600, 7700, 7800, 7900)} {f.PickRandom("", "XT", "XTX")}".Trim(),
            _ => f.Commerce.ProductName()
        };
    }

    private static string GenerateRamName(Faker f)
    {
        var brand = f.PickRandom("Kingston", "Corsair", "G.Skill", "Crucial", "TeamGroup");
        var capacity = f.PickRandom(8, 16, 32, 64);
        var type = f.PickRandom("DDR4", "DDR5");
        var freq = type == "DDR5" ? f.PickRandom(4800, 5200, 5600, 6000, 6400) : f.PickRandom(2666, 3200, 3600);
        return $"{brand} {type}-{freq} {capacity}GB";
    }

    private static string GenerateMotherboardName(Faker f)
    {
        var brand = f.PickRandom("ASUS", "MSI", "Gigabyte", "ASRock");
        var socket = f.PickRandom("AM5", "LGA1700");
        var chipset = socket == "AM5" ? f.PickRandom("X670E", "B650", "A620") : f.PickRandom("Z790", "B760", "H770");
        return $"{brand} {chipset} {socket}";
    }

    private static string GeneratePsuName(Faker f)
    {
        var brand = f.PickRandom("Corsair", "EVGA", "Seasonic", "be quiet!", "Cooler Master");
        var power = f.PickRandom(450, 550, 650, 750, 850, 1000, 1200);
        var efficiency = f.PickRandom("80+ Bronze", "80+ Gold", "80+ Platinum");
        return $"{brand} {power}W {efficiency}";
    }

    private static string GenerateStorageName(Faker f)
    {
        var brand = f.PickRandom("Samsung", "WD", "Crucial", "Kingston", "Seagate");
        var type = f.PickRandom("SSD", "NVMe", "HDD");
        var capacity = f.PickRandom("256GB", "512GB", "1TB", "2TB", "4TB");
        return $"{brand} {type} {capacity}";
    }

    private static string GenerateCaseName(Faker f)
    {
        var brand = f.PickRandom("NZXT", "Corsair", "Fractal Design", "be quiet!", "Lian Li");
        var size = f.PickRandom("Mini-ITX", "Micro-ATX", "ATX", "E-ATX");
        return $"{brand} {size} Case";
    }

    private static string GenerateCoolerName(Faker f)
    {
        var brand = f.PickRandom("Noctua", "be quiet!", "Corsair", "Cooler Master", "NZXT");
        var type = f.PickRandom("Air Cooler", "AIO 240mm", "AIO 360mm", "AIO 420mm");
        return $"{brand} {type}";
    }

    private static Dictionary<string, object> GenerateSpecifications(Faker f)
    {
        var componentType = f.PickRandom("cpu", "gpu", "ram", "motherboard", "psu", "storage");
        
        return componentType switch
        {
            "cpu" => new Dictionary<string, object>
            {
                ["socket"] = f.PickRandom("AM5", "AM4", "LGA1700", "LGA1200"),
                ["cores"] = f.PickRandom(4, 6, 8, 10, 12, 16, 24),
                ["threads"] = f.PickRandom(8, 12, 16, 20, 24, 32),
                ["baseFrequency"] = $"{f.Random.Int(2000, 4000)} MHz",
                ["boostFrequency"] = $"{f.Random.Int(4000, 6000)} MHz",
                ["tdp"] = $"{f.Random.Int(65, 250)} W",
                ["cache"] = $"{f.Random.Int(16, 96)} MB",
                ["unlocked"] = f.Random.Bool().ToString().ToLower()
            },
            "gpu" => new Dictionary<string, object>
            {
                ["memory"] = $"{f.PickRandom(8, 12, 16, 24)} GB",
                ["memoryType"] = f.PickRandom("GDDR6", "GDDR6X", "GDDR7"),
                ["baseClock"] = $"{f.Random.Int(1000, 2000)} MHz",
                ["boostClock"] = $"{f.Random.Int(2000, 3000)} MHz",
                ["tdp"] = $"{f.Random.Int(150, 450)} W",
                ["powerConnectors"] = f.PickRandom("1x 8-pin", "2x 8-pin", "1x 12VHPWR", "2x 12VHPWR"),
                ["outputs"] = "3x DisplayPort, 1x HDMI"
            },
            "ram" => new Dictionary<string, object>
            {
                ["capacity"] = $"{f.PickRandom(8, 16, 32, 64)} GB",
                ["type"] = f.PickRandom("DDR4", "DDR5"),
                ["frequency"] = $"{f.PickRandom(2666, 3200, 3600, 4800, 5600, 6000, 6400)} MHz",
                ["cas"] = f.PickRandom(16, 18, 20, 22, 28, 30, 32, 36),
                ["modules"] = f.PickRandom(1, 2, 4),
                ["voltage"] = f.PickRandom("1.2V", "1.25V", "1.35V", "1.4V")
            },
            "motherboard" => new Dictionary<string, object>
            {
                ["socket"] = f.PickRandom("AM5", "LGA1700"),
                ["chipset"] = f.PickRandom("X670E", "B650", "Z790", "B760", "H770"),
                ["formFactor"] = f.PickRandom("ATX", "Micro-ATX", "Mini-ITX", "E-ATX"),
                ["memorySlots"] = f.PickRandom(2, 4),
                ["maxMemory"] = $"{f.PickRandom(64, 128, 256)} GB",
                ["m2Slots"] = f.Random.Int(1, 5)
            },
            "psu" => new Dictionary<string, object>
            {
                ["power"] = $"{f.PickRandom(450, 550, 650, 750, 850, 1000, 1200)} W",
                ["efficiency"] = f.PickRandom("80+ Bronze", "80+ Silver", "80+ Gold", "80+ Platinum", "80+ Titanium"),
                ["modular"] = f.PickRandom("Non-Modular", "Semi-Modular", "Fully-Modular"),
                ["fanSize"] = f.PickRandom("120mm", "135mm", "140mm")
            },
            "storage" => new Dictionary<string, object>
            {
                ["capacity"] = f.PickRandom("256GB", "512GB", "1TB", "2TB", "4TB", "8TB"),
                ["type"] = f.PickRandom("NVMe SSD", "SATA SSD", "HDD"),
                ["interface"] = f.PickRandom("PCIe 4.0 x4", "PCIe 5.0 x4", "SATA III"),
                ["readSpeed"] = $"{f.Random.Int(500, 7000)} MB/s",
                ["writeSpeed"] = $"{f.Random.Int(300, 6000)} MB/s"
            },
            _ => new Dictionary<string, object>()
        };
    }

    private static List<ProductImage> GenerateImages(Faker f)
    {
        var count = f.Random.Int(1, 5);
        var images = new List<ProductImage>();
        
        for (int i = 0; i < count; i++)
        {
            images.Add(new ProductImage
            {
                Id = f.Random.Guid(),
                Url = $"https://placehold.co/600x600?text=Product+{i + 1}",
                AltText = $"Product image {i + 1}",
                IsPrimary = i == 0,
                SortOrder = i
            });
        }
        
        return images;
    }

    private static readonly string[] CategoryNames = 
    {
        "Процессоры", "Видеокарты", "Оперативная память", "Материнские платы",
        "Блоки питания", "Накопители", "Корпуса", "Охлаждение"
    };

    private static readonly string[] ManufacturerNames =
    {
        "AMD", "Intel", "NVIDIA", "ASUS", "MSI", "Gigabyte", "ASRock",
        "Corsair", "Kingston", "Samsung", "WD", "Crucial", "Noctua",
        "be quiet!", "Cooler Master", "NZXT", "Seasonic", "EVGA", "Fractal Design"
    };

    #region Fluent Builder Methods

    public ProductFaker WithCategory(Guid categoryId, string categoryName, ComponentType? componentType = null)
    {
        RuleFor(p => p.CategoryId, categoryId);
        RuleFor(p => p.Category, new Category
        {
            Id = categoryId,
            Name = categoryName,
            Slug = categoryName.ToLower().Replace(" ", "-"),
            ComponentType = componentType
        });
        return this;
    }

    public ProductFaker WithPrice(decimal minPrice, decimal maxPrice)
    {
        RuleFor(p => p.Price, f => f.Random.Decimal(minPrice, maxPrice));
        return this;
    }

    public ProductFaker WithStock(int stock)
    {
        RuleFor(p => p.Stock, stock);
        return this;
    }

    public ProductFaker AsInactive()
    {
        RuleFor(p => p.IsActive, false);
        return this;
    }

    public ProductFaker AsFeatured()
    {
        RuleFor(p => p.IsFeatured, true);
        return this;
    }

    public ProductFaker AsCpu()
    {
        RuleFor(p => p.Name, f => GenerateCpuName(f));
        RuleFor(p => p.Specifications, f => new Dictionary<string, object>
        {
            ["socket"] = f.PickRandom("AM5", "LGA1700"),
            ["cores"] = f.PickRandom(6, 8, 10, 12, 16),
            ["threads"] = f.PickRandom(12, 16, 20, 24),
            ["baseFrequency"] = $"{f.Random.Int(3000, 4000)} MHz",
            ["boostFrequency"] = $"{f.Random.Int(5000, 6000)} MHz",
            ["tdp"] = $"{f.Random.Int(65, 170)} W"
        });
        return this;
    }

    public ProductFaker AsGpu()
    {
        RuleFor(p => p.Name, f => GenerateGpuName(f));
        RuleFor(p => p.Specifications, f => new Dictionary<string, object>
        {
            ["memory"] = $"{f.PickRandom(8, 12, 16, 24)} GB",
            ["memoryType"] = f.PickRandom("GDDR6", "GDDR6X"),
            ["boostClock"] = $"{f.Random.Int(2000, 2800)} MHz",
            ["tdp"] = $"{f.Random.Int(200, 450)} W"
        });
        return this;
    }

    public ProductFaker WithDiscount(decimal discountPercentage)
    {
        RuleFor(p => p.OldPrice, (f, p) => p.Price);
        RuleFor(p => p.Price, (f, p) => p.OldPrice! * (1 - discountPercentage / 100));
        return this;
    }

    public ProductFaker WithReviews(int count)
    {
        RuleFor(p => p.Reviews, f => GenerateReviews(f, count));
        RuleFor(p => p.ReviewCount, count);
        RuleFor(p => p.Rating, f => Math.Round(f.Random.Double(3.5, 5.0), 1));
        return this;
    }

    private static List<Review> GenerateReviews(Faker f, int count)
    {
        var reviews = new List<Review>();
        for (int i = 0; i < count; i++)
        {
            reviews.Add(new Review
            {
                Id = f.Random.Guid(),
                UserId = f.Random.Guid(),
                UserName = f.Name.FullName(),
                Rating = f.Random.Int(3, 5),
                Comment = f.Lorem.Paragraph(),
                CreatedAt = f.Date.Past(1),
                IsVerified = f.Random.Bool(0.7f),
                IsApproved = true
            });
        }
        return reviews;
    }

    #endregion
}