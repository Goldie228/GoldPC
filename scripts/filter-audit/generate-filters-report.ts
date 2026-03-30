/**
 * Генерирует полный отчёт по фильтрам для всех категорий каталога.
 * Обходит категории через backend API и собирает структуру всех доступных фильтров
 * и их возможных значений/диапазонов без перебора комбинаций.
 *
 * Запуск из корня репозитория (нужен поднятый Catalog API, например ./scripts/dev-local.sh):
 *   npx tsx scripts/filter-audit/generate-filters-report.ts
 *   CATALOG_API_BASE=http://localhost:5000 npx tsx scripts/filter-audit/generate-filters-report.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { specLabel, formatSpecValueForKey } from '../../src/frontend/src/utils/specifications';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.join(__dirname, 'out');

// === Типы ===

interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  children?: CategoryDto[];
}

interface CategoriesResponse {
  data?: CategoryDto[];
  categories?: CategoryDto[];
}

interface FilterFacetOption {
  value: string;
  count: number;
}

interface FilterFacetAttribute {
  key: string;
  displayName: string;
  filterType: 'select' | 'range';
  sortOrder: number;
  options?: FilterFacetOption[];
  minValue?: number;
  maxValue?: number;
}

interface FilterFacetsResponse {
  data?: FilterFacetAttribute[];
}

// Маппинг backend slug → человекочитаемое название (для отчёта)
const CATEGORY_LABELS: Record<string, string> = {
  processors: 'Процессоры',
  gpu: 'Видеокарты',
  motherboards: 'Материнские платы',
  ram: 'Оперативная память',
  storage: 'Накопители',
  psu: 'Блоки питания',
  cases: 'Корпуса',
  coolers: 'Системы охлаждения',
  monitors: 'Мониторы',
  keyboards: 'Клавиатуры',
  mice: 'Мыши',
  headphones: 'Наушники',
};

// === Утилиты ===

function collectLeafCategories(nodes: CategoryDto[]): CategoryDto[] {
  const out: CategoryDto[] = [];
  for (const n of nodes) {
    const children = n.children ?? [];
    if (children.length === 0) {
      out.push(n);
    } else {
      out.push(...collectLeafCategories(children));
    }
  }
  return out;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status} ${url}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

function escapeMdCell(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function formatFilterValue(key: string, value: string): string {
  // Используем форматирование из specifications.ts
  const formatted = formatSpecValueForKey(key, value);
  return escapeMdCell(formatted);
}

function timestamp(): string {
  const d = new Date();
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${Y}${M}${D}-${h}${m}${s}`;
}

// === Сбор данных ===

interface CategoryFilterData {
  categorySlug: string;
  categoryName: string;
  productCount: number;
  filters: FilterFacetAttribute[];
}

async function collectFilterData(apiBase: string): Promise<CategoryFilterData[]> {
  console.log(`Получаю дерево категорий: ${apiBase}/api/v1/catalog/categories`);
  const catResp = await fetchJson<CategoriesResponse>(`${apiBase}/api/v1/catalog/categories`);
  const allCategories = catResp.data ?? catResp.categories ?? [];

  const leafCategories = collectLeafCategories(allCategories);
  console.log(`Найдено листовых категорий: ${leafCategories.length}`);

  // Фильтруем категории с продуктами
  const withProducts = leafCategories.filter((c) => (c.productCount ?? 0) > 0);
  console.log(`Категорий с товарами: ${withProducts.length}`);

  const result: CategoryFilterData[] = [];

  for (const cat of withProducts) {
    const slug = cat.slug;
    const displayName = CATEGORY_LABELS[slug] ?? cat.name;
    
    console.log(`[${slug}] Загрузка фильтров...`);
    
    try {
      const facetsUrl = `${apiBase}/api/v1/catalog/categories/${slug}/filter-facets`;
      const facetsResp = await fetchJson<FilterFacetsResponse>(facetsUrl);
      const filters = facetsResp.data ?? [];
      
      // Сортируем по sortOrder
      filters.sort((a, b) => a.sortOrder - b.sortOrder);
      
      console.log(`[${slug}] Получено фильтров: ${filters.length}`);
      
      result.push({
        categorySlug: slug,
        categoryName: displayName,
        productCount: cat.productCount ?? 0,
        filters,
      });
    } catch (err) {
      console.error(`[${slug}] Ошибка загрузки фильтров:`, err);
      // Продолжаем с другими категориями
      result.push({
        categorySlug: slug,
        categoryName: displayName,
        productCount: cat.productCount ?? 0,
        filters: [],
      });
    }
  }

  return result;
}

// === Генерация Markdown ===

function generateMarkdown(data: CategoryFilterData[], apiBase: string): string {
  const lines: string[] = [];
  
  // Заголовок
  lines.push('# Отчёт по фильтрам каталога');
  lines.push('');
  lines.push(`**Дата генерации:** ${new Date().toLocaleString('ru-RU')}`);
  lines.push(`**API:** ${apiBase}`);
  lines.push(`**Категорий обработано:** ${data.length}`);
  
  const totalFilters = data.reduce((sum, cat) => sum + cat.filters.length, 0);
  lines.push(`**Всего фильтров:** ${totalFilters}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  
  // Оглавление
  lines.push('## Оглавление');
  lines.push('');
  for (const cat of data) {
    const anchor = cat.categorySlug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    lines.push(`- [${cat.categoryName} (${cat.categorySlug})](#${anchor})`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  
  // Секции по категориям
  for (const cat of data) {
    lines.push(`## ${cat.categoryName} (\`${cat.categorySlug}\`)`);
    lines.push('');
    lines.push(`**Товаров в категории:** ${cat.productCount}`);
    lines.push(`**Фильтров:** ${cat.filters.length}`);
    lines.push('');
    
    if (cat.filters.length === 0) {
      lines.push('*Фильтры не найдены или не загружены.*');
      lines.push('');
      continue;
    }
    
    // Таблица фильтров
    for (const filter of cat.filters) {
      const displayName = filter.displayName || specLabel(filter.key);
      lines.push(`### ${displayName} (\`${filter.key}\`)`);
      lines.push('');
      lines.push(`**Тип:** ${filter.filterType === 'select' ? 'Выбор' : 'Диапазон'}`);
      
      if (filter.filterType === 'select') {
        const options = filter.options ?? [];
        lines.push(`**Вариантов:** ${options.length}`);
        lines.push('');
        
        if (options.length > 0) {
          // Создаём таблицу со значениями
          lines.push('| Значение | Форматированное |');
          lines.push('|----------|-----------------|');
          
          for (const opt of options) {
            const rawValue = escapeMdCell(opt.value);
            const formatted = formatFilterValue(filter.key, opt.value);
            lines.push(`| ${rawValue} | ${formatted} |`);
          }
          lines.push('');
        } else {
          lines.push('*Нет доступных значений.*');
          lines.push('');
        }
      } else if (filter.filterType === 'range') {
        lines.push('');
        
        if (filter.minValue !== undefined && filter.maxValue !== undefined) {
          const minRaw = filter.minValue;
          const maxRaw = filter.maxValue;
          
          // Для некоторых ключей показываем человекочитаемые единицы
          const isVideoMemory = filter.key === 'videopamyat' || filter.key === 'vram';
          
          if (isVideoMemory) {
            // Конвертируем из МБ в ГБ
            const minGB = (minRaw / 1024).toFixed(2);
            const maxGB = (maxRaw / 1024).toFixed(2);
            lines.push(`**Диапазон (сырые МБ):** ${minRaw} – ${maxRaw}`);
            lines.push(`**Диапазон (ГБ):** ${minGB} – ${maxGB}`);
          } else {
            lines.push(`**Диапазон:** ${minRaw} – ${maxRaw}`);
          }
        } else {
          lines.push('*Диапазон не определён.*');
        }
        lines.push('');
      }
    }
    
    lines.push('---');
    lines.push('');
  }
  
  return lines.join('\n');
}

// === Основная функция ===

async function main(): Promise<void> {
  const apiBase = process.env['CATALOG_API_BASE'] || 'http://localhost:5000';
  
  console.log('=== Генерация отчёта по фильтрам ===');
  console.log(`API: ${apiBase}`);
  console.log('');
  
  // Собираем данные
  const data = await collectFilterData(apiBase);
  
  // Генерируем markdown
  console.log('');
  console.log('Генерация markdown...');
  const markdown = generateMarkdown(data, apiBase);
  
  // Записываем файл
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
  
  const outFilename = `filters-report-${timestamp()}.md`;
  const outPath = path.join(OUT_DIR, outFilename);
  fs.writeFileSync(outPath, markdown, 'utf-8');
  
  console.log('');
  console.log(`✓ Отчёт сохранён: ${outPath}`);
  console.log(`  Категорий: ${data.length}`);
  
  const totalFilters = data.reduce((sum, cat) => sum + cat.filters.length, 0);
  const totalOptions = data.reduce((sum, cat) => {
    return sum + cat.filters.reduce((fSum, f) => {
      if (f.filterType === 'select' && f.options) {
        return fSum + f.options.length;
      }
      return fSum;
    }, 0);
  }, 0);
  
  console.log(`  Фильтров: ${totalFilters}`);
  console.log(`  Опций (select): ${totalOptions}`);
}

main().catch((err) => {
  console.error('Ошибка:', err);
  process.exit(1);
});
