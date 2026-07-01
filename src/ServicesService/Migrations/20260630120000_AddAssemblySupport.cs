using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GoldPC.ServicesService.Migrations
{
    /// <inheritdoc />
    public partial class AddAssemblySupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add assembly fields to service_requests
            migrationBuilder.AddColumn<Guid>(
                name: "order_id",
                table: "service_requests",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "pc_configuration_id",
                table: "service_requests",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "client_phone",
                table: "service_requests",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "courier_id",
                table: "service_requests",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "assembled_serial_number",
                table: "service_requests",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            // Create assembly_parts table
            migrationBuilder.CreateTable(
                name: "assembly_parts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    service_request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    component_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    part_status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assembly_parts", x => x.id);
                    table.ForeignKey(
                        name: "fk_assembly_parts_service_request",
                        column: x => x.service_request_id,
                        principalTable: "service_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_assembly_parts_service_request_id",
                table: "assembly_parts",
                column: "service_request_id");

            // Create assembled_units table
            migrationBuilder.CreateTable(
                name: "assembled_units",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    service_request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    pc_configuration_id = table.Column<Guid>(type: "uuid", nullable: false),
                    serial_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    assembled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    delivered_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assembled_units", x => x.id);
                    table.ForeignKey(
                        name: "fk_assembled_units_service_request",
                        column: x => x.service_request_id,
                        principalTable: "service_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_assembled_units_service_request_id",
                table: "assembled_units",
                column: "service_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_assembled_units_serial_number",
                table: "assembled_units",
                column: "serial_number",
                unique: true);

            // Update assembly service type price to 100 BYN
            migrationBuilder.UpdateData(
                table: "service_types",
                keyColumn: "id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000005"),
                column: "base_price",
                value: 100.00m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "order_id",
                table: "service_requests");

            migrationBuilder.DropColumn(
                name: "pc_configuration_id",
                table: "service_requests");

            migrationBuilder.DropColumn(
                name: "client_phone",
                table: "service_requests");

            migrationBuilder.DropColumn(
                name: "courier_id",
                table: "service_requests");

            migrationBuilder.DropColumn(
                name: "assembled_serial_number",
                table: "service_requests");

            migrationBuilder.DropTable(
                name: "assembly_parts");

            migrationBuilder.DropTable(
                name: "assembled_units");

            // Revert assembly service type price to 50 BYN
            migrationBuilder.UpdateData(
                table: "service_types",
                keyColumn: "id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000005"),
                column: "base_price",
                value: 50.00m);
        }
    }
}
