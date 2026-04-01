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
    
    /// <summary>
    /// Сообщения Outbox
    /// </summary>
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();
    
    /// <summary>
    /// Промокоды
    /// </summary>
    public DbSet<PromoCode> PromoCodes => Set<PromoCode>();
    
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
            entity.Property(e => e.CustomerFirstName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CustomerLastName).HasMaxLength(100);
            entity.Property(e => e.CustomerPhone).IsRequired().HasMaxLength(20);
            entity.Property(e => e.CustomerEmail).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.Total).HasPrecision(12, 2);
            entity.Property(e => e.Subtotal).HasPrecision(12, 2);
            entity.Property(e => e.DeliveryCost).HasPrecision(12, 2);
            entity.Property(e => e.DiscountAmount).HasPrecision(12, 2);
            entity.Property(e => e.DeliveryMethod).IsRequired().HasMaxLength(20);
            entity.Property(e => e.PaymentMethod).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.Comment).HasMaxLength(1000);
            entity.Property(e => e.PromoCode).HasMaxLength(50);
            entity.Property(e => e.DeliveryDate).HasMaxLength(20);
            entity.Property(e => e.DeliveryTimeSlot).HasMaxLength(20);
            entity.Property(e => e.TrackingNumber).HasMaxLength(100);
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
            entity.HasKey(e => new { e.Id, e.ChangedAt }); // Composite key for partitioning
            entity.Property(e => e.Comment).HasMaxLength(500);
            entity.HasOne(e => e.Order)
                .WithMany(o => o.History)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Конфигурация OutboxMessage
        modelBuilder.Entity<OutboxMessage>(entity =>
        {
            entity.ToTable("outbox_messages");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Content).IsRequired().HasColumnType("text");
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.ProcessedAt);
            entity.Property(e => e.Error);
        });
        
        // Конфигурация PromoCode
        modelBuilder.Entity<PromoCode>(entity =>
        {
            entity.ToTable("promo_codes");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.Property(e => e.DiscountPercent).IsRequired();
            entity.Property(e => e.MinOrderAmount).HasPrecision(12, 2);
            entity.Property(e => e.Description).HasMaxLength(500);
        });
    }
}
