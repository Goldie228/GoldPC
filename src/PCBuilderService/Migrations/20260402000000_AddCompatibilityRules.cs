using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PCBuilderService.Migrations
{
    public partial class AddCompatibilityRules : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "compatibility_rules",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    rule_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    component1_id = table.Column<Guid>(type: "uuid", nullable: false),
                    component1_type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    component1_name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    component2_id = table.Column<Guid>(type: "uuid", nullable: false),
                    component2_type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    component2_name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    socket = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    memory_type = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    form_factor = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    is_compatible = table.Column<bool>(type: "boolean", nullable: false),
                    incompatibility_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    suggestion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_compatibility_rules", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_compatibility_rules_socket",
                table: "compatibility_rules",
                column: "socket",
                filter: "socket IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_compatibility_rules_memory_type",
                table: "compatibility_rules",
                column: "memory_type",
                filter: "memory_type IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_compatibility_rules_form_factor",
                table: "compatibility_rules",
                column: "form_factor",
                filter: "form_factor IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_compatibility_rules_type_compatible",
                table: "compatibility_rules",
                columns: new[] { "rule_type", "is_compatible" });

            migrationBuilder.CreateIndex(
                name: "IX_compatibility_rules_socket_memory_compatible",
                table: "compatibility_rules",
                columns: new[] { "socket", "memory_type", "is_compatible" },
                filter: "socket IS NOT NULL AND memory_type IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_compatibility_rules_unique_pair",
                table: "compatibility_rules",
                columns: new[] { "rule_type", "component1_id", "component2_id" },
                unique: true);

            CreateMaterializedView(migrationBuilder);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP MATERIALIZED VIEW IF EXISTS mv_compatibility_quick_check;");
            migrationBuilder.DropTable(name: "compatibility_rules");
        }

        private void CreateMaterializedView(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                CREATE MATERIALIZED VIEW mv_compatibility_quick_check AS
                SELECT 
                    cr.rule_type,
                    cr.socket,
                    cr.memory_type,
                    cr.form_factor,
                    cr.component1_id,
                    cr.component1_type,
                    cr.component1_name,
                    cr.component2_id,
                    cr.component2_type,
                    cr.component2_name,
                    cr.is_compatible,
                    cr.incompatibility_type,
                    cr.message,
                    cr.suggestion
                FROM compatibility_rules cr
                WHERE cr.is_compatible = false;

                CREATE INDEX IX_mv_compat_check_socket 
                    ON mv_compatibility_quick_check(socket) WHERE socket IS NOT NULL;
                CREATE INDEX IX_mv_compat_check_memory 
                    ON mv_compatibility_quick_check(memory_type) WHERE memory_type IS NOT NULL;
                CREATE INDEX IX_mv_compat_check_form 
                    ON mv_compatibility_quick_check(form_factor) WHERE form_factor IS NOT NULL;
                CREATE INDEX IX_mv_compat_check_rule 
                    ON mv_compatibility_quick_check(rule_type);
            ");
        }
    }
}