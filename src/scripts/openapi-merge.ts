/**
 * Скрипт объединения OpenAPI-спецификаций из всех микросервисов GoldPC.
 *
 * Запуск: npx tsx src/scripts/openapi-merge.ts
 *
 * Скрипт обращается к каждому запущенному сервису, получает swagger.json,
 * объединяет paths и components/schemas в единую спецификацию OpenAPI 3.0.
 * Конфликты имён схем разрешаются добавлением префикса имени сервиса.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Конфигурация сервисов ────────────────────────────────────────────────────
interface ServiceConfig {
  name: string;       // Уникальный префикс для схем
  label: string;      // Человекочитаемое имя для info
  url: string;        // URL swagger.json
}

const SERVICES: ServiceConfig[] = [
  { name: 'Catalog',    label: 'CatalogService',    url: 'http://localhost:5000/swagger/v1/swagger.json' },
  { name: 'Auth',       label: 'AuthService',       url: 'http://localhost:5001/swagger/v1/swagger.json' },
  { name: 'Orders',     label: 'OrdersService',     url: 'http://localhost:5002/swagger/v1/swagger.json' },
  { name: 'Services',   label: 'ServicesService',   url: 'http://localhost:5003/swagger/v1/swagger.json' },
  { name: 'Warranty',   label: 'WarrantyService',   url: 'http://localhost:5004/swagger/v1/swagger.json' },
  { name: 'PCBuilder',  label: 'PCBuilderService',  url: 'http://localhost:5005/swagger/v1/swagger.json' },
  { name: 'Reporting',  label: 'ReportingService',  url: 'http://localhost:5006/swagger/v1/swagger.json' },
  { name: 'Gateway',    label: 'GoldPC Gateway',    url: 'http://localhost:5007/swagger/v1/swagger.json' },
];

// ─── Типы OpenAPI ─────────────────────────────────────────────────────────────
interface OpenApiSpec {
  openapi: string;
  info: { title: string; version: string; description?: string };
  paths: Record<string, Record<string, unknown>>;
  components?: { schemas?: Record<string, unknown>; [key: string]: unknown };
}

// ─── Загрузка спеки с одного сервиса ───────────────────────────────────────────
async function fetchSpec(service: ServiceConfig): Promise<OpenApiSpec | null> {
  try {
    const response = await fetch(service.url, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.warn(`  [SKIP] ${service.label}: HTTP ${response.status}`);
      return null;
    }
    return (await response.json()) as OpenApiSpec;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`  [SKIP] ${service.label}: ${msg}`);
    return null;
  }
}

// ─── Префиксация схемы при конфликте ──────────────────────────────────────────
function prefixSchema(
  schemaName: string,
  schema: unknown,
  prefix: string,
): Record<string, unknown> {
  return { [`${prefix}${schemaName}`]: schema };
}

// ─── Основная логика мержа ─────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('=== GoldPC OpenAPI Merger ===\n');
  console.log('Сервисы для объединения:');
  for (const s of SERVICES) {
    console.log(`  - ${s.label} (${s.url})`);
  }
  console.log('');

  const merged: OpenApiSpec = {
    openapi: '3.0.1',
    info: {
      title: 'GoldPC API',
      version: 'v1',
      description: 'Объединённая OpenAPI-спецификация всех микросервисов GoldPC.',
    },
    paths: {},
    components: { schemas: {} },
  };

  const loadedServices: string[] = [];

  for (const service of SERVICES) {
    console.log(`[*] Загрузка: ${service.label} ...`);
    const spec = await fetchSpec(service);
    if (!spec) continue;

    loadedServices.push(service.label);

    // ── Merge paths ──
    const pathCount = Object.keys(spec.paths || {}).length;
    for (const [path, methods] of Object.entries(spec.paths || {})) {
      if (merged.paths[path]) {
        console.warn(`  [WARN] Конфликт пути: ${path} (из ${service.label}) — пути перезаписаны`);
      }
      merged.paths[path] = methods;
    }
    console.log(`  + ${pathCount} путей`);

    // ── Merge schemas ──
    const schemas = spec.components?.schemas || {};
    const schemaNames = Object.keys(schemas);
    let renamed = 0;
    for (const schemaName of schemaNames) {
      if (merged.components!.schemas![schemaName]) {
        // Конфликт — добавляем префикс имени сервиса
        Object.assign(
          merged.components!.schemas!,
          prefixSchema(schemaName, schemas[schemaName], service.name),
        );
        renamed++;
      } else {
        merged.components!.schemas![schemaName] = schemas[schemaName];
      }
    }
    console.log(`  + ${schemaNames.length} схем (${renamed} переименовано с префиксом "${service.name}")`);
  }

  console.log(`\n=== Итого ===`);
  console.log(`Загружено сервисов: ${loadedServices.length}/${SERVICES.length}`);
  if (loadedServices.length < SERVICES.length) {
    const missing = SERVICES.filter(s => !loadedServices.includes(s.label)).map(s => s.label);
    console.log(`Недоступны: ${missing.join(', ')}`);
  }
  console.log(`Путей: ${Object.keys(merged.paths).length}`);
  console.log(`Схем: ${Object.keys(merged.components!.schemas!).length}`);

  // ── Запись результата ──
  const outDir = resolve(__dirname, '..', 'frontend', 'openapi');
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, 'gateway.json');
  writeFileSync(outPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
  console.log(`\n[*] Записано: ${outPath}`);
}

main().catch((err) => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});
