import { type ReactElement, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  Cpu, Monitor, Smartphone, HardDrive,
  CircuitBoard, Headphones, Mouse, Keyboard,
} from 'lucide-react';
import { catalogApi } from '@/api/catalog';
import type { ProductSummary, GetProductsParams } from '@/api/types';
import { getProductImageUrl, hasValidProductImage } from '@/utils/image';

type Brand = {
  name: string;
  displayName?: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  category: string;
};

// Маппинг названия бренда → slug категории каталога
const brandToCategory: Record<string, string> = {
  Intel: 'cpu',
  AMD: 'cpu',
  NVIDIA: 'gpu',
  MSI: 'motherboard',
  ASUS: 'motherboard',
  GIGABYTE: 'motherboard',
  Samsung: 'storage',
  WD: 'storage',
  Kingston: 'storage',
  Logitech: 'mouse',
  Razer: 'mouse',
  HyperX: 'headphones',
  'BE QUIET!': 'cooling',
  DeepCool: 'cooling',
  Corsair: 'psu',
  Dell: 'monitor',
  LG: 'monitor',
  Apple: 'headphones',
};

const brands: Brand[] = [
  // Processors
  { name: 'Intel', description: 'Процессоры Intel Core, Xeon для ПК и серверов', icon: Cpu, category: 'Процессоры' },
  { name: 'AMD', description: 'Процессоры Ryzen и видеокарты Radeon', icon: Cpu, category: 'Процессоры' },
  // Graphics
  { name: 'NVIDIA', description: 'Видеокарты GeForce RTX для игр и работы', icon: Monitor, category: 'Видеокарты' },
  { name: 'MSI', description: 'Материнские платы, видеокарты, ноутбуки и периферия', icon: CircuitBoard, category: 'Комплектующие' },
  { name: 'ASUS', description: 'Материнские платы, видеокарты, мониторы и ноутбуки', icon: CircuitBoard, category: 'Комплектующие' },
  { name: 'GIGABYTE', description: 'Материнские платы, видеокарты и периферийные устройства', icon: CircuitBoard, category: 'Комплектующие' },
  // Storage
  { name: 'Samsung', description: 'SSD-накопители, оперативная память, мониторы', icon: HardDrive, category: 'Накопители' },
  { name: 'WD', description: 'Жёсткие диски и SSD-накопители для любых задач', icon: HardDrive, category: 'Накопители' },
  { name: 'Kingston', description: 'Оперативная память, SSD-накопители и флеш-накопители', icon: HardDrive, category: 'Накопители' },
  // Periphery
  { name: 'Logitech', description: 'Мыши, клавиатуры, гарнитуры и веб-камеры', icon: Mouse, category: 'Периферия' },
  { name: 'Razer', description: 'Игровые мыши, клавиатуры, наушники и коврики', icon: Mouse, category: 'Периферия' },
  { name: 'HyperX', description: 'Игровые гарнитуры, клавиатуры и оперативная память', icon: Headphones, category: 'Периферия' },
  // Cooling & PSU
  { name: 'BE QUIET!', displayName: 'be quiet!', description: 'Блоки питания, корпуса и системы охлаждения', icon: CircuitBoard, category: 'Охлаждение и БП' },
  { name: 'DeepCool', description: 'Системы жидкостного и воздушного охлаждения, корпусные вентиляторы', icon: CircuitBoard, category: 'Охлаждение и БП' },
  { name: 'Corsair', description: 'Блоки питания, корпуса, оперативная память и периферия', icon: CircuitBoard, category: 'Комплектующие' },
  // Monitors
  { name: 'Dell', description: 'Мониторы, ноутбуки и рабочие станции', icon: Monitor, category: 'Мониторы' },
  { name: 'LG', description: 'Мониторы, телевизоры и компьютерная периферия', icon: Monitor, category: 'Мониторы' },
  // Smartphones
  { name: 'Apple', description: 'iPhone, iPad, MacBook и аксессуары', icon: Headphones, category: 'Наушники' },
];

/*
 * ВАЖНО: Принудительные маппинги для брендов, где скрипт автопарсинга
 * производителя (бизнес-логика бэкенда) создал расхождение между
 * canonical-именем бренда и фактическим именем производителя в товарах.
 *
 * Это НЕ хардкод, а вынужденная мера — менять бизнес-логику автопарсинга
 * нельзя, т.к. она корректно работает для всех остальных брендов.
 *
 * Если в будущем автопарсинг будет исправлен или бренды появятся в API —
 * эти переопределения можно будет удалить.
 */

// Принудительный UUID производителя для брендов, у которых автопарсинг
// разъехался с canonical-именем (например, be quiet! → Be).
const manufacturerIdOverrides: Record<string, string> = {
  // BE QUIET! → UUID производителя "be quiet!" (авто-парсер создал несколько записей)
  'BE QUIET!': 'a7265f70-2dd6-49a1-a9e4-aa94095eb463,6c84d8d5-ee2e-440a-aab6-5d447dccf60d',
};

// Заглушки-изображения для брендов, у которых нет товаров в каталоге
const brandImageOverrides: Record<string, string> = {
  'BE QUIET!': '/placeholders/product-circuit.svg',
};

export function BrandsPage(): ReactElement {
  // Получаем всех производителей с их UUID из API
  const { data: manufacturers } = useQuery({
    queryKey: ['brands-page', 'manufacturers'],
    queryFn: () => catalogApi.getManufacturers(),
    staleTime: 5 * 60 * 1000,
  });

  // Строим карту: название бренда (lowercase) → UUID производителя
  const manufacturerIdMap = useMemo(() => {
    if (!manufacturers) return {};
    const map: Record<string, string> = {};
    for (const m of manufacturers) {
      map[m.name.toLowerCase()] = m.id;
    }
    return map;
  }, [manufacturers]);

  // Для каждого бренда запрашиваем 1 самый дорогой товар
  const brandProductQueries = useMemo(() => {
    if (!manufacturers) return [];
    return brands.map((brand) => {
      // Сначала проверяем принудительный маппинг, затем API
      const manId = manufacturerIdOverrides[brand.name] ?? manufacturerIdMap[brand.name.toLowerCase()];
      const skip = !manId;

      return {
        queryKey: ['brands-page', 'brand-product', brand.name],
        queryFn: async (): Promise<ProductSummary | null> => {
          if (skip) return null;
          const params: GetProductsParams = {
            sortBy: 'price',
            sortOrder: 'desc',
            pageSize: 1,
          };
          // Не фильтруем по категории — ищем самый дорогой товар бренда в принципе
          if (manId) params.manufacturerIds = manId.includes(',') ? manId.split(',') : [manId];
          try {
            const result = await catalogApi.getProducts(params);
            return result.data?.[0] ?? null;
          } catch {
            return null;
          }
        },
        staleTime: 5 * 60 * 1000,
        enabled: !skip,
      };
    });
  }, [manufacturers, manufacturerIdMap]);

  const brandResults = useQueries({ queries: brandProductQueries });

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-8 pb-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-text mb-8">
        <Link to="/" className="hover:text-gold transition-colors">Главная</Link>
        <span className="text-muted-text">/</span>
        <span className="text-body-text">Бренды</span>
      </nav>

      {/* Hero */}
      <section className="mb-16">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-body-text mb-4 tracking-[-0.02em]">
          Производители
        </h1>
        <p className="text-lg text-muted-text max-w-[600px] leading-relaxed">
          Ведущие мировые бренды компьютерной техники и комплектующих в ассортименте GoldPC.
        </p>
      </section>

      {/* Brands Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((brand, index) => {
          const Icon = brand.icon;
          const categorySlug = brandToCategory[brand.name] ?? '';
          const manufacturerId = manufacturerIdOverrides[brand.name] ?? manufacturerIdMap[brand.name.toLowerCase()];
          const params = new URLSearchParams();
          // Если UUID из override — не добавляем категорию (данные автопарсинга ненадёжные,
          // реальные товары могут быть в другой категории)
          if (categorySlug && !manufacturerIdOverrides[brand.name]) params.set('category', categorySlug);
          if (manufacturerId) params.set('manufacturerIds', manufacturerId);
          const queryStr = params.toString();
          const href = queryStr ? `/catalog?${queryStr}` : '/catalog';

          const topProduct = brandResults[index]?.data ?? null;
          const productImage = topProduct?.mainImage?.url && hasValidProductImage(topProduct.mainImage.url)
            ? getProductImageUrl(topProduct.mainImage.url)
            : (brandImageOverrides[brand.name] ?? null);

          return (
            <Link key={brand.name} to={href} className="block group h-full">
              <article
                className="bg-surface-card rounded-xl border border-hairline-dark p-6 flex items-start gap-4 hover:border-gold/30 transition-colors h-full"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-gold/10 text-gold rounded-lg shrink-0">
                  <Icon size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-lg font-semibold text-body-text">{brand.displayName ?? brand.name}</h3>
                    <span className="text-[10px] uppercase tracking-wider text-muted-text bg-surface-elevated px-2 py-0.5 rounded shrink-0">
                      {brand.category}
                    </span>
                  </div>
                  <p className="text-muted-text text-sm leading-relaxed">{brand.description}</p>
                </div>
                {productImage && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-white border border-hairline-dark">
                    <img
                      src={productImage}
                      alt=""
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                )}
              </article>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
