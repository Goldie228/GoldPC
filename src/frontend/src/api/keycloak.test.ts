import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock keycloak-js — vi.hoisted ensures these exist before vi.mock (which is hoisted)
const { mockKeycloak } = vi.hoisted(() => ({
  mockKeycloak: {
    init: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    token: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    tokenParsed: { preferred_username: 'testuser' },
    updateToken: vi.fn(),
    hasRealmRole: vi.fn(),
  },
}));

vi.mock('keycloak-js', () => {
  return {
    default: function MockKeycloak() {
      return mockKeycloak;
    },
  };
});

// Имитация import.meta.env
vi.stubEnv('VITE_KEYCLOAK_URL', 'https://custom-keycloak.example.com');
vi.stubEnv('VITE_KEYCLOAK_REALM', 'custom-realm');
vi.stubEnv('VITE_KEYCLOAK_CLIENT_ID', 'custom-client');

import { initKeycloak, doLogin, doLogout, getToken, updateToken, getUsername, hasRole } from './keycloak';

describe('api/keycloak', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockKeycloak state to defaults (clearAllMocks only clears mock.fn state, not properties)
    mockKeycloak.token = 'mock-access-token';
    mockKeycloak.refreshToken = 'mock-refresh-token';
    mockKeycloak.tokenParsed = { preferred_username: 'testuser' };
    // Clear localStorage to prevent state leaking between tests
    localStorage.clear();
    vi.stubEnv('VITE_KEYCLOAK_URL', 'https://custom-keycloak.example.com');
    vi.stubEnv('VITE_KEYCLOAK_REALM', 'custom-realm');
    vi.stubEnv('VITE_KEYCLOAK_CLIENT_ID', 'custom-client');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initKeycloak', () => {
    it('calls keycloak.init with check-sso and pkceMethod S256', async () => {
      mockKeycloak.init.mockResolvedValueOnce(false);
      const callback = vi.fn();

      initKeycloak(callback);

      // Wait for promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockKeycloak.init).toHaveBeenCalledWith({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: expect.stringContaining('/silent-check-sso.html'),
        pkceMethod: 'S256',
      });
    });

    it('calls callback after init when not authenticated', async () => {
      mockKeycloak.init.mockResolvedValueOnce(false);
      const callback = vi.fn();

      initKeycloak(callback);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(callback).toHaveBeenCalled();
    });

    it('calls callback after init when authenticated', async () => {
      mockKeycloak.init.mockResolvedValueOnce(true);
      const callback = vi.fn();

      initKeycloak(callback);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(callback).toHaveBeenCalled();
    });

    it('stores tokens in localStorage when authenticated', async () => {
      mockKeycloak.init.mockResolvedValueOnce(true);
      mockKeycloak.token = 'real-access-token';
      mockKeycloak.refreshToken = 'real-refresh-token';
      const callback = vi.fn();

      initKeycloak(callback);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(localStorage.getItem('accessToken')).toBe('real-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('real-refresh-token');
    });

    it('does NOT store tokens in localStorage when not authenticated', async () => {
      mockKeycloak.init.mockResolvedValueOnce(false);
      const callback = vi.fn();

      initKeycloak(callback);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('doLogin', () => {
    it('calls keycloak.login()', async () => {
      mockKeycloak.login.mockResolvedValueOnce(undefined);
      await doLogin();
      expect(mockKeycloak.login).toHaveBeenCalled();
    });
  });

  describe('doLogout', () => {
    it('calls keycloak.logout with redirectUri', async () => {
      mockKeycloak.logout.mockResolvedValueOnce(undefined);
      await doLogout('https://goldpc.by');
      expect(mockKeycloak.logout).toHaveBeenCalledWith({ redirectUri: 'https://goldpc.by' });
    });

    it('calls keycloak.logout without redirectUri', async () => {
      mockKeycloak.logout.mockResolvedValueOnce(undefined);
      await doLogout();
      expect(mockKeycloak.logout).toHaveBeenCalledWith({ redirectUri: undefined });
    });
  });

  describe('getToken', () => {
    it('returns keycloak.token', () => {
      expect(getToken()).toBe('mock-access-token');
    });

    it('returns undefined when token is not set', () => {
      mockKeycloak.token = undefined;
      expect(getToken()).toBeUndefined();
      mockKeycloak.token = 'mock-access-token'; // restore
    });
  });

  describe('getUsername', () => {
    it('returns preferred_username from tokenParsed', () => {
      expect(getUsername()).toBe('testuser');
    });

    it('returns undefined when tokenParsed is undefined', () => {
      mockKeycloak.tokenParsed = undefined as unknown as Record<string, unknown>;
      expect(getUsername()).toBeUndefined();
      mockKeycloak.tokenParsed = { preferred_username: 'testuser' }; // restore
    });
  });

  describe('hasRole', () => {
    it('returns true when user has one of the roles', () => {
      mockKeycloak.hasRealmRole.mockImplementation((role: string) => role === 'Admin');
      expect(hasRole(['Admin', 'Manager'])).toBe(true);
    });

    it('returns false when user has none of the roles', () => {
      mockKeycloak.hasRealmRole.mockReturnValue(false);
      expect(hasRole(['Admin', 'Manager'])).toBe(false);
    });

    it('returns false for empty roles array', () => {
      expect(hasRole([])).toBe(false);
    });
  });

  describe('updateToken', () => {
    it('calls successCallback on success', async () => {
      mockKeycloak.updateToken.mockResolvedValueOnce(true);
      const successCb = vi.fn();
      await updateToken(successCb);
      expect(mockKeycloak.updateToken).toHaveBeenCalledWith(5);
      expect(successCb).toHaveBeenCalled();
    });

    it('returns successCallback result on success', async () => {
      mockKeycloak.updateToken.mockResolvedValueOnce(true);
      const result = await updateToken(() => 'done');
      expect(result).toBe('done');
    });

    it('calls doLogin and returns false on failure (refresh token expired)', async () => {
      mockKeycloak.updateToken.mockRejectedValueOnce(new Error('Token refresh failed'));
      mockKeycloak.login.mockResolvedValueOnce(undefined);
      const successCb = vi.fn();

      const result = await updateToken(successCb);

      expect(mockKeycloak.updateToken).toHaveBeenCalledWith(5);
      expect(successCb).not.toHaveBeenCalled();
      expect(mockKeycloak.login).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
