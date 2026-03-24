using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CatalogService.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeSpecifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "attribute_id",
                table: "category_filter_attributes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "specification_attributes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    key = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    display_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    value_type = table.Column<int>(type: "integer", nullable: false),
                    is_multi_value = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_specification_attributes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "specification_canonical_values",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    attribute_id = table.Column<Guid>(type: "uuid", nullable: false),
                    value_text = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_specification_canonical_values", x => x.id);
                    table.ForeignKey(
                        name: "FK_specification_canonical_values_specification_attributes_att~",
                        column: x => x.attribute_id,
                        principalTable: "specification_attributes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "product_specification_values",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    attribute_id = table.Column<Guid>(type: "uuid", nullable: false),
                    canonical_value_id = table.Column<Guid>(type: "uuid", nullable: true),
                    value_number = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_specification_values", x => x.id);
                    table.ForeignKey(
                        name: "FK_product_specification_values_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_product_specification_values_specification_attributes_attri~",
                        column: x => x.attribute_id,
                        principalTable: "specification_attributes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_product_specification_values_specification_canonical_values~",
                        column: x => x.canonical_value_id,
                        principalTable: "specification_canonical_values",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000001"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000002"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000002"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000003"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000003"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000001"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000004"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000004"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000005"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000001"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000006"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000005"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000007"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000006"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000008"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000007"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000009"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000007"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000000a"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000008"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000000b"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000009"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000000c"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-00000000000a"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000000d"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-00000000000b"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000000e"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000006"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000000f"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000001"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000010"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-00000000000c"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000011"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-00000000000d"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000012"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-00000000000e"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000013"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-00000000000f"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000014"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000006"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000015"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000010"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000016"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000006"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000017"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000019"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000018"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-00000000000b"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000019"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000006"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000001a"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000019"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000001b"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000011"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000001c"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000012"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000001d"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000006"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000001e"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000019"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000001f"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-00000000000b"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000020"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000002"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000021"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000003"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000022"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-00000000001c"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000023"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000002"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000024"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-00000000001b"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000025"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-00000000001d"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000026"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-00000000001e"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000027"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-00000000001f"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000028"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000019"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000029"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000020"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000002a"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000021"));

            migrationBuilder.UpdateData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000002b"),
                column: "attribute_id",
                value: new Guid("40000000-0000-0000-0000-000000000022"));

            migrationBuilder.InsertData(
                table: "specification_attributes",
                columns: new[] { "id", "display_name", "is_multi_value", "key", "value_type" },
                values: new object[,]
                {
                    { new Guid("40000000-0000-0000-0000-000000000001"), "Сокет", true, "socket", 0 },
                    { new Guid("40000000-0000-0000-0000-000000000002"), "Объём видеопамяти", false, "vram", 0 },
                    { new Guid("40000000-0000-0000-0000-000000000003"), "Серия GPU", false, "gpu", 0 },
                    { new Guid("40000000-0000-0000-0000-000000000004"), "Количество ядер", false, "cores", 1 },
                    { new Guid("40000000-0000-0000-0000-000000000005"), "Чипсет", false, "chipset", 0 },
                    { new Guid("40000000-0000-0000-0000-000000000006"), "Тип", false, "type", 0 },
                    { new Guid("40000000-0000-0000-0000-000000000007"), "Объём", false, "capacity", 0 },
                    { new Guid("40000000-0000-0000-0000-000000000008"), "Мощность", false, "wattage", 0 },
                    { new Guid("40000000-0000-0000-0000-000000000009"), "Сертификат", false, "efficiency", 0 },
                    { new Guid("40000000-0000-0000-0000-00000000000a"), "Форм-фактор", true, "form_factor", 0 },
                    { new Guid("40000000-0000-0000-0000-00000000000b"), "Цвет", false, "color", 0 },
                    { new Guid("40000000-0000-0000-0000-00000000000c"), "TDP", false, "tdp", 1 },
                    { new Guid("40000000-0000-0000-0000-00000000000d"), "Диагональ", false, "diagonal", 0 },
                    { new Guid("40000000-0000-0000-0000-00000000000e"), "Разрешение", false, "resolution", 0 },
                    { new Guid("40000000-0000-0000-0000-00000000000f"), "Частота обновления", false, "refresh_rate", 0 },
                    { new Guid("40000000-0000-0000-0000-000000000010"), "Подключение", false, "connection", 0 },
                    { new Guid("40000000-0000-0000-0000-000000000011"), "DPI", false, "dpi", 1 },
                    { new Guid("40000000-0000-0000-0000-000000000012"), "Тип сенсора", false, "sensor_type", 0 },
                    { new Guid("40000000-0000-0000-0000-000000000013"), "Тип памяти", true, "memory_type", 0 },
                    { new Guid("40000000-0000-0000-0000-000000000014"), "Потоков", false, "threads", 1 },
                    { new Guid("40000000-0000-0000-0000-000000000015"), "Встроенная графика", false, "integrated_graphics", 0 },
                    { new Guid("40000000-0000-0000-0000-000000000016"), "Модульный", false, "modular", 0 },
                    { new Guid("40000000-0000-0000-0000-000000000017"), "Слотов памяти", false, "memory_slots", 1 },
                    { new Guid("40000000-0000-0000-0000-000000000018"), "Макс. память", false, "max_memory", 0 },
                    { new Guid("40000000-0000-0000-0000-000000000019"), "Интерфейс", false, "interface", 0 },
                    { new Guid("40000000-0000-0000-0000-00000000001a"), "Год выхода", false, "release_year", 0 },
                    { new Guid("40000000-0000-0000-0000-00000000001b"), "Дата выхода (legacy)", false, "data_vykhoda_na_rynok_2", 0 },
                    { new Guid("40000000-0000-0000-0000-00000000001c"), "Производитель ГП", false, "proizvoditel_graficheskogo_protsessora", 0 },
                    { new Guid("40000000-0000-0000-0000-00000000001d"), "Ширина шины памяти", false, "shirina_shiny_pamyati", 1 },
                    { new Guid("40000000-0000-0000-0000-00000000001e"), "Охлаждение", false, "okhlazhdenie_1", 0 },
                    { new Guid("40000000-0000-0000-0000-00000000001f"), "Разъёмы питания", false, "razyemy_pitaniya", 0 },
                    { new Guid("40000000-0000-0000-0000-000000000020"), "Рек. БП, Вт", false, "rekomenduemyy_blok_pitaniya", 1 },
                    { new Guid("40000000-0000-0000-0000-000000000021"), "Длина видеокарты", false, "dlina_videokarty", 1 },
                    { new Guid("40000000-0000-0000-0000-000000000022"), "Высота видеокарты", false, "vysota_videokarty", 1 }
                });

            migrationBuilder.InsertData(
                table: "specification_canonical_values",
                columns: new[] { "id", "attribute_id", "sort_order", "value_text" },
                values: new object[,]
                {
                    { new Guid("50000000-0000-0000-0000-000000000001"), new Guid("40000000-0000-0000-0000-000000000001"), 1, "AM4" },
                    { new Guid("50000000-0000-0000-0000-000000000002"), new Guid("40000000-0000-0000-0000-000000000001"), 2, "AM5" },
                    { new Guid("50000000-0000-0000-0000-000000000003"), new Guid("40000000-0000-0000-0000-000000000001"), 3, "LGA1700" },
                    { new Guid("50000000-0000-0000-0000-000000000004"), new Guid("40000000-0000-0000-0000-000000000002"), 1, "8GB GDDR6" },
                    { new Guid("50000000-0000-0000-0000-000000000005"), new Guid("40000000-0000-0000-0000-000000000002"), 2, "12GB GDDR6X" },
                    { new Guid("50000000-0000-0000-0000-000000000006"), new Guid("40000000-0000-0000-0000-000000000002"), 3, "16GB GDDR6" },
                    { new Guid("50000000-0000-0000-0000-000000000007"), new Guid("40000000-0000-0000-0000-000000000002"), 4, "8GB" },
                    { new Guid("50000000-0000-0000-0000-000000000008"), new Guid("40000000-0000-0000-0000-000000000002"), 5, "12GB" },
                    { new Guid("50000000-0000-0000-0000-000000000009"), new Guid("40000000-0000-0000-0000-000000000002"), 6, "16GB" },
                    { new Guid("50000000-0000-0000-0000-000000000010"), new Guid("40000000-0000-0000-0000-000000000003"), 1, "NVIDIA GeForce RTX 4070 SUPER" },
                    { new Guid("50000000-0000-0000-0000-000000000011"), new Guid("40000000-0000-0000-0000-000000000003"), 2, "AMD Radeon RX 7800 XT" },
                    { new Guid("50000000-0000-0000-0000-000000000012"), new Guid("40000000-0000-0000-0000-000000000003"), 3, "GeForce RTX 4070 SUPER" },
                    { new Guid("50000000-0000-0000-0000-000000000013"), new Guid("40000000-0000-0000-0000-000000000003"), 4, "Radeon RX 7800 XT" },
                    { new Guid("50000000-0000-0000-0000-000000000014"), new Guid("40000000-0000-0000-0000-000000000005"), 1, "B650" },
                    { new Guid("50000000-0000-0000-0000-000000000015"), new Guid("40000000-0000-0000-0000-000000000005"), 2, "Z790" },
                    { new Guid("50000000-0000-0000-0000-000000000016"), new Guid("40000000-0000-0000-0000-000000000006"), 1, "DDR5" },
                    { new Guid("50000000-0000-0000-0000-000000000017"), new Guid("40000000-0000-0000-0000-000000000006"), 2, "DDR4" },
                    { new Guid("50000000-0000-0000-0000-000000000018"), new Guid("40000000-0000-0000-0000-000000000007"), 1, "32GB" },
                    { new Guid("50000000-0000-0000-0000-000000000019"), new Guid("40000000-0000-0000-0000-000000000007"), 2, "16GB" },
                    { new Guid("50000000-0000-0000-0000-000000000020"), new Guid("40000000-0000-0000-0000-000000000007"), 3, "64GB" },
                    { new Guid("50000000-0000-0000-0000-000000000021"), new Guid("40000000-0000-0000-0000-000000000007"), 4, "128GB" },
                    { new Guid("50000000-0000-0000-0000-000000000022"), new Guid("40000000-0000-0000-0000-000000000008"), 1, "750W" },
                    { new Guid("50000000-0000-0000-0000-000000000023"), new Guid("40000000-0000-0000-0000-000000000008"), 2, "850W" },
                    { new Guid("50000000-0000-0000-0000-000000000024"), new Guid("40000000-0000-0000-0000-000000000008"), 3, "650W" },
                    { new Guid("50000000-0000-0000-0000-000000000025"), new Guid("40000000-0000-0000-0000-000000000008"), 4, "700W" },
                    { new Guid("50000000-0000-0000-0000-000000000026"), new Guid("40000000-0000-0000-0000-000000000009"), 1, "80+ Gold" },
                    { new Guid("50000000-0000-0000-0000-000000000027"), new Guid("40000000-0000-0000-0000-000000000009"), 2, "80+ Bronze" },
                    { new Guid("50000000-0000-0000-0000-000000000028"), new Guid("40000000-0000-0000-0000-000000000009"), 3, "80+ Platinum" },
                    { new Guid("50000000-0000-0000-0000-000000000029"), new Guid("40000000-0000-0000-0000-000000000009"), 4, "80+" },
                    { new Guid("50000000-0000-0000-0000-000000000030"), new Guid("40000000-0000-0000-0000-00000000000a"), 1, "ATX" },
                    { new Guid("50000000-0000-0000-0000-000000000031"), new Guid("40000000-0000-0000-0000-00000000000a"), 2, "mATX" },
                    { new Guid("50000000-0000-0000-0000-000000000032"), new Guid("40000000-0000-0000-0000-00000000000a"), 3, "Mini-ITX" },
                    { new Guid("50000000-0000-0000-0000-000000000033"), new Guid("40000000-0000-0000-0000-00000000000a"), 4, "eATX (до 280 мм)" },
                    { new Guid("50000000-0000-0000-0000-000000000034"), new Guid("40000000-0000-0000-0000-000000000016"), 1, "Полностью модульный" },
                    { new Guid("50000000-0000-0000-0000-000000000035"), new Guid("40000000-0000-0000-0000-000000000016"), 2, "Полумодульный" },
                    { new Guid("50000000-0000-0000-0000-000000000036"), new Guid("40000000-0000-0000-0000-000000000016"), 3, "Нет" },
                    { new Guid("50000000-0000-0000-0000-000000000037"), new Guid("40000000-0000-0000-0000-000000000016"), 4, "Full" },
                    { new Guid("50000000-0000-0000-0000-000000000038"), new Guid("40000000-0000-0000-0000-000000000016"), 5, "Semi" },
                    { new Guid("50000000-0000-0000-0000-000000000039"), new Guid("40000000-0000-0000-0000-000000000018"), 1, "128GB" },
                    { new Guid("50000000-0000-0000-0000-000000000040"), new Guid("40000000-0000-0000-0000-000000000018"), 2, "64GB" },
                    { new Guid("50000000-0000-0000-0000-000000000041"), new Guid("40000000-0000-0000-0000-000000000015"), 1, "Есть" },
                    { new Guid("50000000-0000-0000-0000-000000000042"), new Guid("40000000-0000-0000-0000-000000000015"), 2, "Нет" },
                    { new Guid("50000000-0000-0000-0000-000000000043"), new Guid("40000000-0000-0000-0000-000000000013"), 1, "DDR5" },
                    { new Guid("50000000-0000-0000-0000-000000000044"), new Guid("40000000-0000-0000-0000-000000000013"), 2, "DDR4" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_category_filter_attributes_attribute_id",
                table: "category_filter_attributes",
                column: "attribute_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_specification_values_attribute_id_canonical_value_id",
                table: "product_specification_values",
                columns: new[] { "attribute_id", "canonical_value_id" });

            migrationBuilder.CreateIndex(
                name: "IX_product_specification_values_attribute_id_value_number",
                table: "product_specification_values",
                columns: new[] { "attribute_id", "value_number" });

            migrationBuilder.CreateIndex(
                name: "IX_product_specification_values_canonical_value_id",
                table: "product_specification_values",
                column: "canonical_value_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_specification_values_product_id_attribute_id",
                table: "product_specification_values",
                columns: new[] { "product_id", "attribute_id" });

            migrationBuilder.CreateIndex(
                name: "IX_specification_attributes_key",
                table: "specification_attributes",
                column: "key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_specification_canonical_values_attribute_id_value_text",
                table: "specification_canonical_values",
                columns: new[] { "attribute_id", "value_text" },
                unique: true);

            // Синхронизация attribute_id по attribute_key (XCore-ключи → унифицированные)
            migrationBuilder.Sql(@"
                INSERT INTO specification_attributes (id, key, display_name, value_type, is_multi_value)
                SELECT
                    gen_random_uuid(),
                    cfa.attribute_key,
                    left(max(cfa.display_name), 100),
                    CASE WHEN max(cfa.filter_type) = 1 THEN 1 ELSE 0 END,
                    false
                FROM category_filter_attributes cfa
                LEFT JOIN specification_attributes sa ON sa.key = cfa.attribute_key
                WHERE sa.id IS NULL
                GROUP BY cfa.attribute_key;

                UPDATE category_filter_attributes cfa SET attribute_id = sa.id FROM specification_attributes sa WHERE cfa.attribute_key = sa.key;
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'vram') WHERE cfa.attribute_key = 'videopamyat';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'gpu') WHERE cfa.attribute_key = 'graficheskiy_protsessor';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'data_vykhoda_na_rynok_2') WHERE cfa.attribute_key = 'data_vykhoda_na_rynok_2';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'proizvoditel_graficheskogo_protsessora') WHERE cfa.attribute_key = 'proizvoditel_graficheskogo_protsessora';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'shirina_shiny_pamyati') WHERE cfa.attribute_key = 'shirina_shiny_pamyati';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'okhlazhdenie_1') WHERE cfa.attribute_key = 'okhlazhdenie_1';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'razyemy_pitaniya') WHERE cfa.attribute_key = 'razyemy_pitaniya';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'interface') WHERE cfa.attribute_key = 'interfeys_1';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'rekomenduemyy_blok_pitaniya') WHERE cfa.attribute_key = 'rekomenduemyy_blok_pitaniya';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'dlina_videokarty') WHERE cfa.attribute_key = 'dlina_videokarty';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'vysota_videokarty') WHERE cfa.attribute_key = 'vysota_videokarty';
                UPDATE category_filter_attributes cfa SET attribute_id = (SELECT id FROM specification_attributes WHERE key = 'vram') WHERE cfa.attribute_key = 'tip_videopamyati';
                UPDATE category_filter_attributes cfa SET attribute_id = sa.id
                FROM specification_attributes sa
                WHERE cfa.attribute_id = '00000000-0000-0000-0000-000000000000'::uuid
                  AND sa.key = cfa.attribute_key;
            ");

            migrationBuilder.AddForeignKey(
                name: "FK_category_filter_attributes_specification_attributes_attribu~",
                table: "category_filter_attributes",
                column: "attribute_id",
                principalTable: "specification_attributes",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            // Миграция данных из products.specifications (jsonb) в product_specification_values
            migrationBuilder.Sql(@"
                -- Select-атрибуты (single): точное совпадение + маппинг integrated_graphics, modular
                INSERT INTO product_specification_values (id, product_id, attribute_id, canonical_value_id, value_number)
                SELECT gen_random_uuid(), p.id, sa.id, COALESCE(
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND value_text = trim(j.val) LIMIT 1),
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND lower(trim(j.val)) IN ('true','1') AND value_text = 'Есть' LIMIT 1),
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND lower(trim(j.val)) IN ('false','0') AND value_text = 'Нет' LIMIT 1),
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND lower(trim(j.val)) = 'full' AND value_text IN ('Full','Полностью модульный') LIMIT 1),
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND lower(trim(j.val)) = 'semi' AND value_text IN ('Semi','Полумодульный') LIMIT 1)
                ), NULL
                FROM products p
                CROSS JOIN LATERAL jsonb_each_text(p.specifications) AS j(key, val)
                JOIN specification_attributes sa ON sa.key = j.key AND sa.value_type = 0 AND sa.is_multi_value = false
                WHERE COALESCE(
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND value_text = trim(j.val) LIMIT 1),
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND lower(trim(j.val)) IN ('true','1') AND value_text = 'Есть' LIMIT 1),
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND lower(trim(j.val)) IN ('false','0') AND value_text = 'Нет' LIMIT 1),
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND lower(trim(j.val)) = 'full' AND value_text IN ('Full','Полностью модульный') LIMIT 1),
                    (SELECT id FROM specification_canonical_values WHERE attribute_id = sa.id AND lower(trim(j.val)) = 'semi' AND value_text IN ('Semi','Полумодульный') LIMIT 1)
                ) IS NOT NULL;

                -- Range-атрибуты: извлекаем число
                INSERT INTO product_specification_values (id, product_id, attribute_id, canonical_value_id, value_number)
                SELECT gen_random_uuid(), p.id, sa.id, NULL,
                    (NULLIF(trim(regexp_replace(j.val::text, '[^0-9.]', '', 'g')), ''))::numeric
                FROM products p
                CROSS JOIN LATERAL jsonb_each_text(p.specifications) AS j(key, val)
                JOIN specification_attributes sa ON sa.key = j.key AND sa.value_type = 1
                WHERE trim(regexp_replace(j.val::text, '[^0-9.]', '', 'g')) ~ '^[0-9]+\.?[0-9]*$';

                -- Multi-value select: разбиваем по запятой
                INSERT INTO product_specification_values (id, product_id, attribute_id, canonical_value_id, value_number)
                SELECT gen_random_uuid(), p.id, sa.id, scv.id, NULL
                FROM products p
                CROSS JOIN LATERAL jsonb_each_text(p.specifications) AS j(key, val)
                JOIN specification_attributes sa ON sa.key = j.key AND sa.value_type = 0 AND sa.is_multi_value = true
                CROSS JOIN LATERAL regexp_split_to_table(trim(j.val::text), ',\s*') AS part(val)
                JOIN specification_canonical_values scv ON scv.attribute_id = sa.id AND scv.value_text = trim(part.val)
                WHERE trim(part.val) != '';
            ");

            migrationBuilder.DropColumn(
                name: "specifications",
                table: "products");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_category_filter_attributes_specification_attributes_attribu~",
                table: "category_filter_attributes");

            migrationBuilder.DropTable(
                name: "product_specification_values");

            migrationBuilder.DropTable(
                name: "specification_canonical_values");

            migrationBuilder.DropTable(
                name: "specification_attributes");

            migrationBuilder.DropIndex(
                name: "IX_category_filter_attributes_attribute_id",
                table: "category_filter_attributes");

            migrationBuilder.DropColumn(
                name: "attribute_id",
                table: "category_filter_attributes");

            migrationBuilder.AddColumn<Dictionary<string, object>>(
                name: "specifications",
                table: "products",
                type: "jsonb",
                nullable: false);

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000001"),
                column: "specifications",
                value: new Dictionary<string, object> { ["socket"] = "AM4", ["cores"] = 6, ["threads"] = 12, ["base_clock"] = "3.7 GHz", ["boost_clock"] = "4.6 GHz", ["tdp"] = "65W", ["l3_cache"] = "32MB", ["unlocked"] = true, ["integrated_graphics"] = false });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000002"),
                column: "specifications",
                value: new Dictionary<string, object> { ["socket"] = "AM5", ["cores"] = 8, ["threads"] = 16, ["base_clock"] = "4.2 GHz", ["boost_clock"] = "5.0 GHz", ["tdp"] = "120W", ["l3_cache"] = "104MB", ["unlocked"] = true, ["integrated_graphics"] = true });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000003"),
                column: "specifications",
                value: new Dictionary<string, object> { ["socket"] = "LGA1700", ["cores"] = 14, ["threads"] = 20, ["base_clock"] = "3.5 GHz", ["boost_clock"] = "5.1 GHz", ["tdp"] = "125W", ["l3_cache"] = "24MB", ["unlocked"] = true, ["integrated_graphics"] = false });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000004"),
                column: "specifications",
                value: new Dictionary<string, object> { ["socket"] = "AM5", ["chipset"] = "B650", ["form_factor"] = "ATX", ["memory_slots"] = 4, ["max_memory"] = "128GB", ["memory_type"] = "DDR5", ["pcie_slots"] = "1x PCIe 5.0 x16, 1x PCIe 4.0 x16", ["m2_slots"] = 3, ["usb_ports"] = "8x USB-A, 2x USB-C", ["wifi"] = "WiFi 6", ["lan"] = "2.5G" });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000005"),
                column: "specifications",
                value: new Dictionary<string, object> { ["socket"] = "AM5", ["chipset"] = "B650", ["form_factor"] = "ATX", ["memory_slots"] = 4, ["max_memory"] = "128GB", ["memory_type"] = "DDR5", ["pcie_slots"] = "2x PCIe 4.0 x16", ["m2_slots"] = 4, ["usb_ports"] = "9x USB-A, 1x USB-C", ["wifi"] = "WiFi 6E", ["lan"] = "2.5G" });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000006"),
                column: "specifications",
                value: new Dictionary<string, object> { ["capacity"] = "32GB", ["kit_config"] = "2x16GB", ["type"] = "DDR5", ["speed"] = "5600 MHz", ["cas_latency"] = 36, ["voltage"] = "1.25V", ["heat_spreader"] = true, ["rgb"] = false });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000007"),
                column: "specifications",
                value: new Dictionary<string, object> { ["capacity"] = "32GB", ["kit_config"] = "2x16GB", ["type"] = "DDR5", ["speed"] = "6000 MHz", ["cas_latency"] = 30, ["voltage"] = "1.35V", ["heat_spreader"] = true, ["rgb"] = true });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000008"),
                column: "specifications",
                value: new Dictionary<string, object> { ["gpu"] = "NVIDIA GeForce RTX 4070 SUPER", ["vram"] = "12GB GDDR6X", ["memory_bus"] = "192-bit", ["base_clock"] = "1980 MHz", ["boost_clock"] = "2475 MHz", ["cuda_cores"] = 7168, ["rt_cores"] = 56, ["tdp"] = "220W", ["outputs"] = "3x DisplayPort 1.4a, 1x HDMI 2.1", ["recommended_psu"] = "650W" });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000009"),
                column: "specifications",
                value: new Dictionary<string, object> { ["gpu"] = "AMD Radeon RX 7800 XT", ["vram"] = "16GB GDDR6", ["memory_bus"] = "256-bit", ["base_clock"] = "1295 MHz", ["boost_clock"] = "2430 MHz", ["stream_processors"] = 3840, ["ray_accelerators"] = 60, ["tdp"] = "263W", ["outputs"] = "2x DisplayPort 2.1, 2x HDMI 2.1, 1x USB-C", ["recommended_psu"] = "700W" });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000010"),
                column: "specifications",
                value: new Dictionary<string, object> { ["wattage"] = "750W", ["efficiency"] = "80+ Gold", ["modular"] = "Full", ["fan_size"] = "120mm", ["fan_type"] = "Rifle Bearing", ["atx_version"] = "ATX 3.0", ["pcie_connectors"] = "4x 8-pin (2x 12VHPWR)", ["sata_connectors"] = 8, ["noise_level"] = "10-25 dBA" });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000011"),
                column: "specifications",
                value: new Dictionary<string, object> { ["wattage"] = "850W", ["efficiency"] = "80+ Gold", ["modular"] = "Semi", ["fan_size"] = "135mm", ["fan_type"] = "Silent Wings", ["atx_version"] = "ATX 3.0", ["pcie_connectors"] = "6x 8-pin", ["sata_connectors"] = 6, ["noise_level"] = "5-18 dBA" });

            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "id",
                keyValue: new Guid("20000000-0000-0000-0000-000000000012"),
                column: "specifications",
                value: new Dictionary<string, object> { ["wattage"] = "850W", ["efficiency"] = "80+ Gold", ["modular"] = "Full", ["fan_size"] = "120mm", ["fan_type"] = "Fluid Dynamic Bearing", ["atx_version"] = "ATX 3.0", ["pcie_connectors"] = "6x 8-pin", ["sata_connectors"] = 8, ["noise_level"] = "8-22 dBA" });
        }
    }
}
