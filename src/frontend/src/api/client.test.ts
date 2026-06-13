import { describe, it, expect, vi, beforeEach } from 'vitest';

// Типы для мока перехватчиков Axios
interface MockInterceptor {
  fulfilled: (value: any) => any;
  rejected: (error: any) => any;
}

// Мок Axios с рабочей цепочкой перехватчиков
const mockAxiosPost = vi.hoisted(() => vi.fn());

vi.mock('axios', () => {
  const requestHandlers: MockInterceptor[] = [];
  const responseHandlers: MockInterceptor[] = [];

  const instanceFn = vi.fn().mockResolvedValue({ data: {} });

  const instance = Object.assign(instanceFn, {
    interceptors: {
      request: {
        handlers: requestHandlers,
        use: (fulfilled: (c: any) => any, rejected: (e: any) => any) => {
          requestHandlers.push({ fulfilled, rejected });
          return requestHandlers.length - 1;
        },
      },
      response: {
        handlers: responseHandlers,
        use: (fulfilled: (r: any) => any, rejected: (e: any) => any) => {
          responseHandlers.push({ fulfilled, rejected });
          return responseHandlers.length - 1;
        },
      },
    },
    defaults: { headers: { common: {} as Record<string, string> } },
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  });

  return {
    default: {
      create: vi.fn(() => instance),
      post: mockAxiosPost,
    },
  };
});

import apiClient, { BASE_URL } from './client';

describe('api/client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Request Interceptor — Authorization header', () => {
    it('adds Bearer token from localStorage', () => {
      localStorage.setItem('accessToken', 'local-access-token');
      const handler = (apiClient.interceptors.request.handlers as unknown as MockInterceptor[])[0].fulfilled;
      const config = { headers: {} } as any;

      const result = handler(config);

      expect(result.headers.Authorization).toBe('Bearer local-access-token');
    });

    it('adds Bearer token from sessionStorage', () => {
      sessionStorage.setItem('accessToken', 'session-access-token');
      const handler = (apiClient.interceptors.request.handlers as unknown as MockInterceptor[])[0].fulfilled;
      const config = { headers: {} } as any;

      const result = handler(config);

      expect(result.headers.Authorization).toBe('Bearer session-access-token');
    });

    it('prefers localStorage over sessionStorage', () => {
      localStorage.setItem('accessToken', 'local-token');
      sessionStorage.setItem('accessToken', 'session-token');
      const handler = (apiClient.interceptors.request.handlers as unknown as MockInterceptor[])[0].fulfilled;
      const config = { headers: {} } as any;

      const result = handler(config);

      expect(result.headers.Authorization).toBe('Bearer local-token');
    });

    it('does not add header when no token exists', () => {
      const handler = (apiClient.interceptors.request.handlers as unknown as MockInterceptor[])[0].fulfilled;
      const config = { headers: {} } as any;

      const result = handler(config);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor — 401 token refresh', () => {
    it('refreshes token from localStorage and retries request on 401', async () => {
      localStorage.setItem('refreshToken', 'refresh-token-123');

      mockAxiosPost.mockResolvedValueOnce({
        data: {
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        },
      });

      const handler = (apiClient.interceptors.response.handlers as unknown as MockInterceptor[])[0].rejected;
      const originalRequest = { _retry: false, headers: {} as Record<string, string> };
      const error = { response: { status: 401 }, config: originalRequest };

      await handler(error);

      // Refresh endpoint called with correct payload
      expect(mockAxiosPost).toHaveBeenCalledWith(`${BASE_URL}/auth/refresh`, {
        refreshToken: 'refresh-token-123',
      });

      // New tokens stored in localStorage
      expect(localStorage.getItem('accessToken')).toBe('new-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token');

      // Authorization header updated on original request
      expect(originalRequest.headers.Authorization).toBe('Bearer new-access-token');
    });

    it('refreshes token from sessionStorage and stores back to sessionStorage', async () => {
      sessionStorage.setItem('refreshToken', 'session-refresh-token');

      mockAxiosPost.mockResolvedValueOnce({
        data: {
          data: {
            accessToken: 'new-session-access',
            refreshToken: 'new-session-refresh',
          },
        },
      });

      const handler = (apiClient.interceptors.response.handlers as unknown as MockInterceptor[])[0].rejected;
      const originalRequest = { _retry: false, headers: {} as Record<string, string> };
      const error = { response: { status: 401 }, config: originalRequest };

      await handler(error);

      expect(sessionStorage.getItem('accessToken')).toBe('new-session-access');
      expect(sessionStorage.getItem('refreshToken')).toBe('new-session-refresh');
      expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('clears all tokens and auth-storage on failed refresh', async () => {
      localStorage.setItem('refreshToken', 'refresh-token-123');
      localStorage.setItem('accessToken', 'old-access-token');
      localStorage.setItem('auth-storage', '{"user":"test"}');
      sessionStorage.setItem('accessToken', 'session-access');
      sessionStorage.setItem('refreshToken', 'session-refresh');

      mockAxiosPost.mockRejectedValueOnce(new Error('Network error'));

      const handler = (apiClient.interceptors.response.handlers as unknown as MockInterceptor[])[0].rejected;
      const error = {
        response: { status: 401 },
        config: { _retry: false, headers: {} },
      };

      await expect(handler(error)).rejects.toThrow();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('auth-storage')).toBeNull();
      expect(sessionStorage.getItem('accessToken')).toBeNull();
      expect(sessionStorage.getItem('refreshToken')).toBeNull();
    });

    it('does not retry when _retry is already true', async () => {
      localStorage.setItem('refreshToken', 'refresh-token-123');

      const handler = (apiClient.interceptors.response.handlers as unknown as MockInterceptor[])[0].rejected;
      const error = {
        response: { status: 401 },
        config: { _retry: true, headers: {} },
      };

      await expect(handler(error)).rejects.toBeDefined();

      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it('passes through non-401 errors without refresh attempt', async () => {
      const handler = (apiClient.interceptors.response.handlers as unknown as MockInterceptor[])[0].rejected;
      const error = {
        response: { status: 500 },
        config: { _retry: false, headers: {} },
      };

      await expect(handler(error)).rejects.toBeDefined();

      expect(mockAxiosPost).not.toHaveBeenCalled();
    });
  });

  describe('BASE_URL', () => {
    it('defaults to /api/v1 when VITE_API_URL is not set', () => {
      expect(BASE_URL).toBe('/api/v1');
    });
  });
});
