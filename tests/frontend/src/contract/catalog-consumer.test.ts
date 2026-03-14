import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Pact from '@pact-foundation/pact';

/**
 * Контрактные тесты потребителя (Frontend) для Catalog API
 * 
 * Эти тесты определяют ожидания фронтенда от API.
 * После успешного прохождения контракт публикуется в Pact Broker.
 */

const provider = new Pact.Pact({
  consumer: 'GoldPC-Frontend',
  provider: 'GoldPC-Catalog-API',
  port: 1234,
  dir: './pacts',
  log: './logs/pact.log',
  logLevel: 'info',
  spec: 2
});

describe('Catalog API Consumer Tests', () => {
  beforeAll(async () => {
    await provider.setup();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  describe('GET /api/v1/catalog/products', () => {
    it('returns a list of products with pagination', async () => {
      await provider.addInteraction({
        uponReceiving: 'a request for products list',
        withRequest: {
          method: 'GET',
          path: '/api/v1/catalog/products',
          query: { page: '1', limit: '20' },
          headers: {
            Accept: 'application/json'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            data: Pact.Matchers.eachLike({
              id: Pact.Matchers.uuid(),
              name: Pact.Matchers.string('AMD Ryzen 9 7950X'),
              price: Pact.Matchers.decimal(59999.00),
              stock: Pact.Matchers.integer(10),
              category: Pact.Matchers.term({
                matcher: '^(cpu|gpu|ram|motherboard|psu|storage|case|cooling)$',
                generate: 'cpu'
              }),
              manufacturer: Pact.Matchers.string('AMD'),
              rating: Pact.Matchers.decimal(4.5),
              isActive: Pact.Matchers.boolean(true)
            }),
            pagination: {
              page: Pact.Matchers.integer(1),
              limit: Pact.Matchers.integer(20),
              total: Pact.Matchers.integer(100),
              totalPages: Pact.Matchers.integer(5)
            }
          }
        }
      });

      const response = await fetch('http://localhost:1234/api/v1/catalog/products?page=1&limit=20');
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.pagination).toBeDefined();
      expect(body.pagination.page).toBe(1);
    });

    it('returns filtered products by category', async () => {
      await provider.addInteraction({
        uponReceiving: 'a request for products by category',
        withRequest: {
          method: 'GET',
          path: '/api/v1/catalog/products',
          query: { category: 'cpu' },
          headers: {
            Accept: 'application/json'
          }
        },
        willRespondWith: {
          status: 200,
          body: {
            data: Pact.Matchers.eachLike({
              id: Pact.Matchers.uuid(),
              name: Pact.Matchers.string('AMD Ryzen 9 7950X'),
              category: Pact.Matchers.term({
                matcher: '^cpu$',
                generate: 'cpu'
              })
            })
          }
        }
      });

      const response = await fetch('http://localhost:1234/api/v1/catalog/products?category=cpu');
      const body = await response.json();

      expect(response.status).toBe(200);
      body.data.forEach((product: any) => {
        expect(product.category).toBe('cpu');
      });
    });
  });

  describe('GET /api/v1/catalog/products/:id', () => {
    it('returns a single product by id', async () => {
      const productId = '00000000-0000-0000-0000-000000000001';

      await provider.addInteraction({
        uponReceiving: 'a request for single product',
        withRequest: {
          method: 'GET',
          path: `/api/v1/catalog/products/${productId}`,
          headers: {
            Accept: 'application/json'
          }
        },
        willRespondWith: {
          status: 200,
          body: {
            id: Pact.Matchers.uuid(productId),
            name: Pact.Matchers.string('AMD Ryzen 9 7950X'),
            sku: Pact.Matchers.string('SKU-12345'),
            price: Pact.Matchers.decimal(59999.00),
            stock: Pact.Matchers.integer(10),
            category: Pact.Matchers.string('cpu'),
            manufacturer: Pact.Matchers.string('AMD'),
            specifications: Pact.Matchers.somethingLike({
              socket: 'AM5',
              cores: 16,
              threads: 32,
              baseFrequency: '4500 MHz',
              boostFrequency: '5700 MHz',
              tdp: '170 W'
            }),
            description: Pact.Matchers.string('Топовый процессор для энтузиастов'),
            rating: Pact.Matchers.decimal(4.8),
            warrantyMonths: Pact.Matchers.integer(36),
            isActive: Pact.Matchers.boolean(true),
            createdAt: Pact.Matchers.iso8601DateTime('2024-01-15T10:00:00Z')
          }
        }
      });

      const response = await fetch(`http://localhost:1234/api/v1/catalog/products/${productId}`);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.id).toBe(productId);
      expect(body.name).toBeDefined();
      expect(body.price).toBeDefined();
    });

    it('returns 404 when product not found', async () => {
      const nonExistentId = '00000000-0000-0000-0000-999999999999';

      await provider.addInteraction({
        uponReceiving: 'a request for non-existent product',
        withRequest: {
          method: 'GET',
          path: `/api/v1/catalog/products/${nonExistentId}`,
          headers: {
            Accept: 'application/json'
          }
        },
        willRespondWith: {
          status: 404,
          body: {
            code: Pact.Matchers.string('PRODUCT_NOT_FOUND'),
            message: Pact.Matchers.string('Товар не найден')
          }
        }
      });

      const response = await fetch(`http://localhost:1234/api/v1/catalog/products/${nonExistentId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/catalog/categories', () => {
    it('returns list of categories', async () => {
      await provider.addInteraction({
        uponReceiving: 'a request for categories',
        withRequest: {
          method: 'GET',
          path: '/api/v1/catalog/categories',
          headers: {
            Accept: 'application/json'
          }
        },
        willRespondWith: {
          status: 200,
          body: Pact.Matchers.eachLike({
            id: Pact.Matchers.string('cpu'),
            name: Pact.Matchers.string('Процессоры'),
            productCount: Pact.Matchers.integer(45)
          })
        }
      });

      const response = await fetch('http://localhost:1234/api/v1/catalog/categories');
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/catalog/products/search', () => {
    it('returns search results', async () => {
      await provider.addInteraction({
        uponReceiving: 'a search request',
        withRequest: {
          method: 'GET',
          path: '/api/v1/catalog/products/search',
          query: { q: 'ryzen' },
          headers: {
            Accept: 'application/json'
          }
        },
        willRespondWith: {
          status: 200,
          body: {
            data: Pact.Matchers.eachLike({
              id: Pact.Matchers.uuid(),
              name: Pact.Matchers.term({
                matcher: '.*[Rr]yzen.*',
                generate: 'AMD Ryzen 9 7950X'
              }),
              price: Pact.Matchers.decimal(59999.00)
            }),
            query: Pact.Matchers.string('ryzen'),
            totalResults: Pact.Matchers.integer(5)
          }
        }
      });

      const response = await fetch('http://localhost:1234/api/v1/catalog/products/search?q=ryzen');
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.query).toBe('ryzen');
    });
  });
});