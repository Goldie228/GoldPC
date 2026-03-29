# Аудит сравнения по категориям (актуально после правок движка)

Источник: прогон `npm run comparison-audit` (4 товара на лист категории, merged specs + описание).

**Поколоночная разборка по выборке:** после прогона обновите таблицы командой `npm run comparison-audit:docs` — скрипт читает последний `out/report-*.json` и пишет файлы в [`categories/README.md`](categories/README.md) (по одному файлу на листовую категорию).

**Один файл «как на сайте»** (все категории, все строки, ✓ на преимуществах): `npm run comparison-audit:full-md` → `scripts/comparison-audit/out/full-comparison-tables-<timestamp>.md` (папка `out/` локальная, в git не коммитится).

## Принцип

Подсветка = «лучше по правилу». Если данных недостаточно или смысл спорный — режим `none` или только совместимость.

## Автоматический fallback (наушники, клавиатура, мышь)

В [`comparisonEngine.ts`](../../src/frontend/src/utils/comparison/comparisonEngine.ts): если для ключа **нет записи** в [`CATEGORY_RULES`](../../src/frontend/src/utils/comparison/comparisonRules.ts) для канонического ключа, правило по умолчанию `none`, и **все непустые** значения распознаются как boolean («Да»/«Нет» и т.д.), строка сравнивается как **max boolean** («Да» лучше «Нет»). Если для ключа есть **явное правило категории** (включая `mode: none` для опции вроде USB-порта), fallback **не** перекрывает его. Явные алиасы — в [`comparisonRules.ts`](../../src/frontend/src/utils/comparison/comparisonRules.ts) (`HEADPHONE_SPEC_ALIASES`, `KEYBOARD_SPEC_ALIASES`, RAM и т.д.).

## По категориям

| Категория | Статус | Заметки |
|-----------|--------|---------|
| **ram** | OK | Алиасы `частота`→`frequency`, `общий_объем`/`напряжение_питания` и т.д. Частота и объём подсвечиваются осмысленно. CAS latency min — ок при парсинге `22T`. |
| **psu** | OK | `wattage` max; `modular` — строка «модульный» учитывается как true. |
| **gpu** | OK | Длина/высота карты — **без** подсветки (габарит, не «лучше»). VRAM, TDP, шина памяти — с подсветкой; пустые значения дают неполную картину — данные. |
| **processors** | OK | Ядра/потоки max; TDP min — экономичность, не всегда «лучше CPU» (осознанный компромисс). |
| **motherboards** | OK | Слоты/ max памяти max; сокет и тип памяти — compatibility. |
| **storage** | OK | `capacity`: сравнение в **ГБ** в движке ([`parseStorageCapacityToGb`](../../src/frontend/src/utils/comparison/comparisonEngine.ts)): ТБ × 1000, голые числа считаются ГБ; регэкспы без `\b` после кириллицы. При желании дополнительно нормализовать импорт на бэкенде. |
| **monitors** | Исправлено | Если в данных `refresh_rate` = строки `true`/`false`, движок возвращает **none** (не Гц). При импорте JSON для мониторов **boolean** в `refresh_rate` не сохраняется ([`CatalogJsonImporter.cs`](../../src/CatalogService/Services/CatalogJsonImporter.cs)). При числовых Гц — max. |
| **headphones** | Исправлено | **Вес** — режим **none**. `регулятор_громкости` и `регулировка_громкости` мапятся на одно правило. Остальное: явные правила + **boolean fallback** только для ключей без явного правила категории. |
| **mice** | OK | DPI max; часть опций комплектации — явный `none` в правилах; остальное — boolean fallback для неизвестных ключей. |
| **keyboards** | OK | interface compatibility; алиас `usbпорт`/`usbпорт_для_периферии` → `usb_aux` (`none`); часть полей — явный `none`; остальное — fallback. |
| **cases** | OK | form_factor compatibility. |
| **coolers** | OK | socket compatibility. |

## Следующие шаги (данные / бэкенд)

1. Мониторы: писать в `refresh_rate` число Гц, не boolean.
2. Накопители: по желанию единый формат ёмкости уже в импорте (фронт нормализует ТБ/ГБ/голые числа как ГБ).
3. По желанию: расширять алиасы в `comparisonRules` для числовых ключей (где fallback не срабатывает).
