#!/usr/bin/env node

/**
 * Lighthouse Budgets Checker for GoldPC
 * 
 * Парсит JSON-результаты Lighthouse и проверяет соответствие бюджетам производительности.
 * Выходит с ошибкой (exit code 1), если бюджеты нарушены.
 * 
 * Использование:
 *   node scripts/check-lighthouse-budgets.js [path-to-lighthouse-results.json]
 *   node scripts/check-lighthouse-budgets.js ./lighthouse-results.json
 *   node scripts/check-lighthouse-budgets.js ./lhci_reports
 * 
 * @see https://github.com/GoogleChrome/lighthouse-ci
 */

const fs = require('fs');
const path = require('path');

// ========================================
// Бюджеты производительности (Performance Budgets)
// ========================================
const PERFORMANCE_BUDGETS = {
  // Категории (minScore: 0.9 = 90%)
  categories: {
    performance: { minScore: 0.9, level: 'warn', name: 'Performance' },
    accessibility: { minScore: 0.9, level: 'error', name: 'Accessibility' },
    'best-practices': { minScore: 0.9, level: 'warn', name: 'Best Practices' },
    seo: { minScore: 0.9, level: 'error', name: 'SEO' },
  },
  
  // Web Vitals и метрики
  metrics: {
    'first-contentful-paint': { maxNumericValue: 2000, level: 'warn', name: 'First Contentful Paint', unit: 'ms' },
    'largest-contentful-paint': { maxNumericValue: 3000, level: 'error', name: 'Largest Contentful Paint', unit: 'ms' },
    'cumulative-layout-shift': { maxNumericValue: 0.1, level: 'warn', name: 'Cumulative Layout Shift', unit: '' },
    'total-blocking-time': { maxNumericValue: 300, level: 'warn', name: 'Total Blocking Time', unit: 'ms' },
    'speed-index': { maxNumericValue: 3000, level: 'warn', name: 'Speed Index', unit: 'ms' },
    'interactive': { maxNumericValue: 4000, level: 'warn', name: 'Time to Interactive', unit: 'ms' },
    'server-response-time': { maxNumericValue: 600, level: 'warn', name: 'Server Response Time (TTFB)', unit: 'ms' },
  },
};

// Коды выхода
const EXIT_CODES = {
  SUCCESS: 0,
  ERROR: 1,
  NO_INPUT: 2,
  PARSE_ERROR: 3,
};

// Цвета для консоли
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

/**
 * Форматирование числа с единицами измерения
 */
function formatValue(value, unit) {
  if (unit === 'ms') {
    return `${value.toFixed(0)}ms`;
  }
  if (typeof value === 'number') {
    return value.toFixed(value < 1 ? 3 : 0);
  }
  return String(value);
}

/**
 * Форматирование оценки (score)
 */
function formatScore(score) {
  const percentage = (score * 100).toFixed(0);
  
  if (score >= 0.9) {
    return `${COLORS.green}${percentage}%${COLORS.reset}`;
  } else if (score >= 0.5) {
    return `${COLORS.yellow}${percentage}%${COLORS.reset}`;
  } else {
    return `${COLORS.red}${percentage}%${COLORS.reset}`;
  }
}

/**
 * Проверка категории
 */
function checkCategory(categoryKey, score, budget) {
  const violations = [];
  const warnings = [];
  
  if (score < budget.minScore) {
    const message = `${budget.name}: score ${formatScore(score)} < ${budget.minScore * 100}%`;
    
    if (budget.level === 'error') {
      violations.push({ type: 'category', key: categoryKey, message, actual: score, expected: budget.minScore });
    } else {
      warnings.push({ type: 'category', key: categoryKey, message, actual: score, expected: budget.minScore });
    }
  }
  
  return { violations, warnings };
}

/**
 * Проверка метрики
 */
function checkMetric(metricKey, value, budget) {
  const violations = [];
  const warnings = [];
  
  if (value > budget.maxNumericValue) {
    const formattedValue = formatValue(value, budget.unit);
    const formattedBudget = formatValue(budget.maxNumericValue, budget.unit);
    const message = `${budget.name}: ${formattedValue} > ${formattedBudget}`;
    
    if (budget.level === 'error') {
      violations.push({ type: 'metric', key: metricKey, message, actual: value, expected: budget.maxNumericValue });
    } else {
      warnings.push({ type: 'metric', key: metricKey, message, actual: value, expected: budget.maxNumericValue });
    }
  }
  
  return { violations, warnings };
}

/**
 * Проверка результатов Lighthouse
 */
function checkLighthouseResults(results) {
  const allViolations = [];
  const allWarnings = [];
  
  // Проверка категорий
  console.log(`\n${COLORS.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`);
  console.log(`${COLORS.cyan}📊 Lighthouse Categories${COLORS.reset}`);
  console.log(`${COLORS.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}\n`);
  
  for (const [categoryKey, budget] of Object.entries(PERFORMANCE_BUDGETS.categories)) {
    const category = results.categories?.[categoryKey];
    
    if (category) {
      const score = category.score;
      const status = score >= budget.minScore ? `${COLORS.green}✓ PASS${COLORS.reset}` : 
                     budget.level === 'error' ? `${COLORS.red}✗ FAIL${COLORS.reset}` : 
                     `${COLORS.yellow}⚠ WARN${COLORS.reset}`;
      
      console.log(`  ${status}  ${budget.name.padEnd(20)} ${formatScore(score)}`);
      
      const { violations, warnings } = checkCategory(categoryKey, score, budget);
      allViolations.push(...violations);
      allWarnings.push(...warnings);
    } else {
      console.log(`  ${COLORS.yellow}⚠ SKIP${COLORS.reset}  ${budget.name.padEnd(20)} (not found)`);
    }
  }
  
  // Проверка метрик
  console.log(`\n${COLORS.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`);
  console.log(`${COLORS.cyan}⚡ Web Vitals & Performance Metrics${COLORS.reset}`);
  console.log(`${COLORS.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}\n`);
  
  const audits = results.audits || {};
  
  for (const [metricKey, budget] of Object.entries(PERFORMANCE_BUDGETS.metrics)) {
    const audit = audits[metricKey];
    
    if (audit && audit.numericValue !== undefined) {
      const value = audit.numericValue;
      const formattedValue = formatValue(value, budget.unit);
      const formattedBudget = formatValue(budget.maxNumericValue, budget.unit);
      const status = value <= budget.maxNumericValue ? `${COLORS.green}✓ PASS${COLORS.reset}` :
                     budget.level === 'error' ? `${COLORS.red}✗ FAIL${COLORS.reset}` :
                     `${COLORS.yellow}⚠ WARN${COLORS.reset}`;
      
      console.log(`  ${status}  ${budget.name.padEnd(30)} ${formattedValue.padStart(10)} / ${formattedBudget}`);
      
      const { violations, warnings } = checkMetric(metricKey, value, budget);
      allViolations.push(...violations);
      allWarnings.push(...warnings);
    } else {
      console.log(`  ${COLORS.yellow}⚠ SKIP${COLORS.reset}  ${budget.name.padEnd(30)} (not found)`);
    }
  }
  
  return { violations: allViolations, warnings: allWarnings };
}

/**
 * Загрузка результатов из файла
 */
function loadResults(filePath) {
  const absolutePath = path.resolve(filePath);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(`${COLORS.red}Error: File not found: ${absolutePath}${COLORS.reset}`);
    process.exit(EXIT_CODES.NO_INPUT);
  }
  
  const content = fs.readFileSync(absolutePath, 'utf8');
  
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error(`${COLORS.red}Error: Failed to parse JSON: ${error.message}${COLORS.reset}`);
    process.exit(EXIT_CODES.PARSE_ERROR);
  }
}

/**
 * Загрузка результатов из директории lhci_reports
 */
function loadResultsFromDirectory(dirPath) {
  const absolutePath = path.resolve(dirPath);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(`${COLORS.red}Error: Directory not found: ${absolutePath}${COLORS.reset}`);
    process.exit(EXIT_CODES.NO_INPUT);
  }
  
  // Ищем файлы manifest.json или JSON-файлы результатов
  const manifestPath = path.join(absolutePath, 'manifest.json');
  
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    if (manifest.length > 0 && manifest[0].summary) {
      // Возвращаем первый результат как пример
      const resultPath = path.join(absolutePath, manifest[0].htmlPath?.replace('.html', '.json') || '');
      
      if (fs.existsSync(resultPath)) {
        return loadResults(resultPath);
      }
    }
  }
  
  // Ищем JSON-файлы
  const files = fs.readdirSync(absolutePath).filter(f => f.endsWith('.json'));
  
  if (files.length > 0) {
    return loadResults(path.join(absolutePath, files[0]));
  }
  
  console.error(`${COLORS.red}Error: No JSON result files found in ${absolutePath}${COLORS.reset}`);
  process.exit(EXIT_CODES.NO_INPUT);
}

/**
 * Вывод итогового отчёта
 */
function printSummary(violations, warnings) {
  console.log(`\n${COLORS.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`);
  console.log(`${COLORS.cyan}📋 Summary${COLORS.reset}`);
  console.log(`${COLORS.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}\n`);
  
  if (violations.length === 0 && warnings.length === 0) {
    console.log(`${COLORS.green}✅ All performance budgets passed!${COLORS.reset}\n`);
    return;
  }
  
  if (warnings.length > 0) {
    console.log(`${COLORS.yellow}⚠️  Warnings (${warnings.length}):${COLORS.reset}`);
    warnings.forEach(w => console.log(`   - ${w.message}`));
    console.log();
  }
  
  if (violations.length > 0) {
    console.log(`${COLORS.red}❌ Violations (${violations.length}):${COLORS.reset}`);
    violations.forEach(v => console.log(`   - ${v.message}`));
    console.log();
  }
}

/**
 * Главная функция
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
${COLORS.cyan}Lighthouse Budgets Checker for GoldPC${COLORS.reset}

Использование:
  node check-lighthouse-budgets.js <path-to-results>
  node check-lighthouse-budgets.js ./lighthouse-results.json
  node check-lighthouse-budgets.js ./lhci_reports

Аргументы:
  <path-to-results>  Путь к JSON-файлу с результатами Lighthouse
                     или директории с отчётами lhci

Бюджеты:
${COLORS.green}  Категории:${COLORS.reset}
    Performance     >= 90%  (warning)
    Accessibility   >= 90%  (error)
    Best Practices  >= 90%  (warning)
    SEO             >= 90%  (error)

${COLORS.green}  Web Vitals:${COLORS.reset}
    First Contentful Paint   < 2000ms  (warning)
    Largest Contentful Paint < 3000ms  (error)
    Cumulative Layout Shift  < 0.1     (warning)
    Total Blocking Time      < 300ms   (warning)
    Speed Index              < 3000ms  (warning)
`);
    process.exit(EXIT_CODES.NO_INPUT);
  }
  
  const inputPath = args[0];
  console.log(`\n${COLORS.blue}🔍 Checking Lighthouse budgets...${COLORS.reset}`);
  console.log(`${COLORS.blue}   Input: ${path.resolve(inputPath)}${COLORS.reset}`);
  
  // Загрузка результатов
  let results;
  const stat = fs.statSync(path.resolve(inputPath));
  
  if (stat.isDirectory()) {
    results = loadResultsFromDirectory(inputPath);
  } else {
    results = loadResults(inputPath);
  }
  
  // URL страницы
  if (results.finalUrl || results.requestedUrl) {
    console.log(`${COLORS.blue}   URL: ${results.finalUrl || results.requestedUrl}${COLORS.reset}`);
  }
  
  // Проверка бюджетов
  const { violations, warnings } = checkLighthouseResults(results);
  
  // Вывод итогов
  printSummary(violations, warnings);
  
  // Выход с кодом ошибки, если есть violations
  if (violations.length > 0) {
    console.log(`${COLORS.red}💥 Build failed: ${violations.length} budget violation(s)${COLORS.reset}\n`);
    process.exit(EXIT_CODES.ERROR);
  } else {
    process.exit(EXIT_CODES.SUCCESS);
  }
}

// Запуск
main();