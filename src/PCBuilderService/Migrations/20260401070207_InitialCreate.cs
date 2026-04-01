using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PCBuilderService.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "pc_configurations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    purpose = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    processor_id = table.Column<Guid>(type: "uuid", nullable: true),
                    motherboard_id = table.Column<Guid>(type: "uuid", nullable: true),
                    ram_id = table.Column<Guid>(type: "uuid", nullable: true),
                    gpu_id = table.Column<Guid>(type: "uuid", nullable: true),
                    psu_id = table.Column<Guid>(type: "uuid", nullable: true),
                    storage_id = table.Column<Guid>(type: "uuid", nullable: true),
                    case_id = table.Column<Guid>(type: "uuid", nullable: true),
                    cooler_id = table.Column<Guid>(type: "uuid", nullable: true),
                    total_price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    total_power = table.Column<int>(type: "integer", nullable: false),
                    is_compatible = table.Column<bool>(type: "boolean", nullable: false),
                    share_token = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pc_configurations", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_pc_configurations_share_token",
                table: "pc_configurations",
                column: "share_token",
                filter: "share_token IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_pc_configurations_user_id",
                table: "pc_configurations",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "pc_configurations");
        }
    }
}
