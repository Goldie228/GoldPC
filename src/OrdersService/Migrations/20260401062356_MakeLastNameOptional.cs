using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GoldPC.OrdersService.Migrations
{
    /// <inheritdoc />
    public partial class MakeLastNameOptional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE orders
                ADD COLUMN IF NOT EXISTS "CustomerLastName" character varying(100);
                """);

            migrationBuilder.Sql(
                """
                ALTER TABLE orders
                ALTER COLUMN "CustomerLastName" DROP NOT NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE orders
                ADD COLUMN IF NOT EXISTS "CustomerLastName" character varying(100);
                """);

            migrationBuilder.Sql(
                """
                UPDATE orders
                SET "CustomerLastName" = ''
                WHERE "CustomerLastName" IS NULL;
                """);

            migrationBuilder.Sql(
                """
                ALTER TABLE orders
                ALTER COLUMN "CustomerLastName" SET NOT NULL;
                """);
        }
    }
}
