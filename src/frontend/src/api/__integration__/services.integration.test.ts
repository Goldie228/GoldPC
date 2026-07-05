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
//  Жизненный цикл
// ═══════════════════════════════════════════════

let createdRequestId: string | null = null;

beforeAll(async () => {
  await assertBackendAlive();
  const loginResult = await loginAs('client');
  setAuthToken(loginResult.accessToken);
});

afterAll(async () => {
  // Очистка: отменить тестовый запрос, если он был создан
  if (createdRequestId != null) {
    try {
      await servicesApi.cancelServiceRequest(createdRequestId);
    } catch {
      // Игнорировать ошибки очистки — запрос может быть уже отменён или не существовать
    }
  }
  clearAuthToken();
});

// ═══════════════════════════════════════════════
//  Публичные эндпоинты (без авторизации)
// ═══════════════════════════════════════════════

describe('Services API — public', () => {
  it('GET /services/types — returns service types list', async () => {
    const response = await servicesApi.getServiceTypes();
    const types = unwrap(response);

    expect(Array.isArray(types)).toBe(true);
    expect(types.length).toBeGreaterThan(0);

    // Каждый тип должен иметь обязательные поля
    const first = types[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('slug');
    expect(first).toHaveProperty('basePrice');
  });
});

// ═══════════════════════════════════════════════
//  Аутентифицированные эндпоинты (роль клиента)
// ═══════════════════════════════════════════════

describe('Services API — authenticated (client)', () => {
  it('GET /services/my — returns service requests list', async () => {
    const response = await servicesApi.getMyServiceRequests();
    const result = unwrap(response);

    // Результат может быть пагинированным объектом или массивом
    const requests = Array.isArray(result) ? result : result?.items ?? [];
    expect(Array.isArray(requests)).toBe(true);
  });

  it('POST /services — creates a service request', async () => {
    // Сначала получить доступные типы услуг, чтобы выбрать корректный serviceTypeId
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

    // Сохранить для последующих тестов и очистки
    createdRequestId = created.id;
  });

  it('GET /services/my — includes the created request', async () => {
    // Пропустить, если создание не удалось
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
