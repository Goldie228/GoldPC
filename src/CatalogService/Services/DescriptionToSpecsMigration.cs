using System.Globalization;
using System.Text.RegularExpressions;
using CatalogService.Data;
using CatalogService.Models;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Services;

/// <summary>
/// Миграция: перенос характеристик из текстового description 
/// в структурированные product_specification_values
/// </summary>
public partial class DescriptionToSpecsMigration
{
    private readonly CatalogDbContext _context;
    private readonly ILogger<DescriptionToSpecsMigration> _logger;

    public DescriptionToSpecsMigration(
        CatalogDbContext context,
        ILogger<DescriptionToSpecsMigration> logger)
    {
        _context = context;
        _logger = logger;
    }

    // ========================================================================
    // Маппинг русских ключей из description → specification_attributes.key
    // ========================================================================
    private static readonly Dictionary<string, string> KeyMapping = new(StringComparer.OrdinalIgnoreCase)
    {
        // --- Процессор ---
        ["Сокет"] = "socket",
        ["Количество ядер"] = "cores",
        ["Максимальное количество потоков"] = "threads",
        ["Потоков"] = "threads",
        ["Базовая тактовая частота"] = "base_freq",
        ["Базовая частота"] = "base_freq",
        ["Максимальная частота"] = "max_freq",
        ["Макс. частота"] = "max_freq",
        ["Кэш L2"] = "cache_l2",
        ["Кэш L3"] = "cache_l3",
        ["TDP"] = "tdp",
        ["Расчетная тепловая мощность (TDP)"] = "tdp",
        ["Техпроцесс"] = "process_nm",
        ["Архитектура"] = "architecture",
        ["Кодовое название кристалла"] = "codename",
        ["Кодовое название"] = "codename",
        ["Многопоточность ядра"] = "multithreading",
        ["Многопоточность"] = "multithreading",
        ["Встроенная графика"] = "integrated_graphics",
        ["Поддержка памяти"] = "memory_support",
        ["Количество каналов памяти"] = "memory_channels",
        ["Каналы памяти"] = "memory_channels",
        ["Макс. частота памяти"] = "max_memory_freq",
        ["Охлаждение в комплекте"] = "cooling_included",
        ["Тип поставки"] = "delivery_type",
        ["Модельный ряд"] = "model_series",

        // --- Память ---
        ["Тип"] = "type",
        ["Объем"] = "capacity",
        ["Общий объем"] = "capacity",
        ["Объем одного модуля"] = "capacity_per_module",
        ["Объём модуля"] = "capacity_per_module",
        ["Частота"] = "frequency",
        ["CAS Latency"] = "cas_latency",
        ["Напряжение питания"] = "voltage",
        ["Напряжение"] = "voltage",
        ["ECC"] = "ecc",
        ["PC-индекс"] = "pc_index",
        ["Профили Intel XMP"] = "xmp",
        ["Профили XMP"] = "xmp",
        ["Профили AMD EXPO"] = "expo",
        ["Поддержка AMD EXPO"] = "expo",
        ["Цвет"] = "color",
        ["Цвет корпуса"] = "color",
        ["Цвет наушников"] = "color",
        ["Цвет зарядного кейса"] = "color",
        ["Форм-фактор"] = "form_factor",
        ["Форм-фактор памяти"] = "memory_form_factor",

        // --- Общие (разные категории) ---
        ["Назначение"] = "purpose",
        ["Конструкция"] = "design",
        ["Акустическое оформление"] = "acoustic_design",
        ["Материал корпуса"] = "material",

        // --- Периферия / Аудио (наушники, гарнитуры) ---
        ["Цвет кабеля"] = "cable_color",
        ["Длина кабеля"] = "cable_length",
        ["Тип излучателя"] = "emitter_type",
        ["Диаметр излучателя"] = "driver_size",
        ["Диаметр драйвера"] = "driver_size",
        ["Номинальное сопротивление"] = "impedance",
        ["Сопротивление"] = "impedance",
        ["Импеданс"] = "impedance",
        ["Чувствительность"] = "sensitivity",
        ["Нижняя граница частотного диапазона"] = "frequency_range_low",
        ["Верхняя граница частотного диапазона"] = "frequency_range_high",
        ["Верхняя граница част. диапазона"] = "frequency_range_high",
        ["Активное шумоподавление"] = "noise_cancelling",
        ["Шумоподавление микрофона"] = "microphone_noise_reduction",
        ["Функции управления звуком"] = "sound_control",
        ["Регулятор громкости"] = "volume_control",
        ["Количество наушников гарнитуры"] = "headphone_count",
        ["Крепление"] = "mount_type",
        ["Складная конструкция"] = "foldable",
        ["Материал амбушюр"] = "ear_cushion_material",
        ["Материал покрытия оголовья/дужки"] = "headband_material",
        ["Объёмное звучание"] = "surround_sound",
        ["Конструкция микрофона"] = "microphone_design",
        ["Подключение кабеля"] = "cable_connection",
        ["Форма штекера"] = "connector_shape",
        ["Штекер"] = "connector",
        ["Беспроводной интерфейс"] = "wireless_protocols",
        ["Пыле-, влаго-, ударопрочность"] = "dust_water_resistance",

        // --- Видеокарта ---
        ["Графический процессор"] = "graficheskiy_protsessor",
        ["Производитель ГП"] = "proizvoditel_graficheskogo_protsessora",
        ["Тип видеопамяти"] = "tip_videopamyati",
        ["Объём видеопамяти"] = "videopamyat",
        ["Видеопамять"] = "videopamyat",
        ["Ширина шины памяти"] = "shirina_shiny_pamyati",
        // "Интерфейс" — общий ключ, маппится ниже в разделе накопителей
        ["Охлаждение"] = "okhlazhdenie_1",
        ["Разъёмы питания"] = "razyemy_pitaniya",
        ["Рекомендуемый БП"] = "rekomenduemyy_blok_pitaniya",
        ["Рек. БП"] = "rekomenduemyy_blok_pitaniya",
        ["Длина видеокарты"] = "dlina_videokarty",
        ["Высота видеокарты"] = "vysota_videokarty",
        ["Серия GPU"] = "gpu",

        // --- Накопители ---
        ["Интерфейс"] = "interface",
        ["Протокол"] = "protocol",
        ["Тип Flash"] = "flash_type",
        ["Тип флеш-памяти"] = "flash_type",
        ["Скорость чтения"] = "read_speed",
        ["Чтение"] = "read_speed",
        ["Скорость записи"] = "write_speed",
        ["Запись"] = "write_speed",
        ["TBW"] = "tbw",
        ["Ресурс TBW"] = "tbw",

        // --- Монитор ---
        ["Диагональ"] = "diagonal",
        ["Разрешение"] = "resolution",
        ["Частота обновления экрана"] = "refresh_rate",
        ["Частота обновления"] = "refresh_rate",
        ["Матрица"] = "matrix",
        ["Время отклика"] = "response_time",
        ["Отклик"] = "response_time",
        ["Яркость"] = "brightness",
        ["Соотношение сторон"] = "aspect_ratio",
        ["Изогнутый экран"] = "curved",
        ["Технология синхронизации"] = "sync_technology",
        ["Синхронизация"] = "sync_technology",

        // --- Корпус ---
        ["Материал корпуса"] = "material",
        ["Материал"] = "material",
        ["Передняя панель корпуса"] = "material_front",
        ["Передняя панель"] = "material_front",
        ["Прозрачное окно"] = "window",
        ["Боковая панель"] = "window",
        ["Макс. длина видеокарты"] = "max_gpu_length",
        ["Макс. длина ВК"] = "max_gpu_length",
        ["Максимальная длина видеокарты"] = "max_gpu_length",
        ["Макс. высота кулера"] = "max_cooler_height",
        ["Максимальная высота кулера"] = "max_cooler_height",
        ["Кол-во вентиляторов в комплекте"] = "fan_count",
        ["Количество мест для вентиляторов"] = "fan_count",
        ["Вентиляторы в комплекте"] = "fan_count",

        // --- Блок питания ---
        ["Мощность"] = "wattage",
        ["Сертификат"] = "efficiency",
        ["Модульный"] = "modular",
        ["Модульность"] = "modular",

        // --- Периферия ---
        ["DPI"] = "dpi",
        ["Тип сенсора"] = "sensor_type",
        ["Сенсор"] = "sensor_type",
        ["Беспроводной протокол"] = "wireless_protocols",
        ["Беспроводной интерфейс"] = "wireless_protocols",
        ["Тип подключения"] = "connection_type",
        ["Подключение"] = "connection",

        // --- Аудио ---
        ["Диаметр драйвера"] = "driver_size",
        ["Сопротивление"] = "impedance",
        ["Импеданс"] = "impedance",
        ["Диапазон частот"] = "frequency_range",
        ["Частотный диапазон"] = "frequency_range",
        // "Нижняя граница частотного диапазона" маппится на frequency_range_low выше, в общих атрибутах
        ["Шум"] = "noise",
        ["Уровень шума"] = "noise",

        // --- Дата ---
        ["Дата выхода на рынок"] = "data_vykhoda_na_rynok",
        ["Год выхода"] = "release_year",

        // --- Чипсет ---
        ["Чипсет"] = "chipset",

        // --- Слоты памяти (материнские платы) ---
        ["Слотов памяти"] = "memory_slots",
        ["Тип памяти"] = "memory_type",
        ["Макс. память"] = "max_memory",

        // --- Вентиляторы / Охлаждение (дополнительно) ---
        ["Диаметр вентилятора"] = "fan_size",
        ["Количество вентиляторов"] = "fan_count",
        ["Минимальная скорость вращения"] = "min_fan_rpm",
        ["Максимальная скорость вращения"] = "max_fan_rpm",
        ["Контроль скорости вращения (PWM)"] = "pwm_control",
        ["Максимальный воздушный поток"] = "max_airflow",
        ["Максимальный уровень шума"] = "max_noise",
        ["Подшипник"] = "bearing_type",
        ["Тип подключения подсветки"] = "rgb_connector",
        ["Термоконтроль"] = "thermal_control",
        ["Виброизоляция"] = "vibration_dampening",
        ["Подсветка корпуса"] = "case_lighting",
        ["Тепловые трубки"] = "heat_pipes",
        ["Встроенный дисплей на радиаторе"] = "radiator_display",
        ["Встроенный дисплей на водоблоке"] = "waterblock_display",
        ["Типоразмер СЖО"] = "liquid_cooler_size",
        ["Длина трубки"] = "tube_length",
        ["Толщина радиатора СЖО"] = "radiator_thickness",
        ["Материал радиатора"] = "radiator_material",
        ["Материал теплосъемника"] = "cold_plate_material",
        ["Ширина водоблока"] = "waterblock_width",
        ["Длина водоблока"] = "waterblock_length",
        ["Высота водоблока"] = "waterblock_height",
        ["Рассеиваемая мощность (TDP)"] = "cooler_max_tdp",
        ["Толщина системы охлаждения"] = "cooler_thickness",
        ["Испарительные камеры"] = "vapor_chambers",

        // --- Монитор (дополнительно) ---
        ["Версия HDMI"] = "hdmi_version",
        ["Версия DisplayPort"] = "displayport_version",
        ["vga (d-sub)"] = "vga_port",
        ["DVI"] = "dvi_port",
        ["HDMI"] = "hdmi_port",
        ["DisplayPort"] = "displayport_port",
        ["USB Type-C"] = "usb_type_c",
        ["Крепление VESA"] = "vesa_mount",
        ["Отсутствие мерцания (Flicker-Free)"] = "flicker_free",
        ["Поверхность экрана"] = "screen_finish",
        ["Угол обзора по горизонтали"] = "viewing_angle_h",
        ["Угол обзора по вертикали"] = "viewing_angle_v",
        ["Встроенные динамики"] = "built_in_speakers",
        ["Автоматическая регулировка яркости"] = "auto_brightness",
        ["Расширенный динамический диапазон (HDR)"] = "hdr_support",
        ["Регулировка высоты подставки"] = "height_adjustment",
        ["Портретный режим"] = "pivot_mode",
        ["Поворот вправо-влево"] = "swivel",
        ["Сенсорный экран"] = "touchscreen",
        ["Безрамочный дизайн"] = "frameless_design",
        ["LED-подсветка"] = "led_backlight",
        ["Цвет подставки"] = "stand_color",

        // --- Видеокарта (дополнительно) ---
        ["Производитель графического процессора"] = "proizvoditel_graficheskogo_protsessora",
        ["Микроархитектура"] = "microarchitecture",
        ["Кодовое имя чипа"] = "codename",
        ["Количество потоковых процессоров"] = "stream_processors",
        ["Количество RT-ядер"] = "rt_cores",
        ["Эффективная частота памяти"] = "memory_effective_freq",
        ["Пропускная способность памяти"] = "memory_bandwidth",
        ["Поддержка DirectX"] = "directx_support",
        ["Трассировка лучей"] = "ray_tracing",
        ["«Разогнанная» версия"] = "overclocked_version",
        ["Толщина видеокарты"] = "vysota_videokarty",
        ["Крепление для наушников"] = "headphone_hook",

        // --- Периферия (дополнительно) ---
        ["Wi-Fi"] = "wifi",
        ["WiFi"] = "wifi",
        ["Bluetooth"] = "bluetooth",
        ["Беспроводная зарядка"] = "wireless_charging",

        // --- Корпус (дополнительно) ---
        ["Антивибрационные прокладки"] = "anti_vibration_pads",
        ["Блок питания"] = "psu_included",

        // --- Накопители (дополнительно) ---
        ["Кэш L1"] = "cache_l1",

        // --- Габариты ---
        ["Вес"] = "weight",
        ["Длина"] = "length",
        ["Ширина"] = "width",
        ["Высота (толщина)"] = "height",
        ["Высота"] = "height",
        ["Глубина"] = "depth",

        // --- Комплектация ---
        ["Комплект сменных амбушюр"] = "spare_ear_cushions",
        ["Комплект фиксаторов"] = "spare_fasteners",
    };

    /// <summary>
    /// Ключи-секции (заголовки) — строки, которые не являются парами ключ-значение
    /// </summary>
    private static readonly HashSet<string> SectionHeaders = new(StringComparer.OrdinalIgnoreCase)
    {
        "Общая информация", "Основные", "Технические характеристики",
        "Технические характеристики корпуса", "Конструкция", "Конструктивные характеристики",
        "Особенности конструкции", "Кабель", "Питание", "Дополнительная информация",
        "Габариты", "Размеры и вес", "Комплектация", "Звук", "Микрофон", "Аккумулятор и время работы",
        "Метки", "Функциональные особенности", "Экран", "Интерфейс",
        "Вентилятор", "Помпа и водоблок",
    };

    /// <summary>
    /// Единицы измерения для парсинга чисел из значений
    /// </summary>
    private static readonly (string Unit, string RegexPattern)[] UnitPatterns =
    {
        ("ГГц", @"[\d\s,]+(?=\s*ГГц)"),
        ("МГц", @"[\d\s,]+(?=\s*МГц)"),
        ("МБ/с", @"[\d\s,]+(?=\s*МБ/с)"),
        ("МБ", @"[\d\s,]+(?=\s*МБ(?!/))"),
        ("ГБ", @"[\d\s,]+(?=\s*ГБ)"),
        ("ТБ", @"[\d\s,]+(?=\s*ТБ)"),
        ("мм", @"[\d\s,]+(?=\s*мм)"),
        ("нм", @"[\d\s,]+(?=\s*нм)"),
        ("Вт", @"[\d\s,]+(?=\s*Вт)"),
        ("В", @"[\d\s,]+(?=\s*В(?!т))"),
        ("Ом", @"[\d\s,]+(?=\s*Ом)"),
        ("дБ", @"[\d\s,]+(?=\s*дБ)"),
        ("кд/м²", @"[\d\s,]+(?=\s*кд/м²)"),
        ("мс", @"[\d\s,]+(?=\s*мс)"),
        ("бит", @"[\d\s,]+(?=\s*бит)"),
        ("ppi", @"[\d\s,]+(?=\s*ppi)"),
        ("%", @"[\d\s,]+(?=\s*%)"),
        ("°", @"[\d\s,]+(?=\s*°)"),
    };

    /// <summary>
    /// Запустить миграцию description → specifications
    /// </summary>
    public async Task<MigrationResult> MigrateAsync()
    {
        _logger.LogInformation("Starting description → specs migration");

        var result = new MigrationResult();

        // Очистка legacy-мусора: удаляем неправильные значения type,
        // которые были записаны старым импортом (например, "Конструкция микрофона" → type)
        await CleanupLegacyDataAsync();

        // Очистка многосокетных записей, оставшихся от предыдущего прогона миграции
        // (когда всё значение "AM5, AM4, LGA1700, ..." сохранялось в одну запись socket).
        // Сейчас такие значения должны быть разбиты на отдельные записи по каждому сокету.
        await CleanupMultiValueSocketRecordsAsync();

        // Загружаем все атрибуты для быстрого поиска
        var allAttrs = await _context.SpecificationAttributes
            .Include(a => a.CanonicalValues)
            .ToListAsync();
        var attrByKey = allAttrs.ToDictionary(a => a.Key, StringComparer.OrdinalIgnoreCase);

        // Загружаем товары с описанием
        var products = await _context.Products
            .Where(p => p.Description != null && p.Description.Trim() != "")
            .Include(p => p.SpecificationValues)
            .ToListAsync();

        _logger.LogInformation("Loaded {Count} products with descriptions", products.Count);

        foreach (var product in products)
        {
            try
            {
                await ProcessProductAsync(product, attrByKey, result);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error processing product {ProductId} ({Name})", product.Id, product.Name);
                result.Errors++;
                // После исключения DbContext может быть в faulted state — сбрасываем ChangeTracker,
                // чтобы следующие товары могли обрабатываться.
                _context.ChangeTracker.Clear();
            }
        }

        _logger.LogInformation(
            "Migration complete: {Processed} processed, {ParsedPairs} parsed, {Mapped} mapped, {Saved} saved, {Skipped} skipped, {Errors} errors",
            result.Processed, result.ParsedPairs, result.Mapped, result.Saved, result.Skipped, result.Errors);

        return result;
    }

    private async Task ProcessProductAsync(
        Product product,
        Dictionary<string, SpecificationAttribute> attrByKey,
        MigrationResult result)
    {
        if (string.IsNullOrWhiteSpace(product.Description))
            return;

        result.Processed++;
        var lines = product.Description.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        var existingKeys = new HashSet<Guid>(
            product.SpecificationValues.Select(v => v.AttributeId));

        foreach (var rawLine in lines)
        {
            var line = rawLine.Trim();
            if (string.IsNullOrWhiteSpace(line))
                continue;

            // Пропускаем заголовки секций
            if (SectionHeaders.Contains(line.TrimEnd(':', ' ')))
                continue;

            // Парсим "Ключ: Значение"
            var colonIdx = line.IndexOf(':');
            if (colonIdx <= 0)
                continue;

            result.ParsedPairs++;
            var keyPart = line[..colonIdx].Trim();
            var valuePart = line[(colonIdx + 1)..].Trim();

            if (string.IsNullOrWhiteSpace(keyPart) || string.IsNullOrWhiteSpace(valuePart))
                continue;

            // Ищем атрибут по маппингу
            if (!KeyMapping.TryGetValue(keyPart, out var attrKey))
            {
                result.Skipped++;
                continue;
            }

            if (!attrByKey.TryGetValue(attrKey, out var attr))
            {
                _logger.LogDebug("Attribute {Key} not found in DB, skipping", attrKey);
                result.Skipped++;
                continue;
            }

            // Пропускаем если уже есть значение для этого атрибута
            if (existingKeys.Contains(attr.Id))
                continue;

            // Создаём значение. Для мультизначных полей (например, socket у кулеров
            // — "AM5, AM4, LGA1700, LGA1150, ...") возвращается список отдельных записей,
            // чтобы фасеты фильтров и PC Builder видели каждый сокет как опцию.
            var specValues = ParseAndCreateValue(product.Id, attr, valuePart);
            if (specValues == null || specValues.Count == 0)
            {
                result.Skipped++;
                continue;
            }

            foreach (var sv in specValues)
            {
                _context.ProductSpecificationValues.Add(sv);
                result.Saved++;
                result.Mapped++;
            }

            // Помечаем атрибут как обработанный — даже если описание содержит
            // повторяющиеся строки, мы не будем создавать дублирующиеся записи.
            existingKeys.Add(attr.Id);

            // Сохраняем батчами по 100
            if (result.Saved % 100 == 0)
            {
                try
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Saved {Count} specification values so far", result.Saved);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Batch save failed at {Count} values — clearing tracker and continuing", result.Saved);
                    _context.ChangeTracker.Clear();
                    result.Errors++;
                }
            }
        }

        // Не сохраняем после каждого товара — только батчами
    }

    private List<ProductSpecificationValue>? ParseAndCreateValue(
        Guid productId,
        SpecificationAttribute attr,
        string valueText)
    {
        valueText = valueText.Trim().TrimEnd('.');

        if (attr.ValueType == SpecificationAttributeValueType.Range)
        {
            // Пробуем извлечь число
            var number = ExtractNumber(valueText);
            if (number.HasValue)
            {
                return new List<ProductSpecificationValue>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        ProductId = productId,
                        AttributeId = attr.Id,
                        ValueNumber = number.Value,
                    }
                };
            }

            // Если число не извлеклось, возможно это дата (год)
            if (int.TryParse(valueText.TrimEnd('г', ' ', '.'), out var year) && year > 1900 && year < 2100)
            {
                return new List<ProductSpecificationValue>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        ProductId = productId,
                        AttributeId = attr.Id,
                        ValueNumber = year,
                    }
                };
            }

            // Не смогли распарсить число
            return null;
        }

        // Select-атрибут. Для мультизначных полей (например, socket у кулеров:
        // "AM5, AM4, LGA1700, LGA1150, ...") разбиваем на отдельные записи —
        // иначе фасет фильтра и PC Builder не смогут работать с каждой опцией.
        var rawValues = SplitMultiValue(valueText, attr.Key);
        if (rawValues.Count == 0)
            return null;

        var result = new List<ProductSpecificationValue>(rawValues.Count);
        foreach (var raw in rawValues)
        {
            var normalizedValue = NormalizeValue(raw);
            if (string.IsNullOrWhiteSpace(normalizedValue))
                continue;

            normalizedValue = NormalizeBoolean(normalizedValue);

            // Ограничиваем длину до 200 символов (лимит value_text в БД).
            if (normalizedValue.Length > 200)
            {
                normalizedValue = normalizedValue.Substring(0, 200).TrimEnd();
            }

            // Ищем существующее каноническое значение
            var canonical = attr.CanonicalValues
                .FirstOrDefault(cv =>
                    cv.ValueText.Equals(normalizedValue, StringComparison.OrdinalIgnoreCase) ||
                    cv.ValueText.Replace(" ", "").Equals(normalizedValue.Replace(" ", ""), StringComparison.OrdinalIgnoreCase));

            if (canonical == null)
            {
                canonical = new SpecificationCanonicalValue
                {
                    Id = Guid.NewGuid(),
                    AttributeId = attr.Id,
                    ValueText = normalizedValue,
                    SortOrder = attr.CanonicalValues.Count,
                };
                attr.CanonicalValues.Add(canonical);
                _context.SpecificationCanonicalValues.Add(canonical);
            }

            result.Add(new ProductSpecificationValue
            {
                Id = Guid.NewGuid(),
                ProductId = productId,
                AttributeId = attr.Id,
                CanonicalValueId = canonical.Id,
                CanonicalValue = canonical,
            });
        }

        return result.Count > 0 ? result : null;
    }

    /// <summary>
    /// Разбивает многосокетное (или любое мультизначное) значение на отдельные токены.
    /// Для атрибута socket — разделяет по запятой/точке с запятой, обрезая мусор типа "(LGA2011-3,LGA2011".
    /// Для остальных атрибутов — возвращает исходное значение как один токен.
    /// </summary>
    private static List<string> SplitMultiValue(string valueText, string attrKey)
    {
        if (string.IsNullOrWhiteSpace(valueText))
            return new List<string>();

        // Атрибуты, для которых допустимо мультизначение через запятую.
        bool isMultiValueAttr = attrKey.Equals("socket", StringComparison.OrdinalIgnoreCase)
            || attrKey.Equals("memory_type", StringComparison.OrdinalIgnoreCase)
            || attrKey.Equals("supported_sockets", StringComparison.OrdinalIgnoreCase);

        if (!isMultiValueAttr)
            return new List<string> { valueText };

        // Разделяем по запятой или точке с запятой, чистим каждую часть.
        var parts = valueText
            .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(p => p.Trim().TrimEnd('.').Trim())
            .Where(p => !string.IsNullOrWhiteSpace(p))
            // Убираем явный мусор: значения, начинающиеся с "(" или ")" без смысла
            .Select(p => p.StartsWith("(") && !p.Contains(")") ? p.TrimStart('(').Trim() : p)
            .ToList();

        return parts;
    }

    private static decimal? ExtractNumber(string valueText)
    {
        // Убираем пробелы внутри чисел: "4 800" → "4800"
        valueText = Regex.Replace(valueText, @"(\d)\s+(\d)", "$1$2");

        // Ищем число перед единицей измерения
        foreach (var (_, pattern) in UnitPatterns)
        {
            var match = Regex.Match(valueText, pattern);
            if (match.Success)
            {
                var cleaned = match.Value.Replace(" ", "").Replace(",", ".");
                if (decimal.TryParse(cleaned, NumberStyles.Any, CultureInfo.InvariantCulture, out var num))
                    return num;
            }
        }

        // Пробуем просто извлечь десятичное число
        var numMatch = Regex.Match(valueText, @"(\d+[.,]?\d*)");
        if (numMatch.Success)
        {
            var cleaned = numMatch.Value.Replace(",", ".");
            if (decimal.TryParse(cleaned, NumberStyles.Any, CultureInfo.InvariantCulture, out var num))
                return num;
        }

        return null;
    }

    private static string NormalizeValue(string value)
    {
        // Убираем лишние пробелы
        value = Regex.Replace(value.Trim(), @"\s+", " ");

        // Убираем точку в конце
        value = value.TrimEnd('.');

        return value;
    }

    private static string NormalizeBoolean(string value)
    {
        return value.ToLowerInvariant() switch
        {
            "да" => "Да",
            "нет" => "Нет",
            "yes" => "Да",
            "no" => "Нет",
            "true" => "Да",
            "false" => "Нет",
            "есть" => "Да",
            "нету" => "Нет",
            _ => value
        };
    }

    /// <summary>
    /// Очистка legacy-мусора: удаляет неправильные значения из прошлых импортов.
    /// </summary>
    private async Task CleanupLegacyDataAsync()
    {
        // 1) type с признаками "конструкция микрофона" (держатель) — legacy баг
        var typeAttr = await _context.SpecificationAttributes
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Key == "type");

        if (typeAttr != null)
        {
            // Загружаем все значения type в память вместе с каноническими значениями
            var allTypeValues = await _context.ProductSpecificationValues
                .Include(v => v.CanonicalValue)
                .Where(v => v.AttributeId == typeAttr.Id)
                .ToListAsync();

            var badTypeValues = allTypeValues
                .Where(v => v.CanonicalValue != null
                    && (v.CanonicalValue.ValueText.Contains("держатель", StringComparison.OrdinalIgnoreCase)
                        || v.CanonicalValue.ValueText.Contains("крепление", StringComparison.OrdinalIgnoreCase)))
                .ToList();

            if (badTypeValues.Count > 0)
            {
                _context.ProductSpecificationValues.RemoveRange(badTypeValues);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Cleaned up {Count} wrong 'type' specification values", badTypeValues.Count);
            }
        }

        // 2) Удаляем дубликаты canonical values с одинаковым текстом для одного атрибута
        var dupGroups = await _context.SpecificationCanonicalValues
            .GroupBy(cv => new { cv.AttributeId, cv.ValueText })
            .Where(g => g.Count() > 1)
            .Select(g => new { g.Key.AttributeId, g.Key.ValueText })
            .ToListAsync();

        var removedCount = 0;
        foreach (var dup in dupGroups)
        {
            var duplicates = await _context.SpecificationCanonicalValues
                .Where(cv => cv.AttributeId == dup.AttributeId && cv.ValueText == dup.ValueText)
                .OrderBy(cv => cv.SortOrder)
                .Skip(1)
                .ToListAsync();
            removedCount += duplicates.Count;
            _context.SpecificationCanonicalValues.RemoveRange(duplicates);
        }

        if (removedCount > 0)
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation("Cleaned up {Count} duplicate canonical values", removedCount);
        }
    }

    /// <summary>
    /// Удаляет старые многосокетные записи (когда в одной записи socket хранился
    /// список "AM5, AM4, LGA1700, ..."), чтобы миграция создала по отдельной записи
    /// на каждый сокет. Без этого шага миграция пропустит socket у таких товаров
    /// (existingKeys.Contains(attr.Id) == true) и фасеты фильтров не будут работать.
    /// </summary>
    private async Task CleanupMultiValueSocketRecordsAsync()
    {
        var socketAttr = await _context.SpecificationAttributes
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Key == "socket");
        if (socketAttr == null) return;

        // Загружаем все PSV с ключом socket в память и фильтруем на клиенте —
        // EF Core не может транслировать string.Contains(char) для PostgreSQL.
        var allSockets = await _context.ProductSpecificationValues
            .Include(v => v.CanonicalValue)
            .Where(v => v.AttributeId == socketAttr.Id && v.CanonicalValue != null)
            .ToListAsync();

        var multiValueSockets = allSockets
            .Where(v => v.CanonicalValue!.ValueText.Contains(',') || v.CanonicalValue!.ValueText.Contains(';'))
            .ToList();

        if (multiValueSockets.Count == 0) return;

        // Удаляем записи, но НЕ удаляем canonical values — они могут использоваться
        // другими продуктами, у которых запись не многосокетная.
        _context.ProductSpecificationValues.RemoveRange(multiValueSockets);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Cleaned up {Count} multi-value 'socket' records for re-splitting", multiValueSockets.Count);
    }

    public record MigrationResult
    {
        public int Processed { get; set; }
        public int ParsedPairs { get; set; }
        public int Mapped { get; set; }
        public int Saved { get; set; }
        public int Skipped { get; set; }
        public int Errors { get; set; }
    }
}
