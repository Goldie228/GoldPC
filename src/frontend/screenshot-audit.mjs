/**
 * QA Visual Auditor Script - Extended Version
 * Делает скриншоты страниц и анализирует их на пустоту
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5180';
const OUTPUT_DIR = path.join(__dirname, 'test-screenshots');

const PAGES = [
  { name: 'home', url: '/' },
  { name: 'catalog', url: '/catalog' },
  { name: 'login', url: '/login' },
  { name: 'pc-builder', url: '/pc-builder' },
];

async function auditPage(page, name, url) {
  const fullUrl = `${BASE_URL}${url}`;
  const screenshotPath = path.join(OUTPUT_DIR, `${name}-full.png`);
  const htmlPath = path.join(OUTPUT_DIR, `${name}-html.txt`);
  
  console.log(`\n📄 Auditing: ${name} (${fullUrl})`);
  
  const consoleMessages = [];
  const errors = [];
  
  // Перехватываем консольные сообщения
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  // Перехватываем ошибки страницы
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  // Перехватываем неудачные запросы
  page.on('requestfailed', request => {
    errors.push(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  try {
    await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Ждём немного для рендеринга
    await page.waitForTimeout(3000);
    
    // Получаем HTML страницы
    const html = await page.content();
    fs.writeFileSync(htmlPath, html);
    console.log(`  ✅ HTML saved: ${htmlPath}`);
    
    // Делаем full-page скриншот
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true 
    });
    console.log(`  ✅ Screenshot saved: ${screenshotPath}`);
    
    // Анализ контента
    const contentAnalysis = await page.evaluate(() => {
      const body = document.body;
      const mainContent = body.querySelector('main') || body.querySelector('.main-layout__content') || body;
      
      // Получаем весь видимый текст
      const visibleText = mainContent?.innerText || '';
      
      // Считаем значимые элементы
      const significantElements = mainContent?.querySelectorAll('h1, h2, h3, p, button, a, img, input, form, section, article, .card, .product-card') || [];
      
      // Проверяем наличие контента в main-layout__content
      const mainLayoutContent = document.querySelector('.main-layout__content');
      const mainInnerHTML = mainLayoutContent?.innerHTML || '';
      
      // Проверяем наличие Header и Footer
      const hasHeader = !!document.querySelector('header');
      const hasFooter = !!document.querySelector('footer');
      
      // Проверяем наличие root элемента и его содержимое
      const rootEl = document.getElementById('root');
      
      return {
        textLength: visibleText.trim().length,
        elementCount: significantElements.length,
        mainContentLength: mainInnerHTML.trim().length,
        hasHeader,
        hasFooter,
        bodyClasses: document.body.className,
        mainLayoutClasses: document.querySelector('.main-layout')?.className || 'not found',
        rootInnerHTML: rootEl?.innerHTML?.substring(0, 1000) || 'empty',
        rootChildrenCount: rootEl?.children?.length || 0,
        hasRootContent: rootEl?.innerHTML?.trim().length > 0,
      };
    });
    
    // Определяем пустоту страницы
    const isEmpty = contentAnalysis.textLength < 50 && contentAnalysis.elementCount < 5;
    const hasContent = !isEmpty;
    
    let diagnosis = '';
    if (isEmpty) {
      diagnosis = '⚠️ СТРАНИЦА ПУСТАЯ или почти пустая!';
      if (!contentAnalysis.hasHeader && !contentAnalysis.hasFooter) {
        diagnosis += ' MainLayout не загрузился.';
      }
      if (!contentAnalysis.hasRootContent) {
        diagnosis += ' React не смонтировался (root пустой).';
      }
      if (contentAnalysis.rootChildrenCount === 0) {
        diagnosis += ' Нет дочерних элементов в root.';
      }
    } else {
      diagnosis = '✅ Страница содержит контент';
    }
    
    // Добавляем информацию об ошибках в диагноз
    if (errors.length > 0) {
      diagnosis += ` Найдено ошибок: ${errors.length}.`;
    }
    
    console.log(`  📊 Text length: ${contentAnalysis.textLength}`);
    console.log(`  📊 Elements: ${contentAnalysis.elementCount}`);
    console.log(`  📊 Header: ${contentAnalysis.hasHeader ? '✅' : '❌'}`);
    console.log(`  📊 Footer: ${contentAnalysis.hasFooter ? '✅' : '❌'}`);
    console.log(`  📊 Root content: ${contentAnalysis.hasRootContent ? '✅' : '❌'}`);
    console.log(`  📊 Root children: ${contentAnalysis.rootChildrenCount}`);
    console.log(`  🔍 Diagnosis: ${diagnosis}`);
    
    if (consoleMessages.length > 0) {
      console.log(`  📋 Console messages (${consoleMessages.length}):`);
      consoleMessages.slice(0, 5).forEach(m => console.log(`     ${m}`));
    }
    
    if (errors.length > 0) {
      console.log(`  ❌ Errors (${errors.length}):`);
      errors.slice(0, 5).forEach(e => console.log(`     ${e}`));
    }
    
    return {
      name,
      url: fullUrl,
      screenshotPath,
      isEmpty,
      hasContent,
      textLength: contentAnalysis.textLength,
      elementCount: contentAnalysis.elementCount,
      diagnosis,
      errors,
      consoleMessages,
      rootContent: contentAnalysis.rootInnerHTML,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`  ❌ Error: ${errorMessage}`);
    
    return {
      name,
      url: fullUrl,
      screenshotPath,
      isEmpty: true,
      hasContent: false,
      textLength: 0,
      elementCount: 0,
      diagnosis: `❌ Ошибка загрузки: ${errorMessage}`,
      errors: [errorMessage],
      consoleMessages,
      rootContent: '',
    };
  }
}

async function main() {
  console.log('🔍 QA Visual Auditor - Extended Version');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  
  // Создаём директорию если её нет
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  let browser = null;
  
  try {
    browser = await chromium.launch({ 
      headless: true,
      executablePath: '/home/goldie/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    const results = [];
    
    for (const pageInfo of PAGES) {
      const result = await auditPage(page, pageInfo.name, pageInfo.url);
      results.push(result);
    }
    
    // Итоговый отчёт
    console.log('\n' + '='.repeat(60));
    console.log('📋 ИТОГОВЫЙ ОТЧЁТ');
    console.log('='.repeat(60));
    
    const emptyPages = results.filter(r => r.isEmpty);
    const okPages = results.filter(r => r.hasContent);
    
    console.log(`\n✅ Страниц с контентом: ${okPages.length}`);
    okPages.forEach(r => console.log(`   - ${r.name}: ${r.textLength} chars, ${r.elementCount} elements`));
    
    console.log(`\n⚠️ Пустых страниц: ${emptyPages.length}`);
    emptyPages.forEach(r => console.log(`   - ${r.name}: ${r.diagnosis}`));
    
    // Собираем все ошибки
    const allErrors = results.flatMap(r => r.errors || []);
    const allConsoleMessages = results.flatMap(r => r.consoleMessages || []);
    
    // Сохраняем полный отчёт
    const reportPath = path.join(OUTPUT_DIR, 'audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Отчёт сохранён: ${reportPath}`);
    
    // Диагностика проблем
    console.log('\n🔧 ДИАГНОСТИКА ПРОБЛЕМ:');
    console.log('-'.repeat(40));
    
    if (allErrors.length > 0) {
      console.log('\n❌ Обнаруженные ошибки:');
      const uniqueErrors = [...new Set(allErrors)];
      uniqueErrors.forEach(e => console.log(`   - ${e}`));
    }
    
    if (emptyPages.length === PAGES.length) {
      console.log('\n❌ ВСЕ страницы пустые! Анализ:');
      
      // Проверяем root content
      const rootContents = results.map(r => r.rootContent);
      const allRootsEmpty = rootContents.every(c => !c || c.length < 10);
      
      if (allRootsEmpty) {
        console.log('   → React приложение НЕ смонтировалось');
        console.log('   → Проверьте консоль браузера на ошибки');
        console.log('   → Возможная причина: Vite не может загрузить main.tsx');
      }
      
      // Проверяем console messages
      const viteErrors = allConsoleMessages.filter(m => m.includes('error') || m.includes('Error'));
      if (viteErrors.length > 0) {
        console.log('\n   📋 Ошибки в консоли:');
        viteErrors.slice(0, 10).forEach(e => console.log(`      ${e}`));
      }
    }
    
    // Сохраняем диагноз в файл
    const diagnosisPath = path.join(OUTPUT_DIR, 'diagnosis.md');
    const diagnosisContent = generateDiagnosisReport(results, allErrors, allConsoleMessages);
    fs.writeFileSync(diagnosisPath, diagnosisContent);
    console.log(`\n📄 Диагноз сохранён: ${diagnosisPath}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function generateDiagnosisReport(results, errors, consoleMessages) {
  const allEmpty = results.every(r => r.isEmpty);
  
  let report = `# QA Visual Auditor - Diagnosis Report

## Summary

- **Pages Tested:** ${results.length}
- **Pages with Content:** ${results.filter(r => r.hasContent).length}
- **Empty Pages:** ${results.filter(r => r.isEmpty).length}

## Page Details

| Page | URL | Status | Text Length | Elements |
|------|-----|--------|-------------|----------|
${results.map(r => `| ${r.name} | ${r.url} | ${r.isEmpty ? '❌ Empty' : '✅ OK'} | ${r.textLength} | ${r.elementCount} |`).join('\n')}

## Diagnosis

${allEmpty ? `
### ❌ ALL PAGES ARE EMPTY!

**Root Cause Analysis:**

Based on the audit, React application failed to mount. Possible causes:

1. **Vite Module Resolution Error** - The path contains '#' character which causes issues with Vite's module resolution
2. **React Mount Failure** - The root element remains empty because main.tsx failed to load
3. **JavaScript Error** - Check console for runtime errors

**Evidence:**
- Console messages: ${consoleMessages.length}
- Errors detected: ${errors.length}
` : `
### ✅ Pages are rendering correctly
`}

## Errors Detected

\`\`\`
${errors.length > 0 ? errors.join('\n') : 'No errors detected'}
\`\`\`

## Console Messages

\`\`\`
${consoleMessages.slice(0, 20).join('\n')}
\`\`\`

## Recommendations

${allEmpty ? `
1. **Fix Path Issue** - The '#' character in the path '/data/C#/' is causing Vite to fail loading modules
2. **Move Project** - Consider moving the project to a path without special characters
3. **Alternative**: Use a containerized development environment
` : 'No issues detected.'}

---
Generated: ${new Date().toISOString()}
`;
  
  return report;
}

main().catch(console.error);