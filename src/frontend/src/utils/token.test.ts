import { describe, it, expect, beforeEach } from 'vitest';
import { getAccessToken, isAccessTokenValid } from './token';

function makeJwt(expSeconds: number | null): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = expSeconds != null
    ? btoa(JSON.stringify({ exp: expSeconds, sub: 'user-1' }))
    : btoa(JSON.stringify({ sub: 'user-1' }));
  return `${header}.${payload}.signature`;
}

describe('utils/token', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('getAccessToken', () => {
    it('returns null when no token in storage', () => {
      expect(getAccessToken()).toBeNull();
    });

    it('reads from localStorage first', () => {
      localStorage.setItem('accessToken', 'local');
      sessionStorage.setItem('accessToken', 'session');
      expect(getAccessToken()).toBe('local');
    });

    it('falls back to sessionStorage', () => {
      sessionStorage.setItem('accessToken', 'session');
      expect(getAccessToken()).toBe('session');
    });
  });

  describe('isAccessTokenValid', () => {
    it('returns false when no token', () => {
      expect(isAccessTokenValid()).toBe(false);
    });

    it('returns false for empty string token', () => {
      localStorage.setItem('accessToken', '');
      expect(isAccessTokenValid()).toBe(false);
    });

    it('returns false for malformed token', () => {
      localStorage.setItem('accessToken', 'not-a-jwt');
      expect(isAccessTokenValid()).toBe(false);
    });

    it('returns false for token without exp claim', () => {
      localStorage.setItem('accessToken', makeJwt(null));
      expect(isAccessTokenValid()).toBe(false);
    });

    it('returns true for token with future exp', () => {
      const future = Math.floor(Date.now() / 1000) + 3600;
      localStorage.setItem('accessToken', makeJwt(future));
      expect(isAccessTokenValid()).toBe(true);
    });

    it('returns false for expired token', () => {
      const past = Math.floor(Date.now() / 1000) - 60;
      localStorage.setItem('accessToken', makeJwt(past));
      expect(isAccessTokenValid()).toBe(false);
    });
  });
});
