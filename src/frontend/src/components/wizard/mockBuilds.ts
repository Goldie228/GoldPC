import type { Product } from '@/api/types';

export interface MockBuild {
  id: string;
  label: string;
  description: string;
  purpose: string;
  tags: string[];
  components: Product[];
  totalPrice: number;
}

function makeProduct(id: string, name: string, price: number, category: string, brand?: string, image?: string): Product {
  return {
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zа-я0-9-]/g, ''),
    description: '',
    price,
    stock: 10,
    rating: 4.5,
    reviewCount: 10,
    isActive: true,
    isFeatured: false,
    warrantyMonths: 12,
    categoryId: category,
    categoryName: category,
    manufacturerId: null,
    manufacturerName: brand ?? '',
    images: image ? [{ id: '1', url: image, alt: name, sortOrder: 0, isPrimary: true }] : [],
    specificationValues: [],
  };
}

export const MOCK_BUILDS: MockBuild[] = [
  {
    id: 'office-budget',
    label: 'Офисный ПК',
    description: 'Для документов, почты и браузера',
    purpose: 'office',
    tags: ['Тихий', 'Бюджетный', 'Надёжный'],
    totalPrice: 487,
    components: [
      makeProduct('mock-cpu-1', 'Процессор AMD Athlon 3000G', 118.20, 'Процессоры', 'AMD'),
      makeProduct('mock-gpu-1', 'Встроенная графика AMD Radeon Vega 3', 0, 'Видеокарты', 'AMD'),
      makeProduct('mock-mb-1', 'Материнская плата Gigabyte GA-A320M-S2H', 155.00, 'Материнские платы', 'Gigabyte'),
      makeProduct('mock-ram-1', 'Оперативная память DDR4 8GB 3200MHz Kingston FURY Beast', 89.50, 'Оперативная память', 'Kingston'),
      makeProduct('mock-storage-1', 'SSD накопитель Kingston A400 240GB', 55.30, 'Накопители', 'Kingston'),
      makeProduct('mock-psu-1', 'Блок питания ExeGate ATX-CP500 500W', 48.39, 'Блоки питания', 'ExeGate'),
      makeProduct('mock-case-1', 'Корпус Ginzzu B400', 64.87, 'Корпуса', 'Ginzzu'),
      makeProduct('mock-cooling-1', 'Система охлаждения DeepCool AK400', 55.00, 'Системы охлаждения', 'DeepCool'),
    ],
  },
  {
    id: 'gaming-budget',
    label: 'Игровой ПК',
    description: 'Игры в 1080p на средних-высоких настройках',
    purpose: 'gaming',
    tags: ['1080p', 'Gaming', 'RTX'],
    totalPrice: 1654,
    components: [
      makeProduct('mock-cpu-2', 'Процессор AMD Ryzen 5 5600X', 257.52, 'Процессоры', 'AMD'),
      makeProduct('mock-gpu-2', 'Видеокарта Palit GeForce RTX 4060 Dual 8GB', 649.00, 'Видеокарты', 'Palit'),
      makeProduct('mock-mb-2', 'Материнская плата MSI B550-A PRO', 245.00, 'Материнские платы', 'MSI'),
      makeProduct('mock-ram-2', 'Оперативная память DDR4 16GB (2x8) 3200MHz Kingston FURY Beast', 145.00, 'Оперативная память', 'Kingston'),
      makeProduct('mock-storage-2', 'SSD накопitioner Kingston NV2 1TB NVMe', 155.00, 'Накопители', 'Kingston'),
      makeProduct('mock-psu-2', 'Блок питания DeepCool PF550 550W', 143.05, 'Блоки питания', 'DeepCool'),
      makeProduct('mock-case-2', 'Корпус DeepCool Matrexx 30', 115.47, 'Корпуса', 'DeepCool'),
      makeProduct('mock-cooling-2', 'Система охлаждения DeepCool AK400', 55.00, 'Системы охлаждения', 'DeepCool'),
    ],
  },
  {
    id: 'gaming-optimal',
    label: 'Игровой ТОП',
    description: 'Максимум в 1440p и 4K играх',
    purpose: 'gaming',
    tags: ['1440p', '4K', 'Ultra', 'Топ'],
    totalPrice: 4200,
    components: [
      makeProduct('mock-cpu-3', 'Процессор AMD Ryzen 7 7800X3D', 599.00, 'Процессоры', 'AMD'),
      makeProduct('mock-gpu-3', 'Видеокарта MSI GeForce RTX 4070 Ti SUPER 16GB', 1899.00, 'Видеокарты', 'MSI'),
      makeProduct('mock-mb-3', 'Материнская плата MSI MAG B650 TOMAHAWK WIFI', 489.00, 'Материнские платы', 'MSI'),
      makeProduct('mock-ram-3', 'Оперативная память DDR5 32GB (2x16) 6000MHz Kingston FURY Beast', 329.00, 'Оперативная память', 'Kingston'),
      makeProduct('mock-storage-3', 'SSD накопitioner Kingston KC3000 2TB NVMe', 389.00, 'Накопители', 'Kingston'),
      makeProduct('mock-psu-3', 'Блок питания Corsair RM750e 750W', 289.00, 'Блоки питания', 'Corsair'),
      makeProduct('mock-case-3', 'Корпус DeepCool CH560', 199.00, 'Корпуса', 'DeepCool'),
      makeProduct('mock-cooling-3', 'Система охлаждения DeepCool AK620', 99.00, 'Системы охлаждения', 'DeepCool'),
    ],
  },
  {
    id: 'workstation',
    label: 'Рабочая станция',
    description: 'Для монтажа видео и 3D-рендера',
    purpose: 'workstation',
    tags: ['4K', 'Рендер', 'NVMe', '32GB'],
    totalPrice: 4300,
    components: [
      makeProduct('mock-cpu-4', 'Процессор Intel Core i7-13700', 799.00, 'Процессоры', 'Intel'),
      makeProduct('mock-gpu-4', 'Видеокарта Palit GeForce RTX 4070 Ti SUPER 16GB', 1899.00, 'Видеокарты', 'Palit'),
      makeProduct('mock-mb-4', 'Материнская плата MSI MAG Z790 TOMAHAWK WIFI', 699.00, 'Материнские платы', 'MSI'),
      makeProduct('mock-ram-4', 'Оперативная память DDR5 32GB (2x16) 5600MHz Kingston FURY Beast', 299.00, 'Оперативная память', 'Kingston'),
      makeProduct('mock-storage-4', 'SSD накопитель Samsung 990 Pro 2TB NVMe', 489.00, 'Накопители', 'Samsung'),
      makeProduct('mock-psu-4', 'Блок питания Corsair RM850e 850W', 329.00, 'Блоки питания', 'Corsair'),
      makeProduct('mock-case-4', 'Корпус Corsair 4000D Airflow', 199.00, 'Корпуса', 'Corsair'),
      makeProduct('mock-cooling-4', 'Система охлаждения DeepCool LS720 360mm AIO', 289.00, 'Системы охлаждения', 'DeepCool'),
    ],
  },
  {
    id: 'streaming-setup',
    label: 'Стриминг',
    description: 'Для стримов в 1080p60',
    purpose: 'streaming',
    tags: ['OBS', 'NVENC', '1080p60', 'Тихий'],
    totalPrice: 2800,
    components: [
      makeProduct('mock-cpu-5', 'Процессор AMD Ryzen 7 7700X', 499.00, 'Процессоры', 'AMD'),
      makeProduct('mock-gpu-5', 'Видеокарта MSI GeForce RTX 4060 Ti 8GB', 999.00, 'Видеокарты', 'MSI'),
      makeProduct('mock-mb-5', 'Материнская плата MSI MAG B650 TOMAHAWK WIFI', 489.00, 'Материнские платы', 'MSI'),
      makeProduct('mock-ram-5', 'Оперативная память DDR5 32GB (2x16) 5600MHz Kingston FURY Beast', 299.00, 'Оперативная память', 'Kingston'),
      makeProduct('mock-storage-5', 'SSD накопитель Kingston KC3000 1TB NVMe', 199.00, 'Накопители', 'Kingston'),
      makeProduct('mock-psu-5', 'Блок питания Corsair RM750e 750W', 289.00, 'Блоки питания', 'Corsair'),
      makeProduct('mock-case-5', 'Корпус Corsair 4000D Airflow', 199.00, 'Корпуса', 'Corsair'),
      makeProduct('mock-cooling-5', 'Система охлаждения DeepCool AK400', 55.00, 'Системы охлаждения', 'DeepCool'),
    ],
  },
  {
    id: 'home-theater',
    label: 'Домашний кинотеатр',
    description: 'Мультимедиа и 4K контент на ТВ',
    purpose: 'home-theater',
    tags: ['4K', 'HDMI', 'Тихий', 'Mini-ITX'],
    totalPrice: 650,
    components: [
      makeProduct('mock-cpu-6', 'Процессор AMD Athlon 300GE', 121.60, 'Процессоры', 'AMD'),
      makeProduct('mock-gpu-6', 'Встроенная графика AMD Radeon Vega 3', 0, 'Видеокарты', 'AMD'),
      makeProduct('mock-mb-6', 'Материнская плата Gigabyte A520I AC Mini-ITX', 199.00, 'Материнские платы', 'Gigabyte'),
      makeProduct('mock-ram-6', 'Оперативная память DDR4 8GB 3200MHz Kingston FURY Beast', 89.50, 'Оперативная память', 'Kingston'),
      makeProduct('mock-storage-6', 'SSD накопитель Kingston A400 480GB', 85.00, 'Накопители', 'Kingston'),
      makeProduct('mock-psu-6', 'Блок питания ExeGate ATX-CP500 500W', 48.39, 'Блоки питания', 'ExeGate'),
      makeProduct('mock-case-6', 'Корпус SuperPower MX16', 57.15, 'Корпуса', 'SuperPower'),
      makeProduct('mock-cooling-6', 'Система охлаждения (в комплекте с CPU)', 0, 'Системы охлаждения', ''),
    ],
  },
];

export function getMockBuildById(id: string): MockBuild | undefined {
  return MOCK_BUILDS.find(b => b.id === id);
}

export function getPurposeMockBuilds(purpose: string): MockBuild[] {
  return MOCK_BUILDS.filter(b => b.purpose === purpose);
}
