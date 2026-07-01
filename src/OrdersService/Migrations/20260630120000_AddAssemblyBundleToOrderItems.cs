using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GoldPC.OrdersService.Migrations
{
    /// <inheritdoc />
    public partial class AddAssemblyBundleToOrderItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "item_type",
                table: "order_items",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Product");

            migrationBuilder.AddColumn<Guid>(
                name: "pc_configuration_id",
                table: "order_items",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "assembly_fee",
                table: "order_items",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "item_type",
                table: "order_items");

            migrationBuilder.DropColumn(
                name: "pc_configuration_id",
                table: "order_items");

            migrationBuilder.DropColumn(
                name: "assembly_fee",
                table: "order_items");
        }
    }
}
