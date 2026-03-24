/**
 * MSW handlers для Services API
 * Основано на прототипах services.html и service-detail.html
 */

import { http, HttpResponse, delay } from 'msw';
import { faker } from '@faker-js/faker';
import { SERVICES, SERVICE_BENEFITS } from '../data/services';
import type {
  ServiceListResponse,
  PaginationMeta,
  ServiceCategory,
} from '../../api/types';

// === Handlers ===

export const servicesHandlers = [
  // GET /api/services - список услуг с фильтрацией и пагинацией
  http.get('/api/services', async ({ request }) => {
    await delay(faker.number.int({ min: 50, max: 200 }));

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
    const category = url.searchParams.get('category') as ServiceCategory | null;
    const search = url.searchParams.get('search')?.toLowerCase();
    const isPopular = url.searchParams.get('isPopular');

    let services = [...SERVICES];

    // Фильтрация по категории
    if (category) {
      services = services.filter((s) => s.category === category);
    }

    // Фильтрация по популярности
    if (isPopular === 'true') {
      services = services.filter((s) => s.isPopular);
    }

    // Поиск по названию и описанию
    if (search) {
      services = services.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.description.toLowerCase().includes(search) ||
          s.shortDescription.toLowerCase().includes(search)
      );
    }

    // Пагинация
    const totalItems = services.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const data = services.slice(startIndex, startIndex + pageSize);

    const meta: PaginationMeta = {
      page,
      pageSize,
      totalPages,
      totalItems,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };

    const response: ServiceListResponse = { data, meta };

    return HttpResponse.json(response);
  }),

  // GET /api/services/:id - получение услуги по ID
  http.get('/api/services/:id', async ({ params }) => {
    await delay(faker.number.int({ min: 50, max: 150 }));

    const { id } = params;
    const service = SERVICES.find((s) => s.id === id);

    if (!service) {
      return new HttpResponse(
        JSON.stringify({ error: 'Service not found', message: `Service with ID ${id} not found` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return HttpResponse.json(service);
  }),

  // GET /api/services/slug/:slug - получение услуги по slug
  http.get('/api/services/slug/:slug', async ({ params }) => {
    await delay(faker.number.int({ min: 50, max: 150 }));

    const { slug } = params;
    const service = SERVICES.find((s) => s.slug === slug);

    if (!service) {
      return new HttpResponse(
        JSON.stringify({ error: 'Service not found', message: `Service with slug ${slug} not found` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return HttpResponse.json(service);
  }),

  // GET /api/services/benefits - получение преимуществ сервисного центра
  http.get('/api/services/benefits', async () => {
    await delay(faker.number.int({ min: 30, max: 100 }));
    return HttpResponse.json(SERVICE_BENEFITS);
  }),
];