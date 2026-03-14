import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model для страницы авторизации
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('button[type="submit"]');
    this.registerLink = page.locator('a[href="/register"]');
    this.forgotPasswordLink = page.locator('a[href="/forgot-password"]');
    this.errorMessage = page.locator('.error-message');
    this.successMessage = page.locator('.success-message');
  }

  /**
   * Переход на страницу авторизации
   */
  async goto() {
    await this.page.goto('/login');
    await expect(this.page).toHaveURL(/\/login/);
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
    await expect(this.successMessage).not.toBeVisible();
  }

  /**
   * Проверка ошибки авторизации
   */
  async expectError(message: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  /**
   * Переход на страницу регистрации
   */
  async goToRegister() {
    await this.registerLink.click();
    await expect(this.page).toHaveURL(/\/register/);
  }
}