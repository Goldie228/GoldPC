-- ============================================================
-- Исправление проблем качества данных фильтров
-- Запускать против: goldpc_catalog
-- ============================================================

-- 1. ЯРКОСТЬ МОНИТОРА: Разделить все value_number на 10
-- Значения хранятся ×10 (например, 2500 вместо 250 кд/м²)
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
      AND value_number > 100;  -- Исправлять только значения, явно умноженные на 10

    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RAISE NOTICE 'Яркость: исправлено % строк', affected_count;
END $$;

-- 2. ТИП НАУШНИКОВ: Очистка булевых артефактов и повреждённых значений
DO $$
DECLARE
    type_attr_id UUID;
    fixed_count INTEGER;
BEGIN
    SELECT id INTO type_attr_id FROM specification_attributes WHERE key = 'type';

    -- Удалить значения 'false' (булевый артефакт)
    DELETE FROM product_specification_values
    WHERE attribute_id = type_attr_id
      AND canonical_value_id IN (
          SELECT id FROM specification_canonical_values
          WHERE attribute_id = type_attr_id AND value_text = 'false'
      );
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Тип наушников: удалено % значений false', fixed_count;

    -- Исправить повреждённые 'поворотные чашки + (1)' -> 'поворотные чашки'
    UPDATE specification_canonical_values
    SET value_text = 'поворотные чашки'
    WHERE attribute_id = type_attr_id
      AND value_text LIKE 'поворотные чашки +%';
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Тип наушников: исправлено % повреждённых значений', fixed_count;
END $$;

-- 3. КОЛИЧЕСТВО ВЕНТИЛЯТОРОВ КУЛЕРА: Исправить мусорные значения (10, 120, 140 — вероятно диаметр)
DO $$
DECLARE
    fan_count_attr_id UUID;
    fixed_count INTEGER;
BEGIN
    SELECT id INTO fan_count_attr_id FROM specification_attributes WHERE key = 'fan_count';

    -- Установить неразумные значения fan_count в NULL (fan_count должен быть 1-4)
    UPDATE product_specification_values
    SET value_number = NULL
    WHERE attribute_id = fan_count_attr_id
      AND value_number > 10;
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Кулер fan_count: исправлено % мусорных значений', fixed_count;
END $$;

-- 4. DPI МЫШИ: Ограничить неразумные значения (макс. реалистичный DPI ~30000)
DO $$
DECLARE
    dpi_attr_id UUID;
    fixed_count INTEGER;
BEGIN
    SELECT id INTO dpi_attr_id FROM specification_attributes WHERE key = 'dpi';

    -- Установить неразумные значения DPI в NULL
    UPDATE product_specification_values
    SET value_number = NULL
    WHERE attribute_id = dpi_attr_id
      AND value_number > 30000;
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'DPI мыши: исправлено % аномальных значений', fixed_count;
END $$;

-- 5. ИМПЕДАНС НАУШНИКОВ: Исправить макс=4816 (ошибка данных)
DO $$
DECLARE
    imp_attr_id UUID;
    fixed_count INTEGER;
BEGIN
    SELECT id INTO imp_attr_id FROM specification_attributes WHERE key = 'impedance';

    -- Установить неразумные значения impedance в NULL (макс. реалистичное ~2000 Ом)
    UPDATE product_specification_values
    SET value_number = NULL
    WHERE attribute_id = imp_attr_id
      AND value_number > 2000;
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Импеданс наушников: исправлено % аномальных значений', fixed_count;
END $$;

-- 6. НОРМАЛИЗАЦИЯ БУЛЕВЫХ: Преобразование оставшихся true/false в Да/Нет
-- Бэкенд уже нормализует отображение, но давайте исправим и БД тоже
DO $$
DECLARE
    rec RECORD;
    true_cv_id UUID;
    false_cv_id UUID;
    fixed_count INTEGER;
BEGIN
    -- Для каждого атрибута спецификации, имеющего булевы канонические значения
    FOR rec IN
        SELECT DISTINCT sa.id as attr_id, sa.key
        FROM specification_canonical_values scv
        JOIN specification_attributes sa ON sa.id = scv.attribute_id
        WHERE scv.value_text IN ('true', 'false', 'True', 'False', 'TRUE', 'FALSE')
    LOOP
        -- Получить или создать нормализованные канонические значения
        SELECT id INTO true_cv_id FROM specification_canonical_values
        WHERE attribute_id = rec.attr_id AND value_text = 'Да';

        SELECT id INTO false_cv_id FROM specification_canonical_values
        WHERE attribute_id = rec.attr_id AND value_text = 'Нет';

        -- Создать, если не существуют
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

        -- Мигрировать 'true' -> 'Да'
        UPDATE product_specification_values
        SET canonical_value_id = true_cv_id
        WHERE attribute_id = rec.attr_id
          AND canonical_value_id IN (
              SELECT id FROM specification_canonical_values
              WHERE attribute_id = rec.attr_id AND value_text IN ('true', 'True', 'TRUE')
          );
        GET DIAGNOSTICS fixed_count = ROW_COUNT;
        RAISE NOTICE 'Булевый %: мигрировано % true -> Да', rec.key, fixed_count;

        -- Мигрировать 'false' -> 'Нет'
        UPDATE product_specification_values
        SET canonical_value_id = false_cv_id
        WHERE attribute_id = rec.attr_id
          AND canonical_value_id IN (
              SELECT id FROM specification_canonical_values
              WHERE attribute_id = rec.attr_id AND value_text IN ('false', 'False', 'FALSE')
          );
        GET DIAGNOSTICS fixed_count = ROW_COUNT;
        RAISE NOTICE 'Булевый %: мигрировано % false -> Нет', rec.key, fixed_count;
    END LOOP;
END $$;

-- ============================================================================
-- 7. ИСПРАВЛЕНИЕ ДВОЙНЫХ ЕДИНИЦ: Исправление сдвоенных единиц вида "3 ТБGB" в значениях ёмкости
-- ============================================================================
-- Некоторые спарсенные товары имеют value_text вида "3 ТБGB", где и русские, и
-- английские единицы появляются вместе. Исправляем путём извлечения числовой части
-- и сохранения одной нормализованной единицы.

-- 7a. Исправление значений, где русская + английская единица склеены (например "3 ТБGB")
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    UPDATE specification_canonical_values
    SET value_text = regexp_replace(value_text, '(\d+[\.,]?\d*)\s*(ТБ|ГБ|МБ)\s*(TB|GB|MB)',
                                    '\1 \2', 'g')
    WHERE value_text ~ '\d+[\.,]?\d*\s*(ТБ|ГБ|МБ)\s*(TB|GB|MB)';

    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Двойные единицы (RU+EN): исправлено % значений', fixed_count;
END $$;

-- 7b. Исправление значений, где английская + русская единица склеены (например "3GBГБ")
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    UPDATE specification_canonical_values
    SET value_text = regexp_replace(value_text, '(\d+[\.,]?\d*)\s*(TB|GB|MB)\s*(ТБ|ГБ|МБ)',
                                    '\1 \2', 'g')
    WHERE value_text ~ '\d+[\.,]?\d*\s*(TB|GB|MB)\s*(ТБ|ГБ|МБ)';

    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Двойные единицы (EN+RU): исправлено % значений', fixed_count;
END $$;

-- 7c. Нормализация русских единиц в английские: "3 ТБ" -> "3 TB", "16 ГБ" -> "16 GB"
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
    RAISE NOTICE 'Русские -> английские единицы: исправлено % значений', fixed_count;
END $$;

-- 7d. Дедупликация: слияние канонических значений, которые теперь имеют одинаковый value_text
-- например, если после шага 7c существуют и "3 TB", и "3 ТБ", объединить их
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
        -- Оставить первое, объединить остальные
        target_cv_id := rec.ids[1];

        FOR canonical_rec IN
            SELECT unnest(rec.ids[2:]) as old_id
        LOOP
            -- Мигрировать product_specification_values
            UPDATE product_specification_values
            SET canonical_value_id = target_cv_id
            WHERE canonical_value_id = canonical_rec.old_id;

            GET DIAGNOSTICS migrated = ROW_COUNT;
            RAISE NOTICE 'Дедупликация: мигрировано % ссылок из % в %', migrated, canonical_rec.old_id, target_cv_id;

            -- Удалить дублирующееся каноническое значение
            DELETE FROM specification_canonical_values WHERE id = canonical_rec.old_id;
        END LOOP;

        merged_groups := merged_groups + 1;
    END LOOP;

    RAISE NOTICE 'Дедупликация: объединено % групп дублирующихся канонических значений', merged_groups;
END $$;
