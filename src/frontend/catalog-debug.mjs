// @ts-check
import { chromium } from 'playwright';

(async () => {
  console.log('🔍 Отладка каталога...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: '/home/goldie/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome'
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Сбор консольных сообщений
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    console.log(`  [${msg.type()}] ${msg.text()}`);
  });
  
  // Сбор сетевых запросов
  const requests = /** @type {{url: string; method: string}[]} */ ([]);
  page.on('request', req => {
    if (req.url().includes('/api/')) {
      requests.push({ url: req.url(), method: req.method() });
    }
  });
  
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      console.log(`  [Response] ${res.status()} ${res.url()}`);
    }
  });
  
  try {
    console.log('📍 Навигация на http://localhost:5173/catalog...');
    await page.goto('http://localhost:5173/catalog', { waitUntil: 'networkidle', timeout: 60000 });
    
    // Ждём загрузки
    console.log('\n⏳ Ожидание 3 секунды...');
    await page.waitForTimeout(3000);
    
    // Проверка MSW
    console.log('\n🔍 Проверка MSW...');
    const mswActive = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistrations().then(regs => regs.length > 0);
    });
    console.log(`  Service Worker активен: ${mswActive ? '✅' : '❌'}`);
    
    // Проверка DOM
    console.log('\n🔍 Структура страницы...');
    const bodyText = await page.locator('body').textContent();
    console.log(`  Body text preview: ${bodyText?.substring(0, 100)}...`);
    
    // Проверка #root
    const rootHTML = await page.locator('#root').innerHTML();
    console.log(`  #root length: ${rootHTML.length} chars`);
    
    // Поиск элементов товаров
    console.log('\n🔍 Поиск элементов товаров...');
    const articles = await page.locator('article').count();
    console.log(`  Articles: ${articles}`);
    
    const productCards = await page.locator('[class*="product"]').count();
    console.log(`  Elements with "product" class: ${productCards}`);
    
    const cards = await page.locator('[class*="card"]').count();
    console.log(`  Elements with "card" class: ${cards}`);
    
    // Скриншот
    await page.screenshot({ path: '/tmp/catalog-debug.png', fullPage: true });
    console.log('\n📸 Скриншот: /tmp/catalog-debug.png');
    
    // Сетевые запросы
    console.log('\n📡 API запросы:');
    requests.forEach(r => console.log(`  ${r.method} ${r.url}`));
    
    console.log('\n✅ Отладка завершена!');
    
  } catch (error) {
    console.error('\n❌ Ошибка:', error instanceof Error ? error.message : String(error));
  } finally {
    await browser.close();
  }
})();