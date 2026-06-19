/**
 * Integration tests for Services API module.
 *
 * Tests real backend endpoints — no mocks.
 * Backend must be running: curl -s http://localhost:5000/api/v1/services/types
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { servicesApi, type ServiceRequestDto } from '@/api/services';
import {
  loginAs,
  setAuthToken,
  clearAuthToken,
  assertBackendAlive,
  unwrap,
} from '@/api/__integration__/setup';

// ═══════════════════════════════════════════════
//  Lifecycle
// ═══════════════════════════════════════════════

let createdRequestId: string | null = null;

beforeAll(async () => {
  await assertBackendAlive();
  const loginResult = await loginAs('client');
  setAuthToken(loginResult.accessToken);
});

afterAll(async () => {
  // Cleanup: cancel the test request if it was created
  if (createdRequestId != null) {
    try {
      await servicesApi.cancelServiceRequest(createdRequestId);
    } catch {
      // Ignore cleanup errors — request may already be cancelled or not exist
    }
  }
  clearAuthToken();
});

// ═══════════════════════════════════════════════
//  Public endpoints (no auth required)
// ═══════════════════════════════════════════════

describe('Services API — public', () => {
  it('GET /services/types — returns service types list', async () => {
    const response = await servicesApi.getServiceTypes();
    const types = unwrap(response);

    expect(Array.isArray(types)).toBe(true);
    expect(types.length).toBeGreaterThan(0);

    // Each type must have required fields
    const first = types[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('slug');
    expect(first).toHaveProperty('basePrice');
  });
});

// ═══════════════════════════════════════════════
//  Authenticated endpoints (client role)
// ═══════════════════════════════════════════════

describe('Services API — authenticated (client)', () => {
  it('GET /services/my — returns service requests list', async () => {
    const response = await servicesApi.getMyServiceRequests();
    const result = unwrap(response);

    // Result may be a paginated object or an array
    const requests = Array.isArray(result) ? result : result?.items ?? [];
    expect(Array.isArray(requests)).toBe(true);
  });

  it('POST /services — creates a service request', async () => {
    // First get available service types to pick a valid serviceTypeId
    const typesResponse = await servicesApi.getServiceTypes();
    const types = unwrap(typesResponse);
    expect(types.length).toBeGreaterThan(0);

    const serviceTypeId = types[0].id;

    const createResponse = await servicesApi.createServiceRequest({
      serviceTypeId,
      description: 'Интеграционный тест: проверка создания заявки на услугу',
      deviceModel: 'Test Device Model',
      serialNumber: 'TEST-SN-001',
    });

    const created = unwrap(createResponse) as ServiceRequestDto;

    expect(created).toHaveProperty('id');
    expect(created).toHaveProperty('requestNumber');
    expect(created.id).toBeTruthy();
    expect(created.requestNumber).toBeTruthy();

    // Store for later tests and cleanup
    createdRequestId = created.id;
  });

  it('GET /services/my — includes the created request', async () => {
    // Skip if creation failed
    if (createdRequestId == null) {
      return;
    }

    const response = await servicesApi.getMyServiceRequests();
    const result = unwrap(response);
    const requests = Array.isArray(result) ? result : result?.items ?? [];

    const found = requests.find(
      (r: ServiceRequestDto) => r.id === createdRequestId,
    );
    expect(found).toBeDefined();
    expect(found!.id).toBe(createdRequestId);
  });

  it('GET /services/{id} — returns the created request by ID', async () => {
    if (createdRequestId == null) {
      return;
    }

    const response = await servicesApi.getServiceRequestById(createdRequestId);
    const request = unwrap(response) as ServiceRequestDto;

    expect(request.id).toBe(createdRequestId);
    expect(request.requestNumber).toBeTruthy();
    expect(request.description).toContain('Интеграционный тест');
  });
});
