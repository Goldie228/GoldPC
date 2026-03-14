import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

/**
 * E2E тесты для авторизации
 */
test.describe('Авторизация', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('Успешная авторизация', async ({ page }) => {
    // Act
    await loginPage.login('test@example.com', 'password123');

    // Assert
    await expect(page).toHaveURL(/\/(catalog|profile)/);
  });

  test('Ошибка при неверных данных', async () => {
    // Act
    await loginPage.login('wrong@example.com', 'wrongpassword');

    // Assert
    await loginPage.expectError('Неверный email или пароль');
  });

  test('Валидация пустых полей', async ({ page }) => {
    // Act
    await loginPage.login('', '');

    // Assert
    await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#password')).toHaveAttribute('aria-invalid', 'true');
  });

  test('Переход на страницу регистрации', async ({ page }) => {
    // Act
    await loginPage.goToRegister();

    // Assert
    await expect(page).toHaveURL(/\/register/);
  });
});