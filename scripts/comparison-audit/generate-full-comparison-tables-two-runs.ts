/**
 * Строит Markdown, где для каждой категории выводятся ДВЕ таблицы сравнения
 * (два независимых прохода аудита) для визуальной проверки стабильности подсветки.
 *
 * Источник: два последних report-*.json в out/ (их нужно получить отдельными запусками
 * scripts/comparison-audit/run-comparison-audit.ts).
 *
 * Запуск: npx tsx scripts/comparison-audit/generate-full-comparison-tables-two-runs.ts
 * Выход: scripts/comparison-audit/out/full-comparison-tables-two-runs-<stamp1>_vs_<stamp2>.md
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

type CategoryMeta = {
  slug: string;
  name: string;
  productCount: number;
  products: { id: string; name: string }[];
};

type Report = {
  generatedAt: string;
  apiBase: string;
  perCategory: number;
  categories: CategoryMeta[];
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

function latestTwoReports(): { path1: string; path2: string } {
  const files = fs
    .readdirSync(OUT_DIR)
    .filter((f) => /^report-\d{8}-\d{6}\.json$/.test(f))
    .sort();
  if (files.length < 2) {
    throw new Error(`Нужно минимум два файла report-*.json в ${OUT_DIR} (сделай два прогона аудита).`);
  }
  const f2 = files[files.length - 1]!;
  const f1 = files[files.length - 2]!;
  return {
    path1: path.join(OUT_DIR, f1),
    path2: path.join(OUT_DIR, f2),
  };
}

function buildBySlug(report: Report): Map<string, Row[]> {
  const bySlug = new Map<string, Row[]>();
  for (const row of report.rows) {
    const list = bySlug.get(row.categorySlug) ?? [];
    list.push(row);
    bySlug.set(row.categorySlug, list);
  }
  return bySlug;
}

function main(): void {
  const { path1, path2 } = latestTwoReports();

  const stamp1Match = path.basename(path1).match(/report-(\d{8}-\d{6})\.json/);
  const stamp2Match = path.basename(path2).match(/report-(\d{8}-\d{6})\.json/);
  const stamp1 = stamp1Match?.[1] ?? 'run1';
  const stamp2 = stamp2Match?.[1] ?? 'run2';

  const raw1 = fs.readFileSync(path1, 'utf8');
  const raw2 = fs.readFileSync(path2, 'utf8');
  const report1 = JSON.parse(raw1) as Report;
  const report2 = JSON.parse(raw2) as Report;

  const bySlug1 = buildBySlug(report1);
  const bySlug2 = buildBySlug(report2);

  const slugs = Array.from(
    new Set([
      ...report1.categories.map((c) => c.slug),
      ...report2.categories.map((c) => c.slug),
    ]),
  ).sort();

  const lines: string[] = [
    `# Два прохода аудита сравнения (для каждой категории)`,
    ``,
    `- Источник JSON #1: \`${path.relative(path.join(__dirname, '../..'), path1)}\` (stamp=${stamp1})`,
    `- Источник JSON #2: \`${path.relative(path.join(__dirname, '../..'), path2)}\` (stamp=${stamp2})`,
    `- perCategory #1: ${report1.perCategory}, perCategory #2: ${report2.perCategory}`,
    ``,
    `**Идея:** для каждой категории показать две независимые выборки товаров и таблицы подсветки, `,
    `чтобы глазами ловить нестабильность правил сравнения.`,
    ``,
    `**Легенда:** ячейка с **жирным значением** и символом ✓ — так на фронте подсвечивается «лучшее» (режим max/min).`,
    `Строки с режимом *совместимость* преимуществ не подсвечивают — только состояние в колонке «Режим / подсказка».`,
    ``,
    `---`,
    ``,
  ];

  for (const slug of slugs) {
    const cat1 = report1.categories.find((c) => c.slug === slug);
    const cat2 = report2.categories.find((c) => c.slug === slug);
    const rows1 = bySlug1.get(slug) ?? [];
    const rows2 = bySlug2.get(slug) ?? [];
    if (!rows1.length && !rows2.length) continue;

    const title = (cat1 ?? cat2)?.name ?? slug;

    lines.push(`## ${title} (\`${slug}\`)`);
    lines.push('');

    if (cat1) {
      const products1 = cat1.products;
      const n1 = products1.length;
      lines.push(`### Проход 1 (report ${stamp1})`);
      lines.push('');
      lines.push(
        `Товаров в выборке: ${n1}. В каталоге всего (по report #1): ${cat1.productCount}.`,
      );
      lines.push('');

      if (n1 > 0 && rows1.length > 0) {
        const header1 = [
          'Характеристика (ключ)',
          ...products1.map((p, i) => `Товар ${i + 1}: ${shortName(p.name)}`),
          'Режим / подсказка',
        ];
        lines.push(`| ${header1.map((h) => escapeMdCell(h)).join(' | ')} |`);
        lines.push(`| ${header1.map(() => '---').join(' | ')} |`);

        for (const r of rows1) {
          const rowCells = [
            escapeMdCell(r.specKey),
            ...Array.from({ length: n1 }, (_, i) => cellContent(r, i)),
            escapeMdCell(modeHint(r)),
          ];
          lines.push(`| ${rowCells.join(' | ')} |`);
        }
        lines.push('');
      } else {
        lines.push('_Нет данных в первом отчёте для этой категории._');
        lines.push('');
      }
    } else {
      lines.push(`_Категория отсутствует в первом отчёте._`);
      lines.push('');
    }

    if (cat2) {
      const products2 = cat2.products;
      const n2 = products2.length;
      lines.push(`### Проход 2 (report ${stamp2})`);
      lines.push('');
      lines.push(
        `Товаров в выборке: ${n2}. В каталоге всего (по report #2): ${cat2.productCount}.`,
      );
      lines.push('');

      if (n2 > 0 && rows2.length > 0) {
        const header2 = [
          'Характеристика (ключ)',
          ...products2.map((p, i) => `Товар ${i + 1}: ${shortName(p.name)}`),
          'Режим / подсказка',
        ];
        lines.push(`| ${header2.map((h) => escapeMdCell(h)).join(' | ')} |`);
        lines.push(`| ${header2.map(() => '---').join(' | ')} |`);

        for (const r of rows2) {
          const rowCells = [
            escapeMdCell(r.specKey),
            ...Array.from({ length: n2 }, (_, i) => cellContent(r, i)),
            escapeMdCell(modeHint(r)),
          ];
          lines.push(`| ${rowCells.join(' | ')} |`);
        }
        lines.push('');
      } else {
        lines.push('_Нет данных во втором отчёте для этой категории._');
        lines.push('');
      }
    } else {
      lines.push(`_Категория отсутствует во втором отчёте._`);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  const outName = `full-comparison-tables-two-runs-${stamp1}_vs_${stamp2}.md`;
  const outPath = path.join(OUT_DIR, outName);
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');

  console.log(`Wrote ${outPath}`);
  console.log(`Report #1: ${path1}`);
  console.log(`Report #2: ${path2}`);
}

main();

