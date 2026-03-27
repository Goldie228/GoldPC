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
    public DbSet<CategoryFilterAttribute> CategoryFilterAttributes => Set<CategoryFilterAttribute>();
    public DbSet<SpecificationAttribute> SpecificationAttributes => Set<SpecificationAttribute>();
    public DbSet<SpecificationCanonicalValue> SpecificationCanonicalValues => Set<SpecificationCanonicalValue>();
    public DbSet<ProductSpecificationValue> ProductSpecificationValues => Set<ProductSpecificationValue>();
    public DbSet<Manufacturer> Manufacturers => Set<Manufacturer>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureProduct(modelBuilder);
        ConfigureCategory(modelBuilder);
        ConfigureSpecificationAttribute(modelBuilder);
        ConfigureSpecificationCanonicalValue(modelBuilder);
        ConfigureProductSpecificationValue(modelBuilder);
        ConfigureCategoryFilterAttribute(modelBuilder);
        ConfigureManufacturer(modelBuilder);
        ConfigureProductImage(modelBuilder);
        ConfigureReview(modelBuilder);
        
        SeedCategories(modelBuilder);
        SeedManufacturers(modelBuilder);
        SeedSpecificationAttributes(modelBuilder);
        SeedSpecificationCanonicalValues(modelBuilder);
        SeedProducts(modelBuilder);
        SeedFilterAttributes(modelBuilder);
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
            entity.Property(e => e.Slug).HasColumnName("slug").IsRequired().HasMaxLength(220);
            entity.Property(e => e.Description).HasColumnName("description").HasColumnType("text");
            entity.Property(e => e.ManufacturerAddress).HasColumnName("manufacturer_address").HasColumnType("text");
            entity.Property(e => e.ProductionAddress).HasColumnName("production_address").HasColumnType("text");
            entity.Property(e => e.Importer).HasColumnName("importer").HasColumnType("text");
            entity.Property(e => e.ServiceSupport).HasColumnName("service_support").HasColumnType("text");
            entity.Property(e => e.Price).HasColumnName("price").HasPrecision(12, 2);
            entity.Property(e => e.Stock).HasColumnName("stock");
            entity.Property(e => e.WarrantyMonths).HasColumnName("warranty_months");
            entity.Property(e => e.Rating).HasColumnName("rating").HasPrecision(3, 2);
            entity.Property(e => e.ReviewCount).HasColumnName("review_count");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            
            entity.Property(e => e.SourceUrl).HasColumnName("source_url").HasMaxLength(1000);
            entity.Property(e => e.ExternalId).HasColumnName("external_id").HasMaxLength(100);
            
            entity.HasIndex(e => e.Sku).IsUnique();
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.ExternalId).IsUnique().HasFilter("external_id IS NOT NULL");
            entity.HasIndex(e => e.CategoryId);
            entity.HasIndex(e => e.ManufacturerId);
            entity.HasIndex(e => new { e.IsActive, e.Price }); // Composite index for filtering
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

            entity.HasMany(e => e.SpecificationValues)
                .WithOne(s => s.Product)
                .HasForeignKey(s => s.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private void ConfigureSpecificationAttribute(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SpecificationAttribute>(entity =>
        {
            entity.ToTable("specification_attributes");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Key).HasColumnName("key").IsRequired().HasMaxLength(50);
            entity.Property(e => e.DisplayName).HasColumnName("display_name").IsRequired().HasMaxLength(100);
            entity.Property(e => e.ValueType).HasColumnName("value_type");
            entity.Property(e => e.IsMultiValue).HasColumnName("is_multi_value");
            entity.HasIndex(e => e.Key).IsUnique();
        });
    }

    private void ConfigureSpecificationCanonicalValue(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SpecificationCanonicalValue>(entity =>
        {
            entity.ToTable("specification_canonical_values");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AttributeId).HasColumnName("attribute_id");
            entity.Property(e => e.ValueText).HasColumnName("value_text").IsRequired().HasMaxLength(200);
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
            entity.HasIndex(e => new { e.AttributeId, e.ValueText }).IsUnique();
            entity.HasOne(e => e.Attribute)
                .WithMany(a => a.CanonicalValues)
                .HasForeignKey(e => e.AttributeId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private void ConfigureProductSpecificationValue(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProductSpecificationValue>(entity =>
        {
            entity.ToTable("product_specification_values");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.AttributeId).HasColumnName("attribute_id");
            entity.Property(e => e.CanonicalValueId).HasColumnName("canonical_value_id");
            entity.Property(e => e.ValueNumber).HasColumnName("value_number").HasPrecision(18, 4);
            entity.HasIndex(e => new { e.ProductId, e.AttributeId });
            entity.HasIndex(e => new { e.AttributeId, e.CanonicalValueId });
            entity.HasIndex(e => new { e.AttributeId, e.ValueNumber });
            entity.HasOne(e => e.Product)
                .WithMany(p => p.SpecificationValues)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Attribute)
                .WithMany(a => a.ProductValues)
                .HasForeignKey(e => e.AttributeId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.CanonicalValue)
                .WithMany(c => c.ProductValues)
                .HasForeignKey(e => e.CanonicalValueId)
                .OnDelete(DeleteBehavior.Restrict);
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
            
            entity.HasMany(e => e.FilterAttributes)
                .WithOne(f => f.Category)
                .HasForeignKey(f => f.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private void ConfigureCategoryFilterAttribute(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CategoryFilterAttribute>(entity =>
        {
            entity.ToTable("category_filter_attributes");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.AttributeId).HasColumnName("attribute_id");
            entity.Property(e => e.AttributeKey).HasColumnName("attribute_key").IsRequired().HasMaxLength(50);
            entity.Property(e => e.DisplayName).HasColumnName("display_name").IsRequired().HasMaxLength(100);
            entity.Property(e => e.FilterType).HasColumnName("filter_type");
            entity.Property(e => e.SortOrder).HasColumnName("sort_order");
            entity.HasIndex(e => e.CategoryId);
            entity.HasIndex(e => e.AttributeId);
            entity.HasOne(e => e.Attribute)
                .WithMany(a => a.CategoryFilterAttributes)
                .HasForeignKey(e => e.AttributeId)
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
            entity.Property(e => e.LogoPath).HasColumnName("logo_path").HasMaxLength(500);
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
            entity.Property(e => e.Path).HasColumnName("path").HasMaxLength(500);
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
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-000000000009"), Name = "Периферия", Slug = "periphery", ComponentType = ComponentType.Periphery },
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-00000000000a"), Name = "Мониторы", Slug = "monitors", ComponentType = ComponentType.Monitor },
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-00000000000b"), Name = "Клавиатуры", Slug = "keyboards", ComponentType = ComponentType.Keyboard },
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-00000000000c"), Name = "Мыши", Slug = "mice", ComponentType = ComponentType.Mouse },
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-00000000000d"), Name = "Наушники", Slug = "headphones", ComponentType = ComponentType.Headphones }
        };

        modelBuilder.Entity<Category>().HasData(categories);
    }

    private void SeedSpecificationAttributes(ModelBuilder modelBuilder)
    {
        var specAttrs = new[]
        {
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000001"), Key = "socket", DisplayName = "Сокет", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = true },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000002"), Key = "vram", DisplayName = "Объём видеопамяти", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000003"), Key = "gpu", DisplayName = "Серия GPU", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000004"), Key = "cores", DisplayName = "Количество ядер", ValueType = SpecificationAttributeValueType.Range, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000005"), Key = "chipset", DisplayName = "Чипсет", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000006"), Key = "type", DisplayName = "Тип", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000007"), Key = "capacity", DisplayName = "Объём", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000008"), Key = "wattage", DisplayName = "Мощность", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000009"), Key = "efficiency", DisplayName = "Сертификат", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-00000000000a"), Key = "form_factor", DisplayName = "Форм-фактор", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = true },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-00000000000b"), Key = "color", DisplayName = "Цвет", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-00000000000c"), Key = "tdp", DisplayName = "TDP", ValueType = SpecificationAttributeValueType.Range, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-00000000000d"), Key = "diagonal", DisplayName = "Диагональ", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-00000000000e"), Key = "resolution", DisplayName = "Разрешение", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-00000000000f"), Key = "refresh_rate", DisplayName = "Частота обновления", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000010"), Key = "connection", DisplayName = "Подключение", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000011"), Key = "dpi", DisplayName = "DPI", ValueType = SpecificationAttributeValueType.Range, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000012"), Key = "sensor_type", DisplayName = "Тип сенсора", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000013"), Key = "memory_type", DisplayName = "Тип памяти", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = true },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000014"), Key = "threads", DisplayName = "Потоков", ValueType = SpecificationAttributeValueType.Range, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000015"), Key = "integrated_graphics", DisplayName = "Встроенная графика", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000016"), Key = "modular", DisplayName = "Модульный", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000017"), Key = "memory_slots", DisplayName = "Слотов памяти", ValueType = SpecificationAttributeValueType.Range, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000018"), Key = "max_memory", DisplayName = "Макс. память", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000019"), Key = "interface", DisplayName = "Интерфейс", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-00000000001a"), Key = "release_year", DisplayName = "Год выхода", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-00000000001b"), Key = "data_vykhoda_na_rynok_2", DisplayName = "Дата выхода (legacy)", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-00000000001c"), Key = "proizvoditel_graficheskogo_protsessora", DisplayName = "Производитель ГП", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-00000000001d"), Key = "shirina_shiny_pamyati", DisplayName = "Ширина шины памяти", ValueType = SpecificationAttributeValueType.Range, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-00000000001e"), Key = "okhlazhdenie_1", DisplayName = "Охлаждение", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-00000000001f"), Key = "razyemy_pitaniya", DisplayName = "Разъёмы питания", ValueType = SpecificationAttributeValueType.Select, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000020"), Key = "rekomenduemyy_blok_pitaniya", DisplayName = "Рек. БП, Вт", ValueType = SpecificationAttributeValueType.Range, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000021"), Key = "dlina_videokarty", DisplayName = "Длина видеокарты", ValueType = SpecificationAttributeValueType.Range, IsMultiValue = false },
            new SpecificationAttribute { Id = Guid.Parse("40000000-0000-0000-0000-000000000022"), Key = "vysota_videokarty", DisplayName = "Высота видеокарты", ValueType = SpecificationAttributeValueType.Range, IsMultiValue = false },
        };

        modelBuilder.Entity<SpecificationAttribute>().HasData(specAttrs);
    }

    private void SeedSpecificationCanonicalValues(ModelBuilder modelBuilder)
    {
        var socketId = Guid.Parse("40000000-0000-0000-0000-000000000001");
        var vramId = Guid.Parse("40000000-0000-0000-0000-000000000002");
        var gpuId = Guid.Parse("40000000-0000-0000-0000-000000000003");
        var chipsetId = Guid.Parse("40000000-0000-0000-0000-000000000005");
        var typeId = Guid.Parse("40000000-0000-0000-0000-000000000006");
        var capacityId = Guid.Parse("40000000-0000-0000-0000-000000000007");
        var wattageId = Guid.Parse("40000000-0000-0000-0000-000000000008");
        var efficiencyId = Guid.Parse("40000000-0000-0000-0000-000000000009");
        var formFactorId = Guid.Parse("40000000-0000-0000-0000-00000000000a");
        var modularId = Guid.Parse("40000000-0000-0000-0000-000000000016");
        var maxMemoryId = Guid.Parse("40000000-0000-0000-0000-000000000018");
        var integratedGraphicsId = Guid.Parse("40000000-0000-0000-0000-000000000015");
        var memoryTypeId = Guid.Parse("40000000-0000-0000-0000-000000000013");

        var cv = new List<SpecificationCanonicalValue>();
        var i = 1;
        Guid NextId() => Guid.Parse($"50000000-0000-0000-0000-{i++:d12}");

        foreach (var (text, order) in new[] { ("AM4", 1), ("AM5", 2), ("LGA1700", 3) })
            cv.Add(new SpecificationCanonicalValue { Id = NextId(), AttributeId = socketId, ValueText = text, SortOrder = order });
        foreach (var (text, order) in new[] { ("8GB GDDR6", 1), ("12GB GDDR6X", 2), ("16GB GDDR6", 3), ("8GB", 4), ("12GB", 5), ("16GB", 6) })
            cv.Add(new SpecificationCanonicalValue { Id = NextId(), AttributeId = vramId, ValueText = text, SortOrder = order });
        foreach (var (text, order) in new[] { ("NVIDIA GeForce RTX 4070 SUPER", 1), ("AMD Radeon RX 7800 XT", 2), ("GeForce RTX 4070 SUPER", 3), ("Radeon RX 7800 XT", 4) })
            cv.Add(new SpecificationCanonicalValue { Id = NextId(), AttributeId = gpuId, ValueText = text, SortOrder = order });
        foreach (var (text, order) in new[] { ("B650", 1), ("Z790", 2) })
            cv.Add(new SpecificationCanonicalValue { Id = NextId(), AttributeId = chipsetId, ValueText = text, SortOrder = order });
        foreach (var (text, order) in new[] { ("DDR5", 1), ("DDR4", 2) })
            cv.Add(new SpecificationCanonicalValue { Id = NextId(), AttributeId = typeId, ValueText = text, SortOrder = order });
        foreach (var (text, order) in new[] { ("32GB", 1), ("16GB", 2), ("64GB", 3), ("128GB", 4) })
            cv.Add(new SpecificationCanonicalValue { Id = NextId(), AttributeId = capacityId, ValueText = text, SortOrder = order });
        foreach (var (text, order) in new[] { ("750W", 1), ("850W", 2), ("650W", 3), ("700W", 4) })
            cv.Add(new SpecificationCanonicalValue { Id = NextId(), AttributeId = wattageId, ValueText = text, SortOrder = order });
        foreach (var (text, order) in new[] { ("80+ Gold", 1), ("80+ Bronze", 2), ("80+ Platinum", 3), ("80+", 4) })
            cv.Add(new SpecificationCanonicalValue { Id = NextId(), AttributeId = efficiencyId, ValueText = text, SortOrder = order });
        foreach (var (text, order) in new[] { ("ATX", 1), ("mATX", 2), ("Mini-ITX", 3), ("eATX (до 280 мм)", 4) })
            cv.Add(new SpecificationCanonicalValue { Id = NextId(), AttributeId = formFactorId, ValueText = text, SortOrder = order });
        foreach (var (text, order) in new[] { ("Полностью модульный", 1), ("Полумодульный", 2), ("Нет", 3), ("Full", 4), ("Semi", 5) })
            cv.Add(new SpecificationCanonicalValue { Id = NextId(), AttributeId = modularId, ValueText = text, SortOrder = order });
        foreach (var (text, order) in new[] { ("128GB", 1), ("64GB", 2) })
            cv.Add(new SpecificationCanonicalValue { Id = NextId(), AttributeId = maxMemoryId, ValueText = text, SortOrder = order });
        foreach (var (text, order) in new[] { ("Есть", 1), ("Нет", 2) })
            cv.Add(new SpecificationCanonicalValue { Id = NextId(), AttributeId = integratedGraphicsId, ValueText = text, SortOrder = order });
        foreach (var (text, order) in new[] { ("DDR5", 1), ("DDR4", 2) })
            cv.Add(new SpecificationCanonicalValue { Id = NextId(), AttributeId = memoryTypeId, ValueText = text, SortOrder = order });

        modelBuilder.Entity<SpecificationCanonicalValue>().HasData(cv);
    }

    private void SeedFilterAttributes(ModelBuilder modelBuilder)
    {
        var gpuId = Guid.Parse("00000000-0000-0000-0000-000000000004");
        var cpuId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var mbId = Guid.Parse("00000000-0000-0000-0000-000000000002");
        var ramId = Guid.Parse("00000000-0000-0000-0000-000000000003");
        var storageId = Guid.Parse("00000000-0000-0000-0000-000000000006");
        var psuId = Guid.Parse("00000000-0000-0000-0000-000000000005");
        var casesId = Guid.Parse("00000000-0000-0000-0000-000000000007");
        var coolersId = Guid.Parse("00000000-0000-0000-0000-000000000008");
        var peripheryId = Guid.Parse("00000000-0000-0000-0000-000000000009");
        var monitorsId = Guid.Parse("00000000-0000-0000-0000-00000000000a");
        var keyboardsId = Guid.Parse("00000000-0000-0000-0000-00000000000b");
        var miceId = Guid.Parse("00000000-0000-0000-0000-00000000000c");
        var headphonesId = Guid.Parse("00000000-0000-0000-0000-00000000000d");

        var socketAttrId = Guid.Parse("40000000-0000-0000-0000-000000000001");
        var vramAttrId = Guid.Parse("40000000-0000-0000-0000-000000000002");
        var gpuAttrId = Guid.Parse("40000000-0000-0000-0000-000000000003");
        var coresAttrId = Guid.Parse("40000000-0000-0000-0000-000000000004");
        var chipsetAttrId = Guid.Parse("40000000-0000-0000-0000-000000000005");
        var typeAttrId = Guid.Parse("40000000-0000-0000-0000-000000000006");
        var capacityAttrId = Guid.Parse("40000000-0000-0000-0000-000000000007");
        var wattageAttrId = Guid.Parse("40000000-0000-0000-0000-000000000008");
        var efficiencyAttrId = Guid.Parse("40000000-0000-0000-0000-000000000009");
        var formFactorAttrId = Guid.Parse("40000000-0000-0000-0000-00000000000a");
        var colorAttrId = Guid.Parse("40000000-0000-0000-0000-00000000000b");
        var tdpAttrId = Guid.Parse("40000000-0000-0000-0000-00000000000c");
        var diagonalAttrId = Guid.Parse("40000000-0000-0000-0000-00000000000d");
        var resolutionAttrId = Guid.Parse("40000000-0000-0000-0000-00000000000e");
        var refreshRateAttrId = Guid.Parse("40000000-0000-0000-0000-00000000000f");
        var connectionAttrId = Guid.Parse("40000000-0000-0000-0000-000000000010");
        var dpiAttrId = Guid.Parse("40000000-0000-0000-0000-000000000011");
        var sensorTypeAttrId = Guid.Parse("40000000-0000-0000-0000-000000000012");
        var interfaceAttrId = Guid.Parse("40000000-0000-0000-0000-000000000019");

        var attributes = new[]
        {
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000001"), CategoryId = gpuId, AttributeId = vramAttrId, AttributeKey = "vram", DisplayName = "Объём видеопамяти", FilterType = FilterAttributeType.Select, SortOrder = 1 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000002"), CategoryId = gpuId, AttributeId = gpuAttrId, AttributeKey = "gpu", DisplayName = "Серия GPU", FilterType = FilterAttributeType.Select, SortOrder = 2 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000003"), CategoryId = cpuId, AttributeId = socketAttrId, AttributeKey = "socket", DisplayName = "Сокет", FilterType = FilterAttributeType.Select, SortOrder = 1 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000004"), CategoryId = cpuId, AttributeId = coresAttrId, AttributeKey = "cores", DisplayName = "Количество ядер", FilterType = FilterAttributeType.Range, SortOrder = 2 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000005"), CategoryId = mbId, AttributeId = socketAttrId, AttributeKey = "socket", DisplayName = "Сокет", FilterType = FilterAttributeType.Select, SortOrder = 1 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000006"), CategoryId = mbId, AttributeId = chipsetAttrId, AttributeKey = "chipset", DisplayName = "Чипсет", FilterType = FilterAttributeType.Select, SortOrder = 2 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000007"), CategoryId = ramId, AttributeId = typeAttrId, AttributeKey = "type", DisplayName = "Тип памяти", FilterType = FilterAttributeType.Select, SortOrder = 1 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000008"), CategoryId = ramId, AttributeId = capacityAttrId, AttributeKey = "capacity", DisplayName = "Объём", FilterType = FilterAttributeType.Select, SortOrder = 2 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000009"), CategoryId = storageId, AttributeId = capacityAttrId, AttributeKey = "capacity", DisplayName = "Объём", FilterType = FilterAttributeType.Select, SortOrder = 1 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-00000000000a"), CategoryId = psuId, AttributeId = wattageAttrId, AttributeKey = "wattage", DisplayName = "Мощность", FilterType = FilterAttributeType.Select, SortOrder = 1 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-00000000000b"), CategoryId = psuId, AttributeId = efficiencyAttrId, AttributeKey = "efficiency", DisplayName = "Сертификат", FilterType = FilterAttributeType.Select, SortOrder = 2 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-00000000000c"), CategoryId = casesId, AttributeId = formFactorAttrId, AttributeKey = "form_factor", DisplayName = "Форм-фактор", FilterType = FilterAttributeType.Select, SortOrder = 1 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-00000000000d"), CategoryId = casesId, AttributeId = colorAttrId, AttributeKey = "color", DisplayName = "Цвет", FilterType = FilterAttributeType.Select, SortOrder = 2 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-00000000000e"), CategoryId = coolersId, AttributeId = typeAttrId, AttributeKey = "type", DisplayName = "Тип", FilterType = FilterAttributeType.Select, SortOrder = 1 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-00000000000f"), CategoryId = coolersId, AttributeId = socketAttrId, AttributeKey = "socket", DisplayName = "Сокет", FilterType = FilterAttributeType.Select, SortOrder = 2 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000010"), CategoryId = coolersId, AttributeId = tdpAttrId, AttributeKey = "tdp", DisplayName = "TDP, Вт", FilterType = FilterAttributeType.Range, SortOrder = 3 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000011"), CategoryId = monitorsId, AttributeId = diagonalAttrId, AttributeKey = "diagonal", DisplayName = "Диагональ", FilterType = FilterAttributeType.Select, SortOrder = 1 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000012"), CategoryId = monitorsId, AttributeId = resolutionAttrId, AttributeKey = "resolution", DisplayName = "Разрешение", FilterType = FilterAttributeType.Select, SortOrder = 2 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000013"), CategoryId = monitorsId, AttributeId = refreshRateAttrId, AttributeKey = "refresh_rate", DisplayName = "Частота обновления", FilterType = FilterAttributeType.Select, SortOrder = 3 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000014"), CategoryId = peripheryId, AttributeId = typeAttrId, AttributeKey = "type", DisplayName = "Тип устройства", FilterType = FilterAttributeType.Select, SortOrder = 1 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000015"), CategoryId = peripheryId, AttributeId = connectionAttrId, AttributeKey = "connection", DisplayName = "Подключение", FilterType = FilterAttributeType.Select, SortOrder = 2 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000016"), CategoryId = keyboardsId, AttributeId = typeAttrId, AttributeKey = "type", DisplayName = "Тип/типоразмер", FilterType = FilterAttributeType.Select, SortOrder = 1 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000017"), CategoryId = keyboardsId, AttributeId = interfaceAttrId, AttributeKey = "interface", DisplayName = "Интерфейс", FilterType = FilterAttributeType.Select, SortOrder = 2 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000018"), CategoryId = keyboardsId, AttributeId = colorAttrId, AttributeKey = "color", DisplayName = "Цвет", FilterType = FilterAttributeType.Select, SortOrder = 3 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-000000000019"), CategoryId = miceId, AttributeId = typeAttrId, AttributeKey = "type", DisplayName = "Тип", FilterType = FilterAttributeType.Select, SortOrder = 1 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-00000000001a"), CategoryId = miceId, AttributeId = interfaceAttrId, AttributeKey = "interface", DisplayName = "Интерфейс", FilterType = FilterAttributeType.Select, SortOrder = 2 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-00000000001b"), CategoryId = miceId, AttributeId = dpiAttrId, AttributeKey = "dpi", DisplayName = "DPI", FilterType = FilterAttributeType.Range, SortOrder = 3 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-00000000001c"), CategoryId = miceId, AttributeId = sensorTypeAttrId, AttributeKey = "sensor_type", DisplayName = "Тип сенсора", FilterType = FilterAttributeType.Select, SortOrder = 4 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-00000000001d"), CategoryId = headphonesId, AttributeId = typeAttrId, AttributeKey = "type", DisplayName = "Тип", FilterType = FilterAttributeType.Select, SortOrder = 1 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-00000000001e"), CategoryId = headphonesId, AttributeId = interfaceAttrId, AttributeKey = "interface", DisplayName = "Интерфейс", FilterType = FilterAttributeType.Select, SortOrder = 2 },
            new CategoryFilterAttribute { Id = Guid.Parse("30000000-0000-0000-0000-00000000001f"), CategoryId = headphonesId, AttributeId = colorAttrId, AttributeKey = "color", DisplayName = "Цвет", FilterType = FilterAttributeType.Select, SortOrder = 3 }
        };

        modelBuilder.Entity<CategoryFilterAttribute>().HasData(attributes);
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
                Slug = "amd_ryzen_5_5600x",
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
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000002"),
                Name = "AMD Ryzen 7 7800X3D",
                Sku = "CPU-AMD-7800X3D",
                Slug = "amd_ryzen_7_7800x3d",
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
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000003"),
                Name = "Intel Core i5-13600KF",
                Sku = "CPU-INT-13600KF",
                Slug = "intel_core_i5_13600kf",
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
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },

            // === МАТЕРИНСКИЕ ПЛАТЫ ===
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000004"),
                Name = "ASUS TUF Gaming B650-Plus WiFi",
                Sku = "MB-ASUS-B650TUF",
                Slug = "asus_tuf_gaming_b650_plus_wifi",
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
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000005"),
                Name = "MSI MAG B650 TOMAHAWK WIFI",
                Sku = "MB-MSI-B650TOM",
                Slug = "msi_mag_b650_tomahawk_wifi",
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
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },

            // === ОПЕРАТИВНАЯ ПАМЯТЬ ===
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000006"),
                Name = "Kingston FURY Beast 32GB DDR5-5600",
                Sku = "RAM-KING-32D5",
                Slug = "kingston_fury_beast_32gb_ddr5_5600",
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
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000007"),
                Name = "G.Skill Trident Z5 RGB 32GB DDR5-6000",
                Sku = "RAM-GSKILL-32Z5",
                Slug = "g_skill_trident_z5_rgb_32gb_ddr5_6000",
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
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },

            // === ВИДЕОКАРТЫ ===
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000008"),
                Name = "Palit GeForce RTX 4070 SUPER Dual",
                Sku = "GPU-PALIT-4070S",
                Slug = "palit_geforce_rtx_4070_super_dual",
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
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000009"),
                Name = "Gigabyte Radeon RX 7800 XT GAMING OC",
                Sku = "GPU-GIGA-7800XT",
                Slug = "gigabyte_radeon_rx_7800_xt_gaming_oc",
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
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },

            // === БЛОКИ ПИТАНИЯ ===
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000010"),
                Name = "Corsair RM750e 750W 80+ Gold",
                Sku = "PSU-CORS-RM750E",
                Slug = "corsair_rm750e_750w_80_gold",
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
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000011"),
                Name = "be quiet! Pure Power 12 M 850W",
                Sku = "PSU-BEQT-PP12M",
                Slug = "be_quiet_pure_power_12_m_850w",
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
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new Product
            {
                Id = Guid.Parse("20000000-0000-0000-0000-000000000012"),
                Name = "Seasonic Focus GX-850 850W",
                Sku = "PSU-SEAS-GX850",
                Slug = "seasonic_focus_gx_850_850w",
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
                CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        };

        modelBuilder.Entity<Product>().HasData(products);
    }
}
