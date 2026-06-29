import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model для страницы авторизации
 * Актуальные селекторы: #login-email, #login-password, [role="alert"]
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;
  // Модальное окно логина
  readonly modal: Locator;

  constructor(page: Page) {
    this.page = page;
    // Актуальные ID из LoginModal.tsx
    this.emailInput = page.locator('#login-email');
    this.passwordInput = page.locator('#login-password');
    this.loginButton = page.locator('button[type="submit"]');
    // Кнопка "Зарегистрироваться" — это <button>, не <a>
    this.registerButton = page.locator('button:has-text("Зарегистрироваться")');
    this.forgotPasswordLink = page.locator('a[href="/forgot-password"]');
    // Ошибка: div с role="alert"
    this.errorMessage = page.locator('[role="alert"]').first();
    // Модальное окно
    this.modal = page.locator('[role="dialog"]');
  }

  /**
   * Переход на страницу авторизации (модальное окно)
   */
  async goto() {
    await this.page.goto('/');
    // Открываем модалку логина — кликаем по иконке пользователя в хедере
    const userBtn = this.page.locator('button[aria-label*="вой"], button[aria-label*="Вой"], button[aria-label*="профил"], [data-testid="user-menu"]').first();
    if (await userBtn.isVisible().catch(() => false)) {
      await userBtn.click();
    }
    // Ждём появления модалки
    await expect(this.modal).toBeVisible({ timeout: 5000 });
  }

  /**
   * Выполнение входа
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Проверка успешной авторизации
   */
  async expectLoginSuccess() {
    await expect(this.page).toHaveURL(/\/(catalog|profile)/);
    // Модалка должна закрыться
    await expect(this.modal).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Проверка ошибки авторизации
   */
  async expectError(message: string | RegExp) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  /**
   * Переход на страницу регистрации (кнопка в модалке)
   */
  async goToRegister() {
    await this.registerButton.click();
    // Регистрация — это тоже модалка
    await expect(this.page.locator('text=Зарегистрироваться').first()).toBeVisible({ timeout: 5000 });
  }
}
