/**
 * Playwright Console Monitor Script (ESM)
 * Captures console errors and page errors while navigating through routes
 */

import { chromium } from 'playwright';

const errors = { console: [], page: [] };

const ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/catalog', name: 'Catalog' },
  { path: '/cart', name: 'Cart' },
  { path: '/pc-builder', name: 'PC-Builder' },
];

async function monitorPage(page) {
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      errors.console.push({
        type,
        text: msg.text(),
        location: msg.location(),
        url: page.url(),
      });
    }
  });

  page.on('pageerror', (error) => {
    errors.page.push({
      message: error.message,
      stack: error.stack,
      url: page.url(),
    });
  });
}

async function main() {
  console.log('🚀 Starting Console Monitor...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await monitorPage(page);

  for (const route of ROUTES) {
    console.log(`📍 Navigating to: ${route.name} (${route.path})`);
    
    try {
      await page.goto(`http://localhost:5190${route.path}`, {
        waitUntil: 'networkidle',
        timeout: 20000,
      });
      
      await page.waitForTimeout(3000);
      
    } catch (e) {
      console.log(`  ❌ Failed to load: ${e.message}`);
    }
  }

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('📊 CONSOLE MONITOR REPORT');
  console.log('='.repeat(60));

  if (errors.console.length === 0 && errors.page.length === 0) {
    console.log('\n✅ No critical errors found!\n');
    return;
  }

  if (errors.page.length > 0) {
    console.log('\n🔴 PAGE ERRORS (Uncaught Exceptions):');
    console.log('-'.repeat(40));
    errors.page.forEach((err, i) => {
      console.log(`\n${i + 1}. ${err.message}`);
      console.log(`   URL: ${err.url}`);
      if (err.stack) {
        const stackLines = err.stack.split('\n').slice(0, 5);
        stackLines.forEach((line) => console.log(`   ${line}`));
      }
    });
  }

  if (errors.console.length > 0) {
    console.log('\n🟡 CONSOLE MESSAGES (Errors & Warnings):');
    console.log('-'.repeat(40));
    
    const criticalErrors = errors.console.filter((e) =>
      e.text.includes('Failed to resolve') ||
      e.text.includes('Cannot read') ||
      e.text.includes('undefined') ||
      e.text.includes('null') ||
      e.text.includes('Error:') ||
      e.text.includes('Failed to fetch') ||
      e.text.includes('Module') ||
      !e.text.includes('[HMR]')
    );

    criticalErrors.forEach((err, i) => {
      console.log(`\n${i + 1}. [${err.type.toUpperCase()}] ${err.text}`);
      console.log(`   URL: ${err.url}`);
      if (err.location) {
        console.log(`   Location: ${JSON.stringify(err.location)}`);
      }
    });
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(console.error);