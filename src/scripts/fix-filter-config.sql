-- ============================================================
-- Fix Filter Configuration Issues
-- Run against: goldpc_catalog
-- ============================================================

-- 1. FANS: Remove socket/tdp (no data), add connection_type/fan_size (has data)
-- First, get the IDs we need
DO $$
DECLARE
    fans_category_id UUID;
    attr_id UUID;
BEGIN
    -- Get fans category ID
    SELECT id INTO fans_category_id FROM categories WHERE slug = 'fans';

    -- Remove socket filter attribute from fans (only 1 product has data)
    DELETE FROM category_filter_attributes
    WHERE category_id = fans_category_id AND attribute_key = 'socket';

    -- Remove tdp filter attribute from fans (0 products have data)
    DELETE FROM category_filter_attributes
    WHERE category_id = fans_category_id AND attribute_key = 'tdp';

    -- Remove type filter attribute from fans (0 products have meaningful data)
    DELETE FROM category_filter_attributes
    WHERE category_id = fans_category_id AND attribute_key = 'type';

    -- Add connection_type as select filter (368 products have data)
    SELECT id INTO attr_id FROM specification_attributes WHERE key = 'connection_type';
    INSERT INTO category_filter_attributes (id, category_id, attribute_id, attribute_key, display_name, filter_type, sort_order)
    VALUES (gen_random_uuid(), fans_category_id, attr_id, 'connection_type', 'Тип подключения', 0, 1)
    ON CONFLICT DO NOTHING;

    -- Fix sort_order for fans filters
    UPDATE category_filter_attributes SET sort_order = 1 WHERE category_id = fans_category_id AND attribute_key = 'connection_type';
    UPDATE category_filter_attributes SET sort_order = 2 WHERE category_id = fans_category_id AND attribute_key = 'fan_size';
    UPDATE category_filter_attributes SET sort_order = 3 WHERE category_id = fans_category_id AND attribute_key = 'fan_count';
    UPDATE category_filter_attributes SET sort_order = 4 WHERE category_id = fans_category_id AND attribute_key = 'noise';
    UPDATE category_filter_attributes SET sort_order = 5 WHERE category_id = fans_category_id AND attribute_key = 'color';
    UPDATE category_filter_attributes SET sort_order = 6 WHERE category_id = fans_category_id AND attribute_key = 'data_vykhoda_na_rynok';

    RAISE NOTICE 'Fans filter attributes fixed';
END $$;

-- 2. HEADPHONES: Remove interface (0 data) and form_factor (4 data)
DO $$
DECLARE
    hp_category_id UUID;
BEGIN
    SELECT id INTO hp_category_id FROM categories WHERE slug = 'headphones';

    -- Remove interface (0 products have data)
    DELETE FROM category_filter_attributes
    WHERE category_id = hp_category_id AND attribute_key = 'interface';

    -- Remove form_factor (only 4 products have data - useless filter)
    DELETE FROM category_filter_attributes
    WHERE category_id = hp_category_id AND attribute_key = 'form_factor';

    RAISE NOTICE 'Headphones filter attributes fixed';
END $$;

-- 3. PSU: Remove form_factor and modular (0 data for both)
DO $$
DECLARE
    psu_category_id UUID;
BEGIN
    SELECT id INTO psu_category_id FROM categories WHERE slug = 'psu';

    -- Remove form_factor (0 products have data)
    DELETE FROM category_filter_attributes
    WHERE category_id = psu_category_id AND attribute_key = 'form_factor';

    -- Remove modular (0 products have data)
    DELETE FROM category_filter_attributes
    WHERE category_id = psu_category_id AND attribute_key = 'modular';

    RAISE NOTICE 'PSU filter attributes fixed';
END $$;
