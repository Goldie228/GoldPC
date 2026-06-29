/**
 * Integration tests for Auth API module.
 *
 * Tests authService functions against the REAL backend (no mocks).
 * Backend must be running at http://localhost:5000.
 */
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { goldpcApi } from '@/api/generated/client';
import {
  loginAs,
  setAuthToken,
  clearAuthToken,
  assertBackendAlive,
  unwrap,
  TEST_USERS,
} from './setup';
import { getAuthErrorMessage } from '@/api/authService';

beforeAll(async () => {
  await assertBackendAlive();
});

afterEach(() => {
  clearAuthToken();
});

describe('Auth API integration', () => {
  // ──────────────────────────────────────────
  //  1. authService.login()
  // ──────────────────────────────────────────
  describe('login()', () => {
    it('returns accessToken, refreshToken and user for valid credentials', async () => {
      const result = await loginAs('admin');

      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(TEST_USERS.admin.email);
      expect(result.user.roles).toContain('Admin');
    });

    it('throws on invalid credentials', async () => {
      await expect(
        goldpcApi.postAuthLogin({
          email: 'nonexistent@goldpc.by',
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow();
    });
  });

  // ──────────────────────────────────────────
  //  2. authService.getCurrentUser()
  // ──────────────────────────────────────────
  describe('getCurrentUser()', () => {
    it('returns user profile with correct email after login', async () => {
      const { accessToken, user: loginUser } = await loginAs('client');
      setAuthToken(accessToken);

      const profileResponse = await goldpcApi.getAuthProfile();
      const profile = unwrap(profileResponse);

      expect(profile.email).toBe(TEST_USERS.client.email);
      expect(profile.id).toBe(loginUser.id);
    });
  });

  // ──────────────────────────────────────────
  //  3. authService.logout()
  // ──────────────────────────────────────────
  describe('logout()', () => {
    it('clears session without throwing', async () => {
      const { accessToken } = await loginAs('admin');
      setAuthToken(accessToken);

      await expect(
        goldpcApi.postAuthLogout()
      ).resolves.toBeDefined();
    });
  });

  // ──────────────────────────────────────────
  //  4. authService.register()
  // ──────────────────────────────────────────
  describe('register()', () => {
    it('creates a new user and returns tokens', async () => {
      const uniqueEmail = `testuser_${Date.now()}@goldpc.by`;

      const response = await goldpcApi.postAuthRegister({
        email: uniqueEmail,
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
      });

      const data = unwrap(response);
      expect(data.accessToken).toBeTruthy();
      expect(data.refreshToken).toBeTruthy();
      expect(data.user).toBeDefined();
      expect(data.user!.email).toBe(uniqueEmail);
    });
  });

  // ──────────────────────────────────────────
  //  5. getAuthErrorMessage()
  // ──────────────────────────────────────────
  describe('getAuthErrorMessage()', () => {
    it('returns correct Russian message for 401', () => {
      expect(getAuthErrorMessage(401)).toBe('Неверный email или пароль.');
    });

    it('returns correct Russian message for 403', () => {
      expect(getAuthErrorMessage(403)).toBe(
        'Этот аккаунт заблокирован. Обратитесь в поддержку.'
      );
    });

    it('returns correct Russian message for 404', () => {
      expect(getAuthErrorMessage(404)).toBe(
        'Пользователь с таким email не найден.'
      );
    });

    it('returns correct Russian message for 409', () => {
      expect(getAuthErrorMessage(409)).toBe(
        'Пользователь с таким email уже зарегистрирован.'
      );
    });

    it('returns correct Russian message for 429', () => {
      expect(getAuthErrorMessage(429)).toBe(
        'Слишком много попыток входа. Попробуйте позже.'
      );
    });

    it('returns correct Russian message for 500', () => {
      expect(getAuthErrorMessage(500)).toBe(
        'Ошибка сервера. Попробуйте через несколько минут.'
      );
    });

    it('returns fallback message for unknown status code', () => {
      expect(getAuthErrorMessage(999)).toBe(
        'Неизвестная ошибка. Попробуйте позже.'
      );
    });
  });
});
