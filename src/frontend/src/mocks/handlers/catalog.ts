/**
 * MSW handlers для Catalog API
 * Основано на OpenAPI спецификации
 */

import { http, HttpResponse, delay } from 'msw';
import { faker } from '@faker-js/faker';
import type {
  Product,
  ProductSummary,
  ProductCategory,
  Category,
  ProductListResponse,
  PaginationMeta,
} from '../../api/types';

// === Генераторы данных ===

const categories: ProductCategory[] = [
  'cpu',
  'gpu',
  'motherboard',
  'ram',
  'storage',
  'psu',
  'case',
  'cooling',
  'monitor',
  'peripherals',
];

const categoryNames: Record<ProductCategory, string> = {
  cpu: 'Процессоры',
  gpu: 'Видеокарты',
  motherboard: 'Материнские платы',
  ram: 'Оперативная память',
  storage: 'Накопители',
  psu: 'Блоки питания',
  case: 'Корпуса',
  cooling: 'Охлаждение',
  monitor: 'Мониторы',
  peripherals: 'Периферия',
};

const generateProductSummary = (): ProductSummary => {
  const category = faker.helpers.arrayElement(categories);
  const price = parseFloat(
    faker.commerce.price({ min: 1000, max: 200000 })
  );
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
    isActive: faker.datatype.boolean({ probability: 0.95 }),
  };
};

const generateProduct = (summary?: ProductSummary): Product => {
  const base = summary || generateProductSummary();
  const specifications: Record<string, string | number | boolean> = {};
  
  // Генерация спецификаций в зависимости от категории
  switch (base.category) {
    case 'cpu':
      specifications.socket = faker.helpers.arrayElement(['AM5', 'LGA1700', 'AM4', 'LGA1200']);
      specifications.cores = faker.number.int({ min: 4, max: 24 });
      specifications.threads = faker.number.int({ min: 8, max: 32 });
      specifications.baseFrequency = `${faker.number.int({ min: 2800, max: 4500 })} MHz`;
      specifications.turboFrequency = `${faker.number.int({ min: 4000, max: 5800 })} MHz`;
      specifications.tdp = `${faker.number.int({ min: 65, max: 250 })} W`;
      break;
    case 'gpu':
      specifications.memory = `${faker.number.int({ min: 8, max: 24 })} GB`;
      specifications.memoryType = faker.helpers.arrayElement(['GDDR6', 'GDDR6X', 'GDDR7']);
      specifications.baseClock = `${faker.number.int({ min: 1500, max: 2200 })} MHz`;
      specifications.boostClock = `${faker.number.int({ min: 2200, max: 3000 })} MHz`;
      specifications.tdp = `${faker.number.int({ min: 150, max: 450 })} W`;
      break;
    case 'ram':
      specifications.capacity = `${faker.number.int({ min: 8, max: 64 })} GB`;
      specifications.type = faker.helpers.arrayElement(['DDR4', 'DDR5']);
      specifications.frequency = `${faker.number.int({ min: 3200, max: 6400 })} MHz`;
      specifications.cas = faker.number.int({ min: 16, max: 40 });
      specifications.modules = faker.helpers.arrayElement([1, 2, 4]);
      break;
    case 'storage':
      specifications.capacity = faker.helpers.arrayElement(['256 GB', '512 GB', '1 TB', '2 TB', '4 TB']);
      specifications.type = faker.helpers.arrayElement(['SSD', 'NVMe', 'HDD']);
      specifications.interface = faker.helpers.arrayElement(['SATA III', 'PCIe 4.0', 'PCIe 5.0']);
      specifications.readSpeed = `${faker.number.int({ min: 500, max: 7500 })} MB/s`;
      specifications.writeSpeed = `${faker.number.int({ min: 400, max: 7000 })} MB/s`;
      break;
    default:
      specifications.spec1 = faker.commerce.productMaterial();
      specifications.spec2 = faker.commerce.productAdjective();
      break;
  }

  return {
    ...base,
    warrantyMonths: faker.number.int({ min: 12, max: 60 }),
    description: faker.lorem.paragraphs({ min: 2, max: 4 }),
    specifications,
    images: [
      base.mainImage!,
      ...Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => ({
        id: faker.string.uuid(),
        url: `https://picsum.photos/seed/${faker.string.uuid()}/400/300`,
        alt: faker.commerce.productDescription(),
        isMain: false,
        order: faker.number.int({ min: 1, max: 10 }),
      })),
    ],
    isFeatured: faker.datatype.boolean({ probability: 0.2 }),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
  };
};

const generateCategory = (index: number): Category => ({
  id: faker.string.uuid(),
  name: Object.values(categoryNames)[index],
  slug: categories[index],
  icon: `https://picsum.photos/seed/${faker.string.uuid()}/64/64`,
  description: faker.lorem.sentence(),
  productCount: faker.number.int({ min: 10, max: 200 }),
  order: index + 1,
});

// === Кэш сгенерированных продуктов ===
let productsCache: ProductSummary[] | null = null;

const getProductsCache = (): ProductSummary[] => {
  if (!productsCache) {
    productsCache = Array.from({ length: 100 }, generateProductSummary);
  }
  return productsCache;
};

// === Handlers ===

export const catalogHandlers = [
  // GET /api/products - список продуктов с пагинацией и фильтрацией
  http.get('/api/products', async ({ request }) => {
    await delay(faker.number.int({ min: 100, max: 300 }));

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '12');
    const category = url.searchParams.get('category') as ProductCategory | null;
    const manufacturerId = url.searchParams.get('manufacturerId');
    const priceMin = parseFloat(url.searchParams.get('priceMin') || '0');
    const priceMax = parseFloat(url.searchParams.get('priceMax') || '999999');
    const search = url.searchParams.get('search')?.toLowerCase();
    const sortBy = url.searchParams.get('sortBy') as 'name' | 'price' | 'rating' | 'createdAt' | null;
    const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' | null;
    const inStock = url.searchParams.get('inStock') === 'true';

    let products = [...getProductsCache()];

    // Фильтрация
    if (category) {
      products = products.filter((p) => p.category === category);
    }

    if (manufacturerId) {
      products = products.filter((p) => p.manufacturer?.id === manufacturerId);
    }

    products = products.filter(
      (p) => p.price >= priceMin && p.price <= priceMax
    );

    if (search) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.manufacturer?.name.toLowerCase().includes(search)
      );
    }

    if (inStock) {
      products = products.filter((p) => p.stock > 0);
    }

    // Сортировка
    if (sortBy) {
      products.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'price':
            comparison = a.price - b.price;
            break;
          case 'rating':
            comparison = (a.rating || 0) - (b.rating || 0);
            break;
        }
        return sortOrder === 'desc' ? -comparison : comparison;
      });
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

    const response: ProductListResponse = { data, meta };

    return HttpResponse.json(response);
  }),

  // GET /api/products/:id - получение продукта по ID
  http.get('/api/products/:id', async ({ params }) => {
    await delay(faker.number.int({ min: 50, max: 150 }));

    const { id } = params;
    const cachedProducts = getProductsCache();
    const summary = cachedProducts.find((p) => p.id === id);

    if (!summary) {
      return new HttpResponse(
        JSON.stringify({ error: 'Product not found', message: `Product with ID ${id} not found` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const product = generateProduct(summary);
    return HttpResponse.json(product);
  }),

  // GET /api/categories - список категорий
  http.get('/api/categories', async () => {
    await delay(faker.number.int({ min: 30, max: 100 }));

    const categoriesList = categories.map((_, index) => generateCategory(index));
    return HttpResponse.json(categoriesList);
  }),

  // GET /api/categories/:slug - получение категории по slug
  http.get('/api/categories/:slug', async ({ params }) => {
    await delay(faker.number.int({ min: 30, max: 100 }));

    const { slug } = params;
    const index = categories.indexOf(slug as ProductCategory);

    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({ error: 'Category not found', message: `Category ${slug} not found` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return HttpResponse.json(generateCategory(index));
  }),
];