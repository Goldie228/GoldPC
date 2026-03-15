using CatalogService.Models;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Data;

/// <summary>
/// Контекст базы данных для сервиса каталога
/// </summary>
public class CatalogDbContext : DbContext
{
    public CatalogDbContext(DbContextOptions<CatalogDbContext> options) : base(options)
    {
    }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Manufacturer> Manufacturers => Set<Manufacturer>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureProduct(modelBuilder);
        ConfigureCategory(modelBuilder);
        ConfigureManufacturer(modelBuilder);
        ConfigureProductImage(modelBuilder);
        ConfigureReview(modelBuilder);
        
        SeedCategories(modelBuilder);
        SeedManufacturers(modelBuilder);
        SeedProducts(modelBuilder);
    }

    private void ConfigureProduct(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(200);
            entity.Property(e => e.Sku).HasColumnName("sku").IsRequired().HasMaxLength(50);
            entity.Property(e => e.Description).HasColumnName("description").HasColumnType("text");
            entity.Property(e => e.Price).HasColumnName("price").HasPrecision(12, 2);
            entity.Property(e => e.Stock).HasColumnName("stock");
            entity.Property(e => e.WarrantyMonths).HasColumnName("warranty_months");
            entity.Property(e => e.Rating).HasColumnName("rating").HasPrecision(3, 2);
            entity.Property(e => e.ReviewCount).HasColumnName("review_count");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            
            entity.Property(e => e.Specifications)
                .HasColumnName("specifications")
                .HasColumnType("jsonb");
            
            entity.HasIndex(e => e.Sku).IsUnique();
            entity.HasIndex(e => e.CategoryId);
            entity.HasIndex(e => e.ManufacturerId);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.Price);
            
            entity.HasOne(e => e.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
                
            entity.HasOne(e => e.Manufacturer)
                .WithMany(m => m.Products)
                .HasForeignKey(e => e.ManufacturerId)
                .OnDelete(DeleteBehavior.Restrict);
                
            entity.HasMany(e => e.Images)
                .WithOne(i => i.Product)
                .HasForeignKey(i => i.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasMany(e => e.Reviews)
                .WithOne(r => r.Product)
                .HasForeignKey(r => r.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private void ConfigureCategory(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("categories");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(100);
            entity.Property(e => e.Slug).HasColumnName("slug").IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(500);
            entity.Property(e => e.ParentId).HasColumnName("parent_id");
            entity.Property(e => e.ComponentType).HasColumnName("component_type");
            
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.ParentId);
            
            entity.HasOne(e => e.Parent)
                .WithMany(c => c.Children)
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private void ConfigureManufacturer(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Manufacturer>(entity =>
        {
            entity.ToTable("manufacturers");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(100);
            entity.Property(e => e.Country).HasColumnName("country").HasMaxLength(50);
            entity.Property(e => e.LogoUrl).HasColumnName("logo_url").HasMaxLength(500);
            entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(1000);
            
            entity.HasIndex(e => e.Name).IsUnique();
        });
    }

    private void ConfigureProductImage(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.ToTable("product_images");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.Url).HasColumnName("url").IsRequired().HasMaxLength(500);
            entity.Property(e => e.AltText).HasColumnName("alt_text").HasMaxLength(200);
            entity.Property(e => e.IsPrimary).HasColumnName("is_primary");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
            
            entity.HasIndex(e => e.ProductId);
        });
    }

    private void ConfigureReview(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Review>(entity =>
        {
            entity.ToTable("reviews");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.UserName).HasColumnName("user_name").IsRequired().HasMaxLength(100);
            entity.Property(e => e.Rating).HasColumnName("rating");
            entity.Property(e => e.Comment).HasColumnName("comment").HasColumnType("text");
            entity.Property(e => e.Pros).HasColumnName("pros").HasColumnType("text");
            entity.Property(e => e.Cons).HasColumnName("cons").HasColumnType("text");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.IsVerified).HasColumnName("is_verified");
            
            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(e => e.UserId);
        });
    }

    private void SeedCategories(ModelBuilder modelBuilder)
    {
        var categories = new[]
        {
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), Name = "Процессоры", Slug = "processors", ComponentType = ComponentType.Processor },
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-000000000002"), Name = "Материнские платы", Slug = "motherboards", ComponentType = ComponentType.Motherboard },
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-000000000003"), Name = "Оперативная память", Slug = "ram", ComponentType = ComponentType.Ram },
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-000000000004"), Name = "Видеокарты", Slug = "gpu", ComponentType = ComponentType.Gpu },
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-000000000005"), Name = "Блоки питания", Slug = "psu", ComponentType = ComponentType.Psu },
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-000000000006"), Name = "Накопители", Slug = "storage", ComponentType = ComponentType.Storage },
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-000000000007"), Name = "Корпуса", Slug = "cases", ComponentType = ComponentType.Case },
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-000000000008"), Name = "Системы охлаждения", Slug = "coolers", ComponentType = ComponentType.Cooler },
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-000000000009"), Name = "Периферия", Slug = "periphery", ComponentType = ComponentType.Periphery }
        };

        modelBuilder.Entity<Category>().HasData(categories);
    }

    private void SeedManufacturers(ModelBuilder modelBuilder)
    {
        var manufacturers = new[]
        {
            new Manufacturer { Id = Guid.Parse("10000000-0000-0000-0000-000000000001"), Name = "Intel", Country = "USA" },
            new Manufacturer { Id = Guid.Parse("10000000-0000-0000-0000-000000000002"), Name = "AMD", Country = "USA" },
            new Manufacturer { Id = Guid.Parse("10000000-0000-0000-0000-000000000003"), Name = "ASUS", Country = "Taiwan" },
            new Manufacturer { Id = Guid.Parse("10000000-0000-0000-0000-000000000004"), Name = "MSI", Country = "Taiwan" },
            new Manufacturer { Id = Guid.Parse("10000000-0000-0000-0000-000000000005"), Name = "Gigabyte", Country = "Taiwan" },
            new Manufacturer { Id = Guid.Parse("10000000-0000-0000-0000-000000000006"), Name = "ASRock", Country = "Taiwan" },
            new Manufacturer { Id = Guid.Parse("10000000-0000-0000-0000-000000000007"), Name = "NVIDIA", Country = "USA" },
            new Manufacturer { Id = Guid.Parse("10000000-0000-0000-0000-000000000008"), Name = "Palit", Country = "Taiwan" },
            new Manufacturer { Id = Guid.Parse("10000000-0000-0000-0000-000000000009"), Name = "Kingston", Country = "USA" },
            new Manufacturer { Id = Guid.Parse("10000000-0000-0000-0000-000000000010"), Name = "Corsair", Country = "USA" },
            new Manufacturer { Id = Guid.Parse("10000000-0000-0000-0000-000000000011"), Name = "G.Skill", Country = "Taiwan" },
            new Manufacturer { Id = Guid.Parse("10000000-0000-0000-0000-000000000012"), Name = "be quiet!", Country = "Germany" },
            new Manufacturer { Id = Guid.Parse("10000000-0000-0000-0000-000000000013"), Name = "Seasonic", Country = "Taiwan" },
            new Manufacturer { Id = Guid.Parse("10000000-0000-0000-0000-000000000014"), Name = "Samsung", Country = "South Korea" },
            new Manufacturer { Id = Guid.Parse("10000000-0000-0000-0000-000000000015"), Name = "Western Digital", Country = "USA" },
            new Manufacturer { Id = Guid.Parse("10000000-0000-0000-0000-000000000016"), Name = "NZXT", Country = "USA" },
            new Manufacturer { Id = Guid.Parse("10000000-0000-0000-0000-000000000017"), Name = "Fractal Design", Country = "Sweden" }
        };

        modelBuilder.Entity<Manufacturer>().HasData(manufacturers);
    }

    private void SeedProducts(ModelBuilder modelBuilder)
    {
        // ID категорий
        var cpuCategoryId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var motherboardCategoryId = Guid.Parse("00000000-0000-0000-0000-000000000002");
        var ramCategoryId = Guid.Parse("00000000-0000-0000-0000-000000000003");
        var gpuCategoryId = Guid.Parse("00000000-0000-0000-0000-000000000004");
        var psuCategoryId = Guid.Parse("00000000-0000-0000-0000-000000000005");

        // ID производителей
        var amdId = Guid.Parse("10000000-0000-0000-0000-000000000002");
        var intelId = Guid.Parse("10000000-0000-0000-0000-000000000001");
        var asusId = Guid.Parse("10000000-0000-0000-0000-000000000003");
        var msiId = Guid.Parse("10000000-0000-0000-0000-000000000004");
        var gigabyteId = Guid.Parse("10000000-0000-0000-0000-000000000005");
        var palitId = Guid.Parse("10000000-0000-0000-0000-000000000008");
        var kingstonId = Guid.Parse("10000000-0000-0000-0000-000000000009");
        var corsairId = Guid.Parse("10000000-0000-0000-0000-000000000010");
        var gskillId = Guid.Parse("10000000-0000-0000-0000-000000000011");
        var beQuietId = Guid.Parse("10000000-0000-0000-0000-000000000012");
        var seasonicId = Guid.Parse("10000000-0000-0000-0000-000000000013");

        var products = new[]
        {
            // === ПРОЦЕССОРЫ (CPUs) ===
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000001"),
                Name = "AMD Ryzen 5 5600X",
                Sku = "CPU-AMD-5600X",
                Description = "Процессор AMD Ryzen 5 5600X, 6 ядер, 12 потоков, базовая частота 3.7 ГГц, турбо до 4.6 ГГц. Socket AM4. Отличное соотношение цена/производительность для игр и работы.",
                CategoryId = cpuCategoryId,
                ManufacturerId = amdId,
                Price = 549.00m,
                Stock = 25,
                WarrantyMonths = 36,
                Rating = 4.8,
                ReviewCount = 156,
                IsActive = true,
                IsFeatured = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                Specifications = new Dictionary<string, object>
                {
                    ["socket"] = "AM4",
                    ["cores"] = 6,
                    ["threads"] = 12,
                    ["base_clock"] = "3.7 GHz",
                    ["boost_clock"] = "4.6 GHz",
                    ["tdp"] = "65W",
                    ["l3_cache"] = "32MB",
                    ["unlocked"] = true,
                    ["integrated_graphics"] = false
                }
            },
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000002"),
                Name = "AMD Ryzen 7 7800X3D",
                Sku = "CPU-AMD-7800X3D",
                Description = "Лучший игровой процессор с технологией 3D V-Cache. 8 ядер, 16 потоков, Socket AM5. Идеален для игр с объёмным кэшем 104MB.",
                CategoryId = cpuCategoryId,
                ManufacturerId = amdId,
                Price = 1299.00m,
                Stock = 12,
                WarrantyMonths = 36,
                Rating = 4.9,
                ReviewCount = 89,
                IsActive = true,
                IsFeatured = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                Specifications = new Dictionary<string, object>
                {
                    ["socket"] = "AM5",
                    ["cores"] = 8,
                    ["threads"] = 16,
                    ["base_clock"] = "4.2 GHz",
                    ["boost_clock"] = "5.0 GHz",
                    ["tdp"] = "120W",
                    ["l3_cache"] = "104MB",
                    ["unlocked"] = true,
                    ["integrated_graphics"] = true
                }
            },
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000003"),
                Name = "Intel Core i5-13600KF",
                Sku = "CPU-INT-13600KF",
                Description = "Процессор Intel Core i5 13-го поколения, 14 ядер (6P+8E), 20 потоков. Socket LGA1700. Отличная производительность для игр и контента.",
                CategoryId = cpuCategoryId,
                ManufacturerId = intelId,
                Price = 749.00m,
                OldPrice = 849.00m,
                Stock = 18,
                WarrantyMonths = 36,
                Rating = 4.7,
                ReviewCount = 134,
                IsActive = true,
                IsFeatured = false,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                Specifications = new Dictionary<string, object>
                {
                    ["socket"] = "LGA1700",
                    ["cores"] = 14,
                    ["threads"] = 20,
                    ["base_clock"] = "3.5 GHz",
                    ["boost_clock"] = "5.1 GHz",
                    ["tdp"] = "125W",
                    ["l3_cache"] = "24MB",
                    ["unlocked"] = true,
                    ["integrated_graphics"] = false
                }
            },

            // === МАТЕРИНСКИЕ ПЛАТЫ ===
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000004"),
                Name = "ASUS TUF Gaming B650-Plus WiFi",
                Sku = "MB-ASUS-B650TUF",
                Description = "Материнская плата ASUS TUF Gaming на чипсете B650, Socket AM5. Поддержка DDR5, PCIe 5.0, WiFi 6, 2.5G LAN. Надёжность военного класса.",
                CategoryId = motherboardCategoryId,
                ManufacturerId = asusId,
                Price = 429.00m,
                Stock = 15,
                WarrantyMonths = 36,
                Rating = 4.6,
                ReviewCount = 67,
                IsActive = true,
                IsFeatured = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                Specifications = new Dictionary<string, object>
                {
                    ["socket"] = "AM5",
                    ["chipset"] = "B650",
                    ["form_factor"] = "ATX",
                    ["memory_slots"] = 4,
                    ["max_memory"] = "128GB",
                    ["memory_type"] = "DDR5",
                    ["pcie_slots"] = "1x PCIe 5.0 x16, 1x PCIe 4.0 x16",
                    ["m2_slots"] = 3,
                    ["usb_ports"] = "8x USB-A, 2x USB-C",
                    ["wifi"] = "WiFi 6",
                    ["lan"] = "2.5G"
                }
            },
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000005"),
                Name = "MSI MAG B650 TOMAHAWK WIFI",
                Sku = "MB-MSI-B650TOM",
                Description = "Материнская плата MSI MAG B650 Tomahawk, Socket AM5. DDR5, PCIe 4.0, WiFi 6E, 2.5G LAN. Идеальна для Ryzen 7000 серии.",
                CategoryId = motherboardCategoryId,
                ManufacturerId = msiId,
                Price = 389.00m,
                Stock = 22,
                WarrantyMonths = 36,
                Rating = 4.7,
                ReviewCount = 98,
                IsActive = true,
                IsFeatured = false,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                Specifications = new Dictionary<string, object>
                {
                    ["socket"] = "AM5",
                    ["chipset"] = "B650",
                    ["form_factor"] = "ATX",
                    ["memory_slots"] = 4,
                    ["max_memory"] = "128GB",
                    ["memory_type"] = "DDR5",
                    ["pcie_slots"] = "2x PCIe 4.0 x16",
                    ["m2_slots"] = 4,
                    ["usb_ports"] = "9x USB-A, 1x USB-C",
                    ["wifi"] = "WiFi 6E",
                    ["lan"] = "2.5G"
                }
            },

            // === ОПЕРАТИВНАЯ ПАМЯТЬ ===
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000006"),
                Name = "Kingston FURY Beast 32GB DDR5-5600",
                Sku = "RAM-KING-32D5",
                Description = "Комплект оперативной памяти Kingston FURY Beast 2x16GB DDR5-5600 MHz. CL36, 1.25V. Высокая производительность для игр и работы.",
                CategoryId = ramCategoryId,
                ManufacturerId = kingstonId,
                Price = 249.00m,
                OldPrice = 299.00m,
                Stock = 45,
                WarrantyMonths = 36,
                Rating = 4.8,
                ReviewCount = 203,
                IsActive = true,
                IsFeatured = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                Specifications = new Dictionary<string, object>
                {
                    ["capacity"] = "32GB",
                    ["kit_config"] = "2x16GB",
                    ["type"] = "DDR5",
                    ["speed"] = "5600 MHz",
                    ["cas_latency"] = 36,
                    ["voltage"] = "1.25V",
                    ["heat_spreader"] = true,
                    ["rgb"] = false
                }
            },
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000007"),
                Name = "G.Skill Trident Z5 RGB 32GB DDR5-6000",
                Sku = "RAM-GSKILL-32Z5",
                Description = "Память G.Skill Trident Z5 RGB 2x16GB DDR5-6000 MHz CL30. Эффектная RGB-подсветка, оптимизировано для Intel XMP 3.0.",
                CategoryId = ramCategoryId,
                ManufacturerId = gskillId,
                Price = 329.00m,
                Stock = 30,
                WarrantyMonths = 36,
                Rating = 4.9,
                ReviewCount = 145,
                IsActive = true,
                IsFeatured = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                Specifications = new Dictionary<string, object>
                {
                    ["capacity"] = "32GB",
                    ["kit_config"] = "2x16GB",
                    ["type"] = "DDR5",
                    ["speed"] = "6000 MHz",
                    ["cas_latency"] = 30,
                    ["voltage"] = "1.35V",
                    ["heat_spreader"] = true,
                    ["rgb"] = true
                }
            },

            // === ВИДЕОКАРТЫ ===
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000008"),
                Name = "Palit GeForce RTX 4070 SUPER Dual",
                Sku = "GPU-PALIT-4070S",
                Description = "Видеокарта Palit GeForce RTX 4070 SUPER 12GB GDDR6X. DLSS 3, Ray Tracing, 12GB VRAM. Отличная производительность в 1440p.",
                CategoryId = gpuCategoryId,
                ManufacturerId = palitId,
                Price = 2199.00m,
                Stock = 8,
                WarrantyMonths = 36,
                Rating = 4.7,
                ReviewCount = 72,
                IsActive = true,
                IsFeatured = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                Specifications = new Dictionary<string, object>
                {
                    ["gpu"] = "NVIDIA GeForce RTX 4070 SUPER",
                    ["vram"] = "12GB GDDR6X",
                    ["memory_bus"] = "192-bit",
                    ["base_clock"] = "1980 MHz",
                    ["boost_clock"] = "2475 MHz",
                    ["cuda_cores"] = 7168,
                    ["rt_cores"] = 56,
                    ["tdp"] = "220W",
                    ["outputs"] = "3x DisplayPort 1.4a, 1x HDMI 2.1",
                    ["recommended_psu"] = "650W"
                }
            },
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000009"),
                Name = "Gigabyte Radeon RX 7800 XT GAMING OC",
                Sku = "GPU-GIGA-7800XT",
                Description = "Видеокарта Gigabyte Radeon RX 7800 XT 16GB GDDR6. 16GB VRAM, FSR 3, отличное соотношение цена/производительность для 1440p.",
                CategoryId = gpuCategoryId,
                ManufacturerId = gigabyteId,
                Price = 1899.00m,
                Stock = 14,
                WarrantyMonths = 36,
                Rating = 4.6,
                ReviewCount = 58,
                IsActive = true,
                IsFeatured = false,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                Specifications = new Dictionary<string, object>
                {
                    ["gpu"] = "AMD Radeon RX 7800 XT",
                    ["vram"] = "16GB GDDR6",
                    ["memory_bus"] = "256-bit",
                    ["base_clock"] = "1295 MHz",
                    ["boost_clock"] = "2430 MHz",
                    ["stream_processors"] = 3840,
                    ["ray_accelerators"] = 60,
                    ["tdp"] = "263W",
                    ["outputs"] = "2x DisplayPort 2.1, 2x HDMI 2.1, 1x USB-C",
                    ["recommended_psu"] = "700W"
                }
            },

            // === БЛОКИ ПИТАНИЯ ===
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000010"),
                Name = "Corsair RM750e 750W 80+ Gold",
                Sku = "PSU-CORS-RM750E",
                Description = "Блок питания Corsair RM750e 750W, сертификат 80+ Gold, полностью модульный. Тихий 120mm вентилятор, ATX 3.0 совместимость.",
                CategoryId = psuCategoryId,
                ManufacturerId = corsairId,
                Price = 289.00m,
                Stock = 35,
                WarrantyMonths = 60,
                Rating = 4.8,
                ReviewCount = 189,
                IsActive = true,
                IsFeatured = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                Specifications = new Dictionary<string, object>
                {
                    ["wattage"] = "750W",
                    ["efficiency"] = "80+ Gold",
                    ["modular"] = "Full",
                    ["fan_size"] = "120mm",
                    ["fan_type"] = "Rifle Bearing",
                    ["atx_version"] = "ATX 3.0",
                    ["pcie_connectors"] = "4x 8-pin (2x 12VHPWR)",
                    ["sata_connectors"] = 8,
                    ["noise_level"] = "10-25 dBA"
                }
            },
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000011"),
                Name = "be quiet! Pure Power 12 M 850W",
                Sku = "PSU-BEQT-PP12M",
                Description = "Блок питания be quiet! Pure Power 12 M 850W, 80+ Gold, полумодульный. Немецкая разработка, сверхтихая работа.",
                CategoryId = psuCategoryId,
                ManufacturerId = beQuietId,
                Price = 319.00m,
                Stock = 20,
                WarrantyMonths = 60,
                Rating = 4.7,
                ReviewCount = 156,
                IsActive = true,
                IsFeatured = false,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                Specifications = new Dictionary<string, object>
                {
                    ["wattage"] = "850W",
                    ["efficiency"] = "80+ Gold",
                    ["modular"] = "Semi",
                    ["fan_size"] = "135mm",
                    ["fan_type"] = "Silent Wings",
                    ["atx_version"] = "ATX 3.0",
                    ["pcie_connectors"] = "6x 8-pin",
                    ["sata_connectors"] = 6,
                    ["noise_level"] = "5-18 dBA"
                }
            },
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000012"),
                Name = "Seasonic Focus GX-850 850W",
                Sku = "PSU-SEAS-GX850",
                Description = "Блок питания Seasonic Focus GX-850 850W, 80+ Gold, полностью модульный. Премиум качество, 10 лет гарантии.",
                CategoryId = psuCategoryId,
                ManufacturerId = seasonicId,
                Price = 349.00m,
                Stock = 18,
                WarrantyMonths = 120,
                Rating = 4.9,
                ReviewCount = 234,
                IsActive = true,
                IsFeatured = true,
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                Specifications = new Dictionary<string, object>
                {
                    ["wattage"] = "850W",
                    ["efficiency"] = "80+ Gold",
                    ["modular"] = "Full",
                    ["fan_size"] = "120mm",
                    ["fan_type"] = "Fluid Dynamic Bearing",
                    ["atx_version"] = "ATX 3.0",
                    ["pcie_connectors"] = "6x 8-pin",
                    ["sata_connectors"] = 8,
                    ["noise_level"] = "8-22 dBA"
                }
            }
        };

        modelBuilder.Entity<Product>().HasData(products);
    }
}
