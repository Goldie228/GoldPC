#!/usr/bin/env node
/**
 * Скрипт проверки всех веб-страниц на ошибки фронтенда
 * Использование: node scripts/check-all-pages.mjs
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

// Страницы для проверки
const PAGES = [
  { path: '/', name: 'Главная' },
  { path: '/catalog', name: 'Каталог' },
  { path: '/catalog/processors', name: 'Каталог (процессоры)' },
  { path: '/cart', name: 'Корзина' },
  { path: '/wishlist', name: 'Избранное' },
  { path: '/comparison', name: 'Сравнение' },
  { path: '/login', name: 'Вход' },
  { path: '/register', name: 'Регистрация' },
  { path: '/pc-builder', name: 'Конструктор ПК' },
  { path: '/services', name: 'Услуги' },
  { path: '/about', name: 'О нас' },
  { path: '/delivery', name: 'Доставка' },
  { path: '/payment', name: 'Оплата' },
  { path: '/warranty', name: 'Гарантия' },
  { path: '/returns', name: 'Возвраты' },
  { path: '/faq', name: 'FAQ' },
  { path: '/service-request', name: 'Запрос услуги' },
];

async function checkPage(page, url, name) {
  const errors = [];
  const warnings = [];
  
  // Слушаем консольные сообщения
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Слушаем ошибки страницы
  page.on('pageerror', err => {
    errors.push(`PageError: ${err.message}`);
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    // Ждём немного для асинхронных операций
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    
    return {
      name,
      path: url,
      title,
      errors,
      warnings,
      status: errors.length === 0 ? 'OK' : 'ERRORS'
    };
  } catch (err) {
    return {
      name,
      path: url,
      title: '',
      errors: [`Navigation error: ${err.message}`],
      warnings,
      status: 'FAILED'
    };
  }
}

async function main() {
  console.log('🚀 Запуск проверки страниц GoldPC\n');
  console.log('═'.repeat(70));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  const results = [];
  
  for (const { path, name } of PAGES) {
    const page = await context.newPage();
    const url = `${BASE_URL}${path}`;
    
    process.stdout.write(`  Проверка: ${name.padEnd(20)} (${path})... `);
    
    const result = await checkPage(page, url, name);
    results.push(result);
    
    if (result.status === 'OK') {
      console.log('✅ OK');
    } else if (result.status === 'ERRORS') {
      console.log(`❌ ${result.errors.length} ошибок`);
    } else {
      console.log('💥 FAILED');
    }
    
    await page.close();
  }
  
  await browser.close();
  
  // Итоговый отчёт
  console.log('\n' + '═'.repeat(70));
  console.log('📊 ИТОГОВЫЙ ОТЧЁТ\n');
  
  const okCount = results.filter(r => r.status === 'OK').length;
  const errorCount = results.filter(r => r.status === 'ERRORS').length;
  const failedCount = results.filter(r => r.status === 'FAILED').length;
  
  console.log(`  ✅ Работают: ${okCount}`);
  console.log(`  ❌ Ошибки:   ${errorCount}`);
  console.log(`  💥 Упали:    ${failedCount}`);
  console.log(`  📝 Всего:    ${results.length}`);
  
  // Детали ошибок
  const pagesWithErrors = results.filter(r => r.errors.length > 0);
  
  if (pagesWithErrors.length > 0) {
    console.log('\n' + '─'.repeat(70));
    console.log('⚠️  ДЕТАЛИ ОШИБОК:\n');
    
    for (const page of pagesWithErrors) {
      console.log(`  📄 ${page.name} (${page.path}):`);
      for (const error of page.errors) {
        console.log(`     - ${error.substring(0, 100)}${error.length > 100 ? '...' : ''}`);
      }
      console.log('');
    }
  }
  
  console.log('═'.repeat(70));
  
  // Возвращаем код ошибки если есть проблемы
  process.exit(errorCount + failedCount > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});
