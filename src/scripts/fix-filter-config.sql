-- ============================================================
-- Исправление проблем конфигурации фильтров
-- Запускать против: goldpc_catalog
-- ============================================================

-- 1. ВЕНТИЛЯТОРЫ: Удалить socket/tdp (нет данных), добавить connection_type/fan_size (есть данные)
-- Сначала получаем необходимые ID
DO $$
DECLARE
    fans_category_id UUID;
    attr_id UUID;
BEGIN
    -- Получить ID категории fans
    SELECT id INTO fans_category_id FROM categories WHERE slug = 'fans';

    -- Удалить атрибут фильтра socket из вентиляторов (только 1 товар имеет данные)
    DELETE FROM category_filter_attributes
    WHERE category_id = fans_category_id AND attribute_key = 'socket';

    -- Удалить атрибут фильтра tdp из вентиляторов (0 товаров имеют данные)
    DELETE FROM category_filter_attributes
    WHERE category_id = fans_category_id AND attribute_key = 'tdp';

    -- Удалить атрибут фильтра type из вентиляторов (0 товаров имеют значимые данные)
    DELETE FROM category_filter_attributes
    WHERE category_id = fans_category_id AND attribute_key = 'type';

    -- Добавить connection_type как select фильтр (368 товаров имеют данные)
    SELECT id INTO attr_id FROM specification_attributes WHERE key = 'connection_type';
    INSERT INTO category_filter_attributes (id, category_id, attribute_id, attribute_key, display_name, filter_type, sort_order)
    VALUES (gen_random_uuid(), fans_category_id, attr_id, 'connection_type', 'Тип подключения', 0, 1)
    ON CONFLICT DO NOTHING;

    -- Исправить sort_order для фильтров вентиляторов
    UPDATE category_filter_attributes SET sort_order = 1 WHERE category_id = fans_category_id AND attribute_key = 'connection_type';
    UPDATE category_filter_attributes SET sort_order = 2 WHERE category_id = fans_category_id AND attribute_key = 'fan_size';
    UPDATE category_filter_attributes SET sort_order = 3 WHERE category_id = fans_category_id AND attribute_key = 'fan_count';
    UPDATE category_filter_attributes SET sort_order = 4 WHERE category_id = fans_category_id AND attribute_key = 'noise';
    UPDATE category_filter_attributes SET sort_order = 5 WHERE category_id = fans_category_id AND attribute_key = 'color';
    UPDATE category_filter_attributes SET sort_order = 6 WHERE category_id = fans_category_id AND attribute_key = 'data_vykhoda_na_rynok';

    RAISE NOTICE 'Атрибуты фильтров вентиляторов исправлены';
END $$;

-- 2. НАУШНИКИ: Удалить interface (0 данных) и form_factor (4 данных)
DO $$
DECLARE
    hp_category_id UUID;
BEGIN
    SELECT id INTO hp_category_id FROM categories WHERE slug = 'headphones';

    -- Удалить interface (0 товаров имеют данные)
    DELETE FROM category_filter_attributes
    WHERE category_id = hp_category_id AND attribute_key = 'interface';

    -- Удалить form_factor (только 4 товара имеют данные — бесполезный фильтр)
    DELETE FROM category_filter_attributes
    WHERE category_id = hp_category_id AND attribute_key = 'form_factor';

    RAISE NOTICE 'Атрибуты фильтров наушников исправлены';
END $$;

-- 3. БП: Удалить form_factor и modular (0 данных для обоих)
DO $$
DECLARE
    psu_category_id UUID;
BEGIN
    SELECT id INTO psu_category_id FROM categories WHERE slug = 'psu';

    -- Удалить form_factor (0 товаров имеют данные)
    DELETE FROM category_filter_attributes
    WHERE category_id = psu_category_id AND attribute_key = 'form_factor';

    -- Удалить modular (0 товаров имеют данные)
    DELETE FROM category_filter_attributes
    WHERE category_id = psu_category_id AND attribute_key = 'modular';

    RAISE NOTICE 'Атрибуты фильтров БП исправлены';
END $$;
