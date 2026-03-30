using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GoldPC.OrdersService.Migrations
{
    /// <inheritdoc />
    public partial class AddPromoCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "promo_codes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DiscountPercent = table.Column<int>(type: "integer", nullable: false),
                    MinOrderAmount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    ValidFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ValidTo = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MaxUses = table.Column<int>(type: "integer", nullable: true),
                    UsedCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_promo_codes", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_promo_codes_Code",
                table: "promo_codes",
                column: "Code",
                unique: true);

            // Seed initial promo codes for testing
            migrationBuilder.InsertData(
                table: "promo_codes",
                columns: new[] { "Id", "Code", "DiscountPercent", "MinOrderAmount", "ValidFrom", "ValidTo", "MaxUses", "UsedCount", "IsActive", "Description", "CreatedAt", "UpdatedAt" },
                values: new object[,]
                {
                    { Guid.NewGuid(), "GOLDPC", 5, null, null, null, null, 0, true, "Скидка 5% на любой заказ", DateTime.UtcNow, null },
                    { Guid.NewGuid(), "GOLDPC10", 10, 500m, null, null, null, 0, true, "Скидка 10% при заказе от 500 BYN", DateTime.UtcNow, null },
                    { Guid.NewGuid(), "SAVE15", 15, 1000m, null, null, 100, 0, true, "Скидка 15% при заказе от 1000 BYN (лимит 100 использований)", DateTime.UtcNow, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "promo_codes");
        }
    }
}
