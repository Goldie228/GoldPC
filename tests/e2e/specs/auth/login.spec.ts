import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

/**
 * E2E тесты для авторизации
 * @see development-plan/10-e2e-and-load-testing.md (Section 10.1)
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
    await expect(page).toHaveURL(/\/catalog/);
    
    // Проверяем, что пользователь видит страницу каталога
    await expect(page.locator('.products-grid')).toBeVisible();
  });

  test('Invalid credentials show error message', async ({ page }) => {
    // Arrange
    const invalidEmail = 'wrong@example.com';
    const invalidPassword = 'wrongpassword';

    // Act
    await loginPage.login(invalidEmail, invalidPassword);

    // Assert - остаемся на странице логина с сообщением об ошибке
    await expect(page).toHaveURL(/\/login/);
    await loginPage.expectError('Неверный email или пароль');
  });

  test('Empty fields validation', async ({ page }) => {
    // Act
    await loginPage.login('', '');

    // Assert - поля помечены как невалидные
    await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#password')).toHaveAttribute('aria-invalid', 'true');
    
    // Остаемся на странице логина
    await expect(page).toHaveURL(/\/login/);
  });

  test('Navigation to registration page', async ({ page }) => {
    // Act
    await loginPage.goToRegister();

    // Assert
    await expect(page).toHaveURL(/\/register/);
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
    await loginPage.expectError('Неверный email или пароль');

    // Изменяем данные
    await page.locator('#email').fill('new@example.com');

    // Сообщение об ошибке должно исчезнуть
    await expect(page.locator('.error-message')).not.toBeVisible();
  });

  test('Login with Enter key', async ({ page }) => {
    // Arrange
    const validEmail = 'test@example.com';
    const validPassword = 'password123';

    // Act - заполняем поля и нажимаем Enter
    await page.locator('#email').fill(validEmail);
    await page.locator('#password').fill(validPassword);
    await page.locator('#password').press('Enter');

    // Assert - успешный вход с редиректом на каталог
    await expect(page).toHaveURL(/\/catalog/);
    await expect(page.locator('.products-grid')).toBeVisible();
  });
});