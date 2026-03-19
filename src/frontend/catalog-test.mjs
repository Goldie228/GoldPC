// @ts-check
import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Запуск теста каталога...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: '/home/goldie/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome'
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Навигация на страницу каталога
    console.log('📍 Навигация на http://localhost:5173/catalog...');
    await page.goto('http://localhost:5173/catalog', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Проверка Filter Sidebar
    console.log('\n🔍 Проверка Filter Sidebar...');
    const sidebar = await page.locator('aside').first();
    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    if (sidebarVisible) {
      console.log('  ✅ Filter Sidebar найден');
      
      // Проверяем содержимое сайдбара
      const filterTitle = await page.locator('text=Фильтры').first().isVisible().catch(() => false);
      const categories = await page.locator('text=Категории').first().isVisible().catch(() => false);
      const price = await page.locator('text=Цена').first().isVisible().catch(() => false);
      
      console.log(`     - Заголовок "Фильтры": ${filterTitle ? '✅' : '❌'}`);
      console.log(`     - Секция "Категории": ${categories ? '✅' : '❌'}`);
      console.log(`     - Секция "Цена": ${price ? '✅' : '❌'}`);
    } else {
      console.log('  ❌ Filter Sidebar НЕ найден');
    }
    
    // Проверка Product Grid
    console.log('\n🔍 Проверка Product Grid...');
    await page.waitForSelector('article', { timeout: 10000 }).catch(() => {});
    const products = await page.locator('article').all();
    console.log(`  📦 Найдено товаров: ${products.length}`);
    
    if (products.length > 0) {
      console.log('  ✅ Product Grid найден');
      
      // Проверка первого ProductCard
      console.log('\n🔍 Детальная проверка ProductCard...');
      const firstProduct = products[0];
      
      // Проверка изображения
      const img = await firstProduct.locator('img').first();
      const imgVisible = await img.isVisible().catch(() => false);
      const imgSrc = imgVisible ? await img.getAttribute('src') : null;
      console.log(`  🖼️ Изображение: ${imgVisible ? '✅' : '❌'}`);
      if (imgSrc) {
        console.log(`     URL: ${imgSrc.substring(0, 50)}...`);
      }
      
      // Проверка цены
      const priceElement = await firstProduct.locator('[class*="price"]').first();
      const priceVisible = await priceElement.isVisible().catch(() => false);
      const priceText = priceVisible ? await priceElement.textContent() : null;
      console.log(`  💰 Цена: ${priceVisible ? '✅' : '❌'}`);
      if (priceText) {
        console.log(`     Текст: ${priceText}`);
      }
      
      // Проверка цвета цены (Gold)
      const priceColor = priceVisible ? await priceElement.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          color: style.color,
          className: el.className
        };
      }) : null;
      if (priceColor) {
        console.log(`     Цвет: ${priceColor.color}`);
        console.log(`     CSS класс: ${priceColor.className.includes('price') ? '✅ содержит "price"' : '❌'}`);
      }
      
      // Проверка кнопки "В корзину"
      const cartBtn = await firstProduct.locator('button').filter({ hasText: /корзин/i }).first();
      const btnVisible = await cartBtn.isVisible().catch(() => false);
      const btnText = btnVisible ? await cartBtn.textContent() : null;
      console.log(`  🛒 Кнопка "В корзину": ${btnVisible ? '✅' : '❌'}`);
      if (btnText) {
        console.log(`     Текст: ${btnText}`);
      }
      
      // Скриншот первого товара
      await firstProduct.screenshot({ path: '/tmp/product-card.png' });
      console.log('  📸 Скриншот сохранен: /tmp/product-card.png');
    } else {
      console.log('  ❌ Товары не найдены');
      
      // Проверка skeleton loading
      const skeletons = await page.locator('[class*="skeleton"]').count();
      console.log(`  ⏳ Skeleton элементов: ${skeletons}`);
      
      // Проверка пустого состояния
      const emptyState = await page.locator('text=/не найден/i').isVisible().catch(() => false);
      console.log(`  📭 Пустое состояние: ${emptyState ? '✅' : '❌'}`);
    }
    
    // Полный скриншот страницы
    await page.screenshot({ path: '/tmp/catalog-page.png', fullPage: true });
    console.log('\n📸 Полный скриншот страницы: /tmp/catalog-page.png');
    
    // Проверка layout структуры
    console.log('\n🔍 Анализ layout структуры...');
    const container = await page.locator('[class*="container"]').first();
    const containerStyles = await container.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        gridTemplateColumns: style.gridTemplateColumns,
        gap: style.gap
      };
    });
    console.log(`  Container display: ${containerStyles.display}`);
    console.log(`  Grid columns: ${containerStyles.gridTemplateColumns}`);
    console.log(`  Gap: ${containerStyles.gap}`);
    
    console.log('\n✅ Тест завершен успешно!');
    
  } catch (error) {
    console.error('\n❌ Ошибка:', error instanceof Error ? error.message : String(error));
  } finally {
    await browser.close();
  }
})();