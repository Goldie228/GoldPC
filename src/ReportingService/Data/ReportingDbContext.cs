using GoldPC.ReportingService.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

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
        // Extract connection info for each target DB and set up postgres_fdw
        var catalogNpgsql = new NpgsqlConnectionStringBuilder(catalogConnStr);
        var ordersNpgsql = new NpgsqlConnectionStringBuilder(ordersConnStr);
        var servicesNpgsql = new NpgsqlConnectionStringBuilder(servicesConnStr);

        // 1. Enable postgres_fdw extension
        await Database.ExecuteSqlRawAsync("CREATE EXTENSION IF NOT EXISTS postgres_fdw;");

        // 2. Create foreign servers (IF NOT EXISTS via DO block)
        await Database.ExecuteSqlRawAsync(@"
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_foreign_server WHERE srvname = 'catalog_server') THEN
                    CREATE SERVER catalog_server FOREIGN DATA WRAPPER postgres_fdw
                        OPTIONS (host {0}, dbname {1}, port {2});
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_foreign_server WHERE srvname = 'orders_server') THEN
                    CREATE SERVER orders_server FOREIGN DATA WRAPPER postgres_fdw
                        OPTIONS (host {3}, dbname {4}, port {5});
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_foreign_server WHERE srvname = 'services_server') THEN
                    CREATE SERVER services_server FOREIGN DATA WRAPPER postgres_fdw
                        OPTIONS (host {6}, dbname {7}, port {8});
                END IF;
            END $$;",
            catalogNpgsql.Host, catalogNpgsql.Database, catalogNpgsql.Port.ToString(),
            ordersNpgsql.Host, ordersNpgsql.Database, ordersNpgsql.Port.ToString(),
            servicesNpgsql.Host, servicesNpgsql.Database, servicesNpgsql.Port.ToString());

        // 3. Create user mappings for each server
        var dbUser = catalogNpgsql.Username ?? "postgres";
        var dbPassword = catalogNpgsql.Password ?? "admin";

        foreach (var serverName in new[] { "catalog_server", "orders_server", "services_server" })
        {
            // Use parameterized approach — escape single quotes to prevent SQL injection
            var escapedUser = dbUser.Replace("'", "''");
            var escapedPassword = dbPassword.Replace("'", "''");
            var escapedServer = serverName.Replace("'", "''");
            await Database.ExecuteSqlRawAsync($@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_user_mappings
                        WHERE srvname = '{escapedServer}' AND usename = current_user
                    ) THEN
                        CREATE USER MAPPING FOR current_user SERVER {escapedServer}
                            OPTIONS (user '{escapedUser}', password '{escapedPassword}');
                    END IF;
                END $$;");
        }

        // 4. Create foreign schemas and foreign tables for key tables from each service

        // --- Catalog DB tables ---
        await Database.ExecuteSqlRawAsync("CREATE SCHEMA IF NOT EXISTS fdw_catalog;");

        await CreateForeignTableAsync("fdw_catalog", "products", "catalog_server", new[]
        {
            ("id", "uuid"), ("name", "varchar(200)"), ("sku", "varchar(50)"), ("slug", "varchar(220)"),
            ("description", "text"), ("category_id", "uuid"), ("manufacturer_id", "uuid"),
            ("price", "numeric(12,2)"), ("stock", "integer"), ("warranty_months", "integer"),
            ("rating", "numeric(3,2)"), ("review_count", "integer"), ("is_active", "boolean"),
            ("created_at", "timestamp with time zone"), ("updated_at", "timestamp with time zone")
        });

        await CreateForeignTableAsync("fdw_catalog", "categories", "catalog_server", new[]
        {
            ("id", "uuid"), ("name", "varchar(100)"), ("slug", "varchar(100)"),
            ("description", "varchar(500)"), ("parent_id", "uuid")
        });

        await CreateForeignTableAsync("fdw_catalog", "manufacturers", "catalog_server", new[]
        {
            ("id", "uuid"), ("name", "varchar(100)"), ("country", "varchar(50)")
        });

        await CreateForeignTableAsync("fdw_catalog", "product_images", "catalog_server", new[]
        {
            ("id", "uuid"), ("product_id", "uuid"), ("url", "varchar(500)"),
            ("alt_text", "varchar(200)"), ("is_primary", "boolean"), ("sort_order", "integer")
        });

        await CreateForeignTableAsync("fdw_catalog", "reviews", "catalog_server", new[]
        {
            ("id", "uuid"), ("product_id", "uuid"), ("user_id", "uuid"),
            ("user_name", "varchar(100)"), ("rating", "integer"), ("comment", "text"),
            ("created_at", "timestamp with time zone"), ("is_verified", "boolean")
        });

        await CreateForeignTableAsync("fdw_catalog", "price_history", "catalog_server", new[]
        {
            ("id", "uuid"), ("product_id", "uuid"), ("price", "numeric(12,2)"),
            ("old_price", "numeric(12,2)"), ("changed_at", "timestamp with time zone"),
            ("changed_by", "varchar(100)")
        });

        // --- Orders DB tables ---
        await Database.ExecuteSqlRawAsync("CREATE SCHEMA IF NOT EXISTS fdw_orders;");

        await CreateForeignTableAsync("fdw_orders", "orders", "orders_server", new[]
        {
            ("id", "uuid"), ("user_id", "uuid"), ("total", "numeric(12,2)"),
            ("status", "varchar(50)"), ("created_at", "timestamp with time zone"),
            ("updated_at", "timestamp with time zone")
        });

        await CreateForeignTableAsync("fdw_orders", "order_items", "orders_server", new[]
        {
            ("id", "uuid"), ("order_id", "uuid"), ("product_id", "uuid"),
            ("quantity", "integer"), ("price", "numeric(12,2)"), ("sku", "varchar(50)")
        });

        await CreateForeignTableAsync("fdw_orders", "order_history", "orders_server", new[]
        {
            ("id", "uuid"), ("order_id", "uuid"), ("old_status", "varchar(50)"),
            ("new_status", "varchar(50)"), ("changed_at", "timestamp with time zone"),
            ("changed_by", "varchar(100)")
        });

        // --- Services DB tables ---
        await Database.ExecuteSqlRawAsync("CREATE SCHEMA IF NOT EXISTS fdw_services;");

        await CreateForeignTableAsync("fdw_services", "service_requests", "services_server", new[]
        {
            ("id", "uuid"), ("user_id", "uuid"), ("status", "varchar(50)"),
            ("assigned_master_id", "uuid"), ("created_at", "timestamp with time zone"),
            ("updated_at", "timestamp with time zone")
        });

        await CreateForeignTableAsync("fdw_services", "service_types", "services_server", new[]
        {
            ("id", "uuid"), ("name", "varchar(100)"), ("description", "text"),
            ("base_price", "numeric(12,2)")
        });
    }

    /// <summary>
    /// Creates a foreign table in the specified schema if it does not already exist.
    /// </summary>
    private async Task CreateForeignTableAsync(string schema, string tableName, string serverName,
        (string name, string pgType)[] columns)
    {
        var columnDefs = string.Join(", ", columns.Select(c => $"\"{c.name}\" {c.pgType}"));
        await Database.ExecuteSqlRawAsync($@"
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_foreign_table ft
                    JOIN pg_foreign_server fs ON ft.ftserver = fs.oid
                    WHERE ft.ftrelname = '{tableName}' AND fs.srvname = '{serverName}'
                ) THEN
                    CREATE FOREIGN TABLE {schema}.{tableName} ({columnDefs})
                        SERVER {serverName} OPTIONS (schema_name 'public', table_name '{tableName}');
                END IF;
            END $$;");
    }
}
