using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GoldPC.ReportingService.Migrations
{
    /// <summary>
    /// Импорт таблицы service_types через postgres_fdw для отчётов по услугам СЦ
    /// </summary>
    public partial class ImportServiceTypesFdw : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Импорт таблицы service_types из services_db через FDW
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_foreign_table 
                        WHERE ftrelname = 'service_types'
                    ) THEN
                        IMPORT FOREIGN SCHEMA public 
                        LIMIT TO (service_types) 
                        FROM SERVER services_server 
                        INTO fdw_services;
                    END IF;
                END $$;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Откат: удаляем импортированнуюforeign таблицу
            migrationBuilder.Sql("DROP FOREIGN TABLE IF EXISTS fdw_services.service_types;");
        }
    }
}
