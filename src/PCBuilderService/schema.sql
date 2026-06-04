CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

CREATE TABLE pc_configurations (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    purpose character varying(50) NOT NULL,
    processor_id uuid,
    motherboard_id uuid,
    ram_id uuid,
    gpu_id uuid,
    psu_id uuid,
    storage_id uuid,
    case_id uuid,
    cooler_id uuid,
    total_price numeric(12,2) NOT NULL,
    total_power integer NOT NULL,
    is_compatible boolean NOT NULL,
    share_token character varying(64),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone,
    CONSTRAINT "PK_pc_configurations" PRIMARY KEY (id)
);

CREATE INDEX "IX_pc_configurations_share_token" ON pc_configurations (share_token) WHERE share_token IS NOT NULL;

CREATE INDEX "IX_pc_configurations_user_id" ON pc_configurations (user_id);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260401070207_InitialCreate', '8.0.11');

COMMIT;

