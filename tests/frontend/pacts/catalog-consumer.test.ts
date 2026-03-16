import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Pact from '@pact-foundation/pact';

/**
 * Контрактные тесты потребителя (Frontend) для Catalog API
 * 
 * Эти тесты определяют ожидания фронтенда от Catalog API.
 * После успешного прохождения контракт публикуется в Pact Broker.
 * 
 * Consumer: GoldPC-Frontend
 * Provider: GoldPC-Catalog-API
 */

const provider = new Pact.Pact({
  consumer: 'GoldPC-Frontend',
  provider: 'GoldPC-Catalog-API',
  port: 12345,
  dir: './pacts',
  log: './logs/pact.log',
  logLevel: 'info',
  spec: 2
});

describe('Catalog API Consumer Contract Tests', () => {
  beforeAll(async () => {
    await provider.setup();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  describe('GET /api/v1/catalog/products', () => {
    it('should return a list of products with status 200', async () => {
      // Определяем взаимодействие с провайдером
      await provider.addInteraction({
        uponReceiving: 'a request for products list',
        withRequest: {
          method: 'GET',
          path: '/api/v1/catalog/products',
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
            // Ожидаем структуру ответа с массивом data
            data: Pact.Matchers.eachLike({
              id: Pact.Matchers.uuid('550e8400-e29b-41d4-a716-446655440000'),
              name: Pact.Matchers.string('AMD Ryzen 7 7800X3D'),
              price: Pact.Matchers.decimal(1599.99)
            })
          }
        }
      });

      // Выполняем запрос к mock провайдеру
      const response = await fetch('http://localhost:12345/api/v1/catalog/products', {
        headers: {
          Accept: 'application/json'
        }
      });

      const body = await response.json();

      // Проверяем статус ответа
      expect(response.status).toBe(200);

      // Проверяем структуру body
      expect(body).toHaveProperty('data');
      expect(body.data).toBeInstanceOf(Array);

      // Проверяем что каждый продукт содержит обязательные поля
      if (body.data.length > 0) {
        const product = body.data[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');
      }
    });

    it('should return products with pagination support', async () => {
      await provider.addInteraction({
        uponReceiving: 'a paginated request for products',
        withRequest: {
          method: 'GET',
          path: '/api/v1/catalog/products',
          query: { page: '1', limit: '10' },
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
              name: Pact.Matchers.string('Product Name'),
              price: Pact.Matchers.decimal(1000.00)
            }),
            pagination: Pact.Matchers.somethingLike({
              page: 1,
              limit: 10,
              total: 100,
              totalPages: 10
            })
          }
        }
      });

      const response = await fetch('http://localhost:12345/api/v1/catalog/products?page=1&limit=10', {
        headers: { Accept: 'application/json' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.pagination).toBeDefined();
    });

    it('should filter products by category', async () => {
      await provider.addInteraction({
        uponReceiving: 'a request for products filtered by category',
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
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            data: Pact.Matchers.eachLike({
              id: Pact.Matchers.uuid(),
              name: Pact.Matchers.string('AMD Ryzen 9 7950X'),
              price: Pact.Matchers.decimal(59999.00),
              category: Pact.Matchers.term({
                matcher: '^cpu$',
                generate: 'cpu'
              })
            })
          }
        }
      });

      const response = await fetch('http://localhost:12345/api/v1/catalog/products?category=cpu', {
        headers: { Accept: 'application/json' }
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toBeInstanceOf(Array);
    });
  });
});