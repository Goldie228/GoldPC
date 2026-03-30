using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CatalogService.Migrations
{
    /// <inheritdoc />
    public partial class AddXCoreGpuFilterAttributes : Migration
    {
        private static readonly Guid CategoryGpuId = new Guid("00000000-0000-0000-0000-000000000004");

        private static readonly string[] CategoryFilterAttributeColumns =
        {
            "id", "attribute_key", "category_id", "display_name", "filter_type", "sort_order",
        };

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-000000000020"), "videopamyat", CategoryGpuId, "Видеопамять, ГБ", 1, 1 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-000000000021"), "graficheskiy_protsessor", CategoryGpuId, "Графический процессор", 0, 2 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-000000000022"), "proizvoditel_graficheskogo_protsessora", CategoryGpuId, "Производитель ГП", 0, 3 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-000000000023"), "tip_videopamyati", CategoryGpuId, "Тип видеопамяти", 0, 4 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-000000000024"), "data_vykhoda_na_rynok_2", CategoryGpuId, "Дата выхода на рынок, г", 1, 5 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-000000000025"), "shirina_shiny_pamyati", CategoryGpuId, "Ширина шины памяти, бит", 1, 6 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-000000000026"), "okhlazhdenie_1", CategoryGpuId, "Охлаждение", 0, 7 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-000000000027"), "razyemy_pitaniya", CategoryGpuId, "Разъёмы питания", 0, 8 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-000000000028"), "interfeys_1", CategoryGpuId, "Интерфейс", 0, 9 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-000000000029"), "rekomenduemyy_blok_pitaniya", CategoryGpuId, "Рекомендуемый БП, Вт", 1, 10 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-00000000002a"), "dlina_videokarty", CategoryGpuId, "Длина, мм", 1, 11 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-00000000002b"), "vysota_videokarty", CategoryGpuId, "Высота, мм", 1, 12 });

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000020"));
            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000021"));
            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000022"));
            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000023"));
            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000024"));
            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000025"));
            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000026"));
            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000027"));
            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000028"));
            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000029"));
            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000002a"));
            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000002b"));

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
