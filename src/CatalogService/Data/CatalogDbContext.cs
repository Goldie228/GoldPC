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
}