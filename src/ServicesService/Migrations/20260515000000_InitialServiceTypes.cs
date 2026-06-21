using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GoldPC.ServicesService.Migrations
{
    /// <inheritdoc />
    public partial class InitialServiceTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "service_types",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    base_price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    estimated_duration_minutes = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_service_types", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "service_requests",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    request_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    client_id = table.Column<Guid>(type: "uuid", nullable: false),
                    master_id = table.Column<Guid>(type: "uuid", nullable: true),
                    service_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    device_model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    serial_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    estimated_cost = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    actual_cost = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    master_comment = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_service_requests", x => x.id);
                    table.ForeignKey(
                        name: "FK_service_requests_service_types_service_type_id",
                        column: x => x.service_type_id,
                        principalTable: "service_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "service_parts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    service_request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_service_parts", x => x.id);
                    table.ForeignKey(
                        name: "FK_service_parts_service_requests_service_request_id",
                        column: x => x.service_request_id,
                        principalTable: "service_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "work_reports",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    service_request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    changed_by = table.Column<Guid>(type: "uuid", nullable: false),
                    previous_status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    new_status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    comment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    changed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_work_reports", x => x.id);
                    table.ForeignKey(
                        name: "FK_work_reports_service_requests_service_request_id",
                        column: x => x.service_request_id,
                        principalTable: "service_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_service_requests_request_number",
                table: "service_requests",
                column: "request_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_service_requests_service_type_id",
                table: "service_requests",
                column: "service_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_service_parts_service_request_id",
                table: "service_parts",
                column: "service_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_work_reports_service_request_id",
                table: "work_reports",
                column: "service_request_id");

            migrationBuilder.InsertData(
                table: "service_types",
                columns: new[] { "id", "name", "slug", "description", "base_price", "estimated_duration_minutes", "is_active" },
                values: new object[,]
                {
                    { new Guid("10000000-0000-0000-0000-000000000001"), "Ремонт компьютеров", "ремонт-компьютеров", "Диагностика и ремонт настольных ПК любой сложности. Замена компонентов, устранение перегрева, восстановление после залития.", 30.00m, 120, true },
                    { new Guid("10000000-0000-0000-0000-000000000002"), "Ремонт ноутбуков", "ремонт-ноутбуков", "Ремонт материнских плат, замена матриц, клавиатур, аккумуляторов. Работаем со всеми брендами.", 40.00m, 180, true },
                    { new Guid("10000000-0000-0000-0000-000000000003"), "Модернизация ПК", "модернизация-пк", "Апгрейд процессора, видеокарты, оперативной памяти, SSD. Подберём совместимые компоненты под ваш бюджет.", 25.00m, 60, true },
                    { new Guid("10000000-0000-0000-0000-000000000004"), "Диагностика", "диагностика", "Полная аппаратная и программная диагностика. Определим причину неисправности и предложим варианты ремонта.", 15.00m, 90, true },
                    { new Guid("10000000-0000-0000-0000-000000000005"), "Сборка ПК на заказ", "assembly", "Подбор комплектующих и профессиональная сборка компьютера под ваши задачи: игры, работа, стриминг.", 50.00m, 120, true },
                    { new Guid("10000000-0000-0000-0000-000000000006"), "Восстановление данных", "восстановление-данных", "Восстановление удалённых файлов, данных с повреждённых HDD/SSD, флешек и карт памяти.", 45.00m, 240, true },
                    { new Guid("10000000-0000-0000-0000-000000000007"), "Чистка и обслуживание", "чистка-и-обслуживание", "Чистка от пыли, замена термопасты, профилактика системы охлаждения. Продлим жизнь вашему ПК.", 20.00m, 90, true }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "work_reports");
            migrationBuilder.DropTable(name: "service_parts");
            migrationBuilder.DropTable(name: "service_requests");
            migrationBuilder.DropTable(name: "service_types");
        }
    }
}
