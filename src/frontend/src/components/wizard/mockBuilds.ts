import type { Product, ProductCategory } from '@/api/types';

export interface MockBuild {
  id: string;
  label: string;
  description: string;
  purpose: string;
  tags: string[];
  components: Product[];
  totalPrice: number;
}

function makeProduct(
  id: string, name: string, price: number,
  category: ProductCategory, brand?: string,
): Product {
  return {
    id,
    name,
    sku: id,
    category,
    brand,
    price,
    stock: 10,
    isActive: true,
    isFeatured: false,
    rating: 4.5,
    reviewCount: 10,
    warrantyMonths: 12,
    manufacturerId: undefined,
    description: '',
    images: [],
    specifications: {},
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
      makeProduct('mock-cpu-1', 'Процессор AMD Athlon 3000G', 118, 'cpu', 'AMD'),
      makeProduct('mock-mb-1', 'Материнская плата Gigabyte GA-A320M-S2H', 155, 'motherboard', 'Gigabyte'),
      makeProduct('mock-ram-1', 'Оперативная память DDR4 8GB 3200MHz Kingston FURY Beast', 90, 'ram', 'Kingston'),
      makeProduct('mock-storage-1', 'SSD накопитель Kingston A400 240GB', 55, 'storage', 'Kingston'),
      makeProduct('mock-psu-1', 'Блок питания ExeGate ATX-CP500 500W', 48, 'psu', 'ExeGate'),
      makeProduct('mock-case-1', 'Корпус Ginzzu B400', 65, 'case', 'Ginzzu'),
      makeProduct('mock-cooling-1', 'Система охлаждения DeepCool AK400', 55, 'cooling', 'DeepCool'),
    ],
  },
  {
    id: 'gaming-budget',
    label: 'Игровой ПК',
    description: 'Игры в 1080p на средних-высоких настройках',
    purpose: 'gaming',
    tags: ['1080p', 'Gaming', 'RTX'],
    totalPrice: 1655,
    components: [
      makeProduct('mock-cpu-2', 'Процессор AMD Ryzen 5 5600X', 258, 'cpu', 'AMD'),
      makeProduct('mock-gpu-2', 'Видеокарта Palit GeForce RTX 4060 Dual 8GB', 649, 'gpu', 'Palit'),
      makeProduct('mock-mb-2', 'Материнская плата MSI B550-A PRO', 245, 'motherboard', 'MSI'),
      makeProduct('mock-ram-2', 'Оперативная память DDR4 16GB 3200MHz Kingston FURY Beast', 145, 'ram', 'Kingston'),
      makeProduct('mock-storage-2', 'SSD накопитель Kingston NV2 1TB NVMe', 155, 'storage', 'Kingston'),
      makeProduct('mock-psu-2', 'Блок питания DeepCool PF550 550W', 143, 'psu', 'DeepCool'),
      makeProduct('mock-case-2', 'Корпус DeepCool Matrexx 30', 115, 'case', 'DeepCool'),
      makeProduct('mock-cooling-2', 'Система охлаждения DeepCool AK400', 55, 'cooling', 'DeepCool'),
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
      makeProduct('mock-cpu-3', 'Процессор AMD Ryzen 7 7800X3D', 599, 'cpu', 'AMD'),
      makeProduct('mock-gpu-3', 'Видеокарта MSI GeForce RTX 4070 Ti SUPER 16GB', 1899, 'gpu', 'MSI'),
      makeProduct('mock-mb-3', 'Материнская плата MSI MAG B650 TOMAHAWK WIFI', 489, 'motherboard', 'MSI'),
      makeProduct('mock-ram-3', 'Оперативная память DDR5 32GB 6000MHz Kingston FURY Beast', 329, 'ram', 'Kingston'),
      makeProduct('mock-storage-3', 'SSD накопитель Kingston KC3000 2TB NVMe', 389, 'storage', 'Kingston'),
      makeProduct('mock-psu-3', 'Блок питания Corsair RM750e 750W', 289, 'psu', 'Corsair'),
      makeProduct('mock-case-3', 'Корпус DeepCool CH560', 199, 'case', 'DeepCool'),
      makeProduct('mock-cooling-3', 'Система охлаждения DeepCool AK620', 99, 'cooling', 'DeepCool'),
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
      makeProduct('mock-cpu-4', 'Процессор Intel Core i7-13700', 799, 'cpu', 'Intel'),
      makeProduct('mock-gpu-4', 'Видеокарта Palit GeForce RTX 4070 Ti SUPER 16GB', 1899, 'gpu', 'Palit'),
      makeProduct('mock-mb-4', 'Материнская плата MSI MAG Z790 TOMAHAWK WIFI', 699, 'motherboard', 'MSI'),
      makeProduct('mock-ram-4', 'Оперативная память DDR5 32GB 5600MHz Kingston FURY Beast', 299, 'ram', 'Kingston'),
      makeProduct('mock-storage-4', 'SSD накопитель Samsung 990 Pro 2TB NVMe', 489, 'storage', 'Samsung'),
      makeProduct('mock-psu-4', 'Блок питания Corsair RM850e 850W', 329, 'psu', 'Corsair'),
      makeProduct('mock-case-4', 'Корпус Corsair 4000D Airflow', 199, 'case', 'Corsair'),
      makeProduct('mock-cooling-4', 'Система охлаждения DeepCool LS720 360mm AIO', 289, 'cooling', 'DeepCool'),
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
      makeProduct('mock-cpu-5', 'Процессор AMD Ryzen 7 7700X', 499, 'cpu', 'AMD'),
      makeProduct('mock-gpu-5', 'Видеокарта MSI GeForce RTX 4060 Ti 8GB', 999, 'gpu', 'MSI'),
      makeProduct('mock-mb-5', 'Материнская плата MSI MAG B650 TOMAHAWK WIFI', 489, 'motherboard', 'MSI'),
      makeProduct('mock-ram-5', 'Оперативная память DDR5 32GB 5600MHz Kingston FURY Beast', 299, 'ram', 'Kingston'),
      makeProduct('mock-storage-5', 'SSD накопитель Kingston KC3000 1TB NVMe', 199, 'storage', 'Kingston'),
      makeProduct('mock-psu-5', 'Блок питания Corsair RM750e 750W', 289, 'psu', 'Corsair'),
      makeProduct('mock-case-5', 'Корпус Corsair 4000D Airflow', 199, 'case', 'Corsair'),
      makeProduct('mock-cooling-5', 'Система охлаждения DeepCool AK400', 55, 'cooling', 'DeepCool'),
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
      makeProduct('mock-cpu-6', 'Процессор AMD Athlon 300GE', 122, 'cpu', 'AMD'),
      makeProduct('mock-mb-6', 'Материнская плата Gigabyte A520I AC Mini-ITX', 199, 'motherboard', 'Gigabyte'),
      makeProduct('mock-ram-6', 'Оперативная память DDR4 8GB 3200MHz Kingston FURY Beast', 90, 'ram', 'Kingston'),
      makeProduct('mock-storage-6', 'SSD накопитель Kingston A400 480GB', 85, 'storage', 'Kingston'),
      makeProduct('mock-psu-6', 'Блок питания ExeGate ATX-CP500 500W', 48, 'psu', 'ExeGate'),
      makeProduct('mock-case-6', 'Корпус SuperPower MX16', 57, 'case', 'SuperPower'),
      makeProduct('mock-cooling-6', 'Система охлаждения (в комплекте с CPU)', 0, 'cooling', ''),
    ],
  },
];

export function getMockBuildById(id: string): MockBuild | undefined {
  return MOCK_BUILDS.find(b => b.id === id);
}

export function getPurposeMockBuilds(purpose: string): MockBuild[] {
  return MOCK_BUILDS.filter(b => b.purpose === purpose);
}
