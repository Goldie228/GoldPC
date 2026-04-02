using Microsoft.EntityFrameworkCore;
using PCBuilderService.Models;

namespace PCBuilderService.Data;

public class PCBuilderDbContext : DbContext
{
    public PCBuilderDbContext(DbContextOptions<PCBuilderDbContext> options) : base(options) { }

    public DbSet<PCConfiguration> PCConfigurations => Set<PCConfiguration>();
    public DbSet<CompatibilityRule> CompatibilityRules => Set<CompatibilityRule>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        ConfigurePCConfiguration(modelBuilder);
        ConfigureCompatibilityRule(modelBuilder);
    }

    private void ConfigurePCConfiguration(ModelBuilder modelBuilder)
    {
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
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ShareToken).HasFilter("share_token IS NOT NULL");
        });
    }

    private void ConfigureCompatibilityRule(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CompatibilityRule>(entity =>
        {
            entity.ToTable("compatibility_rules");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.RuleType).HasColumnName("rule_type").IsRequired().HasMaxLength(50);
            entity.Property(e => e.Component1Id).HasColumnName("component1_id").IsRequired();
            entity.Property(e => e.Component1Type).HasColumnName("component1_type").IsRequired().HasMaxLength(30);
            entity.Property(e => e.Component1Name).HasColumnName("component1_name").IsRequired().HasMaxLength(300);
            entity.Property(e => e.Component2Id).HasColumnName("component2_id").IsRequired();
            entity.Property(e => e.Component2Type).HasColumnName("component2_type").IsRequired().HasMaxLength(30);
            entity.Property(e => e.Component2Name).HasColumnName("component2_name").IsRequired().HasMaxLength(300);
            entity.Property(e => e.Socket).HasColumnName("socket").HasMaxLength(30);
            entity.Property(e => e.MemoryType).HasColumnName("memory_type").HasMaxLength(10);
            entity.Property(e => e.FormFactor).HasColumnName("form_factor").HasMaxLength(20);
            entity.Property(e => e.IsCompatible).HasColumnName("is_compatible").IsRequired();
            entity.Property(e => e.IncompatibilityType).HasColumnName("incompatibility_type").IsRequired().HasMaxLength(50);
            entity.Property(e => e.Message).HasColumnName("message").HasMaxLength(500);
            entity.Property(e => e.Suggestion).HasColumnName("suggestion").HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            // Индекс на socket - для быстрого поиска по сокету
            entity.HasIndex(e => e.Socket)
                .HasDatabaseName("IX_compatibility_rules_socket")
                .HasFilter("socket IS NOT NULL");

            // Индекс на memory_type - для быстрого поиска совместимой памяти
            entity.HasIndex(e => e.MemoryType)
                .HasDatabaseName("IX_compatibility_rules_memory_type")
                .HasFilter("memory_type IS NOT NULL");

            // Индекс на form_factor - для быстрого поиска совместимых корпусов
            entity.HasIndex(e => e.FormFactor)
                .HasDatabaseName("IX_compatibility_rules_form_factor")
                .HasFilter("form_factor IS NOT NULL");

            // Составной индекс для поиска правил по типу и совместимости
            entity.HasIndex(e => new { e.RuleType, e.IsCompatible })
                .HasDatabaseName("IX_compatibility_rules_type_compatible");

            // Составной индекс для поиска по сокету и типу памяти
            entity.HasIndex(e => new { e.Socket, e.MemoryType, e.IsCompatible })
                .HasDatabaseName("IX_compatibility_rules_socket_memory_compatible")
                .HasFilter("socket IS NOT NULL AND memory_type IS NOT NULL");

            // Уникальный индекс для предотвращения дублирования
            entity.HasIndex(e => new { e.RuleType, e.Component1Id, e.Component2Id })
                .IsUnique()
                .HasDatabaseName("IX_compatibility_rules_unique_pair");
        });
    }
}