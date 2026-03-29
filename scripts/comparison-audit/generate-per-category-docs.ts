/**
 * Строит markdown по каждой категории из последнего report-*.json в out/.
 * Запуск: npx tsx scripts/comparison-audit/generate-per-category-docs.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.join(__dirname, 'out');
const CATEGORIES_DIR = path.join(__dirname, 'categories');

type Row = {
  categorySlug: string;
  categoryName: string;
  productCategoryField: string;
  specKey: string;
  canonicalSpecKey: string;
  values: unknown[];
  ruleSnapshot: { mode: string; valueType: string };
  evaluation: { mode: string; bestIndices: number[]; compatibilityState: string | null };
};

type Report = {
  generatedAt: string;
  apiBase: string;
  perCategory: number;
  categories: { slug: string; name: string; productCount: number; products: { id: string; name: string }[] }[];
  rows: Row[];
};

function verdictForRow(r: Row): string {
  const rs = r.ruleSnapshot.mode;
  const ev = r.evaluation.mode;
  if (r.categorySlug === 'monitors' && r.canonicalSpecKey === 'refresh_rate' && ev === 'none') {
    return 'OK (движок отключает подсветку при boolean вместо Гц)';
  }
  if (rs === ev) return 'OK';
  if (rs === 'none' && ev === 'max' && r.categorySlug === 'headphones') {
    return 'OK (boolean fallback для Да/Нет из описания)';
  }
  if (rs === 'none' && ev === 'max' && (r.categorySlug === 'keyboards' || r.categorySlug === 'mice')) {
    return 'OK (boolean fallback)';
  }
  if (ev === 'none' && rs !== 'none') {
    return 'Проверить данные (недостаточно сопоставимых чисел для min/max)';
  }
  return 'OK';
}

function escapeCell(v: string): string {
  return v.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function shortenValues(values: unknown[], maxLen = 120): string {
  const s = JSON.stringify(values);
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}…`;
}

function latestReportPath(): string {
  const files = fs.readdirSync(OUT_DIR).filter((f) => /^report-\d{8}-\d{6}\.json$/.test(f));
  if (files.length === 0) throw new Error(`No report-*.json in ${OUT_DIR}`);
  files.sort();
  return path.join(OUT_DIR, files[files.length - 1]!);
}

function main(): void {
  const reportPath = latestReportPath();
  const raw = fs.readFileSync(reportPath, 'utf8');
  const report = JSON.parse(raw) as Report;

  fs.mkdirSync(CATEGORIES_DIR, { recursive: true });

  const bySlug = new Map<string, Row[]>();
  for (const row of report.rows) {
    const list = bySlug.get(row.categorySlug) ?? [];
    list.push(row);
    bySlug.set(row.categorySlug, list);
  }

  const indexLines = [
    `# Индекс разборки по категориям`,
    ``,
    `- Источник отчёта: \`${path.relative(path.join(__dirname, '../..'), reportPath)}\``,
    `- Сгенерировано из: \`${report.generatedAt}\` (\`perCategory=${report.perCategory}\`)`,
    ``,
    `| Slug | Файл |`,
    `| --- | --- |`,
  ];

  const sortedSlugs = Array.from(bySlug.keys()).sort();

  for (const slug of sortedSlugs) {
    const rows = bySlug.get(slug)!;
    const catMeta = report.categories.find((c) => c.slug === slug);
    const title = catMeta?.name ?? slug;

    const lines: string[] = [
      `# ${title} (\`${slug}\`)`,
      ``,
      `**Выборка:** ${report.perCategory} товар(ов) на категорию. **Поле category у товара:** \`${rows[0]?.productCategoryField ?? '—'}\`.`,
      ``,
      `## Товары в выборке`,
      ``,
    ];

    if (catMeta?.products?.length) {
      for (const p of catMeta.products) {
        lines.push(`- ${p.name} (\`${p.id}\`)`);
      }
    }
    lines.push(``, `## Характеристики (колонка за колонкой)`, ``);
    lines.push(
      `| specKey | canonical | rule | eval | best idx | values (сокр.) | вердикт |`,
      `| --- | --- | --- | --- | --- | --- | --- |`
    );

    for (const r of rows) {
      lines.push(
        `| ${escapeCell(r.specKey)} | ${escapeCell(r.canonicalSpecKey)} | ${r.ruleSnapshot.mode}/${r.ruleSnapshot.valueType} | ${r.evaluation.mode} | ${r.evaluation.bestIndices.join(',') || '—'} | ${escapeCell(shortenValues(r.values))} | ${escapeCell(verdictForRow(r))} |`
      );
    }

    lines.push(
      ``,
      `## Примечание`,
      ``,
      `Строки с \`evaluation.mode = none\` не подсвечивают «лучшее» — это ожидаемо для текстовых/спорных полей или при недостатке сопоставимых чисел.`
    );

    const fileName = `${slug}.md`;
    fs.writeFileSync(path.join(CATEGORIES_DIR, fileName), lines.join('\n'), 'utf8');
    indexLines.push(`| ${slug} | [${fileName}](./${fileName}) |`);
  }

  fs.writeFileSync(path.join(CATEGORIES_DIR, 'README.md'), [...indexLines, ''].join('\n'), 'utf8');
  console.log(`Wrote ${sortedSlugs.length} category files + README under ${CATEGORIES_DIR}`);
  console.log(`Source: ${reportPath}`);
}

main();
