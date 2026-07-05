/**
 * Integration tests — Orders, Addresses, and Warranty API modules.
 *
 * These tests hit REAL backend services (no mocks).
 * Backend must be running: ./dev-local.sh
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ordersApi } from '@/api/orders';
import { addressesApi } from '@/api/addresses';
import { warrantyApi } from '@/api/warranty';
import {
  loginAs,
  setAuthToken,
  clearAuthToken,
  assertBackendAlive,
  unwrap,
} from '@/api/__integration__/setup';

// ═══════════════════════════════════════════════
//  Настройка
// ═══════════════════════════════════════════════

let createdAddressId: string | undefined;

beforeAll(async () => {
  await assertBackendAlive();
  const login = await loginAs('client');
  setAuthToken(login.accessToken);
});

afterAll(async () => {
  // Очистка: удалить тестовый адрес, если он был создан
  if (createdAddressId) {
    try {
      await addressesApi.deleteAddress(createdAddressId);
    } catch {
      // Очистка по возможности
    }
  }
  clearAuthToken();
});

// ═══════════════════════════════════════════════
//  Orders API
// ═══════════════════════════════════════════════

describe('Orders API', () => {
  it('getDeliveryQuote — returns delivery options for Минск', async () => {
    const quote = await ordersApi.getDeliveryQuote({
      deliveryMethod: 'Delivery',
      subtotal: 500,
      city: 'Минск',
    });

    expect(quote).toBeDefined();
    expect(typeof quote.subtotal).toBe('number');
    expect(typeof quote.deliveryCost).toBe('number');
    expect(typeof quote.total).toBe('number');
    expect(quote.total).toBeGreaterThanOrEqual(quote.subtotal);
  });

  it('getMyOrders — returns paged order list', async () => {
    const result = await ordersApi.getMyOrders(1, 10);

    expect(result).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.totalCount).toBe('number');
    expect(typeof result.pageNumber).toBe('number');
    expect(typeof result.pageSize).toBe('number');
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);
  });
});

// ═══════════════════════════════════════════════
//  Addresses API
// ═══════════════════════════════════════════════

describe('Addresses API', () => {
  it('getAddresses — returns address list', async () => {
    const addresses = await addressesApi.getAddresses();

    expect(Array.isArray(addresses)).toBe(true);
    // Каждый адрес должен иметь обязательные поля
    for (const addr of addresses) {
      expect(typeof addr.id).toBe('string');
      expect(typeof addr.name).toBe('string');
      expect(typeof addr.city).toBe('string');
      expect(typeof addr.address).toBe('string');
      expect(typeof addr.isDefault).toBe('boolean');
    }
  });

  it('createAddress + deleteAddress — creates and cleans up an address', async () => {
    const testAddress = {
      name: 'Тестовый адрес',
      city: 'Минск',
      address: 'ул. Тестовая, 42',
      apartment: '10',
      postalCode: '220000',
      isDefault: false,
    };

    // Создание
    const created = await addressesApi.createAddress(testAddress);
    expect(created).toBeDefined();
    expect(created.id).toBeTruthy();
    expect(created.name).toBe(testAddress.name);
    expect(created.city).toBe(testAddress.city);
    expect(created.address).toBe(testAddress.address);
    expect(created.apartment).toBe(testAddress.apartment);
    expect(created.postalCode).toBe(testAddress.postalCode);
    expect(created.isDefault).toBe(false);

    // Сохраняем ID для очистки в afterAll на случай ошибки удаления
    createdAddressId = created.id;

    // Проверяем, что адрес появился в списке
    const addresses = await addressesApi.getAddresses();
    const found = addresses.find((a) => a.id === created.id);
    expect(found).toBeDefined();

    // Удаляем
    await addressesApi.deleteAddress(created.id);
    createdAddressId = undefined;

    // Проверяем, что удалено
    const addressesAfter = await addressesApi.getAddresses();
    const deleted = addressesAfter.find((a) => a.id === created.id);
    expect(deleted).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════
//  Warranty API
// ═══════════════════════════════════════════════

describe('Warranty API', () => {
  it('getMyCards — returns paged warranty cards list', async () => {
    const result = await warrantyApi.getMyCards(1, 10);

    expect(result).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.totalCount).toBe('number');
    expect(typeof result.pageNumber).toBe('number');
    expect(typeof result.pageSize).toBe('number');
    expect(result.pageNumber).toBe(1);
    expect(result.pageSize).toBe(10);

    // Каждая карта должна иметь обязательные поля
    for (const card of result.items) {
      expect(typeof card.id).toBe('string');
      expect(typeof card.warrantyNumber).toBe('string');
      expect(typeof card.productName).toBe('string');
      expect(['active', 'expired', 'annulled']).toContain(card.status);
    }
  });
});
