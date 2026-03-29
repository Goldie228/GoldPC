/**
 * Строит один большой Markdown: для каждой категории — таблица «как на странице сравнения»:
 * строки = характеристики, столбцы = товары выборки, ячейки с **жирным** и ✓ там, где движок даёт преимущество (bestIndices).
 *
 * Источник: последний report-*.json в out/ (тот же снимок, что и npm run comparison-audit).
 * Запуск: npx tsx scripts/comparison-audit/generate-full-comparison-tables-md.ts
 * Выход: scripts/comparison-audit/out/full-comparison-tables-<timestamp>.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.join(__dirname, 'out');

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

type Report = {
  generatedAt: string;
  apiBase: string;
  perCategory: number;
  categories: {
    slug: string;
    name: string;
    productCount: number;
    products: { id: string; name: string }[];
  }[];
  rows: Row[];
};

function escapeMdCell(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function formatValue(v: unknown): string {
  if (v === undefined || v === null) return '—';
  if (typeof v === 'string' && v.trim() === '') return '—';
  if (typeof v === 'object') return escapeMdCell(JSON.stringify(v));
  return escapeMdCell(String(v));
}

function shortName(name: string, max = 36): string {
  const t = name.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function latestReportPath(): string {
  const files = fs.readdirSync(OUT_DIR).filter((f) => /^report-\d{8}-\d{6}\.json$/.test(f));
  if (files.length === 0) throw new Error(`Нет report-*.json в ${OUT_DIR}. Сначала: npm run comparison-audit`);
  files.sort();
  return path.join(OUT_DIR, files[files.length - 1]!);
}

function modeHint(r: Row): string {
  const { mode } = r.evaluation;
  const best = r.evaluation.bestIndices;
  if (mode === 'compatibility') {
    return r.evaluation.compatibilityState
      ? `совместимость: ${r.evaluation.compatibilityState}`
      : 'совместимость (без подсветки ячеек)';
  }
  if (mode === 'none') return 'без подсветки';
  if (best.length === 0) return `${mode} (нет лидеров / мало данных)`;
  return `${mode} → преимущество: столбцы ${best.map((i) => i + 1).join(', ')}`;
}

function cellContent(r: Row, colIndex: number): string {
  const v = formatValue(r.values[colIndex]);
  const mode = r.evaluation.mode;
  const best = new Set(r.evaluation.bestIndices);
  if ((mode === 'max' || mode === 'min') && best.has(colIndex)) {
    return `**${v}** ✓`;
  }
  return v;
}

function main(): void {
  const reportPath = latestReportPath();
  const stampMatch = path.basename(reportPath).match(/report-(\d{8}-\d{6})\.json/);
  const stamp = stampMatch?.[1] ?? 'latest';

  const raw = fs.readFileSync(reportPath, 'utf8');
  const report = JSON.parse(raw) as Report;

  const bySlug = new Map<string, Row[]>();
  for (const row of report.rows) {
    const list = bySlug.get(row.categorySlug) ?? [];
    list.push(row);
    bySlug.set(row.categorySlug, list);
  }

  const lines: string[] = [
    `# Полные таблицы сравнения (как на сайте, по данным аудита)`,
    ``,
    `- Источник JSON: \`${path.relative(path.join(__dirname, '../..'), reportPath)}\``,
    `- Время: ${report.generatedAt}`,
    `- API: ${report.apiBase}, товаров на категорию: ${report.perCategory}`,
    ``,
    `**Легенда:** ячейка с **жирным значением** и символом ✓ — так на фронте подсвечивается «лучшее» (режим max/min). `,
    `Строки с режимом *совместимость* преимуществ не подсвечивают — только состояние в колонке «Режим / подсказка». `,
    `В отчёт входят только характеристики из merge спецификаций + описание (как \`ComparisonPage\`), без отдельных строк «Производитель / Рейтинг / Наличие» из UI.`,
    ``,
    `---`,
    ``,
  ];

  const slugOrder = report.categories.map((c) => c.slug);

  for (const slug of slugOrder) {
    const cat = report.categories.find((c) => c.slug === slug);
    const rows = bySlug.get(slug);
    if (!cat || !rows?.length) continue;

    const products = cat.products;
    const n = products.length;
    lines.push(`## ${cat.name} (\`${slug}\`)`);
    lines.push(``);
    lines.push(`Товаров в выборке: ${n}. В каталоге всего: ${cat.productCount}.`);
    lines.push(``);

    const header = ['Характеристика (ключ)', ...products.map((p, i) => `Товар ${i + 1}: ${shortName(p.name)}`), 'Режим / подсказка'];
    lines.push(`| ${header.map((h) => escapeMdCell(h)).join(' | ')} |`);
    lines.push(`| ${header.map(() => '---').join(' | ')} |`);

    for (const r of rows) {
      const rowCells = [
        escapeMdCell(r.specKey),
        ...Array.from({ length: n }, (_, i) => cellContent(r, i)),
        escapeMdCell(modeHint(r)),
      ];
      lines.push(`| ${rowCells.join(' | ')} |`);
    }
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  const outPath = path.join(OUT_DIR, `full-comparison-tables-${stamp}.md`);
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(`Categories: ${slugOrder.length}, total spec rows: ${report.rows.length}`);
}

main();
