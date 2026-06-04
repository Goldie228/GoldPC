CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

CREATE TABLE orders (
    "Id" uuid NOT NULL,
    "OrderNumber" character varying(20) NOT NULL,
    "UserId" uuid NOT NULL,
    "Status" character varying(20) NOT NULL,
    "Total" numeric(12,2) NOT NULL,
    "Subtotal" numeric(12,2) NOT NULL,
    "DeliveryCost" numeric(12,2) NOT NULL,
    "DeliveryMethod" character varying(20) NOT NULL,
    "PaymentMethod" character varying(20) NOT NULL,
    "Address" character varying(500),
    "Comment" character varying(1000),
    "IsPaid" boolean NOT NULL,
    "PaidAt" timestamp with time zone,
    "PaymentId" text,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "PK_orders" PRIMARY KEY ("Id")
);

CREATE TABLE outbox_messages (
    "Id" uuid NOT NULL,
    "Type" character varying(255) NOT NULL,
    "Content" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "ProcessedAt" timestamp with time zone,
    "Error" text,
    CONSTRAINT "PK_outbox_messages" PRIMARY KEY ("Id")
);

CREATE TABLE order_history (
    "Id" uuid NOT NULL,
    "ChangedAt" timestamp with time zone NOT NULL,
    "OrderId" uuid NOT NULL,
    "PreviousStatus" integer NOT NULL,
    "NewStatus" integer NOT NULL,
    "Comment" character varying(500),
    "ChangedBy" uuid NOT NULL,
    CONSTRAINT "PK_order_history" PRIMARY KEY ("Id", "ChangedAt"),
    CONSTRAINT "FK_order_history_orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES orders ("Id") ON DELETE CASCADE
);

CREATE TABLE order_items (
    "Id" uuid NOT NULL,
    "OrderId" uuid NOT NULL,
    "ProductId" uuid NOT NULL,
    "ProductName" character varying(255) NOT NULL,
    "Quantity" integer NOT NULL,
    "UnitPrice" numeric(12,2) NOT NULL,
    CONSTRAINT "PK_order_items" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_order_items_orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES orders ("Id") ON DELETE CASCADE
);

CREATE INDEX "IX_order_history_OrderId" ON order_history ("OrderId");

CREATE INDEX "IX_order_items_OrderId" ON order_items ("OrderId");

CREATE UNIQUE INDEX "IX_orders_OrderNumber" ON orders ("OrderNumber");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260324144644_AddOutboxMessages', '8.0.11');

COMMIT;

START TRANSACTION;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS "CustomerLastName" character varying(100);

ALTER TABLE orders
ALTER COLUMN "CustomerLastName" DROP NOT NULL;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260401062356_MakeLastNameOptional', '8.0.11');

COMMIT;

START TRANSACTION;

UPDATE orders SET "CustomerLastName" = '' WHERE "CustomerLastName" IS NULL;
ALTER TABLE orders ALTER COLUMN "CustomerLastName" SET NOT NULL;
ALTER TABLE orders ALTER COLUMN "CustomerLastName" SET DEFAULT '';

ALTER TABLE orders ADD "CustomerFirstName" character varying(100) NOT NULL DEFAULT '';

ALTER TABLE orders ADD "CustomerPhone" character varying(20) NOT NULL DEFAULT '';

ALTER TABLE orders ADD "CustomerEmail" character varying(255);

ALTER TABLE orders ADD "DeliveryDate" timestamp with time zone;

ALTER TABLE orders ADD "DeliveryTimeSlot" character varying(50);

ALTER TABLE orders ADD "DiscountAmount" numeric(12,2) NOT NULL DEFAULT 0.0;

ALTER TABLE orders ADD "PromoCode" character varying(50);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260414162415_AddCustomerFields', '8.0.11');

COMMIT;

START TRANSACTION;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260414173240_AddDiscountAndPromoColumns', '8.0.11');

COMMIT;

START TRANSACTION;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260414175328_AddDiscountAmountPromoCode', '8.0.11');

COMMIT;

