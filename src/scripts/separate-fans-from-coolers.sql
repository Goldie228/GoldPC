-- ============================================================
-- Миграция: отделение вентиляторов от кулеров
-- Находит товары в категории "coolers" с "Вентилятор" или
-- "Комплект вентиляторов" в названии и переносит в новую
-- категорию "fans".
--
-- Запуск:
--   PGPASSWORD=admin psql -h localhost -p 5434 -U postgres -d goldpc_catalog \
--     -f src/scripts/separate-fans-from-coolers.sql
-- ============================================================

BEGIN;

DO $$
DECLARE
    coolers_id UUID;
    fans_id UUID;
    fans_count INT;
BEGIN
    -- 1. Найти ID категории coolers
    SELECT id INTO coolers_id FROM categories WHERE slug = 'coolers';

    IF coolers_id IS NULL THEN
        RAISE EXCEPTION 'Категория coolers не найдена';
    END IF;

    -- 2. Создать категорию fans, если её нет
    SELECT id INTO fans_id FROM categories WHERE slug = 'fans';

    IF fans_id IS NULL THEN
        fans_id := gen_random_uuid();
        INSERT INTO categories (id, name, slug, "Order")
        VALUES (fans_id, 'Вентиляторы', 'fans',
                (SELECT COALESCE(MAX("Order"), 0) + 1 FROM categories));
        RAISE NOTICE 'Создана категория fans (id: %)', fans_id;
    ELSE
        RAISE NOTICE 'Категория fans уже существует (id: %)', fans_id;
    END IF;

    -- 3. Перенести товары с "Вентилятор" или "Комплект вентиляторов" в названии
    UPDATE products
    SET "CategoryId" = fans_id
    WHERE "CategoryId" = coolers_id
      AND (
        name ILIKE '%вентилятор%'
        OR name ILIKE '%комплект вентиляторов%'
      );

    GET DIAGNOSTICS fans_count = ROW_COUNT;
    RAISE NOTICE 'Перенесено товаров в fans: %', fans_count;

    -- 4. Создать CategoryFilterAttributes для fans (копируя из coolers)
    INSERT INTO category_filter_attributes
        (id, category_id, attribute_id, attribute_key, display_name, filter_type, sort_order)
    SELECT
        gen_random_uuid(),
        fans_id,
        cfa.attribute_id,
        cfa.attribute_key,
        cfa.display_name,
        cfa.filter_type,
        cfa.sort_order
    FROM category_filter_attributes cfa
    WHERE cfa.category_id = coolers_id
      AND NOT EXISTS (
        SELECT 1 FROM category_filter_attributes x
        WHERE x.category_id = fans_id
          AND x.attribute_key = cfa.attribute_key
      );

    RAISE NOTICE 'CategoryFilterAttributes скопированы для fans';
END $$;

COMMIT;

-- 5. Проверка: показать товары в fans
SELECT p.name, p."CategoryId", c.slug as category_slug
FROM products p
JOIN categories c ON c.id = p."CategoryId"
WHERE c.slug = 'fans'
ORDER BY p.name;
