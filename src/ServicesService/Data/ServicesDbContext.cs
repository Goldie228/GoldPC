using GoldPC.ServicesService.Entities;
using Microsoft.EntityFrameworkCore;

namespace GoldPC.ServicesService.Data;

public class ServicesDbContext : DbContext
{
    public ServicesDbContext(DbContextOptions<ServicesDbContext> options) : base(options) { }
    
    public DbSet<ServiceRequest> ServiceRequests => Set<ServiceRequest>();
    public DbSet<ServiceType> ServiceTypes => Set<ServiceType>();
    public DbSet<UsedPart> UsedParts => Set<UsedPart>();
    public DbSet<ServiceHistory> ServiceHistory => Set<ServiceHistory>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<ServiceType>(entity =>
        {
            entity.ToTable("service_types");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.BasePrice).HasPrecision(12, 2);
        });
        
        modelBuilder.Entity<ServiceRequest>(entity =>
        {
            entity.ToTable("service_requests");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.RequestNumber).IsUnique();
            entity.Property(e => e.RequestNumber).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(2000);
            entity.Property(e => e.DeviceModel).HasMaxLength(100);
            entity.Property(e => e.SerialNumber).HasMaxLength(50);
            entity.Property(e => e.EstimatedCost).HasPrecision(12, 2);
            entity.Property(e => e.ActualCost).HasPrecision(12, 2);
            entity.Property(e => e.MasterComment).HasMaxLength(2000);
            
            entity.HasOne(e => e.ServiceType)
                .WithMany(st => st.ServiceRequests)
                .HasForeignKey(e => e.ServiceTypeId);
        });
        
        modelBuilder.Entity<UsedPart>(entity =>
        {
            entity.ToTable("used_parts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ProductName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.UnitPrice).HasPrecision(12, 2);
            
            entity.HasOne(e => e.ServiceRequest)
                .WithMany(sr => sr.UsedParts)
                .HasForeignKey(e => e.ServiceRequestId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        modelBuilder.Entity<ServiceHistory>(entity =>
        {
            entity.ToTable("service_history");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Comment).HasMaxLength(500);
            
            entity.HasOne(e => e.ServiceRequest)
                .WithMany(sr => sr.History)
                .HasForeignKey(e => e.ServiceRequestId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}