/**
 * Integration test helpers — shared utilities for all integration tests.
 *
 * These tests hit REAL backend services (no mocks).
 * Backend must be running: curl -s http://localhost:5000/api/v1/catalog/products
 */

import apiClient from '@/api/client';
import { goldpcApi } from '@/api/generated/client';

// ═══════════════════════════════════════════════
//  Test credentials (from dev-seed.sql)
// ═══════════════════════════════════════════════

export const TEST_USERS = {
  admin: { email: 'admin@goldpc.by', password: 'Admin123!', role: 'Admin' },
  manager: { email: 'manager@goldpc.by', password: 'Manager123!', role: 'Manager' },
  master: { email: 'master@goldpc.by', password: 'Master123!', role: 'Master' },
  client: { email: 'client@goldpc.by', password: 'Client123!', role: 'Client' },
  accountant: { email: 'accountant@goldpc.by', password: 'Accountant123!', role: 'Accountant' },
} as const;

// ═══════════════════════════════════════════════
//  API base URL (gateway on port 5000)
// ═══════════════════════════════════════════════

const GATEWAY_URL = process.env.INTEGRATION_API_URL ?? 'http://localhost:5000';

// Override apiClient baseURL for integration tests (Node.js environment)
apiClient.defaults.baseURL = `${GATEWAY_URL}/api/v1`;

// ═══════════════════════════════════════════════
//  Auth helpers
// ═══════════════════════════════════════════════

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

/**
 * Login as a specific user and return tokens + user info.
 * Uses the real /Auth/login endpoint.
 */
export async function loginAs(role: keyof typeof TEST_USERS): Promise<LoginResult> {
  const creds = TEST_USERS[role];
  const response = await goldpcApi.postAuthLogin({
    email: creds.email,
    password: creds.password,
  });

  const body = response.data as { data?: LoginResult; success?: boolean };
  const data = body?.data ?? body as unknown as LoginResult;

  if (!data?.accessToken) {
    throw new Error(`Login failed for ${creds.email}: ${JSON.stringify(response.data)}`);
  }

  return data;
}

/**
 * Set the Authorization header on apiClient for authenticated requests.
 */
export function setAuthToken(token: string): void {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

/**
 * Clear the Authorization header.
 */
export function clearAuthToken(): void {
  delete apiClient.defaults.headers.common['Authorization'];
}

// ═══════════════════════════════════════════════
//  Backend health check
// ═══════════════════════════════════════════════

/**
 * Check if the backend gateway is reachable.
 * Call this in beforeAll to skip tests if backend is down.
 */
export async function assertBackendAlive(): Promise<void> {
  try {
    const resp = await apiClient.get('/catalog/products', { params: { pageSize: 1 } });
    if (resp.status !== 200) {
      throw new Error(`Backend returned status ${resp.status}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Backend is not reachable at ${GATEWAY_URL}. ` +
      `Start the backend before running integration tests. Error: ${message}`
    );
  }
}

// ═══════════════════════════════════════════════
//  Response assertion helpers
// ═══════════════════════════════════════════════

/**
 * Extract data from ApiResponse<T> wrapper.
 * Backend wraps all responses in { success, data, message }.
 */
export function unwrap<T>(response: unknown): T {
  if (response != null && typeof response === 'object' && 'data' in response) {
    const wrapped = response as { data?: T; success?: boolean; message?: string };
    if (wrapped.data !== undefined) return wrapped.data;
  }
  throw new Error(`Unable to unwrap response: ${JSON.stringify(response).slice(0, 200)}`);
}

/**
 * Expect the response to have a successful HTTP status.
 */
export function expectSuccess(status: number): void {
  if (status < 200 || status >= 300) {
    throw new Error(`Expected 2xx status, got ${status}`);
  }
}
