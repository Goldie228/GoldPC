// @ts-check
import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Запуск расширенного теста каталога...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: '/home/goldie/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome'
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Навигация на страницу каталога
    console.log('📍 Навигация на http://localhost:5176/catalog...');
    await page.goto('http://localhost:5176/catalog', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Получаем HTML страницы
    const html = await page.content();
    console.log('\n📄 HTML страницы (первые 500 символов):');
    console.log(html.substring(0, 500));
    
    // Проверяем ошибки в консоли
    console.log('\n🔍 Проверка ошибок консоли...');
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('  Console Error:', msg.text());
      }
    });
    
    // Проверка наличия root элемента
    console.log('\n🔍 Проверка #root элемента...');
    const rootContent = await page.locator('#root').innerHTML().catch(() => 'empty');
    console.log(`  #root содержимое: ${rootContent.substring(0, 100)}...`);
    
    // Скриншот
    await page.screenshot({ path: '/tmp/catalog-page2.png', fullPage: true });
    console.log('\n📸 Скриншот: /tmp/catalog-page2.png');
    
    console.log('\n✅ Тест завершен!');
    
  } catch (error) {
    console.error('\n❌ Ошибка:', error instanceof Error ? error.message : String(error));
  } finally {
    await browser.close();
  }
})();