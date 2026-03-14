using GoldPC.OrdersService.Entities;
using Microsoft.EntityFrameworkCore;

namespace GoldPC.OrdersService.Data;

/// <summary>
/// Контекст базы данных для сервиса заказов
/// </summary>
public class OrdersDbContext : DbContext
{
    public OrdersDbContext(DbContextOptions<OrdersDbContext> options) : base(options)
    {
    }
    
    /// <summary>
    /// Заказы
    /// </summary>
    public DbSet<Order> Orders => Set<Order>();
    
    /// <summary>
    /// Позиции заказов
    /// </summary>
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    
    /// <summary>
    /// История заказов
    /// </summary>
    public DbSet<OrderHistory> OrderHistory => Set<OrderHistory>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Конфигурация Order
        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("orders");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.OrderNumber).IsUnique();
            entity.Property(e => e.OrderNumber).IsRequired().HasMaxLength(20);
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.Total).HasPrecision(12, 2);
            entity.Property(e => e.DeliveryMethod).IsRequired().HasMaxLength(20);
            entity.Property(e => e.PaymentMethod).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.Comment).HasMaxLength(1000);
        });
        
        // Конфигурация OrderItem
        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("order_items");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ProductName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.UnitPrice).HasPrecision(12, 2);
            entity.HasOne(e => e.Order)
                .WithMany(o => o.Items)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // Конфигурация OrderHistory
        modelBuilder.Entity<OrderHistory>(entity =>
        {
            entity.ToTable("order_history");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Comment).HasMaxLength(500);
            entity.HasOne(e => e.Order)
                .WithMany(o => o.History)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}