#!/usr/bin/env bash
# Создание всех тестовых пользователей для GoldPC (admin + manager + master + accountant + client)
# Вставка напрямую в PostgreSQL для обхода ограничителя скорости.
# Использование: bash scripts/seed-data/seed-users.sh

set -e

PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
PG_USER="${PG_USER:-postgres}"
AUTH_DB="goldpc_auth"

# Хеши паролей (bcrypt): admin=G0ldPC#Adm1n2026!, остальные=Test1234!
ADMIN_HASH='$2a$12$LJ3m4ys4LzYRZjhFv.p5l.NVXp3R7bQxhTSHkFh2WQ1O6R4S5C7Ha'
TEST_HASH='$2a$12$EbnPRjviqd9soKFAoBWEn.b/krATU.MWOEEMwsC6dYdOcHwfccApS'

echo "🔑 Seeding users into $AUTH_DB..."

PGPASSWORD=admin psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$AUTH_DB" -c "
-- Admin
INSERT INTO users (\"Id\", \"Email\", \"PasswordHash\", \"FirstName\", \"LastName\", \"Phone\", \"Role\", \"IsActive\", \"FailedLoginAttempts\", \"CreatedAt\", \"IsEmailVerified\")
VALUES (gen_random_uuid(), 'admin@goldpc.by', '$ADMIN_HASH', 'Админ', 'Системы', '+375291000001', 'Admin', true, 0, NOW(), true)
ON CONFLICT (\"Email\") DO UPDATE SET \"Role\" = 'Admin';

-- Manager
INSERT INTO users (\"Id\", \"Email\", \"PasswordHash\", \"FirstName\", \"LastName\", \"Phone\", \"Role\", \"IsActive\", \"FailedLoginAttempts\", \"CreatedAt\", \"IsEmailVerified\")
VALUES (gen_random_uuid(), 'manager@goldpc.by', '$TEST_HASH', 'Менеджер', 'Магазина', '+375292000002', 'Manager', true, 0, NOW(), true)
ON CONFLICT (\"Email\") DO NOTHING;

-- Master
INSERT INTO users (\"Id\", \"Email\", \"PasswordHash\", \"FirstName\", \"LastName\", \"Phone\", \"Role\", \"IsActive\", \"FailedLoginAttempts\", \"CreatedAt\", \"IsEmailVerified\")
VALUES (gen_random_uuid(), 'master@goldpc.by', '$TEST_HASH', 'Мастер', 'Ремонта', '+375293000003', 'Master', true, 0, NOW(), true)
ON CONFLICT (\"Email\") DO NOTHING;

-- Accountant
INSERT INTO users (\"Id\", \"Email\", \"PasswordHash\", \"FirstName\", \"LastName\", \"Phone\", \"Role\", \"IsActive\", \"FailedLoginAttempts\", \"CreatedAt\", \"IsEmailVerified\")
VALUES (gen_random_uuid(), 'accountant@goldpc.by', '$TEST_HASH', 'Бухгалтер', 'Отдела', '+375294000004', 'Accountant', true, 0, NOW(), true)
ON CONFLICT (\"Email\") DO NOTHING;

-- Client
INSERT INTO users (\"Id\", \"Email\", \"PasswordHash\", \"FirstName\", \"LastName\", \"Phone\", \"Role\", \"IsActive\", \"FailedLoginAttempts\", \"CreatedAt\", \"IsEmailVerified\")
VALUES (gen_random_uuid(), 'client@goldpc.by', '$TEST_HASH', 'Клиент', 'Тестовый', '+375295000005', 'Client', true, 0, NOW(), true)
ON CONFLICT (\"Email\") DO NOTHING;
"

echo ""
echo "✅ All users seeded:"
echo "   admin@goldpc.by      / G0ldPC#Adm1n2026!  (Admin)"
echo "   manager@goldpc.by    / Test1234!           (Manager)"
echo "   master@goldpc.by     / Test1234!           (Master)"
echo "   accountant@goldpc.by / Test1234!           (Accountant)"
echo "   client@goldpc.by     / Test1234!           (Client)"
