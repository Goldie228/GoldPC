using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace GoldPC.ServicesService.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_service_parts_service_requests_service_request_id",
                table: "service_parts");

            migrationBuilder.DropForeignKey(
                name: "FK_service_requests_service_types_service_type_id",
                table: "service_requests");

            migrationBuilder.DropForeignKey(
                name: "FK_work_reports_service_requests_service_request_id",
                table: "work_reports");

            migrationBuilder.DeleteData(
                table: "service_types",
                keyColumn: "id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "service_types",
                keyColumn: "id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "service_types",
                keyColumn: "id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "service_types",
                keyColumn: "id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "service_types",
                keyColumn: "id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000005"));

            migrationBuilder.DeleteData(
                table: "service_types",
                keyColumn: "id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000006"));

            migrationBuilder.DeleteData(
                table: "service_types",
                keyColumn: "id",
                keyValue: new Guid("10000000-0000-0000-0000-000000000007"));

            migrationBuilder.AlterColumn<string>(
                name: "previous_status",
                table: "work_reports",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "new_status",
                table: "work_reports",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "description",
                table: "service_types",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "status",
                table: "service_requests",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30,
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "ticket_messages",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    service_request_id = table.Column<Guid>(type: "uuid", nullable: false),
                    author_id = table.Column<Guid>(type: "uuid", nullable: false),
                    author_role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    content = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    file_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    file_size = table.Column<long>(type: "bigint", nullable: true),
                    content_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    read_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ticket_messages", x => x.id);
                    table.ForeignKey(
                        name: "fk_ticket_messages_service_request",
                        column: x => x.service_request_id,
                        principalTable: "service_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ticket_messages_service_request_id",
                table: "ticket_messages",
                column: "service_request_id");

            migrationBuilder.AddForeignKey(
                name: "fk_service_parts_service_request",
                table: "service_parts",
                column: "service_request_id",
                principalTable: "service_requests",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_service_requests_service_type",
                table: "service_requests",
                column: "service_type_id",
                principalTable: "service_types",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_work_reports_service_request",
                table: "work_reports",
                column: "service_request_id",
                principalTable: "service_requests",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_service_parts_service_request",
                table: "service_parts");

            migrationBuilder.DropForeignKey(
                name: "fk_service_requests_service_type",
                table: "service_requests");

            migrationBuilder.DropForeignKey(
                name: "fk_work_reports_service_request",
                table: "work_reports");

            migrationBuilder.DropTable(
                name: "ticket_messages");

            migrationBuilder.AlterColumn<string>(
                name: "previous_status",
                table: "work_reports",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30);

            migrationBuilder.AlterColumn<string>(
                name: "new_status",
                table: "work_reports",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30);

            migrationBuilder.AlterColumn<string>(
                name: "description",
                table: "service_types",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "status",
                table: "service_requests",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(30)",
                oldMaxLength: 30);

            migrationBuilder.InsertData(
                table: "service_types",
                columns: new[] { "id", "base_price", "description", "estimated_duration_minutes", "is_active", "name" },
                values: new object[,]
                {
                    { new Guid("10000000-0000-0000-0000-000000000001"), 30.00m, "Диагностика и ремонт настольных ПК любой сложности. Замена компонентов, устранение перегрева, восстановление после залития.", 120, true, "Ремонт компьютеров" },
                    { new Guid("10000000-0000-0000-0000-000000000002"), 40.00m, "Ремонт материнских плат, замена матриц, клавиатур, аккумуляторов. Работаем со всеми брендами.", 180, true, "Ремонт ноутбуков" },
                    { new Guid("10000000-0000-0000-0000-000000000003"), 25.00m, "Апгрейд процессора, видеокарты, оперативной памяти, SSD. Подберём совместимые компоненты под ваш бюджет.", 60, true, "Модернизация ПК" },
                    { new Guid("10000000-0000-0000-0000-000000000004"), 15.00m, "Полная аппаратная и программная диагностика. Определим причину неисправности и предложим варианты ремонта.", 90, true, "Диагностика" },
                    { new Guid("10000000-0000-0000-0000-000000000005"), 50.00m, "Подбор комплектующих и профессиональная сборка компьютера под ваши задачи: игры, работа, стриминг.", 120, true, "Сборка ПК на заказ" },
                    { new Guid("10000000-0000-0000-0000-000000000006"), 45.00m, "Восстановление удалённых файлов, данных с повреждённых HDD/SSD, флешек и карт памяти.", 240, true, "Восстановление данных" },
                    { new Guid("10000000-0000-0000-0000-000000000007"), 20.00m, "Чистка от пыли, замена термопасты, профилактика системы охлаждения. Продлим жизнь вашему ПК.", 90, true, "Чистка и обслуживание" }
                });

            migrationBuilder.AddForeignKey(
                name: "FK_service_parts_service_requests_service_request_id",
                table: "service_parts",
                column: "service_request_id",
                principalTable: "service_requests",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_service_requests_service_types_service_type_id",
                table: "service_requests",
                column: "service_type_id",
                principalTable: "service_types",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_work_reports_service_requests_service_request_id",
                table: "work_reports",
                column: "service_request_id",
                principalTable: "service_requests",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
