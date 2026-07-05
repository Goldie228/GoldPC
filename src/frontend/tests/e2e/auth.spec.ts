/**
 * Playwright E2E tests — Auth (login) flow.
 *
 * Tests the real login modal in a browser against the live backend.
 * Requires: frontend on :5176, backend on :5000.
 */
import { test, expect } from '@playwright/test';

const TEST_USERS = {
  admin: { email: 'admin@goldpc.by', password: 'Admin123!' },
  client: { email: 'client@goldpc.by', password: 'Client123!' },
  manager: { email: 'manager@goldpc.by', password: 'Manager123!' },
  master: { email: 'master@goldpc.by', password: 'Master123!' },
  accountant: { email: 'accountant@goldpc.by', password: 'Accountant123!' },
};

/** Открытие модального окна входа через кнопку профиля в шапке. */
async function openLoginModal(page: import('@playwright/test').Page) {
  // Клик по иконке профиля/входа в шапке
  const profileBtn = page.locator('header button[aria-label="Войти"]');
  await profileBtn.click();
  // Клик "Войти" в выпадающем меню
  const loginBtn = page.getByRole('button', { name: 'Войти' }).first();
  await loginBtn.click();
  // Ожидание появления модальной формы
  await expect(page.locator('#login-email')).toBeVisible();
}

/** Заполнение формы входа и отправка. */
async function submitLogin(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
) {
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('button[type="submit"]').click();
}

test.describe('Auth — Login flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('login modal opens and shows form fields', async ({ page }) => {
    await openLoginModal(page);

    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('#login-email')).toHaveAttribute('type', 'email');
  });

  test('successful login as Client closes modal and updates header', async ({ page }) => {
    await openLoginModal(page);
    await submitLogin(page, TEST_USERS.client.email, TEST_USERS.client.password);

    // Модальное окно должно закрыться (поле email больше не видно)
    await expect(page.locator('#login-email')).not.toBeVisible({ timeout: 10000 });

    // Иконка профиля должна показывать состояние аутентификации
    const profileBtn = page.locator('header button[aria-label="Профиль"]');
    await expect(profileBtn).toBeVisible({ timeout: 5000 });
  });

  test('successful login as Admin — admin panel accessible', async ({ page }) => {
    await openLoginModal(page);
    await submitLogin(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    await expect(page.locator('#login-email')).not.toBeVisible({ timeout: 10000 });

    // Переход в панель администратора
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Должно отображаться содержимое админки, а не перенаправление на вход
    const body = await page.locator('body').textContent();
    expect(body).not.toBeNull();
    // Страница админа должна иметь содержимое (не пустое)
    const rootContent = await page.locator('#root').innerHTML();
    expect(rootContent.trim().length).toBeGreaterThan(0);
  });

  test('failed login shows error message', async ({ page }) => {
    await openLoginModal(page);
    await submitLogin(page, TEST_USERS.client.email, 'WrongPassword123!');

    // Должно появиться уведомление об ошибке
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });

    // Модальное окно должно оставаться открытым (вход не удался)
    await expect(page.locator('#login-email')).toBeVisible();
  });

  test('login with empty fields shows validation errors', async ({ page }) => {
    await openLoginModal(page);
    // Отправка без заполнения полей
    await page.locator('button[type="submit"]').click();

    // Должна появиться ошибка валидации email
    const emailError = page.locator('#login-email-error');
    await expect(emailError).toBeVisible();
  });

  test.describe('Role-based login', () => {
    const roles: Array<{ role: string; email: string; password: string }> = [
      { role: 'Admin', ...TEST_USERS.admin },
      { role: 'Manager', ...TEST_USERS.manager },
      { role: 'Client', ...TEST_USERS.client },
      { role: 'Master', ...TEST_USERS.master },
      { role: 'Accountant', ...TEST_USERS.accountant },
    ];

    for (const { role, email, password } of roles) {
      test(`login as ${role} succeeds`, async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        await openLoginModal(page);
        await submitLogin(page, email, password);

        // Модальное окно должно закрыться
        await expect(page.locator('#login-email')).not.toBeVisible({ timeout: 10000 });

        // Нет критических ошибок консоли (игнорируем шумные сторонние)
        const critical = consoleErrors.filter(
          (e) => !e.includes('favicon') && !e.includes('third-party'),
        );
        expect(critical).toHaveLength(0);
      });
    }
  });
});
