CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

CREATE TABLE users (
    "Id" uuid NOT NULL,
    "Email" character varying(256) NOT NULL,
    "PasswordHash" character varying(500) NOT NULL,
    "Role" character varying(20) NOT NULL,
    "FirstName" character varying(50) NOT NULL,
    "LastName" character varying(50) NOT NULL,
    "Phone" character varying(20) NOT NULL,
    "IsActive" boolean NOT NULL,
    "FailedLoginAttempts" integer NOT NULL,
    "LockedUntil" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "PK_users" PRIMARY KEY ("Id")
);

CREATE TABLE password_reset_tokens (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "TokenHash" character varying(128) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "ExpiresAt" timestamp with time zone NOT NULL,
    "UsedAt" timestamp with time zone,
    "UsedByIp" character varying(45),
    CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_password_reset_tokens_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE CASCADE
);

CREATE TABLE refresh_tokens (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Token" character varying(500) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "ExpiresAt" timestamp with time zone NOT NULL,
    "RevokedAt" timestamp with time zone,
    "CreatedByIp" text,
    "RevokedByIp" text,
    "RevokedReason" text,
    CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_refresh_tokens_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE CASCADE
);

CREATE TABLE user_addresses (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Name" character varying(100) NOT NULL,
    "City" character varying(100) NOT NULL,
    "Address" character varying(500) NOT NULL,
    "Apartment" character varying(50),
    "PostalCode" character varying(20),
    "IsDefault" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "PK_user_addresses" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_user_addresses_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE CASCADE
);

CREATE TABLE wishlist_items (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "ProductId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    CONSTRAINT "PK_wishlist_items" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_wishlist_items_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "IX_password_reset_tokens_TokenHash" ON password_reset_tokens ("TokenHash");

CREATE INDEX "IX_password_reset_tokens_UserId" ON password_reset_tokens ("UserId");

CREATE UNIQUE INDEX "IX_refresh_tokens_Token" ON refresh_tokens ("Token");

CREATE INDEX "IX_refresh_tokens_UserId" ON refresh_tokens ("UserId");

CREATE INDEX "IX_user_addresses_UserId" ON user_addresses ("UserId");

CREATE UNIQUE INDEX "IX_users_Email" ON users ("Email");

CREATE UNIQUE INDEX "IX_wishlist_items_UserId_ProductId" ON wishlist_items ("UserId", "ProductId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260513144946_InitialCreate', '8.0.11');

COMMIT;

START TRANSACTION;

ALTER TABLE users ADD "IsEmailVerified" boolean NOT NULL DEFAULT FALSE;

CREATE TABLE email_verification_tokens (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "TokenHash" character varying(128) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "ExpiresAt" timestamp with time zone NOT NULL,
    "UsedAt" timestamp with time zone,
    "UsedByIp" character varying(45),
    CONSTRAINT "PK_email_verification_tokens" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_email_verification_tokens_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "IX_email_verification_tokens_TokenHash" ON email_verification_tokens ("TokenHash");

CREATE INDEX "IX_email_verification_tokens_UserId" ON email_verification_tokens ("UserId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260513162912_EmailVerification', '8.0.11');

COMMIT;

