using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CatalogService.Migrations
{
    /// <inheritdoc />
    public partial class AddProductLegalInfoFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "importer",
                table: "products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "manufacturer_address",
                table: "products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "production_address",
                table: "products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "service_support",
                table: "products",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000001"),
                columns: new[] { "importer", "manufacturer_address", "production_address", "service_support" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000002"),
                columns: new[] { "importer", "manufacturer_address", "production_address", "service_support" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000003"),
                columns: new[] { "importer", "manufacturer_address", "production_address", "service_support" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000004"),
                columns: new[] { "importer", "manufacturer_address", "production_address", "service_support" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000005"),
                columns: new[] { "importer", "manufacturer_address", "production_address", "service_support" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000006"),
                columns: new[] { "importer", "manufacturer_address", "production_address", "service_support" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000007"),
                columns: new[] { "importer", "manufacturer_address", "production_address", "service_support" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000008"),
                columns: new[] { "importer", "manufacturer_address", "production_address", "service_support" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000009"),
                columns: new[] { "importer", "manufacturer_address", "production_address", "service_support" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000010"),
                columns: new[] { "importer", "manufacturer_address", "production_address", "service_support" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000011"),
                columns: new[] { "importer", "manufacturer_address", "production_address", "service_support" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000012"),
                columns: new[] { "importer", "manufacturer_address", "production_address", "service_support" },
                values: new object[] { null, null, null, null });

            migrationBuilder.CreateIndex(
                name: "IX_products_is_active_price",
                table: "products",
                columns: new[] { "is_active", "price" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_products_is_active_price",
                table: "products");

            migrationBuilder.DropColumn(
                name: "importer",
                table: "products");

            migrationBuilder.DropColumn(
                name: "manufacturer_address",
                table: "products");

            migrationBuilder.DropColumn(
                name: "production_address",
                table: "products");

            migrationBuilder.DropColumn(
                name: "service_support",
                table: "products");
        }
    }
}
