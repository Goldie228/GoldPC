using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CatalogService.Migrations
{
    /// <inheritdoc />
    public partial class SeedProductsData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "categories",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    parent_id = table.Column<Guid>(type: "uuid", nullable: true),
                    Icon = table.Column<string>(type: "text", nullable: true),
                    component_type = table.Column<int>(type: "integer", nullable: true),
                    Order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_categories", x => x.id);
                    table.ForeignKey(
                        name: "FK_categories_categories_parent_id",
                        column: x => x.parent_id,
                        principalTable: "categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "manufacturers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    country = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    logo_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_manufacturers", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "products",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    sku = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    ManufacturerId = table.Column<Guid>(type: "uuid", nullable: true),
                    price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    OldPrice = table.Column<decimal>(type: "numeric", nullable: true),
                    stock = table.Column<int>(type: "integer", nullable: false),
                    specifications = table.Column<Dictionary<string, object>>(type: "jsonb", nullable: false),
                    warranty_months = table.Column<int>(type: "integer", nullable: false),
                    rating = table.Column<double>(type: "double precision", precision: 3, scale: 2, nullable: false),
                    review_count = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    IsFeatured = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_products", x => x.id);
                    table.ForeignKey(
                        name: "FK_products_categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_products_manufacturers_ManufacturerId",
                        column: x => x.ManufacturerId,
                        principalTable: "manufacturers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "product_images",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    alt_text = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    is_primary = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_images", x => x.id);
                    table.ForeignKey(
                        name: "FK_product_images_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "reviews",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    rating = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: true),
                    comment = table.Column<string>(type: "text", nullable: true),
                    pros = table.Column<string>(type: "text", nullable: true),
                    cons = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_verified = table.Column<bool>(type: "boolean", nullable: false),
                    IsApproved = table.Column<bool>(type: "boolean", nullable: false),
                    Helpful = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reviews", x => x.id);
                    table.ForeignKey(
                        name: "FK_reviews_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "categories",
                columns: new[] { "id", "component_type", "description", "Icon", "name", "Order", "parent_id", "slug" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0000-000000000001"), 1, null, null, "Процессоры", 0, null, "processors" },
                    { new Guid("00000000-0000-0000-0000-000000000002"), 2, null, null, "Материнские платы", 0, null, "motherboards" },
                    { new Guid("00000000-0000-0000-0000-000000000003"), 3, null, null, "Оперативная память", 0, null, "ram" },
                    { new Guid("00000000-0000-0000-0000-000000000004"), 4, null, null, "Видеокарты", 0, null, "gpu" },
                    { new Guid("00000000-0000-0000-0000-000000000005"), 5, null, null, "Блоки питания", 0, null, "psu" },
                    { new Guid("00000000-0000-0000-0000-000000000006"), 6, null, null, "Накопители", 0, null, "storage" },
                    { new Guid("00000000-0000-0000-0000-000000000007"), 7, null, null, "Корпуса", 0, null, "cases" },
                    { new Guid("00000000-0000-0000-0000-000000000008"), 8, null, null, "Системы охлаждения", 0, null, "coolers" },
                    { new Guid("00000000-0000-0000-0000-000000000009"), 9, null, null, "Периферия", 0, null, "periphery" }
                });

            migrationBuilder.InsertData(
                table: "manufacturers",
                columns: new[] { "id", "country", "description", "logo_url", "name" },
                values: new object[,]
                {
                    { new Guid("10000000-0000-0000-0000-000000000001"), "USA", null, null, "Intel" },
                    { new Guid("10000000-0000-0000-0000-000000000002"), "USA", null, null, "AMD" },
                    { new Guid("10000000-0000-0000-0000-000000000003"), "Taiwan", null, null, "ASUS" },
                    { new Guid("10000000-0000-0000-0000-000000000004"), "Taiwan", null, null, "MSI" },
                    { new Guid("10000000-0000-0000-0000-000000000005"), "Taiwan", null, null, "Gigabyte" },
                    { new Guid("10000000-0000-0000-0000-000000000006"), "Taiwan", null, null, "ASRock" },
                    { new Guid("10000000-0000-0000-0000-000000000007"), "USA", null, null, "NVIDIA" },
                    { new Guid("10000000-0000-0000-0000-000000000008"), "Taiwan", null, null, "Palit" },
                    { new Guid("10000000-0000-0000-0000-000000000009"), "USA", null, null, "Kingston" },
                    { new Guid("10000000-0000-0000-0000-000000000010"), "USA", null, null, "Corsair" },
                    { new Guid("10000000-0000-0000-0000-000000000011"), "Taiwan", null, null, "G.Skill" },
                    { new Guid("10000000-0000-0000-0000-000000000012"), "Germany", null, null, "be quiet!" },
                    { new Guid("10000000-0000-0000-0000-000000000013"), "Taiwan", null, null, "Seasonic" },
                    { new Guid("10000000-0000-0000-0000-000000000014"), "South Korea", null, null, "Samsung" },
                    { new Guid("10000000-0000-0000-0000-000000000015"), "USA", null, null, "Western Digital" },
                    { new Guid("10000000-0000-0000-0000-000000000016"), "USA", null, null, "NZXT" },
                    { new Guid("10000000-0000-0000-0000-000000000017"), "Sweden", null, null, "Fractal Design" }
                });

            migrationBuilder.InsertData(
                table: "products",
                columns: new[] { "id", "CategoryId", "created_at", "description", "is_active", "IsFeatured", "ManufacturerId", "name", "OldPrice", "price", "rating", "review_count", "sku", "specifications", "stock", "updated_at", "warranty_months" },
                values: new object[,]
                {
                    { new Guid("20000000-0000-0000-0000-000000000001"), new Guid("00000000-0000-0000-0000-000000000001"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Процессор AMD Ryzen 5 5600X, 6 ядер, 12 потоков, базовая частота 3.7 ГГц, турбо до 4.6 ГГц. Socket AM4. Отличное соотношение цена/производительность для игр и работы.", true, true, new Guid("10000000-0000-0000-0000-000000000002"), "AMD Ryzen 5 5600X", null, 549.00m, 4.7999999999999998, 156, "CPU-AMD-5600X", new Dictionary<string, object> { ["socket"] = "AM4", ["cores"] = 6, ["threads"] = 12, ["base_clock"] = "3.7 GHz", ["boost_clock"] = "4.6 GHz", ["tdp"] = "65W", ["l3_cache"] = "32MB", ["unlocked"] = true, ["integrated_graphics"] = false }, 25, null, 36 },
                    { new Guid("20000000-0000-0000-0000-000000000002"), new Guid("00000000-0000-0000-0000-000000000001"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Лучший игровой процессор с технологией 3D V-Cache. 8 ядер, 16 потоков, Socket AM5. Идеален для игр с объёмным кэшем 104MB.", true, true, new Guid("10000000-0000-0000-0000-000000000002"), "AMD Ryzen 7 7800X3D", null, 1299.00m, 4.9000000000000004, 89, "CPU-AMD-7800X3D", new Dictionary<string, object> { ["socket"] = "AM5", ["cores"] = 8, ["threads"] = 16, ["base_clock"] = "4.2 GHz", ["boost_clock"] = "5.0 GHz", ["tdp"] = "120W", ["l3_cache"] = "104MB", ["unlocked"] = true, ["integrated_graphics"] = true }, 12, null, 36 },
                    { new Guid("20000000-0000-0000-0000-000000000003"), new Guid("00000000-0000-0000-0000-000000000001"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Процессор Intel Core i5 13-го поколения, 14 ядер (6P+8E), 20 потоков. Socket LGA1700. Отличная производительность для игр и контента.", true, false, new Guid("10000000-0000-0000-0000-000000000001"), "Intel Core i5-13600KF", 849.00m, 749.00m, 4.7000000000000002, 134, "CPU-INT-13600KF", new Dictionary<string, object> { ["socket"] = "LGA1700", ["cores"] = 14, ["threads"] = 20, ["base_clock"] = "3.5 GHz", ["boost_clock"] = "5.1 GHz", ["tdp"] = "125W", ["l3_cache"] = "24MB", ["unlocked"] = true, ["integrated_graphics"] = false }, 18, null, 36 },
                    { new Guid("20000000-0000-0000-0000-000000000004"), new Guid("00000000-0000-0000-0000-000000000002"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Материнская плата ASUS TUF Gaming на чипсете B650, Socket AM5. Поддержка DDR5, PCIe 5.0, WiFi 6, 2.5G LAN. Надёжность военного класса.", true, true, new Guid("10000000-0000-0000-0000-000000000003"), "ASUS TUF Gaming B650-Plus WiFi", null, 429.00m, 4.5999999999999996, 67, "MB-ASUS-B650TUF", new Dictionary<string, object> { ["socket"] = "AM5", ["chipset"] = "B650", ["form_factor"] = "ATX", ["memory_slots"] = 4, ["max_memory"] = "128GB", ["memory_type"] = "DDR5", ["pcie_slots"] = "1x PCIe 5.0 x16, 1x PCIe 4.0 x16", ["m2_slots"] = 3, ["usb_ports"] = "8x USB-A, 2x USB-C", ["wifi"] = "WiFi 6", ["lan"] = "2.5G" }, 15, null, 36 },
                    { new Guid("20000000-0000-0000-0000-000000000005"), new Guid("00000000-0000-0000-0000-000000000002"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Материнская плата MSI MAG B650 Tomahawk, Socket AM5. DDR5, PCIe 4.0, WiFi 6E, 2.5G LAN. Идеальна для Ryzen 7000 серии.", true, false, new Guid("10000000-0000-0000-0000-000000000004"), "MSI MAG B650 TOMAHAWK WIFI", null, 389.00m, 4.7000000000000002, 98, "MB-MSI-B650TOM", new Dictionary<string, object> { ["socket"] = "AM5", ["chipset"] = "B650", ["form_factor"] = "ATX", ["memory_slots"] = 4, ["max_memory"] = "128GB", ["memory_type"] = "DDR5", ["pcie_slots"] = "2x PCIe 4.0 x16", ["m2_slots"] = 4, ["usb_ports"] = "9x USB-A, 1x USB-C", ["wifi"] = "WiFi 6E", ["lan"] = "2.5G" }, 22, null, 36 },
                    { new Guid("20000000-0000-0000-0000-000000000006"), new Guid("00000000-0000-0000-0000-000000000003"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Комплект оперативной памяти Kingston FURY Beast 2x16GB DDR5-5600 MHz. CL36, 1.25V. Высокая производительность для игр и работы.", true, true, new Guid("10000000-0000-0000-0000-000000000009"), "Kingston FURY Beast 32GB DDR5-5600", 299.00m, 249.00m, 4.7999999999999998, 203, "RAM-KING-32D5", new Dictionary<string, object> { ["capacity"] = "32GB", ["kit_config"] = "2x16GB", ["type"] = "DDR5", ["speed"] = "5600 MHz", ["cas_latency"] = 36, ["voltage"] = "1.25V", ["heat_spreader"] = true, ["rgb"] = false }, 45, null, 36 },
                    { new Guid("20000000-0000-0000-0000-000000000007"), new Guid("00000000-0000-0000-0000-000000000003"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Память G.Skill Trident Z5 RGB 2x16GB DDR5-6000 MHz CL30. Эффектная RGB-подсветка, оптимизировано для Intel XMP 3.0.", true, true, new Guid("10000000-0000-0000-0000-000000000011"), "G.Skill Trident Z5 RGB 32GB DDR5-6000", null, 329.00m, 4.9000000000000004, 145, "RAM-GSKILL-32Z5", new Dictionary<string, object> { ["capacity"] = "32GB", ["kit_config"] = "2x16GB", ["type"] = "DDR5", ["speed"] = "6000 MHz", ["cas_latency"] = 30, ["voltage"] = "1.35V", ["heat_spreader"] = true, ["rgb"] = true }, 30, null, 36 },
                    { new Guid("20000000-0000-0000-0000-000000000008"), new Guid("00000000-0000-0000-0000-000000000004"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Видеокарта Palit GeForce RTX 4070 SUPER 12GB GDDR6X. DLSS 3, Ray Tracing, 12GB VRAM. Отличная производительность в 1440p.", true, true, new Guid("10000000-0000-0000-0000-000000000008"), "Palit GeForce RTX 4070 SUPER Dual", null, 2199.00m, 4.7000000000000002, 72, "GPU-PALIT-4070S", new Dictionary<string, object> { ["gpu"] = "NVIDIA GeForce RTX 4070 SUPER", ["vram"] = "12GB GDDR6X", ["memory_bus"] = "192-bit", ["base_clock"] = "1980 MHz", ["boost_clock"] = "2475 MHz", ["cuda_cores"] = 7168, ["rt_cores"] = 56, ["tdp"] = "220W", ["outputs"] = "3x DisplayPort 1.4a, 1x HDMI 2.1", ["recommended_psu"] = "650W" }, 8, null, 36 },
                    { new Guid("20000000-0000-0000-0000-000000000009"), new Guid("00000000-0000-0000-0000-000000000004"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Видеокарта Gigabyte Radeon RX 7800 XT 16GB GDDR6. 16GB VRAM, FSR 3, отличное соотношение цена/производительность для 1440p.", true, false, new Guid("10000000-0000-0000-0000-000000000005"), "Gigabyte Radeon RX 7800 XT GAMING OC", null, 1899.00m, 4.5999999999999996, 58, "GPU-GIGA-7800XT", new Dictionary<string, object> { ["gpu"] = "AMD Radeon RX 7800 XT", ["vram"] = "16GB GDDR6", ["memory_bus"] = "256-bit", ["base_clock"] = "1295 MHz", ["boost_clock"] = "2430 MHz", ["stream_processors"] = 3840, ["ray_accelerators"] = 60, ["tdp"] = "263W", ["outputs"] = "2x DisplayPort 2.1, 2x HDMI 2.1, 1x USB-C", ["recommended_psu"] = "700W" }, 14, null, 36 },
                    { new Guid("20000000-0000-0000-0000-000000000010"), new Guid("00000000-0000-0000-0000-000000000005"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Блок питания Corsair RM750e 750W, сертификат 80+ Gold, полностью модульный. Тихий 120mm вентилятор, ATX 3.0 совместимость.", true, true, new Guid("10000000-0000-0000-0000-000000000010"), "Corsair RM750e 750W 80+ Gold", null, 289.00m, 4.7999999999999998, 189, "PSU-CORS-RM750E", new Dictionary<string, object> { ["wattage"] = "750W", ["efficiency"] = "80+ Gold", ["modular"] = "Full", ["fan_size"] = "120mm", ["fan_type"] = "Rifle Bearing", ["atx_version"] = "ATX 3.0", ["pcie_connectors"] = "4x 8-pin (2x 12VHPWR)", ["sata_connectors"] = 8, ["noise_level"] = "10-25 dBA" }, 35, null, 60 },
                    { new Guid("20000000-0000-0000-0000-000000000011"), new Guid("00000000-0000-0000-0000-000000000005"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Блок питания be quiet! Pure Power 12 M 850W, 80+ Gold, полумодульный. Немецкая разработка, сверхтихая работа.", true, false, new Guid("10000000-0000-0000-0000-000000000012"), "be quiet! Pure Power 12 M 850W", null, 319.00m, 4.7000000000000002, 156, "PSU-BEQT-PP12M", new Dictionary<string, object> { ["wattage"] = "850W", ["efficiency"] = "80+ Gold", ["modular"] = "Semi", ["fan_size"] = "135mm", ["fan_type"] = "Silent Wings", ["atx_version"] = "ATX 3.0", ["pcie_connectors"] = "6x 8-pin", ["sata_connectors"] = 6, ["noise_level"] = "5-18 dBA" }, 20, null, 60 },
                    { new Guid("20000000-0000-0000-0000-000000000012"), new Guid("00000000-0000-0000-0000-000000000005"), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Блок питания Seasonic Focus GX-850 850W, 80+ Gold, полностью модульный. Премиум качество, 10 лет гарантии.", true, true, new Guid("10000000-0000-0000-0000-000000000013"), "Seasonic Focus GX-850 850W", null, 349.00m, 4.9000000000000004, 234, "PSU-SEAS-GX850", new Dictionary<string, object> { ["wattage"] = "850W", ["efficiency"] = "80+ Gold", ["modular"] = "Full", ["fan_size"] = "120mm", ["fan_type"] = "Fluid Dynamic Bearing", ["atx_version"] = "ATX 3.0", ["pcie_connectors"] = "6x 8-pin", ["sata_connectors"] = 8, ["noise_level"] = "8-22 dBA" }, 18, null, 120 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_categories_parent_id",
                table: "categories",
                column: "parent_id");

            migrationBuilder.CreateIndex(
                name: "IX_categories_slug",
                table: "categories",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_manufacturers_name",
                table: "manufacturers",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_product_images_product_id",
                table: "product_images",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_products_CategoryId",
                table: "products",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_products_is_active",
                table: "products",
                column: "is_active");

            migrationBuilder.CreateIndex(
                name: "IX_products_ManufacturerId",
                table: "products",
                column: "ManufacturerId");

            migrationBuilder.CreateIndex(
                name: "IX_products_price",
                table: "products",
                column: "price");

            migrationBuilder.CreateIndex(
                name: "IX_products_sku",
                table: "products",
                column: "sku",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_reviews_product_id",
                table: "reviews",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_reviews_user_id",
                table: "reviews",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "product_images");

            migrationBuilder.DropTable(
                name: "reviews");

            migrationBuilder.DropTable(
                name: "products");

            migrationBuilder.DropTable(
                name: "categories");

            migrationBuilder.DropTable(
                name: "manufacturers");
        }
    }
}
