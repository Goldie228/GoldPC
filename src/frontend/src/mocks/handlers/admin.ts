/**
 * MSW handlers для Admin API
 * Эндпоинты для управления пользователями и каталогом
 */

import { http, HttpResponse, delay } from 'msw';
import { faker } from '@faker-js/faker/locale/ru';
import type { User, Product, ProductCategory, PaginationMeta, PagedResponse } from '../../api/types';
import type { UserRole, UpdateUserRoleRequest, DashboardStats, StatsResponse, DictionaryCategory, DictionaryManufacturer, DictionaryItem, SiteSettings } from '../../api/admin';

// === Генераторы данных ===

const USER_ROLES: UserRole[] = ['Client', 'Manager', 'Master', 'Admin', 'Accountant'];

const ROLE_LABELS: Record<UserRole, string> = {
  Client: 'Клиент',
  Manager: 'Менеджер',
  Master: 'Мастер',
  Admin: 'Администратор',
  Accountant: 'Бухгалтер',
};

const generateUser = (): User => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  phone: faker.phone.number({ style: 'national' }),
  role: faker.helpers.arrayElement(USER_ROLES),
  isActive: faker.datatype.boolean({ probability: 0.9 }),
  createdAt: faker.date.past({ years: 2 }).toISOString(),
});

// === Кэш пользователей ===
let usersCache: User[] | null = null;

const getUsersCache = (): User[] => {
  if (!usersCache) {
    usersCache = Array.from({ length: 50 }, generateUser);
    // Гарантируем наличие хотя бы одного админа
    usersCache[0] = {
      ...usersCache[0],
      role: 'Admin',
      email: 'admin@goldpc.by',
      firstName: 'Администратор',
      lastName: 'Системы',
      isActive: true,
    };
  }
  return usersCache;
};

// === Кэш продуктов для админки ===
let adminProductsCache: Product[] | null = null;

const categories: ProductCategory[] = [
  'cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooling', 'monitor', 'peripherals'
];

// === Кэш справочников ===
let categoriesCache: DictionaryCategory[] | null = null;
let manufacturersCache: DictionaryManufacturer[] | null = null;
let attributesCache: DictionaryItem[] | null = null;

const categoryNames = [
  { name: 'Процессоры', slug: 'processors' },
  { name: 'Видеокарты', slug: 'graphics-cards' },
  { name: 'Материнские платы', slug: 'motherboards' },
  { name: 'Оперативная память', slug: 'ram' },
  { name: 'Накопители SSD', slug: 'ssd' },
  { name: 'Блоки питания', slug: 'psu' },
  { name: 'Корпуса', slug: 'cases' },
  { name: 'Системы охлаждения', slug: 'cooling' },
  { name: 'Мониторы', slug: 'monitors' },
  { name: 'Периферия', slug: 'peripherals' },
];

const manufacturerNames = [
  { name: 'AMD', country: 'США' },
  { name: 'Intel', country: 'США' },
  { name: 'NVIDIA', country: 'США' },
  { name: 'ASUS', country: 'Тайвань' },
  { name: 'MSI', country: 'Тайвань' },
  { name: 'Gigabyte', country: 'Тайвань' },
  { name: 'Corsair', country: 'США' },
  { name: 'Samsung', country: 'Южная Корея' },
  { name: 'Kingston', country: 'США' },
  { name: 'Seagate', country: 'США' },
];

const attributeNames = [
  { name: 'Тактовая частота', slug: 'clock-frequency' },
  { name: 'Объем памяти', slug: 'memory-capacity' },
  { name: 'Интерфейс', slug: 'interface' },
  { name: 'Форм-фактор', slug: 'form-factor' },
  { name: 'Мощность', slug: 'power' },
  { name: 'Тип охлаждения', slug: 'cooling-type' },
];

const getCategoriesCache = (): DictionaryCategory[] => {
  if (!categoriesCache) {
    categoriesCache = categoryNames.map((cat, index) => ({
      id: faker.string.uuid(),
      name: cat.name,
      slug: cat.slug,
      isActive: index !== 6, // "Корпуса" скрыта
      productCount: faker.number.int({ min: 20, max: 150 }),
    }));
  }
  return categoriesCache;
};

const getManufacturersCache = (): DictionaryManufacturer[] => {
  if (!manufacturersCache) {
    manufacturersCache = manufacturerNames.map((man) => ({
      id: faker.string.uuid(),
      name: man.name,
      slug: man.name.toLowerCase().replace(/\s+/g, '-'),
      isActive: true,
      productCount: faker.number.int({ min: 30, max: 200 }),
      country: man.country,
    }));
  }
  return manufacturersCache;
};

const getAttributesCache = (): DictionaryItem[] => {
  if (!attributesCache) {
    attributesCache = attributeNames.map((attr) => ({
      id: faker.string.uuid(),
      name: attr.name,
      slug: attr.slug,
      isActive: true,
    }));
  }
  return attributesCache;
};

// === Кэш настроек ===
let settingsCache: SiteSettings | null = null;

const getSettingsCache = (): SiteSettings => {
  if (!settingsCache) {
    settingsCache = {
      siteName: 'GoldPC',
      adminEmail: 'admin@goldpc.by',
      storeAddress: 'Минск, ул. Примерная, 1',
      phone: '+375 (29) 123-45-67',
      workingHours: 'Пн-Пт: 9:00-20:00, Сб-Вс: 10:00-18:00',
      freeDeliveryThreshold: 500,
      deliveryCost: 15,
      deliveryTime: '1-3',
      twoFactorRequired: true,
      auditLogging: true,
      loginNotifications: false,
      orderEmailNotifications: true,
      smsNotifications: true,
      lowStockNotifications: true,
      maintenanceMode: false,
    };
  }
  return settingsCache;
};

const generateAdminProduct = (): Product => {
  const category = faker.helpers.arrayElement(categories);
  const price = parseFloat(faker.commerce.price({ min: 1000, max: 200000 }));
  const hasDiscount = faker.datatype.boolean({ probability: 0.3 });
  
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    sku: faker.string.alphanumeric({ length: 10 }).toUpperCase(),
    category,
    manufacturer: {
      id: faker.string.uuid(),
      name: faker.company.name(),
      country: faker.location.country(),
    },
    price,
    oldPrice: hasDiscount ? price * faker.number.float({ min: 1.1, max: 1.3 }) : undefined,
    stock: faker.number.int({ min: 0, max: 50 }),
    mainImage: {
      id: faker.string.uuid(),
      url: `https://picsum.photos/seed/${faker.string.uuid()}/400/300`,
      alt: faker.commerce.productDescription(),
      isMain: true,
    },
    rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
    isActive: faker.datatype.boolean({ probability: 0.8 }),
    warrantyMonths: faker.number.int({ min: 12, max: 60 }),
    description: faker.lorem.paragraphs({ min: 2, max: 4 }),
    specifications: {},
    images: [],
    isFeatured: faker.datatype.boolean({ probability: 0.2 }),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
  };
};

const getAdminProductsCache = (): Product[] => {
  if (!adminProductsCache) {
    adminProductsCache = Array.from({ length: 100 }, generateAdminProduct);
  }
  return adminProductsCache;
};

// === Handlers ===

export const adminHandlers = [
  // === USER MANAGEMENT ===
  
  // GET /api/v1/admin/users - список пользователей
  http.get('/api/v1/admin/users', async ({ request }) => {
    await delay(faker.number.int({ min: 100, max: 300 }));

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const search = url.searchParams.get('search')?.toLowerCase();
    const role = url.searchParams.get('role') as UserRole | null;
    const isActive = url.searchParams.get('isActive');

    let users = [...getUsersCache()];

    // Фильтрация
    if (search) {
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(search) ||
          u.firstName.toLowerCase().includes(search) ||
          u.lastName.toLowerCase().includes(search)
      );
    }

    if (role) {
      users = users.filter((u) => u.role === role);
    }

    if (isActive !== null) {
      const activeFilter = isActive === 'true';
      users = users.filter((u) => u.isActive === activeFilter);
    }

    // Пагинация
    const totalItems = users.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const data = users.slice(startIndex, startIndex + pageSize);

    const meta: PaginationMeta = {
      page,
      pageSize,
      totalPages,
      totalItems,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };

    const response: PagedResponse<User> = { data, meta };
    return HttpResponse.json(response);
  }),

  // GET /api/v1/admin/users/:id - получение пользователя
  http.get('/api/v1/admin/users/:id', async ({ params }) => {
    await delay(faker.number.int({ min: 50, max: 150 }));

    const { id } = params;
    const user = getUsersCache().find((u) => u.id === id);

    if (!user) {
      return new HttpResponse(
        JSON.stringify({ error: 'User not found', message: `User with ID ${id} not found` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return HttpResponse.json(user);
  }),

  // PATCH /api/v1/admin/users/:id/role - изменение роли
  http.patch('/api/v1/admin/users/:id/role', async ({ params, request }) => {
    await delay(faker.number.int({ min: 100, max: 200 }));

    const { id } = params;
    const body = await request.json() as UpdateUserRoleRequest;
    const users = getUsersCache();
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return new HttpResponse(
        JSON.stringify({ error: 'User not found', message: `User with ID ${id} not found` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    users[userIndex] = {
      ...users[userIndex],
      role: body.role,
    };

    return HttpResponse.json(users[userIndex]);
  }),

  // POST /api/v1/admin/users/:id/deactivate - деактивация
  http.post('/api/v1/admin/users/:id/deactivate', async ({ params }) => {
    await delay(faker.number.int({ min: 100, max: 200 }));

    const { id } = params;
    const users = getUsersCache();
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return new HttpResponse(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    users[userIndex] = {
      ...users[userIndex],
      isActive: false,
    };

    return HttpResponse.json(users[userIndex]);
  }),

  // POST /api/v1/admin/users/:id/activate - активация
  http.post('/api/v1/admin/users/:id/activate', async ({ params }) => {
    await delay(faker.number.int({ min: 100, max: 200 }));

    const { id } = params;
    const users = getUsersCache();
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return new HttpResponse(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    users[userIndex] = {
      ...users[userIndex],
      isActive: true,
    };

    return HttpResponse.json(users[userIndex]);
  }),

  // PUT /api/v1/admin/users/:id - полное обновление пользователя
  http.put('/api/v1/admin/users/:id', async ({ params, request }) => {
    await delay(faker.number.int({ min: 100, max: 200 }));

    const { id } = params;
    const body = await request.json() as Partial<User>;
    const users = getUsersCache();
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return new HttpResponse(
        JSON.stringify({ error: 'User not found', message: `User with ID ${id} not found` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Обновляем только переданные поля
    users[userIndex] = {
      ...users[userIndex],
      ...(body.email !== undefined && { email: body.email }),
      ...(body.firstName !== undefined && { firstName: body.firstName }),
      ...(body.lastName !== undefined && { lastName: body.lastName }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.role !== undefined && { role: body.role }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    };

    return HttpResponse.json(users[userIndex]);
  }),

  // DELETE /api/v1/admin/users/:id - удаление пользователя
  http.delete('/api/v1/admin/users/:id', async ({ params }) => {
    await delay(faker.number.int({ min: 100, max: 200 }));

    const { id } = params;
    const users = getUsersCache();
    const userIndex = users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return new HttpResponse(
        JSON.stringify({ error: 'User not found', message: `User with ID ${id} not found` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Удаляем пользователя из кэша
    users.splice(userIndex, 1);

    return new HttpResponse(null, { status: 204 });
  }),

  // === CATALOG MANAGEMENT ===

  // GET /api/v1/admin/products - список всех продуктов
  http.get('/api/v1/admin/products', async ({ request }) => {
    await delay(faker.number.int({ min: 100, max: 300 }));

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const category = url.searchParams.get('category') as ProductCategory | null;
    const isActive = url.searchParams.get('isActive');

    let products = [...getAdminProductsCache()];

    // Фильтрация
    if (category) {
      products = products.filter((p) => p.category === category);
    }

    if (isActive !== null) {
      const activeFilter = isActive === 'true';
      products = products.filter((p) => p.isActive === activeFilter);
    }

    // Пагинация
    const totalItems = products.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const data = products.slice(startIndex, startIndex + pageSize);

    const meta: PaginationMeta = {
      page,
      pageSize,
      totalPages,
      totalItems,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };

    const response: PagedResponse<Product> = { data, meta };
    return HttpResponse.json(response);
  }),

  // GET /api/v1/admin/products/:id - получение продукта
  http.get('/api/v1/admin/products/:id', async ({ params }) => {
    await delay(faker.number.int({ min: 50, max: 150 }));

    const { id } = params;
    const product = getAdminProductsCache().find((p) => p.id === id);

    if (!product) {
      return new HttpResponse(
        JSON.stringify({ error: 'Product not found', message: `Product with ID ${id} not found` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return HttpResponse.json(product);
  }),

  // PUT /api/v1/admin/products/:id - обновление продукта
  http.put('/api/v1/admin/products/:id', async ({ params, request }) => {
    await delay(faker.number.int({ min: 100, max: 200 }));

    const { id } = params;
    const body = await request.json() as Partial<Product>;
    const products = getAdminProductsCache();
    const productIndex = products.findIndex((p) => p.id === id);

    if (productIndex === -1) {
      return new HttpResponse(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    products[productIndex] = {
      ...products[productIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(products[productIndex]);
  }),

  // DELETE /api/v1/admin/products/:id - удаление продукта
  http.delete('/api/v1/admin/products/:id', async ({ params }) => {
    await delay(faker.number.int({ min: 100, max: 200 }));

    const { id } = params;
    const products = getAdminProductsCache();
    const productIndex = products.findIndex((p) => p.id === id);

    if (productIndex === -1) {
      return new HttpResponse(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Помечаем как неактивный вместо реального удаления
    products[productIndex].isActive = false;

    return new HttpResponse(null, { status: 204 });
  }),

  // POST /api/v1/admin/products - создание продукта
  http.post('/api/v1/admin/products', async ({ request }) => {
    await delay(faker.number.int({ min: 150, max: 300 }));

    const body = await request.json() as Partial<Product>;
    const products = getAdminProductsCache();
    
    const newProduct: Product = {
      id: faker.string.uuid(),
      name: body.name || faker.commerce.productName(),
      sku: body.sku || faker.string.alphanumeric({ length: 10 }).toUpperCase(),
      category: body.category || faker.helpers.arrayElement(categories),
      price: body.price || parseFloat(faker.commerce.price({ min: 1000, max: 200000 })),
      stock: body.stock ?? 0,
      isActive: body.isActive ?? true,
      description: body.description || '',
      specifications: body.specifications || {},
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      warrantyMonths: body.warrantyMonths || 12,
      isFeatured: false,
    };

    products.unshift(newProduct);
    return HttpResponse.json(newProduct, { status: 201 });
  }),

  // === STATS ===

  // GET /api/v1/admin/stats - статистика дашборда
  http.get('/api/v1/admin/stats', async () => {
    await delay(faker.number.int({ min: 100, max: 250 }));

    const stats: DashboardStats = {
      totalUsers: faker.number.int({ min: 1500, max: 3000 }),
      totalOrders: faker.number.int({ min: 300, max: 800 }),
      revenue: faker.number.int({ min: 200000, max: 600000 }),
      usersChange: faker.number.float({ min: -5, max: 15, fractionDigits: 1 }),
      ordersChange: faker.number.float({ min: -3, max: 12, fractionDigits: 1 }),
      revenueChange: faker.number.float({ min: -2, max: 20, fractionDigits: 1 }),
    };

    const response: StatsResponse = {
      stats,
      lastUpdated: new Date().toISOString(),
    };

    return HttpResponse.json(response);
  }),

  // === DICTIONARIES ===

  // GET /api/v1/admin/dictionaries/categories - список категорий
  http.get('/api/v1/admin/dictionaries/categories', async () => {
    await delay(faker.number.int({ min: 100, max: 200 }));
    return HttpResponse.json(getCategoriesCache());
  }),

  // GET /api/v1/admin/dictionaries/manufacturers - список производителей
  http.get('/api/v1/admin/dictionaries/manufacturers', async () => {
    await delay(faker.number.int({ min: 100, max: 200 }));
    return HttpResponse.json(getManufacturersCache());
  }),

  // GET /api/v1/admin/dictionaries/attributes - список характеристик
  http.get('/api/v1/admin/dictionaries/attributes', async () => {
    await delay(faker.number.int({ min: 100, max: 200 }));
    return HttpResponse.json(getAttributesCache());
  }),

  // POST /api/v1/admin/dictionaries/:type - создание записи
  http.post('/api/v1/admin/dictionaries/:type', async ({ params, request }) => {
    await delay(faker.number.int({ min: 100, max: 200 }));

    const { type } = params as { type: 'categories' | 'manufacturers' | 'attributes' };
    const body = await request.json() as { name: string; slug: string };

    const newItem: DictionaryItem = {
      id: faker.string.uuid(),
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
      isActive: true,
    };

    switch (type) {
      case 'categories':
        getCategoriesCache().push({ ...newItem, productCount: 0 } as DictionaryCategory);
        break;
      case 'manufacturers':
        getManufacturersCache().push({ ...newItem, productCount: 0 } as DictionaryManufacturer);
        break;
      case 'attributes':
        getAttributesCache().push(newItem);
        break;
    }

    return HttpResponse.json(newItem, { status: 201 });
  }),

  // PUT /api/v1/admin/dictionaries/:type/:id - обновление записи
  http.put('/api/v1/admin/dictionaries/:type/:id', async ({ params, request }) => {
    await delay(faker.number.int({ min: 100, max: 200 }));

    const { type, id } = params as { type: 'categories' | 'manufacturers' | 'attributes'; id: string };
    const body = await request.json() as Partial<DictionaryItem>;

    let cache: DictionaryItem[];
    switch (type) {
      case 'categories':
        cache = getCategoriesCache();
        break;
      case 'manufacturers':
        cache = getManufacturersCache();
        break;
      case 'attributes':
        cache = getAttributesCache();
        break;
    }

    const index = cache.findIndex((item) => item.id === id);
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({ error: 'Item not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    cache[index] = { ...cache[index], ...body };
    return HttpResponse.json(cache[index]);
  }),

  // DELETE /api/v1/admin/dictionaries/:type/:id - удаление записи
  http.delete('/api/v1/admin/dictionaries/:type/:id', async ({ params }) => {
    await delay(faker.number.int({ min: 100, max: 200 }));

    const { type, id } = params as { type: 'categories' | 'manufacturers' | 'attributes'; id: string };

    let cache: DictionaryItem[];
    switch (type) {
      case 'categories':
        cache = getCategoriesCache();
        break;
      case 'manufacturers':
        cache = getManufacturersCache();
        break;
      case 'attributes':
        cache = getAttributesCache();
        break;
    }

    const index = cache.findIndex((item) => item.id === id);
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({ error: 'Item not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Помечаем как неактивный вместо удаления
    cache[index].isActive = false;
    return new HttpResponse(null, { status: 204 });
  }),

  // === SETTINGS ===

  // GET /api/v1/admin/settings - получение настроек
  http.get('/api/v1/admin/settings', async () => {
    await delay(faker.number.int({ min: 100, max: 200 }));
    return HttpResponse.json(getSettingsCache());
  }),

  // PUT /api/v1/admin/settings - обновление настроек
  http.put('/api/v1/admin/settings', async ({ request }) => {
    await delay(faker.number.int({ min: 150, max: 250 }));

    const body = await request.json() as Partial<SiteSettings>;
    const settings = getSettingsCache();

    // Обновляем настройки
    Object.assign(settings, body);

    return HttpResponse.json(settings);
  }),

  // POST /api/v1/admin/settings/reset - сброс настроек
  http.post('/api/v1/admin/settings/reset', async () => {
    await delay(faker.number.int({ min: 100, max: 200 }));

    // Сбрасываем к значению по умолчанию
    settingsCache = {
      siteName: 'GoldPC',
      adminEmail: 'admin@goldpc.by',
      storeAddress: 'Минск, ул. Примерная, 1',
      phone: '+375 (29) 123-45-67',
      workingHours: 'Пн-Пт: 9:00-20:00, Сб-Вс: 10:00-18:00',
      freeDeliveryThreshold: 500,
      deliveryCost: 15,
      deliveryTime: '1-3',
      twoFactorRequired: false,
      auditLogging: true,
      loginNotifications: false,
      orderEmailNotifications: true,
      smsNotifications: true,
      lowStockNotifications: true,
      maintenanceMode: false,
    };

    return HttpResponse.json(settingsCache);
  }),
];

export { ROLE_LABELS };
