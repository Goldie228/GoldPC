using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace CatalogService.Data;

/// <summary>
/// Контекст базы данных только для чтения (использует реплику)
/// </summary>
public class ReadOnlyCatalogDbContext : CatalogDbContext
{
    public ReadOnlyCatalogDbContext(DbContextOptions<ReadOnlyCatalogDbContext> options)
        : base(CreateBaseOptions(options))
    {
    }

    private static DbContextOptions<CatalogDbContext> CreateBaseOptions(DbContextOptions<ReadOnlyCatalogDbContext> options)
    {
        var builder = new DbContextOptionsBuilder<CatalogDbContext>();
        foreach (var extension in options.Extensions)
        {
            ((IDbContextOptionsBuilderInfrastructure)builder).AddOrUpdateExtension(extension);
        }
        return builder.Options;
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
        base.OnConfiguring(optionsBuilder);
    }
}
