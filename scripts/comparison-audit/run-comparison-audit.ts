/**
 * Аудит подсветки «лучших» характеристик на странице сравнения.
 * Тянет категории и товары с локального Catalog API, применяет merge описания как ComparisonPage,
 * прогоняет evaluateComparison и пишет JSON + краткий Markdown в scripts/comparison-audit/out/.
 *
 * Запуск из корня репозитория (нужен поднятый Catalog, например ./scripts/dev-local.sh):
 *   npx tsx scripts/comparison-audit/run-comparison-audit.ts
 *   CATALOG_API_BASE=http://localhost:5000 npx tsx scripts/comparison-audit/run-comparison-audit.ts --per-category=4
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { evaluateComparison } from '../../src/frontend/src/utils/comparison/comparisonEngine';
import {
  getCanonicalSpecKeyForComparison,
  getComparisonRule,
} from '../../src/frontend/src/utils/comparison/comparisonRules';
import { sortSpecKeysForComparison } from '../../src/frontend/src/utils/comparison/specKeysSort';
import { specificationsWithDescriptionFallback } from '../../src/frontend/src/utils/productDescriptionSpecs';
import type { ProductSpecifications } from '../../src/frontend/src/api/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.join(__dirname, 'out');

interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  children?: CategoryDto[];
}

interface CategoriesResponse {
  data: CategoryDto[];
}

interface ProductListDto {
  id: string;
  name: string;
  slug: string;
}

interface PagedResult<T> {
  data: T[];
}

interface ProductDetailDto {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string | null;
  specifications: Record<string, unknown>;
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    if (j !== i) {
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
  }
}

function parseArgs(): { perCategory: number } {
  let perCategory = 4;
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--per-category=')) {
      const n = Number.parseInt(a.split('=')[1] ?? '', 10);
      if (!Number.isNaN(n) && n > 0) perCategory = n;
    }
  }
  return { perCategory };
}

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

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function timestampForFile(): string {
  const d = new Date();
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}

function escapeMdCell(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

async function main(): Promise<void> {
  const { perCategory } = parseArgs();
  const apiBase = (process.env.CATALOG_API_BASE ?? 'http://localhost:5000').replace(/\/$/, '');

  const categoriesRes = await fetchJson<CategoriesResponse>(`${apiBase}/api/v1/catalog/categories`);
  const leaves = collectLeafCategories(categoriesRes.data ?? []).filter((c) => c.productCount >= 1);

  type CategoryReport = {
    slug: string;
    name: string;
    productCount: number;
    sampleProductIds: string[];
    products: { id: string; name: string }[];
  };

  type Row = {
    categorySlug: string;
    categoryName: string;
    productCategoryField: string;
    specKey: string;
    canonicalSpecKey: string;
    values: unknown[];
    ruleSnapshot: { mode: string; valueType: string };
    evaluation: {
      mode: string;
      bestIndices: number[];
      compatibilityState: string | null;
    };
  };

  const categories: CategoryReport[] = [];
  const rows: Row[] = [];

  for (const leaf of leaves) {
    const listUrl = new URL(`${apiBase}/api/v1/catalog/products`);
    listUrl.searchParams.set('category', leaf.slug);
    listUrl.searchParams.set('pageSize', String(perCategory));
    listUrl.searchParams.set('page', '1');

    const list = await fetchJson<PagedResult<ProductListDto>>(listUrl.toString());
    const items = [...(list.data ?? [])];
    shuffleInPlace(items);
    if (items.length === 0) continue;

    const details: ProductDetailDto[] = [];
    for (const item of items) {
      const detail = await fetchJson<ProductDetailDto>(`${apiBase}/api/v1/catalog/products/${item.id}`);
      details.push(detail);
    }

    const merged = details.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      specifications: specificationsWithDescriptionFallback(
        p.specifications as ProductSpecifications | undefined,
        p.description ?? undefined
      ),
    }));

    const keysSet = new Set<string>();
    for (const p of merged) {
      Object.keys(p.specifications ?? {}).forEach((k) => keysSet.add(k));
    }
    const specKeys = sortSpecKeysForComparison(Array.from(keysSet));

    const categoryField = merged[0]?.category ?? leaf.slug;

    categories.push({
      slug: leaf.slug,
      name: leaf.name,
      productCount: leaf.productCount,
      sampleProductIds: merged.map((p) => p.id),
      products: merged.map((p) => ({ id: p.id, name: p.name })),
    });

    for (const key of specKeys) {
      const values = merged.map((p) => p.specifications[key]);
      const evaluation = evaluateComparison(categoryField, key, values);
      const rule = getComparisonRule(categoryField, key);
      rows.push({
        categorySlug: leaf.slug,
        categoryName: leaf.name,
        productCategoryField: categoryField,
        specKey: key,
        canonicalSpecKey: getCanonicalSpecKeyForComparison(categoryField, key),
        values,
        ruleSnapshot: { mode: rule.mode, valueType: rule.valueType },
        evaluation: {
          mode: evaluation.mode,
          bestIndices: [...evaluation.bestIndices].sort((a, b) => a - b),
          compatibilityState: evaluation.compatibilityState,
        },
      });
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = timestampForFile();
  const jsonPath = path.join(OUT_DIR, `report-${stamp}.json`);
  const mdPath = path.join(OUT_DIR, `report-${stamp}.md`);

  const report = {
    generatedAt: new Date().toISOString(),
    apiBase,
    perCategory,
    categories,
    rows,
  };

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  const highlighted = rows.filter((r) => r.evaluation.mode !== 'none');
  const mdLines: string[] = [
    `# Comparison audit (non-none rows)`,
    ``,
    `- Generated: ${report.generatedAt}`,
    `- API: ${apiBase}`,
    `- Per category: ${perCategory}`,
    `- Highlighted rows: ${highlighted.length} / ${rows.length}`,
    ``,
    `| Category | Key | Canonical | Mode | Best idx | Values |`,
    `| --- | --- | --- | --- | --- | --- |`,
  ];
  for (const r of highlighted) {
    const vals = r.values.map((v) => (v === undefined ? '—' : JSON.stringify(v))).join('; ');
    mdLines.push(
      `| ${escapeMdCell(r.categorySlug)} | ${escapeMdCell(r.specKey)} | ${escapeMdCell(r.canonicalSpecKey)} | ${r.evaluation.mode} | ${r.evaluation.bestIndices.join(',')} | ${escapeMdCell(vals)} |`
    );
  }
  fs.writeFileSync(mdPath, mdLines.join('\n'), 'utf8');

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
  console.log(`Categories sampled: ${categories.length}, spec rows: ${rows.length}, highlighted: ${highlighted.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
