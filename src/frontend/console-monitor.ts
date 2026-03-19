/**
 * Playwright Console Monitor Script
 * Captures console errors and page errors while navigating through routes
 */

import { chromium, Page, Browser } from 'playwright';

interface ConsoleError {
  type: string;
  text: string;
  location?: string;
  url: string;
}

interface PageError {
  message: string;
  stack?: string;
  url: string;
}

const errors: { console: ConsoleError[]; page: PageError[] } = {
  console: [],
  page: [],
};

const ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/catalog', name: 'Catalog' },
  { path: '/cart', name: 'Cart' },
  { path: '/pc-builder', name: 'PC-Builder' },
];

async function monitorPage(page: Page) {
  // Capture console messages
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      errors.console.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()?.toString(),
        url: page.url(),
      });
    }
  });

  // Capture page errors (uncaught exceptions)
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

  const browser: Browser = await chromium.launch({ headless: true });
  const page: Page = await browser.newPage();

  monitorPage(page);

  for (const route of ROUTES) {
    console.log(`📍 Navigating to: ${route.name} (${route.path})`);
    
    try {
      await page.goto(`http://localhost:5178${route.path}`, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });
      
      // Wait a bit for any async errors
      await page.waitForTimeout(2000);
      
    } catch (e) {
      console.log(`  ❌ Failed to load: ${(e as Error).message}`);
    }
  }

  await browser.close();

  // Report errors
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
    
    // Filter out non-critical messages
    const criticalErrors = errors.console.filter((e) =>
      e.text.includes('Failed to resolve') ||
      e.text.includes('Cannot read') ||
      e.text.includes('undefined') ||
      e.text.includes('null') ||
      e.text.includes('Error:') ||
      e.text.includes('Failed to fetch') ||
      e.text.includes('Module') ||
      !e.text.includes('[HMR]') // Ignore Hot Module Replacement messages
    );

    criticalErrors.forEach((err, i) => {
      console.log(`\n${i + 1}. [${err.type.toUpperCase()}] ${err.text}`);
      console.log(`   URL: ${err.url}`);
      if (err.location) {
        console.log(`   Location: ${err.location}`);
      }
    });
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(console.error);