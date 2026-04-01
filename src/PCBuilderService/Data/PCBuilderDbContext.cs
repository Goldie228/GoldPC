using Microsoft.EntityFrameworkCore;
using PCBuilderService.Models;

namespace PCBuilderService.Data;

/// <summary>
/// Контекст базы данных для сервиса сборки ПК
/// </summary>
public class PCBuilderDbContext : DbContext
{
    public PCBuilderDbContext(DbContextOptions<PCBuilderDbContext> options) : base(options)
    {
    }

    /// <summary>
    /// Конфигурации ПК
    /// </summary>
    public DbSet<PCConfiguration> PCConfigurations => Set<PCConfiguration>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<PCConfiguration>(entity =>
        {
            entity.ToTable("pc_configurations");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(200);
            entity.Property(e => e.Purpose).HasColumnName("purpose").IsRequired().HasMaxLength(50);
            entity.Property(e => e.ProcessorId).HasColumnName("processor_id");
            entity.Property(e => e.MotherboardId).HasColumnName("motherboard_id");
            entity.Property(e => e.RamId).HasColumnName("ram_id");
            entity.Property(e => e.GpuId).HasColumnName("gpu_id");
            entity.Property(e => e.PsuId).HasColumnName("psu_id");
            entity.Property(e => e.StorageId).HasColumnName("storage_id");
            entity.Property(e => e.CaseId).HasColumnName("case_id");
            entity.Property(e => e.CoolerId).HasColumnName("cooler_id");
            entity.Property(e => e.TotalPrice).HasColumnName("total_price").HasPrecision(12, 2);
            entity.Property(e => e.TotalPower).HasColumnName("total_power");
            entity.Property(e => e.IsCompatible).HasColumnName("is_compatible");
            entity.Property(e => e.ShareToken).HasColumnName("share_token").HasMaxLength(64);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            // Индексы
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ShareToken).HasFilter("share_token IS NOT NULL");
        });
    }
}
