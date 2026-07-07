using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GoldPC.ServicesService.Migrations
{
    /// <inheritdoc />
    public partial class FixAssemblyPartsMissingColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "created_at",
                table: "assembly_parts",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                table: "assembly_parts",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "created_at",
                table: "assembly_parts");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "assembly_parts");
        }
    }
}
