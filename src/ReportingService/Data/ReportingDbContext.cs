using GoldPC.ReportingService.Models;
using Microsoft.EntityFrameworkCore;

namespace GoldPC.ReportingService.Data;

public class ReportingDbContext : DbContext
{
    public ReportingDbContext(DbContextOptions<ReportingDbContext> options)
        : base(options)
    {
    }

    // SQL Views (Keyless entities)
    public DbSet<SalesPerformanceReport> SalesPerformance { get; set; }
    public DbSet<ServiceEfficiencyReport> ServiceEfficiency { get; set; }
    public DbSet<InventoryAnalyticsReport> InventoryAnalytics { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<SalesPerformanceReport>(entity =>
        {
            entity.HasNoKey();
            entity.ToView("vw_SalesPerformance");
        });

        modelBuilder.Entity<ServiceEfficiencyReport>(entity =>
        {
            entity.HasNoKey();
            entity.ToView("vw_ServiceEfficiency");
        });

        modelBuilder.Entity<InventoryAnalyticsReport>(entity =>
        {
            entity.HasNoKey();
            entity.ToView("vw_InventoryAnalytics");
        });
    }

    public async Task InitializeFdwAsync(string catalogConnStr, string ordersConnStr, string servicesConnStr)
    {
        // Extract connection info for postgres_fdw
        // Connection string format: "Server=...;Database=...;User Id=...;Password=..."
        
        // This method will be called during startup to ensure FDW is set up
        // We'll use Raw SQL to setup postgres_fdw if needed
        // Note: In production this should be done in migrations or during DB init
    }
}
