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

// === Категории ===

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

// === Реалистичные продукты для разработки ===

interface RealisticProduct extends Product {
  specifications: Record<string, string | number | boolean>;
}

const REALISTIC_PRODUCTS: RealisticProduct[] = [
  // === ПРОЦЕССОРЫ (CPU) ===
  {
    id: 'cpu-001',
    name: 'AMD Ryzen 9 7950X',
    sku: 'CPU-AMD-7950X',
    category: 'cpu',
    manufacturer: {
      id: 'mfr-amd',
      name: 'AMD',
      country: 'США',
    },
    price: 54990,
    oldPrice: 62990,
    stock: 15,
    mainImage: {
      id: 'img-cpu-001',
      url: 'https://placehold.co/400x400/1a1a2e/e7352c?text=AMD+Ryzen+9+7950X',
      alt: 'AMD Ryzen 9 7950X',
      isMain: true,
    },
    rating: 4.9,
    isActive: true,
    warrantyMonths: 36,
    description: 'Флагманский процессор AMD Ryzen 9 7950X на архитектуре Zen 4. 16 ядер, 32 потока, идеально для игр и профессиональных задач.',
    specifications: {
      socket: 'AM5',
      cores: 16,
      threads: 32,
      baseFrequency: '4500 МГц',
      turboFrequency: '5700 МГц',
      tdp: '170 Вт',
      cache: '64 МБ L3',
      architecture: 'Zen 4',
      lithography: '5 нм',
      unlocked: true,
    },
    images: [],
    isFeatured: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-12-01T12:00:00Z',
  },
  {
    id: 'cpu-002',
    name: 'Intel Core i9-14900K',
    sku: 'CPU-INT-14900K',
    category: 'cpu',
    manufacturer: {
      id: 'mfr-intel',
      name: 'Intel',
      country: 'США',
    },
    price: 58990,
    oldPrice: 64990,
    stock: 8,
    mainImage: {
      id: 'img-cpu-002',
      url: 'https://placehold.co/400x400/0071c5/ffffff?text=Intel+i9-14900K',
      alt: 'Intel Core i9-14900K',
      isMain: true,
    },
    rating: 4.8,
    isActive: true,
    warrantyMonths: 36,
    description: 'Мощнейший процессор Intel 14-го поколения. 24 ядра, частота до 6.0 ГГц, поддержка DDR5 и PCIe 5.0.',
    specifications: {
      socket: 'LGA1700',
      cores: 24,
      threads: 32,
      baseFrequency: '3600 МГц',
      turboFrequency: '6000 МГц',
      tdp: '125 Вт',
      maxTdp: '253 Вт',
      cache: '36 МБ L3',
      architecture: 'Raptor Lake Refresh',
      lithography: 'Intel 7',
    },
    images: [],
    isFeatured: true,
    createdAt: '2024-02-20T10:00:00Z',
  },
  {
    id: 'cpu-003',
    name: 'AMD Ryzen 7 7800X3D',
    sku: 'CPU-AMD-7800X3D',
    category: 'cpu',
    manufacturer: {
      id: 'mfr-amd',
      name: 'AMD',
      country: 'США',
    },
    price: 38990,
    stock: 22,
    mainImage: {
      id: 'img-cpu-003',
      url: 'https://placehold.co/400x400/1a1a2e/e7352c?text=Ryzen+7+7800X3D',
      alt: 'AMD Ryzen 7 7800X3D',
      isMain: true,
    },
    rating: 4.9,
    isActive: true,
    warrantyMonths: 36,
    description: 'Лучший игровой процессор с технологией 3D V-Cache. 8 ядер, невероятная производительность в играх.',
    specifications: {
      socket: 'AM5',
      cores: 8,
      threads: 16,
      baseFrequency: '4200 МГц',
      turboFrequency: '5050 МГц',
      tdp: '120 Вт',
      cache: '104 МБ (96 МБ 3D V-Cache)',
      architecture: 'Zen 4',
      lithography: '5 нм',
      '3dVCache': true,
    },
    images: [],
    isFeatured: true,
    createdAt: '2024-03-10T10:00:00Z',
  },
  {
    id: 'cpu-004',
    name: 'Intel Core i5-14600K',
    sku: 'CPU-INT-14600K',
    category: 'cpu',
    manufacturer: {
      id: 'mfr-intel',
      name: 'Intel',
      country: 'США',
    },
    price: 32990,
    stock: 18,
    mainImage: {
      id: 'img-cpu-004',
      url: 'https://placehold.co/400x400/0071c5/ffffff?text=Intel+i5-14600K',
      alt: 'Intel Core i5-14600K',
      isMain: true,
    },
    rating: 4.7,
    isActive: true,
    warrantyMonths: 36,
    description: 'Отличный выбор для игрового ПК. 14 ядер, разгон до 5.3 ГГц, отличное соотношение цена/качество.',
    specifications: {
      socket: 'LGA1700',
      cores: 14,
      threads: 20,
      baseFrequency: '3500 МГц',
      turboFrequency: '5300 МГц',
      tdp: '125 Вт',
      maxTdp: '181 Вт',
      cache: '24 МБ L3',
      architecture: 'Raptor Lake Refresh',
    },
    images: [],
    isFeatured: false,
    createdAt: '2024-04-05T10:00:00Z',
  },
  // === ВИДЕОКАРТЫ (GPU) ===
  {
    id: 'gpu-001',
    name: 'NVIDIA GeForce RTX 4090',
    sku: 'GPU-NV-RTX4090',
    category: 'gpu',
    manufacturer: {
      id: 'mfr-nvidia',
      name: 'NVIDIA',
      country: 'США',
    },
    price: 189990,
    oldPrice: 219990,
    stock: 5,
    mainImage: {
      id: 'img-gpu-001',
      url: 'https://placehold.co/400x400/76b900/ffffff?text=RTX+4090',
      alt: 'NVIDIA GeForce RTX 4090',
      isMain: true,
    },
    rating: 4.9,
    isActive: true,
    warrantyMonths: 36,
    description: 'Флагманская видеокарта NVIDIA на архитектуре Ada Lovelace. 24 ГБ GDDR6X, трассировка лучей 3-го поколения, DLSS 3.',
    specifications: {
      chip: 'AD102',
      memory: '24 ГБ',
      memoryType: 'GDDR6X',
      memoryBus: '384 бит',
      baseFrequency: '2235 МГц',
      boostFrequency: '2520 МГц',
      tdp: '450 Вт',
      cudaCores: 16384,
      rtCores: 3,
      dlss: 3,
    },
    images: [],
    isFeatured: true,
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-11-15T12:00:00Z',
  },
  {
    id: 'gpu-002',
    name: 'AMD Radeon RX 7900 XTX',
    sku: 'GPU-AMD-RX7900XTX',
    category: 'gpu',
    manufacturer: {
      id: 'mfr-amd',
      name: 'AMD',
      country: 'США',
    },
    price: 119990,
    oldPrice: 134990,
    stock: 7,
    mainImage: {
      id: 'img-gpu-002',
      url: 'https://placehold.co/400x400/e7352c/ffffff?text=RX+7900+XTX',
      alt: 'AMD Radeon RX 7900 XTX',
      isMain: true,
    },
    rating: 4.8,
    isActive: true,
    warrantyMonths: 36,
    description: 'Топовая видеокарта AMD на архитектуре RDNA 3. 24 ГБ памяти, поддержка DisplayPort 2.1, FSR 3.',
    specifications: {
      chip: 'Navi 31',
      memory: '24 ГБ',
      memoryType: 'GDDR6',
      memoryBus: '384 бит',
      baseFrequency: '1900 МГц',
      boostFrequency: '2500 МГц',
      tdp: '355 Вт',
      streamProcessors: 6144,
      infinityCache: '96 МБ',
    },
    images: [],
    isFeatured: true,
    createdAt: '2024-02-15T10:00:00Z',
  },
  {
    id: 'gpu-003',
    name: 'NVIDIA GeForce RTX 4070 Super',
    sku: 'GPU-NV-RTX4070S',
    category: 'gpu',
    manufacturer: {
      id: 'mfr-nvidia',
      name: 'NVIDIA',
      country: 'США',
    },
    price: 64990,
    stock: 12,
    mainImage: {
      id: 'img-gpu-003',
      url: 'https://placehold.co/400x400/76b900/ffffff?text=RTX+4070+Super',
      alt: 'NVIDIA GeForce RTX 4070 Super',
      isMain: true,
    },
    rating: 4.7,
    isActive: true,
    warrantyMonths: 36,
    description: 'Отличная видеокарта для 1440p гейминга. 12 ГБ GDDR6X, DLSS 3, трассировка лучей.',
    specifications: {
      chip: 'AD104',
      memory: '12 ГБ',
      memoryType: 'GDDR6X',
      memoryBus: '192 бит',
      baseFrequency: '1980 МГц',
      boostFrequency: '2475 МГц',
      tdp: '220 Вт',
      cudaCores: 7168,
      dlss: 3,
    },
    images: [],
    isFeatured: false,
    createdAt: '2024-03-20T10:00:00Z',
  },
  // === МАТЕРИНСКИЕ ПЛАТЫ ===
  {
    id: 'mb-001',
    name: 'ASUS ROG Maximus Z790 Hero',
    sku: 'MB-ASUS-Z790HERO',
    category: 'motherboard',
    manufacturer: {
      id: 'mfr-asus',
      name: 'ASUS',
      country: 'Тайвань',
    },
    price: 54990,
    stock: 6,
    mainImage: {
      id: 'img-mb-001',
      url: 'https://placehold.co/400x400/000000/ffffff?text=ASUS+Z790+Hero',
      alt: 'ASUS ROG Maximus Z790 Hero',
      isMain: true,
    },
    rating: 4.8,
    isActive: true,
    warrantyMonths: 36,
    description: 'Премиальная материнская плата для Intel. Поддержка DDR5, PCIe 5.0, WiFi 6E, премиальный звук.',
    specifications: {
      socket: 'LGA1700',
      chipset: 'Intel Z790',
      formFactor: 'ATX',
      memorySlots: 4,
      maxMemory: '128 ГБ',
      memoryType: 'DDR5',
      memorySpeed: '7800+ МГц',
      pcieSlots: '3x PCIe 5.0 x16',
      m2Slots: 5,
      usb: 'USB 3.2 Gen 2x2, USB-C',
      wifi: 'WiFi 6E',
      bluetooth: '5.3',
    },
    images: [],
    isFeatured: true,
    createdAt: '2024-01-25T10:00:00Z',
  },
  {
    id: 'mb-002',
    name: 'MSI MPG X670E Carbon WiFi',
    sku: 'MB-MSI-X670ECARBON',
    category: 'motherboard',
    manufacturer: {
      id: 'mfr-msi',
      name: 'MSI',
      country: 'Тайвань',
    },
    price: 42990,
    oldPrice: 47990,
    stock: 9,
    mainImage: {
      id: 'img-mb-002',
      url: 'https://placehold.co/400x400/ff0000/ffffff?text=MSI+X670E+Carbon',
      alt: 'MSI MPG X670E Carbon WiFi',
      isMain: true,
    },
    rating: 4.7,
    isActive: true,
    warrantyMonths: 36,
    description: 'Высокопроизводительная плата для AMD Ryzen 7000. PCIe 5.0, DDR5, мощная подсистема питания.',
    specifications: {
      socket: 'AM5',
      chipset: 'AMD X670E',
      formFactor: 'ATX',
      memorySlots: 4,
      maxMemory: '128 ГБ',
      memoryType: 'DDR5',
      memorySpeed: '6666+ МГц',
      pcieSlots: '2x PCIe 5.0 x16',
      m2Slots: 4,
      usb: 'USB 4.0, USB 3.2 Gen 2',
      wifi: 'WiFi 6E',
      bluetooth: '5.3',
      vrmPhases: 24,
    },
    images: [],
    isFeatured: true,
    createdAt: '2024-02-10T10:00:00Z',
  },
  {
    id: 'mb-003',
    name: 'Gigabyte B650 Aorus Elite AX',
    sku: 'MB-GIG-B650ELITE',
    category: 'motherboard',
    manufacturer: {
      id: 'mfr-gigabyte',
      name: 'Gigabyte',
      country: 'Тайвань',
    },
    price: 21990,
    stock: 14,
    mainImage: {
      id: 'img-mb-003',
      url: 'https://placehold.co/400x400/ff6600/ffffff?text=Gigabyte+B650+Aorus',
      alt: 'Gigabyte B650 Aorus Elite AX',
      isMain: true,
    },
    rating: 4.6,
    isActive: true,
    warrantyMonths: 36,
    description: 'Отличное соотношение цена/качество для AMD Ryzen. DDR5, PCIe 4.0, WiFi 6, RGB-подсветка.',
    specifications: {
      socket: 'AM5',
      chipset: 'AMD B650',
      formFactor: 'ATX',
      memorySlots: 4,
      maxMemory: '128 ГБ',
      memoryType: 'DDR5',
      memorySpeed: '6400+ МГц',
      pcieSlots: '1x PCIe 4.0 x16',
      m2Slots: 3,
      usb: 'USB 3.2 Gen 2',
      wifi: 'WiFi 6',
      bluetooth: '5.2',
      vrmPhases: 16,
    },
    images: [],
    isFeatured: false,
    createdAt: '2024-03-05T10:00:00Z',
  },
];

// === Вспомогательные функции ===

function getProductsCache(): ProductSummary[] {
  return REALISTIC_PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    manufacturer: p.manufacturer,
    price: p.price,
    oldPrice: p.oldPrice,
    stock: p.stock,
    mainImage: p.mainImage,
    rating: p.rating,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
  }));
}

function generateProduct(summary: ProductSummary): Product {
  const base = REALISTIC_PRODUCTS.find((p) => p.id === summary.id);
  if (base) return base;
  
  return {
    ...summary,
    warrantyMonths: 12,
    description: faker.commerce.productDescription(),
    specifications: {},
    images: summary.mainImage ? [summary.mainImage] : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function generateCategory(index: number): Category {
  const category = categories[index];
  return {
    id: `cat-${index}`,
    name: categoryNames[category],
    slug: category,
    description: `${categoryNames[category]} для вашего ПК`,
    productCount: faker.number.int({ min: 10, max: 100 }),
  };
}

// === Handlers ===

export const catalogHandlers = [
  // GET /api/products - список продуктов с фильтрацией и пагинацией
  http.get('/api/products', async ({ request }) => {
    await delay(faker.number.int({ min: 50, max: 200 }));

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
    const category = url.searchParams.get('category') as ProductCategory | null;
    const manufacturerId = url.searchParams.get('manufacturerId');
    const priceMin = parseInt(url.searchParams.get('priceMin') || '0', 10);
    const priceMax = parseInt(url.searchParams.get('priceMax') || '999999', 10);
    const search = url.searchParams.get('search')?.toLowerCase();
    const inStock = url.searchParams.get('inStock') === 'true';
    const sortBy = url.searchParams.get('sortBy') as 'name' | 'price' | 'rating' | null;
    const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

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