-- ============================================================
-- Fix Filter Data Quality Issues
-- Run against: goldpc_catalog
-- ============================================================

-- 1. MONITOR BRIGHTNESS: Divide all value_number by 10
-- Values are stored ×10 (e.g., 2500 instead of 250 cd/m²)
DO $$
DECLARE
    brightness_attr_id UUID;
    affected_count INTEGER;
BEGIN
    SELECT id INTO brightness_attr_id FROM specification_attributes WHERE key = 'brightness';

    UPDATE product_specification_values
    SET value_number = value_number / 10
    WHERE attribute_id = brightness_attr_id
      AND value_number IS NOT NULL
      AND value_number > 100;  -- Only fix values that are clearly ×10

    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RAISE NOTICE 'Brightness: fixed % rows', affected_count;
END $$;

-- 2. HEADPHONE TYPE: Clean up boolean artifacts and corrupted values
DO $$
DECLARE
    type_attr_id UUID;
    fixed_count INTEGER;
BEGIN
    SELECT id INTO type_attr_id FROM specification_attributes WHERE key = 'type';

    -- Remove 'false' values (boolean artifact)
    DELETE FROM product_specification_values
    WHERE attribute_id = type_attr_id
      AND canonical_value_id IN (
          SELECT id FROM specification_canonical_values
          WHERE attribute_id = type_attr_id AND value_text = 'false'
      );
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Headphone type: removed % false values', fixed_count;

    -- Fix corrupted 'поворотные чашки + (1)' -> 'поворотные чашки'
    UPDATE specification_canonical_values
    SET value_text = 'поворотные чашки'
    WHERE attribute_id = type_attr_id
      AND value_text LIKE 'поворотные чашки +%';
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Headphone type: fixed % corrupted values', fixed_count;
END $$;

-- 3. COOLER FAN_COUNT: Fix garbage values (10, 120, 140 are likely diameter)
DO $$
DECLARE
    fan_count_attr_id UUID;
    fixed_count INTEGER;
BEGIN
    SELECT id INTO fan_count_attr_id FROM specification_attributes WHERE key = 'fan_count';

    -- Set unreasonable fan_count values to NULL (fan_count should be 1-4)
    UPDATE product_specification_values
    SET value_number = NULL
    WHERE attribute_id = fan_count_attr_id
      AND value_number > 10;
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Cooler fan_count: fixed % garbage values', fixed_count;
END $$;

-- 4. MOUSE DPI: Cap unreasonable values (max realistic DPI is ~30000)
DO $$
DECLARE
    dpi_attr_id UUID;
    fixed_count INTEGER;
BEGIN
    SELECT id INTO dpi_attr_id FROM specification_attributes WHERE key = 'dpi';

    -- Set unreasonable DPI values to NULL
    UPDATE product_specification_values
    SET value_number = NULL
    WHERE attribute_id = dpi_attr_id
      AND value_number > 30000;
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Mouse DPI: fixed % anomalous values', fixed_count;
END $$;

-- 5. HEADPHONE IMPEDANCE: Fix max=4816 (data error)
DO $$
DECLARE
    imp_attr_id UUID;
    fixed_count INTEGER;
BEGIN
    SELECT id INTO imp_attr_id FROM specification_attributes WHERE key = 'impedance';

    -- Set unreasonable impedance values to NULL (max realistic is ~2000 Ohm)
    UPDATE product_specification_values
    SET value_number = NULL
    WHERE attribute_id = imp_attr_id
      AND value_number > 2000;
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Headphone impedance: fixed % anomalous values', fixed_count;
END $$;

-- 6. BOOLEAN NORMALIZATION: Convert remaining true/false to Да/Нет
-- The backend already normalizes display, but let's fix the DB too
DO $$
DECLARE
    rec RECORD;
    true_cv_id UUID;
    false_cv_id UUID;
    fixed_count INTEGER;
BEGIN
    -- For each spec attribute that has boolean-like canonical values
    FOR rec IN
        SELECT DISTINCT sa.id as attr_id, sa.key
        FROM specification_canonical_values scv
        JOIN specification_attributes sa ON sa.id = scv.attribute_id
        WHERE scv.value_text IN ('true', 'false', 'True', 'False', 'TRUE', 'FALSE')
    LOOP
        -- Get or create normalized canonical values
        SELECT id INTO true_cv_id FROM specification_canonical_values
        WHERE attribute_id = rec.attr_id AND value_text = 'Да';

        SELECT id INTO false_cv_id FROM specification_canonical_values
        WHERE attribute_id = rec.attr_id AND value_text = 'Нет';

        -- Create if not exists
        IF true_cv_id IS NULL THEN
            INSERT INTO specification_canonical_values (id, attribute_id, value_text, sort_order)
            VALUES (gen_random_uuid(), rec.attr_id, 'Да', 1)
            RETURNING id INTO true_cv_id;
        END IF;
        IF false_cv_id IS NULL THEN
            INSERT INTO specification_canonical_values (id, attribute_id, value_text, sort_order)
            VALUES (gen_random_uuid(), rec.attr_id, 'Нет', 2)
            RETURNING id INTO false_cv_id;
        END IF;

        -- Migrate 'true' -> 'Да'
        UPDATE product_specification_values
        SET canonical_value_id = true_cv_id
        WHERE attribute_id = rec.attr_id
          AND canonical_value_id IN (
              SELECT id FROM specification_canonical_values
              WHERE attribute_id = rec.attr_id AND value_text IN ('true', 'True', 'TRUE')
          );
        GET DIAGNOSTICS fixed_count = ROW_COUNT;
        RAISE NOTICE 'Boolean %: migrated % true -> Да', rec.key, fixed_count;

        -- Migrate 'false' -> 'Нет'
        UPDATE product_specification_values
        SET canonical_value_id = false_cv_id
        WHERE attribute_id = rec.attr_id
          AND canonical_value_id IN (
              SELECT id FROM specification_canonical_values
              WHERE attribute_id = rec.attr_id AND value_text IN ('false', 'False', 'FALSE')
          );
        GET DIAGNOSTICS fixed_count = ROW_COUNT;
        RAISE NOTICE 'Boolean %: migrated % false -> Нет', rec.key, fixed_count;
    END LOOP;
END $$;

-- ============================================================================
-- 7. DOUBLE-UNIT FIX: Fix "3 ТБGB" style doubled units in capacity values
-- ============================================================================
-- Some scraped products have value_text like "3 ТБGB" where both Russian and
-- English units appear. Fix by extracting the numeric part and keeping a single
-- normalized unit.

-- 7a. Fix values where Russian + English unit are concatenated (e.g. "3 ТБGB")
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    UPDATE specification_canonical_values
    SET value_text = regexp_replace(value_text, '(\d+[\.,]?\d*)\s*(ТБ|ГБ|МБ)\s*(TB|GB|MB)',
                                    '\1 \2', 'g')
    WHERE value_text ~ '\d+[\.,]?\d*\s*(ТБ|ГБ|МБ)\s*(TB|GB|MB)';

    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Double-unit (RU+EN): fixed % values', fixed_count;
END $$;

-- 7b. Fix values where English + Russian unit are concatenated (e.g. "3GBГБ")
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    UPDATE specification_canonical_values
    SET value_text = regexp_replace(value_text, '(\d+[\.,]?\d*)\s*(TB|GB|MB)\s*(ТБ|ГБ|МБ)',
                                    '\1 \2', 'g')
    WHERE value_text ~ '\d+[\.,]?\d*\s*(TB|GB|MB)\s*(ТБ|ГБ|МБ)';

    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Double-unit (EN+RU): fixed % values', fixed_count;
END $$;

-- 7c. Normalize Russian units to English: "3 ТБ" -> "3 TB", "16 ГБ" -> "16 GB"
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    -- ТБ -> TB
    UPDATE specification_canonical_values
    SET value_text = regexp_replace(value_text, '(\d+[\.,]?\d*)\s*ТБ', '\1 TB', 'g')
    WHERE value_text ~ '\d+[\.,]?\d*\s*ТБ';

    -- ГБ -> GB
    UPDATE specification_canonical_values
    SET value_text = regexp_replace(value_text, '(\d+[\.,]?\d*)\s*ГБ', '\1 GB', 'g')
    WHERE value_text ~ '\d+[\.,]?\d*\s*ГБ';

    -- МБ -> MB
    UPDATE specification_canonical_values
    SET value_text = regexp_replace(value_text, '(\d+[\.,]?\d*)\s*МБ', '\1 MB', 'g')
    WHERE value_text ~ '\d+[\.,]?\d*\s*МБ';

    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Russian -> English units: fixed % values', fixed_count;
END $$;

-- 7d. Deduplicate: merge canonical values that now have the same value_text
-- e.g. if "3 TB" and "3 ТБ" both exist after step 7c, merge them
DO $$
DECLARE
    rec RECORD;
    canonical_rec RECORD;
    target_cv_id UUID;
    migrated INTEGER;
    merged_groups INTEGER := 0;
BEGIN
    FOR rec IN
        SELECT attribute_id, value_text, array_agg(id ORDER BY id) as ids
        FROM specification_canonical_values
        GROUP BY attribute_id, value_text
        HAVING count(*) > 1
    LOOP
        -- Keep the first one, merge the rest
        target_cv_id := rec.ids[1];

        FOR canonical_rec IN
            SELECT unnest(rec.ids[2:]) as old_id
        LOOP
            -- Migrate product_specification_values
            UPDATE product_specification_values
            SET canonical_value_id = target_cv_id
            WHERE canonical_value_id = canonical_rec.old_id;

            GET DIAGNOSTICS migrated = ROW_COUNT;
            RAISE NOTICE 'Dedup: migrated % refs from % to %', migrated, canonical_rec.old_id, target_cv_id;

            -- Remove the duplicate canonical value
            DELETE FROM specification_canonical_values WHERE id = canonical_rec.old_id;
        END LOOP;

        merged_groups := merged_groups + 1;
    END LOOP;

    RAISE NOTICE 'Dedup: merged % groups of duplicate canonical values', merged_groups;
END $$;
