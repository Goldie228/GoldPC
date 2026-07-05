-- Скрипт заполнения таблицы promo_codes
-- Использование: psql -U goldpc -d orders_db -f seed-promo-codes.sql
-- Безопасен для многократного запуска (использует ON CONFLICT DO NOTHING).

INSERT INTO promo_codes (id, code, discount_percent, min_order_amount, valid_from, valid_to, max_uses, used_count, is_active, description, created_at)
VALUES
    (gen_random_uuid(), 'GOLDPC',   5,  NULL,  NULL,  NULL,  NULL, 0, true,  'Скидка 5% на любой заказ',                                  now()),
    (gen_random_uuid(), 'GOLDPC10', 10, 500,   NULL,  NULL,  NULL, 0, true,  'Скидка 10% при заказе от 500 BYN',                           now()),
    (gen_random_uuid(), 'SAVE15',   15, 1000,  NULL,  NULL,  100, 0, true,  'Скидка 15% при заказе от 1000 BYN (лимит 100 использований)', now())
ON CONFLICT (code) DO NOTHING;
