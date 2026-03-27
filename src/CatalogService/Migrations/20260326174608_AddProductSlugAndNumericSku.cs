using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CatalogService.Migrations
{
    /// <inheritdoc />
    public partial class AddProductSlugAndNumericSku : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "slug",
                table: "products",
                type: "character varying(220)",
                maxLength: 220,
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE products
                SET slug = CASE
                    WHEN NULLIF(TRIM(REGEXP_REPLACE(LOWER(sku), '[^a-z0-9]+', '_', 'g')), '') IS NULL
                        THEN 'product_' || REPLACE(id::text, '-', '')
                    ELSE TRIM(BOTH '_' FROM REGEXP_REPLACE(LOWER(sku), '[^a-z0-9]+', '_', 'g'))
                END
                WHERE slug IS NULL;
                """);

            migrationBuilder.Sql(
                """
                WITH ranked AS (
                    SELECT
                        id,
                        slug,
                        ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) AS rn
                    FROM products
                )
                UPDATE products p
                SET slug = CASE
                    WHEN r.rn = 1 THEN p.slug
                    ELSE LEFT(p.slug, 210) || '_' || r.rn::text
                END
                FROM ranked r
                WHERE p.id = r.id;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "slug",
                table: "products",
                type: "character varying(220)",
                maxLength: 220,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(220)",
                oldMaxLength: 220,
                oldNullable: true);

            migrationBuilder.Sql(
                """
                WITH ordered AS (
                    SELECT id, ROW_NUMBER() OVER (ORDER BY RANDOM()) AS rn
                    FROM products
                )
                UPDATE products p
                SET sku = (1000000000 + o.rn)::text
                FROM ordered o
                WHERE p.id = o.id;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_products_slug",
                table: "products",
                column: "slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_products_slug",
                table: "products");

            migrationBuilder.DropColumn(
                name: "slug",
                table: "products");
        }
    }
}
