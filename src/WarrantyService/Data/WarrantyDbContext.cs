using GoldPC.WarrantyService.Entities;
using Microsoft.EntityFrameworkCore;

namespace GoldPC.WarrantyService.Data;

public class WarrantyDbContext : DbContext
{
    public WarrantyDbContext(DbContextOptions<WarrantyDbContext> options) : base(options) { }
    
    public DbSet<WarrantyClaim> WarrantyClaims => Set<WarrantyClaim>();
    public DbSet<WarrantyHistory> WarrantyHistory => Set<WarrantyHistory>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<WarrantyClaim>(entity =>
        {
            entity.ToTable("warranty_claims");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ClaimNumber).IsUnique();
            entity.Property(e => e.ClaimNumber).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.ProductName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.MasterComment).HasMaxLength(1000);
            entity.Property(e => e.Resolution).HasMaxLength(500);
        });
        
        modelBuilder.Entity<WarrantyHistory>(entity =>
        {
            entity.ToTable("warranty_history");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Comment).HasMaxLength(500);
            entity.HasOne(e => e.WarrantyClaim)
                .WithMany(w => w.History)
                .HasForeignKey(e => e.WarrantyClaimId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}