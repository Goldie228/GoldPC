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
            migrationBuilder.DropTable(
                name: "service_types");
        }
    }
}
