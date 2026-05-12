import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Monitor, Smartphone, HardDrive, CircuitBoard, Headphones, Mouse, Keyboard } from 'lucide-react';

type Brand = {
  name: string;
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
  'be quiet!': 'cooling',
  Noctua: 'cooling',
  Corsair: 'psu',
  Dell: 'monitor',
  LG: 'monitor',
  Apple: '',
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
  { name: 'be quiet!', description: 'Блоки питания, корпуса и системы охлаждения', icon: CircuitBoard, category: 'Охлаждение и БП' },
  { name: 'Noctua', description: 'Премиальные кулеры и вентиляторы для ПК', icon: CircuitBoard, category: 'Охлаждение и БП' },
  { name: 'Corsair', description: 'Блоки питания, корпуса, оперативная память и периферия', icon: CircuitBoard, category: 'Комплектующие' },
  // Monitors
  { name: 'Dell', description: 'Мониторы, ноутбуки и рабочие станции', icon: Monitor, category: 'Мониторы' },
  { name: 'LG', description: 'Мониторы, телевизоры и компьютерная периферия', icon: Monitor, category: 'Мониторы' },
  // Smartphones
  { name: 'Apple', description: 'iPhone, iPad, MacBook и аксессуары', icon: Smartphone, category: 'Смартфоны и планшеты' },
];

export function BrandsPage(): ReactElement {
  return (
    <main className="min-h-screen bg-canvas-dark pt-24 md:pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
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
           {brands.map((brand) => {
             const Icon = brand.icon;
             const categorySlug = brandToCategory[brand.name] ?? '';
             const href = categorySlug ? `/catalog?category=${categorySlug}` : '/catalog';
             return (
               <Link key={brand.name} to={href} className="block">
                 <article
                   className="bg-surface-card rounded-xl border border-hairline-dark p-6 flex items-start gap-4 hover:border-gold/30 transition-colors"
                 >
                   <div className="w-12 h-12 flex items-center justify-center bg-gold/10 text-gold rounded-lg shrink-0">
                     <Icon size={24} />
                   </div>
                   <div className="min-w-0">
                     <div className="flex items-center gap-2 mb-1">
                       <h3 className="text-lg font-semibold text-body-text">{brand.name}</h3>
                       <span className="text-[10px] uppercase tracking-wider text-muted-text bg-surface-elevated px-2 py-0.5 rounded shrink-0">
                         {brand.category}
                       </span>
                     </div>
                     <p className="text-muted-text text-sm leading-relaxed">{brand.description}</p>
                   </div>
                 </article>
               </Link>
             );
           })}
        </div>
      </div>
    </main>
  );
}
