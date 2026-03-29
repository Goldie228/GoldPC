using CatalogService.Data;
using CatalogService.Models;
using CatalogService.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace GoldPC.UnitTests.Services;

public class CatalogJsonImporterBackfillTests
{
    [Fact]
    public async Task BackfillMissingManufacturersAsync_WhenManufacturerMissing_AssignsAndCreatesManufacturer()
    {
        // Arrange
        await using var context = CreateContext();

        var categoryId = Guid.Parse("00000000-0000-0000-0000-00000000000c"); // mice
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Игровая мышь Logitech Pro X Superlight 2 DEX (розовый)",
            Sku = "TEST-MOUSE-001",
            Slug = "test_mouse_001",
            CategoryId = categoryId,
            Price = 567m,
            Stock = 10,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            ManufacturerId = null
        };

        context.Products.Add(product);
        await context.SaveChangesAsync();

        var importer = CreateImporter(context);

        // Act
        var result = await importer.BackfillMissingManufacturersAsync(batchSize: 1);
        var updated = await context.Products
            .Include(p => p.Manufacturer)
            .FirstAsync(p => p.Id == product.Id);

        // Assert
        result.TotalCandidates.Should().Be(1);
        result.UpdatedProducts.Should().Be(1);
        updated.ManufacturerId.Should().NotBeNull();
        updated.Manufacturer.Should().NotBeNull();
        updated.Manufacturer!.Name.Should().Be("Logitech");
    }

    [Fact]
    public async Task BackfillMissingManufacturersAsync_WhenNoBrandInName_SkipsProduct()
    {
        // Arrange
        await using var context = CreateContext();

        var categoryId = Guid.Parse("00000000-0000-0000-0000-000000000003"); // ram
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "ОЗУ DDR5 32GB",
            Sku = "TEST-RAM-001",
            Slug = "test_ram_001",
            CategoryId = categoryId,
            Price = 199m,
            Stock = 3,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            ManufacturerId = null
        };

        context.Products.Add(product);
        await context.SaveChangesAsync();

        var importer = CreateImporter(context);

        // Act
        var result = await importer.BackfillMissingManufacturersAsync(batchSize: 10);
        var updated = await context.Products.FirstAsync(p => p.Id == product.Id);

        // Assert
        result.TotalCandidates.Should().Be(1);
        result.UpdatedProducts.Should().Be(0);
        result.Skipped.Should().Be(1);
        updated.ManufacturerId.Should().BeNull();
    }

    private static CatalogDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CatalogDbContext>()
            .UseInMemoryDatabase(databaseName: $"xcore-backfill-tests-{Guid.NewGuid():N}")
            .Options;

        var context = new CatalogDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }

    private static CatalogJsonImporter CreateImporter(CatalogDbContext context)
    {
        var hostEnvironmentMock = new Mock<IHostEnvironment>();
        hostEnvironmentMock.SetupGet(e => e.ContentRootPath).Returns(Path.GetTempPath());

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["CatalogService:UploadsPath"] = "uploads"
            })
            .Build();

        return new CatalogJsonImporter(
            context,
            new SpecImportNormalizer(context),
            new ManufacturerDetector(),
            NullLogger<CatalogJsonImporter>.Instance,
            hostEnvironmentMock.Object,
            configuration);
    }
}
