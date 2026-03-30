using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CatalogService.Migrations
{
    /// <inheritdoc />
    public partial class SplitPeripheryIntoKeyboardsMiceHeadphones : Migration
    {
        private static readonly string[] CategoryInsertColumns =
        {
            "id", "component_type", "description", "Icon", "name", "Order", "parent_id", "slug",
        };

        private static readonly string[] CategoryFilterAttributeColumns =
        {
            "id", "attribute_key", "category_id", "display_name", "filter_type", "sort_order",
        };

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "categories",
                columns: CategoryInsertColumns,
                values: new object[] { new Guid("00000000-0000-0000-0000-00000000000b"), 12, null, null, "Клавиатуры", 0, null, "keyboards" });
            migrationBuilder.InsertData(
                table: "categories",
                columns: CategoryInsertColumns,
                values: new object[] { new Guid("00000000-0000-0000-0000-00000000000c"), 13, null, null, "Мыши", 0, null, "mice" });
            migrationBuilder.InsertData(
                table: "categories",
                columns: CategoryInsertColumns,
                values: new object[] { new Guid("00000000-0000-0000-0000-00000000000d"), 14, null, null, "Наушники", 0, null, "headphones" });

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

            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-000000000016"), "type", new Guid("00000000-0000-0000-0000-00000000000b"), "Тип/типоразмер", 0, 1 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-000000000017"), "interface", new Guid("00000000-0000-0000-0000-00000000000b"), "Интерфейс", 0, 2 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-000000000018"), "color", new Guid("00000000-0000-0000-0000-00000000000b"), "Цвет", 0, 3 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-000000000019"), "type", new Guid("00000000-0000-0000-0000-00000000000c"), "Тип", 0, 1 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-00000000001a"), "interface", new Guid("00000000-0000-0000-0000-00000000000c"), "Интерфейс", 0, 2 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-00000000001b"), "dpi", new Guid("00000000-0000-0000-0000-00000000000c"), "DPI", 1, 3 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-00000000001c"), "sensor_type", new Guid("00000000-0000-0000-0000-00000000000c"), "Тип сенсора", 0, 4 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-00000000001d"), "type", new Guid("00000000-0000-0000-0000-00000000000d"), "Тип", 0, 1 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-00000000001e"), "interface", new Guid("00000000-0000-0000-0000-00000000000d"), "Интерфейс", 0, 2 });
            migrationBuilder.InsertData(
                table: "category_filter_attributes",
                columns: CategoryFilterAttributeColumns,
                values: new object[] { new Guid("30000000-0000-0000-0000-00000000001f"), "color", new Guid("00000000-0000-0000-0000-00000000000d"), "Цвет", 0, 3 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000016"));

            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000017"));

            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000018"));

            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-000000000019"));

            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000001a"));

            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000001b"));

            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000001c"));

            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000001d"));

            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000001e"));

            migrationBuilder.DeleteData(
                table: "category_filter_attributes",
                keyColumn: "id",
                keyValue: new Guid("30000000-0000-0000-0000-00000000001f"));

            migrationBuilder.DeleteData(
                table: "categories",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-00000000000b"));

            migrationBuilder.DeleteData(
                table: "categories",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-00000000000c"));

            migrationBuilder.DeleteData(
                table: "categories",
                keyColumn: "id",
                keyValue: new Guid("00000000-0000-0000-0000-00000000000d"));

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
