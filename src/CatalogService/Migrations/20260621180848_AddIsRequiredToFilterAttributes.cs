using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CatalogService.Migrations
{
    /// <inheritdoc />
    public partial class AddIsRequiredToFilterAttributes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsMultiValue",
                table: "category_filter_attributes",
                newName: "is_multi_value");

            migrationBuilder.AddColumn<string>(
                name: "group_name",
                table: "specification_attributes",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_required",
                table: "specification_attributes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "sort_order",
                table: "specification_attributes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "unit",
                table: "specification_attributes",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "validation_max",
                table: "specification_attributes",
                type: "numeric(18,4)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "validation_min",
                table: "specification_attributes",
                type: "numeric(18,4)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "validation_step",
                table: "specification_attributes",
                type: "numeric(18,4)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_required",
                table: "category_filter_attributes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "price_history",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    old_price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    changed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    changed_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_price_history", x => x.id);
                    table.ForeignKey(
                        name: "FK_price_history_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000001"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000002"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000003"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000004"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000005"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000006"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000007"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000008"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000009"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000000a"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000011"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000012"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000013"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000014"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000015"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000016"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000017"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000018"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000019"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000001a"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000001b"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000001c"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000001d"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000001e"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000001f"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000020"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000021"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000022"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000023"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000024"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000025"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000026"),
                column: "is_required",
                value: false);

            migrationBuilder.UpdateData(
                table: "product_specification_values",
                keyColumn: "id",
                keyValue: new Guid("60000000-0000-0000-0000-00000000000a"),
                column: "canonical_value_id",
                value: new Guid("50000000-0000-0000-0000-000000000026"));

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000001"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000002"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000003"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000004"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000005"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000006"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000007"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000008"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000009"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-00000000000a"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-00000000000b"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-00000000000c"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-00000000000d"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-00000000000e"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-00000000000f"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000010"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000011"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000012"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000013"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000014"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000015"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000016"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000017"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000018"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000019"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000021"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000022"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000023"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000024"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.UpdateData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000025"),
                columns: new[] { "group_name", "is_required", "sort_order", "unit", "validation_max", "validation_min", "validation_step" },
                values: new object[] { null, false, 0, null, null, null, null });

            migrationBuilder.InsertData(
                table: "specification_attributes",
                columns: new[] { "id", "display_name", "group_name", "is_multi_value", "is_required", "key", "sort_order", "unit", "validation_max", "validation_min", "validation_step", "value_type" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000026"), "Форм-фактор памяти", null, false, false, "memory_form_factor", 0, null, null, null, null, 0 });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000042"),
                columns: new[] { "attribute_id", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000026"), "DIMM" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000043"),
                columns: new[] { "attribute_id", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000026"), "SO-DIMM" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000044"),
                columns: new[] { "attribute_id", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000023"), "Воздушный" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000045"),
                columns: new[] { "attribute_id", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000023"), "Жидкостный" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000046"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 1, "AM4" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000047"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000024"), 2, "AM5" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000048"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000024"), 3, "LGA1700" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000049"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 1, "150W" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000050"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 2, "200W" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000051"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000025"), 3, "250W" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000052"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000025"), 4, "300W" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000053"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000007"), 5, "1TB" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000054"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000007"), 6, "2TB" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000055"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 1, "NVMe PCIe 4.0" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000056"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 2, "NVMe PCIe 3.0" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000057"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 3, "SATA III" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000058"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 4, "USB Type-C" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000059"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 5, "USB Type-A" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000060"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000019"), 6, "Bluetooth" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000061"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000019"), 7, "3.5 мм" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000062"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-00000000000b"), 1, "Черный" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000063"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-00000000000b"), 2, "Белый" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000064"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 3, "Механическая" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000065"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 4, "Мембранная" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000066"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 5, "Игровая" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000067"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 6, "Офисная" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000068"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000006"), 7, "Полноразмерные" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000069"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000006"), 8, "Вкладыши" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000070"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 1, "27\"" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000071"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-00000000000d"), 2, "32\"" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000072"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-00000000000d"), 3, "24\"" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000073"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 1, "1920x1080 (Full HD)" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000074"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-00000000000e"), 2, "2560x1440 (QHD)" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000075"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-00000000000e"), 3, "3840x2160 (4K UHD)" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000076"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 1, "144 Гц" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000077"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-00000000000f"), 2, "165 Гц" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000078"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-00000000000f"), 3, "60 Гц" });

            migrationBuilder.InsertData(
                table: "specification_canonical_values",
                columns: new[] { "id", "attribute_id", "sort_order", "value_text" },
                values: new object[,]
                {
                    { new Guid("50000000-0000-0000-0000-000000000079"), new Guid("40000000-0000-0000-0000-000000000012"), 1, "Оптический" },
                    { new Guid("50000000-0000-0000-0000-000000000080"), new Guid("40000000-0000-0000-0000-000000000012"), 2, "Лазерный" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_price_history_changed_at",
                table: "price_history",
                column: "changed_at");

            migrationBuilder.CreateIndex(
                name: "IX_price_history_product_id",
                table: "price_history",
                column: "product_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "price_history");

            migrationBuilder.DeleteData(
                table: "specification_attributes",
                keyColumn: "id",
                keyValue: new Guid("40000000-0000-0000-0000-000000000026"));

            migrationBuilder.DeleteData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000079"));

            migrationBuilder.DeleteData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000080"));

            migrationBuilder.DropColumn(
                name: "group_name",
                table: "specification_attributes");

            migrationBuilder.DropColumn(
                name: "is_required",
                table: "specification_attributes");

            migrationBuilder.DropColumn(
                name: "sort_order",
                table: "specification_attributes");

            migrationBuilder.DropColumn(
                name: "unit",
                table: "specification_attributes");

            migrationBuilder.DropColumn(
                name: "validation_max",
                table: "specification_attributes");

            migrationBuilder.DropColumn(
                name: "validation_min",
                table: "specification_attributes");

            migrationBuilder.DropColumn(
                name: "validation_step",
                table: "specification_attributes");

            migrationBuilder.DropColumn(
                name: "is_required",
                table: "category_filter_attributes");

            migrationBuilder.RenameColumn(
                name: "is_multi_value",
                table: "category_filter_attributes",
                newName: "IsMultiValue");

            migrationBuilder.UpdateData(
                table: "product_specification_values",
                keyColumn: "id",
                keyValue: new Guid("60000000-0000-0000-0000-00000000000a"),
                column: "canonical_value_id",
                value: new Guid("50000000-0000-0000-0000-000000000027"));

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000042"),
                columns: new[] { "attribute_id", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000023"), "Воздушный" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000043"),
                columns: new[] { "attribute_id", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000023"), "Жидкостный" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000044"),
                columns: new[] { "attribute_id", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000024"), "AM4" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000045"),
                columns: new[] { "attribute_id", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000024"), "AM5" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000046"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 3, "LGA1700" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000047"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000025"), 1, "150W" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000048"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000025"), 2, "200W" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000049"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 3, "250W" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000050"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 4, "300W" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000051"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000007"), 5, "1TB" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000052"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000007"), 6, "2TB" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000053"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000019"), 1, "NVMe PCIe 4.0" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000054"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000019"), 2, "NVMe PCIe 3.0" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000055"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 3, "SATA III" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000056"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 4, "USB Type-C" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000057"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 5, "USB Type-A" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000058"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 6, "Bluetooth" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000059"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 7, "3.5 мм" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000060"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-00000000000b"), 1, "Черный" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000061"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-00000000000b"), 2, "Белый" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000062"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000006"), 3, "Механическая" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000063"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000006"), 4, "Мембранная" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000064"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 5, "Игровая" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000065"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 6, "Офисная" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000066"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 7, "Полноразмерные" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000067"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 8, "Вкладыши" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000068"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-00000000000d"), 1, "27\"" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000069"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-00000000000d"), 2, "32\"" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000070"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 3, "24\"" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000071"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-00000000000e"), 1, "1920x1080 (Full HD)" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000072"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-00000000000e"), 2, "2560x1440 (QHD)" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000073"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 3, "3840x2160 (4K UHD)" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000074"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-00000000000f"), 1, "144 Гц" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000075"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-00000000000f"), 2, "165 Гц" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000076"),
                columns: new[] { "sort_order", "value_text" },
                values: new object[] { 3, "60 Гц" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000077"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000012"), 1, "Оптический" });

            migrationBuilder.UpdateData(
                table: "specification_canonical_values",
                keyColumn: "id",
                keyValue: new Guid("50000000-0000-0000-0000-000000000078"),
                columns: new[] { "attribute_id", "sort_order", "value_text" },
                values: new object[] { new Guid("40000000-0000-0000-0000-000000000012"), 2, "Лазерный" });
        }
    }
}
