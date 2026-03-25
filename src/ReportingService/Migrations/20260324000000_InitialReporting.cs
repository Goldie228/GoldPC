using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GoldPC.ReportingService.Migrations
{
    public partial class InitialReporting : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Enable postgres_fdw
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS postgres_fdw;");

            // 2. Setup Servers (Assuming all DBs are on the same host for simplicity, as per docker-compose)
            // In a real environment, these would point to different hosts or the same host with different DBs
            
            // For docker environment, the host is 'postgres'
            // We use 'goldpc_catalog', 'goldpc_orders', 'goldpc_services' databases.
            // Note: fdw connects to the same database by default unless specified.
            // Since they are different databases on the same server, we need separate servers OR use the same server with different options.
            
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_foreign_server WHERE srvname = 'catalog_server') THEN
                        CREATE SERVER catalog_server FOREIGN DATA WRAPPER postgres_fdw OPTIONS (host 'postgres', dbname 'goldpc_catalog', port '5432');
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_foreign_server WHERE srvname = 'orders_server') THEN
                        CREATE SERVER orders_server FOREIGN DATA WRAPPER postgres_fdw OPTIONS (host 'postgres', dbname 'goldpc_orders', port '5432');
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_foreign_server WHERE srvname = 'services_server') THEN
                        CREATE SERVER services_server FOREIGN DATA WRAPPER postgres_fdw OPTIONS (host 'postgres', dbname 'goldpc_services', port '5432');
                    END IF;
                END $$;
            ");

            // 3. Setup User Mapping
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_user_mappings WHERE srvname = 'catalog_server') THEN
                        CREATE USER MAPPING FOR postgres SERVER catalog_server OPTIONS (user 'postgres', password 'admin');
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_user_mappings WHERE srvname = 'orders_server') THEN
                        CREATE USER MAPPING FOR postgres SERVER orders_server OPTIONS (user 'postgres', password 'admin');
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_user_mappings WHERE srvname = 'services_server') THEN
                        CREATE USER MAPPING FOR postgres SERVER services_server OPTIONS (user 'postgres', password 'admin');
                    END IF;
                END $$;
            ");

            // 4. Import Foreign Schemas (or specific tables)
            migrationBuilder.Sql(@"
                CREATE SCHEMA IF NOT EXISTS fdw_catalog;
                IMPORT FOREIGN SCHEMA public LIMIT TO (products, categories) FROM SERVER catalog_server INTO fdw_catalog;

                CREATE SCHEMA IF NOT EXISTS fdw_orders;
                IMPORT FOREIGN SCHEMA public LIMIT TO (orders, order_items, order_history) FROM SERVER orders_server INTO fdw_orders;

                CREATE SCHEMA IF NOT EXISTS fdw_services;
                IMPORT FOREIGN SCHEMA public LIMIT TO (service_requests) FROM SERVER services_server INTO fdw_services;
            ");

            // 5. Create Views
            
            // Sales Performance View
            migrationBuilder.Sql(@"
                CREATE OR REPLACE VIEW vw_SalesPerformance AS
                SELECT 
                    date_trunc('day', created_at) as Date,
                    SUM(total) as Revenue,
                    SUM(total * 0.2) as Profit, -- Assuming 20% profit margin for demo
                    COUNT(*) as OrdersCount
                FROM fdw_orders.orders
                WHERE status = 'Completed' OR status = 'Paid'
                GROUP BY date_trunc('day', created_at);
            ");

            // Service Efficiency View
            migrationBuilder.Sql(@"
                CREATE OR REPLACE VIEW vw_ServiceEfficiency AS
                SELECT 
                    assigned_master_id as MasterId,
                    'Master ' || substr(assigned_master_id::text, 1, 8) as MasterName, -- Placeholder for master name
                    COUNT(*) FILTER (WHERE status NOT IN ('Completed', 'Cancelled')) as ActiveTasks,
                    COUNT(*) FILTER (WHERE status = 'Completed') as CompletedTasks,
                    CASE 
                        WHEN COUNT(*) FILTER (WHERE status = 'Completed') + COUNT(*) FILTER (WHERE status NOT IN ('Completed', 'Cancelled')) = 0 THEN 0
                        ELSE (COUNT(*) FILTER (WHERE status = 'Completed')::float / (COUNT(*) FILTER (WHERE status = 'Completed') + COUNT(*) FILTER (WHERE status NOT IN ('Completed', 'Cancelled')))) * 100
                    END as EfficiencyRate
                FROM fdw_services.service_requests
                WHERE assigned_master_id IS NOT NULL
                GROUP BY assigned_master_id;
            ");

            // Inventory Analytics View
            migrationBuilder.Sql(@"
                CREATE OR REPLACE VIEW vw_InventoryAnalytics AS
                WITH SalesData AS (
                    SELECT 
                        sku, 
                        COUNT(*)::float / 30 as velocity -- Last 30 days average
                    FROM fdw_orders.order_items oi
                    JOIN fdw_orders.orders o ON oi.order_id = o.id
                    WHERE o.created_at > now() - interval '30 days'
                    GROUP BY sku
                )
                SELECT 
                    p.id as ProductId,
                    p.name as ProductName,
                    p.stock as CurrentStock,
                    10 as LowStockThreshold, -- Hardcoded threshold for demo
                    COALESCE(s.velocity, 0) as SalesVelocity,
                    CASE 
                        WHEN p.stock < 10 THEN GREATEST(20, ceil(COALESCE(s.velocity, 0) * 14)) -- Order for 14 days
                        ELSE 0 
                    END as SuggestedOrderQuantity
                FROM fdw_catalog.products p
                LEFT JOIN SalesData s ON p.sku = s.sku;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP VIEW IF EXISTS vw_InventoryAnalytics;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS vw_ServiceEfficiency;");
            migrationBuilder.Sql("DROP VIEW IF EXISTS vw_SalesPerformance;");
            migrationBuilder.Sql("DROP SCHEMA IF EXISTS fdw_services CASCADE;");
            migrationBuilder.Sql("DROP SCHEMA IF EXISTS fdw_orders CASCADE;");
            migrationBuilder.Sql("DROP SCHEMA IF EXISTS fdw_catalog CASCADE;");
            migrationBuilder.Sql("DROP USER MAPPING IF EXISTS FOR postgres SERVER services_server;");
            migrationBuilder.Sql("DROP USER MAPPING IF EXISTS FOR postgres SERVER orders_server;");
            migrationBuilder.Sql("DROP USER MAPPING IF EXISTS FOR postgres SERVER catalog_server;");
            migrationBuilder.Sql("DROP SERVER IF EXISTS services_server;");
            migrationBuilder.Sql("DROP SERVER IF EXISTS orders_server;");
            migrationBuilder.Sql("DROP SERVER IF EXISTS catalog_server;");
        }
    }
}
