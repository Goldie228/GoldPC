/**
 * Генераторы тестовых данных для продуктов
 * Использует @faker-js/faker для создания реалистичных mock-данных
 * Соответствует backend DTOs из CatalogService/DTOs/ProductDtos.cs
 */

import { faker } from '@faker-js/faker/locale/ru';

// === Типы данных (соответствуют backend DTOs) ===

export type ProductCategory =
  | 'cpu'
  | 'gpu'
  | 'motherboard'
  | 'ram'
  | 'storage'
  | 'psu'
  | 'case'
  | 'cooling'
  | 'monitor'
  | 'peripherals';

export interface Rating {
  average: number;
  count: number;
}

export interface Manufacturer {
  id: string;
  name: string;
  logo?: string;
  country?: string;
  description?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  isMain: boolean;
  order: number;
}

export interface ProductSpecifications {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Продукт для списка (каталог)
 * Соответствует ProductListDto в backend
 */
export interface ProductSummary {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  price: number;
  oldPrice?: number;
  stock: number;
  manufacturer?: Manufacturer;
  mainImage?: ProductImage;
  rating?: Rating;
  isActive: boolean;
}

/**
 * Детальная информация о продукте
 * Соответствует ProductDetailDto в backend
 */
export interface ProductDetail extends ProductSummary {
  manufacturerId?: string;
  warrantyMonths: number;
  description?: string;
  specifications: ProductSpecifications;
  images: ProductImage[];
  isFeatured: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Категория продукта
 * Соответствует CategoryDto в backend
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  children: Category[];
  icon?: string;
  description?: string;
  productCount: number;
  order: number;
}

/**
 * Метаданные пагинации
 * Соответствует PaginationMeta в backend
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Пагинированный ответ
 * Соответствует PagedResult<T> в backend
 */
export interface PagedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

// === Константы для генерации ===

const PRODUCT_CATEGORIES: ProductCategory[] = [
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

const CATEGORY_NAMES: Record<ProductCategory, string> = {
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

const MANUFACTURERS: Record<ProductCategory, string[]> = {
  cpu: ['AMD', 'Intel'],
  gpu: ['NVIDIA', 'AMD', 'ASUS', 'MSI', 'Gigabyte', 'Palit'],
  motherboard: ['ASUS', 'MSI', 'Gigabyte', 'ASRock', 'Biostar'],
  ram: ['Kingston', 'Corsair', 'G.Skill', 'Crucial', 'Samsung'],
  storage: ['Samsung', 'WD', 'Seagate', 'Crucial', 'Kingston'],
  psu: ['Corsair', 'EVGA', 'Seasonic', 'be quiet!', 'Deepcool'],
  case: ['NZXT', 'Corsair', 'Fractal Design', 'be quiet!', 'Deepcool'],
  cooling: ['Noctua', 'be quiet!', 'Corsair', 'Deepcool', 'ARCTIC'],
  monitor: ['Samsung', 'LG', 'ASUS', 'BenQ', 'Dell', 'AOC'],
  peripherals: ['Logitech', 'Razer', 'SteelSeries', 'HyperX', 'Zowie'],
};

const COUNTRIES = ['США', 'Китай', 'Тайвань', 'Южная Корея', 'Япония', 'Германия'];

const CPU_SOCKETS = ['AM5', 'AM4', 'LGA1700', 'LGA1200', 'LGA1151'];
const GPU_CHIPS = ['RTX 4090', 'RTX 4080', 'RTX 4070', 'RX 7900 XTX', 'RX 7800 XT'];
const RAM_TYPES = ['DDR5', 'DDR4'];
const STORAGE_TYPES = ['NVMe SSD', 'SATA SSD', 'HDD'];

// === Вспомогательные генераторы ===

/**
 * Генерация производителя
 */
export const generateManufacturer = (category: ProductCategory): Manufacturer => {
  const manufacturerNames = MANUFACTURERS[category] || MANUFACTURERS.peripherals;
  const name = faker.helpers.arrayElement(manufacturerNames);

  return {
    id: faker.string.uuid(),
    name,
    logo: `https://placehold.co/200x80/333/fff?text=${encodeURIComponent(name)}`,
    country: faker.helpers.arrayElement(COUNTRIES),
    description: faker.company.catchPhrase(),
  };
};

/**
 * Генерация изображения продукта
 */
export const generateProductImage = (
  productId: string,
  index: number,
  isMain: boolean = false
): ProductImage => ({
  id: faker.string.uuid(),
  url: `https://placehold.co/400x400/1a1a2e/eee?text=Product+${productId.slice(0, 8)}+${index + 1}`,
  alt: `Изображение продукта ${index + 1}`,
  isMain,
  order: index,
});

/**
 * Генерация рейтинга
 */
export const generateRating = (): Rating => ({
  average: parseFloat(faker.number.float({ min: 3, max: 5, fractionDigits: 1 }).toFixed(1)),
  count: faker.number.int({ min: 0, max: 500 }),
});

/**
 * Генерация спецификаций в зависимости от категории
 */
const generateSpecifications = (category: ProductCategory): ProductSpecifications => {
  const baseSpecs: ProductSpecifications = {};

  switch (category) {
    case 'cpu':
      baseSpecs['socket'] = faker.helpers.arrayElement(CPU_SOCKETS);
      baseSpecs['cores'] = faker.number.int({ min: 4, max: 24 });
      baseSpecs['threads'] = faker.number.int({ min: 8, max: 32 });
      baseSpecs['baseFrequency'] = `${faker.number.int({ min: 2500, max: 4500 })} МГц`;
      baseSpecs['boostFrequency'] = `${faker.number.int({ min: 4000, max: 6000 })} МГц`;
      baseSpecs['tdp'] = `${faker.number.int({ min: 65, max: 250 })} Вт`;
      baseSpecs['cache'] = `${faker.number.int({ min: 16, max: 96 })} МБ`;
      break;

    case 'gpu':
      baseSpecs['chip'] = faker.helpers.arrayElement(GPU_CHIPS);
      baseSpecs['memory'] = `${faker.helpers.arrayElement([8, 12, 16, 24])} ГБ`;
      baseSpecs['memoryType'] = faker.helpers.arrayElement(['GDDR6', 'GDDR6X']);
      baseSpecs['baseFrequency'] = `${faker.number.int({ min: 1500, max: 2500 })} МГц`;
      baseSpecs['boostFrequency'] = `${faker.number.int({ min: 2000, max: 3000 })} МГц`;
      baseSpecs['tdp'] = `${faker.number.int({ min: 150, max: 450 })} Вт`;
      baseSpecs['ports'] = '3x DisplayPort, 1x HDMI';
      break;

    case 'motherboard':
      baseSpecs['socket'] = faker.helpers.arrayElement(CPU_SOCKETS);
      baseSpecs['chipset'] = faker.helpers.arrayElement(['Z790', 'B760', 'X670', 'B650']);
      baseSpecs['formFactor'] = faker.helpers.arrayElement(['ATX', 'Micro-ATX', 'Mini-ITX']);
      baseSpecs['memorySlots'] = faker.number.int({ min: 2, max: 4 });
      baseSpecs['maxMemory'] = `${faker.helpers.arrayElement([64, 128, 192])} ГБ`;
      baseSpecs['memoryType'] = faker.helpers.arrayElement(RAM_TYPES);
      baseSpecs['pcieSlots'] = faker.number.int({ min: 1, max: 4 });
      break;

    case 'ram':
      baseSpecs['type'] = faker.helpers.arrayElement(RAM_TYPES);
      baseSpecs['capacity'] = `${faker.helpers.arrayElement([8, 16, 32, 64])} ГБ`;
      baseSpecs['frequency'] = `${faker.helpers.arrayElement([3200, 3600, 4000, 4800, 5600, 6000])} МГц`;
      baseSpecs['latency'] = `CL${faker.helpers.arrayElement([16, 18, 20, 22, 28, 30, 32, 36, 38, 40])}`;
      baseSpecs['voltage'] = `${faker.number.float({ min: 1.2, max: 1.5, fractionDigits: 1 })} В`;
      baseSpecs['modules'] = faker.helpers.arrayElement(['1 модуль', '2 модуля', '4 модуля']);
      break;

    case 'storage':
      baseSpecs['type'] = faker.helpers.arrayElement(STORAGE_TYPES);
      baseSpecs['capacity'] = faker.helpers.arrayElement(['256 ГБ', '512 ГБ', '1 ТБ', '2 ТБ', '4 ТБ']);
      baseSpecs['interface'] = faker.helpers.arrayElement(['NVMe PCIe 4.0', 'NVMe PCIe 5.0', 'SATA III']);
      baseSpecs['readSpeed'] = `${faker.number.int({ min: 500, max: 7000 })} МБ/с`;
      baseSpecs['writeSpeed'] = `${faker.number.int({ min: 400, max: 6000 })} МБ/с`;
      break;

    case 'psu':
      baseSpecs['power'] = `${faker.helpers.arrayElement([450, 550, 650, 750, 850, 1000, 1200])} Вт`;
      baseSpecs['efficiency'] = faker.helpers.arrayElement(['80+ Bronze', '80+ Gold', '80+ Platinum', '80+ Titanium']);
      baseSpecs['modular'] = faker.helpers.arrayElement(['Не модульный', 'Полностью модульный', 'Полумодульный']);
      baseSpecs['fanSize'] = `${faker.helpers.arrayElement([120, 135, 140])} мм`;
      break;

    case 'case':
      baseSpecs['formFactor'] = faker.helpers.arrayElement(['Full Tower', 'Mid Tower', 'Micro Tower', 'Mini ITX']);
      baseSpecs['material'] = faker.helpers.arrayElement(['Сталь', 'Алюминий', 'Стекло/Сталь']);
      baseSpecs['gpuLength'] = `до ${faker.number.int({ min: 280, max: 420 })} мм`;
      baseSpecs['cpuCoolerHeight'] = `до ${faker.number.int({ min: 140, max: 185 })} мм`;
      baseSpecs['fans'] = `${faker.number.int({ min: 2, max: 6 })} предустановленных`;
      break;

    case 'cooling':
      baseSpecs['type'] = faker.helpers.arrayElement(['Воздушное', 'Жидкостное (AIO)']);
      baseSpecs['tdp'] = `${faker.number.int({ min: 120, max: 350 })} Вт`;
      baseSpecs['noise'] = `${faker.number.int({ min: 15, max: 40 })} дБА`;
      baseSpecs['fanSize'] = `${faker.helpers.arrayElement([120, 140, 240, 280, 360])} мм`;
      baseSpecs['height'] = `${faker.number.int({ min: 40, max: 170 })} мм`;
      break;

    case 'monitor':
      baseSpecs['diagonal'] = `${faker.helpers.arrayElement([24, 27, 32, 34])}"`;
      baseSpecs['resolution'] = faker.helpers.arrayElement(['1920x1080', '2560x1440', '3840x2160']);
      baseSpecs['refreshRate'] = `${faker.helpers.arrayElement([60, 75, 144, 165, 240])} Гц`;
      baseSpecs['panelType'] = faker.helpers.arrayElement(['IPS', 'VA', 'TN', 'OLED']);
      baseSpecs['responseTime'] = `${faker.helpers.arrayElement([1, 2, 4, 5])} мс`;
      break;

    case 'peripherals':
    default:
      baseSpecs['connection'] = faker.helpers.arrayElement(['USB', 'Bluetooth', 'USB + Bluetooth']);
      baseSpecs['color'] = faker.helpers.arrayElement(['Черный', 'Белый', 'RGB']);
      break;
  }

  return baseSpecs;
};

/**
 * Генерация SKU кода продукта
 */
const generateSku = (category: ProductCategory): string => {
  const prefix = category.toUpperCase().slice(0, 3);
  const number = faker.number.int({ min: 100000, max: 999999 });
  return `${prefix}-${number}`;
};

/**
 * Генерация цены в зависимости от категории
 */
const generatePrice = (category: ProductCategory): { price: number; oldPrice?: number } => {
  const priceRanges: Record<ProductCategory, { min: number; max: number }> = {
    cpu: { min: 8000, max: 80000 },
    gpu: { min: 15000, max: 300000 },
    motherboard: { min: 5000, max: 50000 },
    ram: { min: 2000, max: 30000 },
    storage: { min: 1500, max: 40000 },
    psu: { min: 3000, max: 30000 },
    case: { min: 2000, max: 25000 },
    cooling: { min: 1000, max: 20000 },
    monitor: { min: 8000, max: 100000 },
    peripherals: { min: 500, max: 15000 },
  };

  const range = priceRanges[category];
  const price = parseFloat(faker.commerce.price({ min: range.min, max: range.max }));

  // 20% шанс скидки
  const hasDiscount = faker.datatype.boolean({ probability: 0.2 });
  const oldPrice = hasDiscount ? parseFloat((price * faker.number.float({ min: 1.1, max: 1.3 })).toFixed(0)) : undefined;

  return { price, oldPrice };
};

// === Основные генераторы ===

/**
 * Генерация одного продукта (ProductSummary)
 * Используется для списков и каталога
 */
export const generateProduct = (overrides?: Partial<ProductSummary>): ProductSummary => {
  const category = overrides?.category ?? faker.helpers.arrayElement(PRODUCT_CATEGORIES);
  const manufacturer = generateManufacturer(category);
  const { price, oldPrice } = generatePrice(category);
  const productId = faker.string.uuid();

  return {
    id: productId,
    name: faker.commerce.productName(),
    sku: generateSku(category),
    category,
    price,
    oldPrice,
    stock: faker.number.int({ min: 0, max: 100 }),
    manufacturer,
    mainImage: generateProductImage(productId, 0, true),
    rating: generateRating(),
    isActive: faker.datatype.boolean({ probability: 0.95 }),
    ...overrides,
  };
};

/**
 * Генерация детальной информации о продукте (ProductDetail)
 * Включает спецификации, изображения, описание
 */
export const generateProductDetail = (
  overrides?: Partial<ProductDetail>,
  includeImages: boolean = true
): ProductDetail => {
  const baseProduct = generateProduct(overrides);
  const category = baseProduct.category;

  const images: ProductImage[] = includeImages
    ? [
        baseProduct.mainImage!,
        ...Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, (_, i) =>
          generateProductImage(baseProduct.id, i + 1, false)
        ),
      ]
    : [];

  return {
    ...baseProduct,
    manufacturerId: baseProduct.manufacturer?.id,
    warrantyMonths: faker.helpers.arrayElement([12, 24, 36]),
    description: faker.lorem.paragraphs({ min: 2, max: 4 }),
    specifications: generateSpecifications(category),
    images,
    isFeatured: faker.datatype.boolean({ probability: 0.1 }),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    updatedAt: faker.datatype.boolean({ probability: 0.3 })
      ? faker.date.recent({ days: 30 }).toISOString()
      : undefined,
    ...overrides,
  };
};

/**
 * Генерация массива продуктов (ProductSummary[])
 * Используется для списков каталога
 */
export const generateProducts = (count: number, overrides?: Partial<ProductSummary>): ProductSummary[] =>
  Array.from({ length: count }, () => generateProduct(overrides));

/**
 * Генерация массива детальных продуктов (ProductDetail[])
 */
export const generateProductDetails = (
  count: number,
  overrides?: Partial<ProductDetail>
): ProductDetail[] => Array.from({ length: count }, () => generateProductDetail(overrides));

/**
 * Генерация продуктов по категории
 */
export const generateProductsByCategory = (
  category: ProductCategory,
  count: number
): ProductSummary[] => generateProducts(count, { category });

/**
 * Генерация пагинированного ответа продуктов
 * Соответствует PagedResult<ProductListDto> в backend
 */
export const generatePagedProducts = (
  page: number = 1,
  pageSize: number = 20,
  totalItems: number = 100,
  filters?: { category?: ProductCategory; inStock?: boolean }
): PagedResult<ProductSummary> => {
  let products = generateProducts(totalItems);

  // Применяем фильтры
  if (filters?.category) {
    products = products.filter((p) => p.category === filters.category);
  }
  if (filters?.inStock) {
    products = products.filter((p) => p.stock > 0);
  }

  const totalPages = Math.ceil(products.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const data = products.slice(startIndex, startIndex + pageSize);

  return {
    data,
    meta: {
      page,
      pageSize,
      totalPages,
      totalItems: products.length,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Генерация категории
 */
export const generateCategory = (
  overrides?: Partial<Category>,
  children: Category[] = []
): Category => {
  const slug = faker.helpers.slugify(faker.commerce.department()).toLowerCase();

  return {
    id: faker.string.uuid(),
    name: faker.commerce.department(),
    slug,
    children,
    icon: faker.helpers.arrayElement(['cpu', 'gpu', 'memory', 'storage', 'monitor']),
    description: faker.lorem.sentence(),
    productCount: faker.number.int({ min: 0, max: 200 }),
    order: faker.number.int({ min: 0, max: 20 }),
    ...overrides,
  };
};

/**
 * Генерация списка всех категорий
 */
export const generateCategories = (): Category[] =>
  PRODUCT_CATEGORIES.map((slug, index) => ({
    id: faker.string.uuid(),
    name: CATEGORY_NAMES[slug],
    slug,
    children: [],
    icon: slug,
    description: `Категория: ${CATEGORY_NAMES[slug]}`,
    productCount: faker.number.int({ min: 10, max: 100 }),
    order: index,
  }));

/**
 * Генерация featured (рекомендуемых) продуктов
 */
export const generateFeaturedProducts = (count: number = 6): ProductDetail[] =>
  generateProductDetails(count).map((p) => ({ ...p, isFeatured: true, isActive: true }));

/**
 * Генерация продуктов со скидкой
 */
export const generateDiscountedProducts = (count: number = 6): ProductSummary[] =>
  generateProducts(count).map((p) => ({
    ...p,
    oldPrice: parseFloat((p.price * 1.2).toFixed(0)),
  }));
