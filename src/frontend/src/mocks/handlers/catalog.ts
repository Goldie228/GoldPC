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
  // === ПРОЦЕССОРЫ (CPU) - 500-2500 BYN ===
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
    price: 2350,
    oldPrice: 2690,
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
    price: 2490,
    oldPrice: 2790,
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
    price: 1650,
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
    price: 1350,
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
  // === ВИДЕОКАРТЫ (GPU) - 1000-6000 BYN ===
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
    price: 5890,
    oldPrice: 6490,
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
    price: 4290,
    oldPrice: 4690,
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
    price: 2190,
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
  // === МАТЕРИНСКИЕ ПЛАТЫ - 300-800 BYN ===
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
    price: 780,
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
    price: 650,
    oldPrice: 720,
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
    price: 380,
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

// === Генерация дополнительных продуктов для каждой категории ===

function generateAdditionalProducts(): ProductSummary[] {
  const additionalProducts: ProductSummary[] = [];
  
  const manufacturersByCategory: Record<ProductCategory, { name: string; country: string }[]> = {
    cpu: [
      { name: 'AMD', country: 'США' },
      { name: 'Intel', country: 'США' },
    ],
    gpu: [
      { name: 'NVIDIA', country: 'США' },
      { name: 'AMD', country: 'США' },
      { name: 'ASUS', country: 'Тайвань' },
      { name: 'MSI', country: 'Тайвань' },
      { name: 'Gigabyte', country: 'Тайвань' },
      { name: 'Palit', country: 'Гонконг' },
    ],
    motherboard: [
      { name: 'ASUS', country: 'Тайвань' },
      { name: 'MSI', country: 'Тайвань' },
      { name: 'Gigabyte', country: 'Тайвань' },
      { name: 'ASRock', country: 'Тайвань' },
    ],
    ram: [
      { name: 'Kingston', country: 'США' },
      { name: 'Corsair', country: 'США' },
      { name: 'G.Skill', country: 'Тайвань' },
      { name: 'Crucial', country: 'США' },
      { name: 'Samsung', country: 'Южная Корея' },
    ],
    storage: [
      { name: 'Samsung', country: 'Южная Корея' },
      { name: 'WD', country: 'США' },
      { name: 'Seagate', country: 'США' },
      { name: 'Crucial', country: 'США' },
      { name: 'Kingston', country: 'США' },
    ],
    psu: [
      { name: 'Corsair', country: 'США' },
      { name: 'Seasonic', country: 'Тайвань' },
      { name: 'be quiet!', country: 'Германия' },
      { name: 'EVGA', country: 'США' },
      { name: 'Deepcool', country: 'Китай' },
    ],
    case: [
      { name: 'NZXT', country: 'США' },
      { name: 'Corsair', country: 'США' },
      { name: 'Fractal Design', country: 'Швеция' },
      { name: 'be quiet!', country: 'Германия' },
      { name: 'Deepcool', country: 'Китай' },
    ],
    cooling: [
      { name: 'Noctua', country: 'Австрия' },
      { name: 'be quiet!', country: 'Германия' },
      { name: 'Corsair', country: 'США' },
      { name: 'Deepcool', country: 'Китай' },
      { name: 'ARCTIC', country: 'Германия' },
    ],
    monitor: [
      { name: 'Samsung', country: 'Южная Корея' },
      { name: 'LG', country: 'Южная Корея' },
      { name: 'ASUS', country: 'Тайвань' },
      { name: 'BenQ', country: 'Тайвань' },
      { name: 'Dell', country: 'США' },
      { name: 'AOC', country: 'Тайвань' },
    ],
    peripherals: [
      { name: 'Logitech', country: 'Швейцария' },
      { name: 'Razer', country: 'США' },
      { name: 'SteelSeries', country: 'Дания' },
      { name: 'HyperX', country: 'США' },
      { name: 'Zowie', country: 'Тайвань' },
    ],
  };

  const productNamesByCategory: Record<ProductCategory, string[]> = {
    cpu: [
      'AMD Ryzen 5 7600X', 'AMD Ryzen 7 7700X', 'AMD Ryzen 9 7900X',
      'Intel Core i5-13600K', 'Intel Core i7-13700K', 'Intel Core i5-14400',
      'AMD Ryzen 5 5600X', 'AMD Ryzen 7 5800X3D', 'Intel Core i3-14100',
    ],
    gpu: [
      'NVIDIA RTX 4080 Super', 'NVIDIA RTX 4060 Ti', 'NVIDIA RTX 4060',
      'AMD RX 7900 XT', 'AMD RX 7800 XT', 'AMD RX 7700 XT',
      'ASUS TUF RTX 4070', 'MSI Gaming RTX 4060', 'Gigabyte RTX 4060 Ti Eagle',
      'Palit RTX 4070 Dual', 'AMD RX 7600', 'NVIDIA RTX 3050',
    ],
    motherboard: [
      'ASUS TUF Gaming B650-Plus', 'ASUS Prime Z790-P WiFi',
      'MSI MAG B650 Tomahawk WiFi', 'MSI PRO Z790-A WiFi',
      'Gigabyte B650 Aorus Elite AX', 'Gigabyte Z790 Aorus Elite',
      'ASRock B650M Pro RS', 'ASRock Z790 Pro RS',
    ],
    ram: [
      'Kingston Fury Beast DDR5 32GB', 'Kingston Fury Beast DDR5 16GB',
      'Corsair Vengeance DDR5 32GB', 'Corsair Vengeance DDR5 16GB',
      'G.Skill Trident Z5 DDR5 32GB', 'G.Skill Trident Z5 DDR5 16GB',
      'Crucial DDR5 32GB', 'Crucial DDR5 16GB',
      'Samsung DDR5 32GB', 'Kingston Fury Beast DDR4 16GB',
      'Corsair Vengeance DDR4 32GB', 'G.Skill Trident Z DDR4 32GB',
    ],
    storage: [
      'Samsung 990 Pro 2TB', 'Samsung 980 Pro 1TB', 'Samsung 970 EVO Plus 500GB',
      'WD Black SN850X 2TB', 'WD Blue SN570 1TB',
      'Seagate Barracuda 2TB HDD', 'Seagate FireCuda 1TB',
      'Crucial P5 Plus 1TB', 'Kingston KC3000 2TB',
      'Samsung 870 EVO 1TB SATA', 'WD Red 4TB NAS HDD',
    ],
    psu: [
      'Corsair RM750x 750W', 'Corsair RM850x 850W', 'Corsair HX1000 1000W',
      'Seasonic Focus GX-750', 'Seasonic Focus GX-850',
      'be quiet! Pure Power 750W', 'be quiet! Straight Power 850W',
      'EVGA SuperNOVA 750 G6', 'Deepcool PQ750 750W',
    ],
    case: [
      'NZXT H7 Flow', 'NZXT H510', 'NZXT H710i',
      'Corsair 4000D Airflow', 'Corsair 5000D Airflow',
      'Fractal Design Define 7', 'Fractal Design Meshify C',
      'be quiet! Pure Base 500DX', 'Deepcool CC560',
    ],
    cooling: [
      'Noctua NH-D15', 'Noctua NH-U12S', 'Noctua NH-D12L',
      'be quiet! Dark Rock Pro 4', 'be quiet! Pure Rock 2',
      'Corsair iCUE H100i 240mm AIO', 'Corsair iCUE H150i 360mm AIO',
      'Deepcool AK620', 'ARCTIC Freezer 34',
    ],
    monitor: [
      'Samsung Odyssey G7 27"', 'Samsung Odyssey G5 32"',
      'LG 27GP950-B 27" 4K', 'LG 27GL850-B 27"',
      'ASUS ROG Swift PG279Q 27"', 'ASUS TUF VG27AQ 27"',
      'BenQ MOBIUZ EX2710 27"', 'Dell S2721DGF 27"',
      'AOC Q27G2U 27" 144Hz', 'Samsung Odyssey Neo G9 49"',
    ],
    peripherals: [
      'Logitech G Pro X Superlight', 'Logitech G502 Lightspeed',
      'Razer DeathAdder V3 Pro', 'Razer Basilisk V3',
      'SteelSeries Rival 600', 'SteelSeries Sensei Ten',
      'HyperX Pulsefire Haste', 'Zowie EC2-C',
      'Logitech G715 Keyboard', 'Razer BlackWidow V4 Pro',
      'SteelSeries Apex Pro TKL', 'HyperX Alloy Origins',
    ],
  };

  const priceRanges: Record<ProductCategory, { min: number; max: number }> = {
    cpu: { min: 500, max: 2500 },        // Процессоры: 500-2500 BYN
    gpu: { min: 1000, max: 6000 },       // Видеокарты: 1000-6000 BYN
    motherboard: { min: 300, max: 800 }, // Материнские платы: 300-800 BYN
    ram: { min: 150, max: 400 },         // Оперативная память: 150-400 BYN
    storage: { min: 150, max: 500 },     // Накопители (SSD): 150-500 BYN
    psu: { min: 150, max: 600 },         // Блоки питания
    case: { min: 100, max: 500 },        // Корпуса
    cooling: { min: 80, max: 400 },      // Охлаждение
    monitor: { min: 400, max: 2000 },    // Мониторы
    peripherals: { min: 50, max: 400 },  // Периферия
  };

  const categoryCounts: Record<ProductCategory, number> = {
    cpu: 42,
    gpu: 38,
    motherboard: 56,
    ram: 89,
    storage: 67,
    psu: 34,
    case: 28,
    cooling: 45,
    monitor: 22,
    peripherals: 51,
  };

  categories.forEach((category) => {
    const existingCount = REALISTIC_PRODUCTS.filter(p => p.category === category).length;
    const neededCount = categoryCounts[category] - existingCount;
    const manufacturers = manufacturersByCategory[category];
    const productNames = productNamesByCategory[category];
    const priceRange = priceRanges[category];

    for (let i = 0; i < neededCount; i++) {
      const manufacturer = manufacturers[i % manufacturers.length];
      const productName = productNames[i % productNames.length];
      const basePrice = faker.number.int({ min: priceRange.min, max: priceRange.max });
      const hasDiscount = faker.datatype.boolean({ probability: 0.2 });
      
      additionalProducts.push({
        id: `${category}-${String(existingCount + i + 1).padStart(3, '0')}`,
        name: `${productName} ${faker.string.alphanumeric(4).toUpperCase()}`,
        sku: `${category.toUpperCase().slice(0, 3)}-${faker.number.int({ min: 100000, max: 999999 })}`,
        category,
        manufacturer: {
          id: `mfr-${manufacturer.name.toLowerCase()}`,
          name: manufacturer.name,
          country: manufacturer.country,
        },
        price: basePrice,
        oldPrice: hasDiscount ? Math.round(basePrice * 1.15) : undefined,
        stock: faker.number.int({ min: 0, max: 50 }),
        mainImage: {
          id: `img-${category}-${i}`,
          url: `https://placehold.co/400x400/1a1a2e/eee?text=${encodeURIComponent(productName.slice(0, 15))}`,
          alt: productName,
          isMain: true,
        },
        rating: parseFloat(faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }).toFixed(1)),
        isActive: faker.datatype.boolean({ probability: 0.95 }),
      });
    }
  });

  return additionalProducts;
}

// Кэш всех продуктов
let allProductsCache: ProductSummary[] | null = null;

function getAllProducts(): ProductSummary[] {
  if (!allProductsCache) {
    allProductsCache = [...REALISTIC_PRODUCTS.map(p => ({
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
    })), ...generateAdditionalProducts()];
  }
  return allProductsCache;
}

// Кэш категорий с количеством продуктов
let categoriesCache: (Category & { count: number })[] | null = null;

function getCategoriesWithCount(): (Category & { count: number })[] {
  if (!categoriesCache) {
    const products = getAllProducts();
    categoriesCache = categories.map((category, index) => {
      const count = products.filter(p => p.category === category).length;
      return {
        id: `cat-${index}`,
        name: categoryNames[category],
        slug: category,
        description: `${categoryNames[category]} для вашего ПК`,
        productCount: count,
        count,
      };
    });
  }
  return categoriesCache;
}

// === Handlers ===

export const catalogHandlers = [
  // GET /api/v1/catalog/products - список продуктов с фильтрацией и пагинацией
  http.get('/api/v1/catalog/products', async ({ request }) => {
    await delay(faker.number.int({ min: 50, max: 200 }));

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
    const category = url.searchParams.get('category') as ProductCategory | null;
    const manufacturerId = url.searchParams.get('manufacturerId');
    const brand = url.searchParams.get('brand')?.toLowerCase();
    const priceMin = parseInt(url.searchParams.get('priceMin') || '0', 10);
    const priceMax = parseInt(url.searchParams.get('priceMax') || '999999', 10);
    const search = url.searchParams.get('search')?.toLowerCase();
    const rating = url.searchParams.get('rating') ? parseFloat(url.searchParams.get('rating')!) : null;
    const inStock = url.searchParams.get('inStock') === 'true';
    const sortBy = url.searchParams.get('sortBy') as 'name' | 'price' | 'rating' | null;
    const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';
    const specifications: Record<string, string> = {};
    for (const [k, v] of url.searchParams) {
      const m = k.match(/^specifications\[(.+)\]$/i);
      if (m && v) specifications[m[1]] = v;
    }

    let products = [...getProductsCache()];

    // Фильтрация (category приходит как backend slug: processors, gpu, etc.)
    const slugToFrontend: Record<string, ProductCategory> = {
      processors: 'cpu',
      gpu: 'gpu',
      motherboards: 'motherboard',
      ram: 'ram',
      storage: 'storage',
      psu: 'psu',
      cases: 'case',
      coolers: 'cooling',
      monitors: 'monitor',
      periphery: 'peripherals',
    };
    if (category) {
      const frontendCat = slugToFrontend[category] ?? category;
      products = products.filter((p) => p.category === frontendCat);
    }

    if (Object.keys(specifications).length > 0) {
      products = products.filter((p) => {
        const pSpecs = (p as RealisticProduct).specifications ?? {};
        return Object.entries(specifications).every(([k, v]) => String(pSpecs[k]) === String(v));
      });
    }

    if (manufacturerId) {
      products = products.filter((p) => p.manufacturer?.id === manufacturerId);
    }

    if (brand) {
      products = products.filter((p) => 
        p.manufacturer?.name.toLowerCase().includes(brand)
      );
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

    if (rating) {
      products = products.filter((p) => (p.rating ?? 0) >= rating);
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

  // GET /api/v1/catalog/products/:id - получение продукта по ID
  http.get('/api/v1/catalog/products/:id', async ({ params }) => {
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

  // GET /api/v1/catalog/categories - список категорий
  http.get('/api/v1/catalog/categories', async () => {
    await delay(faker.number.int({ min: 30, max: 100 }));

    // Возвращаем категории с реальными счётчиками продуктов
    const categoriesWithCount = getCategoriesWithCount();
    const categoriesList = categoriesWithCount.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      productCount: cat.count,
    }));
    return HttpResponse.json(categoriesList);
  }),

  // GET /api/v1/catalog/categories/:slug/filter-attributes - атрибуты фильтрации
  http.get('/api/v1/catalog/categories/:slug/filter-attributes', async ({ params }) => {
    await delay(faker.number.int({ min: 20, max: 80 }));
    const slug = typeof params.slug === 'string' ? params.slug : params.slug?.[0] ?? '';
    // Backend slugs: gpu, processors, motherboards, ram, storage, psu, cases, coolers, periphery, monitors
    const attrMap: Record<string, Array<{ key: string; displayName: string; filterType: string; sortOrder: number; values?: string[] }>> = {
      gpu: [
        { key: 'vram', displayName: 'Объём видеопамяти', filterType: 'select', sortOrder: 1, values: ['8GB', '12GB', '16GB', '24GB'] },
        { key: 'gpu', displayName: 'Серия GPU', filterType: 'select', sortOrder: 2, values: ['GeForce RTX 5060', 'GeForce RTX 4070 SUPER', 'Radeon RX 7800 XT'] },
      ],
      processors: [
        { key: 'socket', displayName: 'Сокет', filterType: 'select', sortOrder: 1, values: ['AM4', 'AM5', 'LGA1700'] },
        { key: 'cores', displayName: 'Количество ядер', filterType: 'range', sortOrder: 2 },
      ],
      motherboards: [
        { key: 'socket', displayName: 'Сокет', filterType: 'select', sortOrder: 1, values: ['AM5'] },
        { key: 'chipset', displayName: 'Чипсет', filterType: 'select', sortOrder: 2, values: ['B650'] },
      ],
      ram: [
        { key: 'type', displayName: 'Тип памяти', filterType: 'select', sortOrder: 1, values: ['DDR5'] },
        { key: 'capacity', displayName: 'Объём', filterType: 'select', sortOrder: 2, values: ['32GB'] },
      ],
      storage: [{ key: 'capacity', displayName: 'Объём', filterType: 'select', sortOrder: 1, values: [] }],
      psu: [
        { key: 'wattage', displayName: 'Мощность', filterType: 'select', sortOrder: 1, values: ['750W', '850W'] },
        { key: 'efficiency', displayName: 'Сертификат', filterType: 'select', sortOrder: 2, values: ['80+ Gold'] },
      ],
    };
    const attrs = attrMap[slug] ?? [];
    return HttpResponse.json({ data: attrs });
  }),

  // GET /api/v1/catalog/categories/:slug - получение категории по slug
  http.get('/api/v1/catalog/categories/:slug', async ({ params }) => {
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

  // GET /api/v1/catalog/search - поиск продуктов (отдельный endpoint для поиска)
  http.get('/api/v1/catalog/search', async ({ request }) => {
    await delay(faker.number.int({ min: 50, max: 200 }));

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
    const category = url.searchParams.get('category') as ProductCategory | null;
    const manufacturerId = url.searchParams.get('manufacturerId');
    const brand = url.searchParams.get('brand')?.toLowerCase();
    const priceMin = parseInt(url.searchParams.get('priceMin') || '0', 10);
    const priceMax = parseInt(url.searchParams.get('priceMax') || '999999', 10);
    const search = url.searchParams.get('search')?.toLowerCase();
    const rating = url.searchParams.get('rating') ? parseFloat(url.searchParams.get('rating')!) : null;
    const inStock = url.searchParams.get('inStock') === 'true';
    const sortBy = url.searchParams.get('sortBy') as 'name' | 'price' | 'rating' | null;
    const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

    let products = [...getProductsCache()];

    // Фильтрация (идентичная логика с /products)
    if (category) {
      products = products.filter((p) => p.category === category);
    }

    if (manufacturerId) {
      products = products.filter((p) => p.manufacturer?.id === manufacturerId);
    }

    if (brand) {
      products = products.filter((p) => 
        p.manufacturer?.name.toLowerCase().includes(brand)
      );
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

    if (rating) {
      products = products.filter((p) => (p.rating || 0) >= rating);
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
]; 
