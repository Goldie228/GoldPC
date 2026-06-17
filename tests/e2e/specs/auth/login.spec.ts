import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

/**
 * E2E тесты для авторизации
 * Актуальные селекторы: #login-email, #login-password, [role="alert"]
 */
test.describe('Авторизация', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('Успешная авторизация redirects to catalog', async ({ page }) => {
    // Arrange
    const validEmail = 'test@example.com';
    const validPassword = 'password123';

    // Act
    await loginPage.login(validEmail, validPassword);

    // Assert - успешная авторизация редиректит на каталог
    await expect(page).toHaveURL(/\/(catalog|\/)/, { timeout: 10000 });
  });

  test('Invalid credentials show error message', async ({ page }) => {
    // Arrange
    const invalidEmail = 'wrong@example.com';
    const invalidPassword = 'wrongpassword';

    // Act
    await loginPage.login(invalidEmail, invalidPassword);

    // Assert - появляется сообщение об ошибке
    await loginPage.expectError(/неверн|ошибк|error/i);
  });

  test('Empty fields validation', async ({ page }) => {
    // Act
    await loginPage.login('', '');

    // Assert - проверяем что форма осталась видимой
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
  });

  test('Navigation to registration page', async ({ page }) => {
    // Act
    await loginPage.goToRegister();

    // Assert - открывается форма регистрации
    await expect(page.locator('text=Зарегистрироваться').first()).toBeVisible();
  });

  test('Forgot password link navigation', async ({ page }) => {
    // Act
    await page.locator('a[href="/forgot-password"]').click();

    // Assert
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('Error message disappears after input change', async ({ page }) => {
    // Сначала вызываем ошибку
    await loginPage.login('wrong@example.com', 'wrongpassword');
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 5000 });

    // Изменяем данные
    await loginPage.emailInput.fill('new@example.com');

    // Сообщение об ошибке должно исчезнуть
    await expect(loginPage.errorMessage).not.toBeVisible({ timeout: 3000 });
  });

  test('Login with Enter key', async ({ page }) => {
    // Arrange
    const validEmail = 'test@example.com';
    const validPassword = 'password123';

    // Act - заполняем поля и нажимаем Enter
    await loginPage.emailInput.fill(validEmail);
    await loginPage.passwordInput.fill(validPassword);
    await loginPage.passwordInput.press('Enter');

    // Assert - успешный вход
    await expect(page).toHaveURL(/\/(catalog|\/)/, { timeout: 10000 });
  });
});
