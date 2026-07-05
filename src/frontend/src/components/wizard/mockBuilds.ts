import type { Product, ProductCategory } from '@/api/types';
import type { SpecificationValue } from '@/api/types';

export interface MockBuild {
  id: string;
  label: string;
  description: string;
  purpose: string;
  tags: string[];
  components: Product[];
  totalPrice: number;
}

function sp(name: string, value: string): SpecificationValue {
  return { id: `${name}-${value}`, specificationAttributeName: name, value };
}

const SPEC_KEY_MAP: Record<string, string> = {
  'Сокет': 'socket', 'Тип памяти': 'memoryType', 'Форм-фактор': 'formFactor',
  'Общий объём': 'capacity', 'Тактовая частота': 'frequency', 'Объём памяти': 'memorySize',
};

function p(
  id: string, name: string, price: number, category: ProductCategory,
  img?: string, specs?: SpecificationValue[],
): Product {
  const specifications: Record<string, string> = {};
  if (specs) {
    for (const sv of specs) {
      const engKey = SPEC_KEY_MAP[sv.specificationAttributeName] ?? sv.specificationAttributeName;
      specifications[engKey] = sv.value;
    }
  }
  const mainImage = img ? { id: '1', url: img, alt: name, sortOrder: 0, isPrimary: true } : undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product: any = {
    id, name, sku: id, category, price,
    stock: 10, isActive: true, isFeatured: false,
    rating: 4.5, reviewCount: 10, warrantyMonths: 12,
    mainImage,
    images: mainImage ? [mainImage] : [],
    specificationValues: specs ?? [],
    specifications,
  };
  // Add direct fields that extractors check first (socket, memoryType)
  if (specs) {
    for (const sv of specs) {
      if (sv.specificationAttributeName === 'Сокет') product.socket = sv.value;
      if (sv.specificationAttributeName === 'Тип памяти') product.memoryType = sv.value;
    }
  }
  return product as Product;
}

// All image paths from database product_images таблица
export const MOCK_BUILDS: MockBuild[] = [
  {
    id: 'office-budget', label: 'Офисный ПК',
    description: 'Для документов, почты и браузера',
    purpose: 'office', tags: ['Тихий', 'Бюджетный', 'Надёжный'], totalPrice: 808,
    components: [
      p('a3fa1f9b-083e-42a4-97f8-3e1b0b93f305', 'Процессор AMD Athlon 3000G', 118, 'cpu',
        'https://x-core.by/upload/iblock/db6/3as5ubzhvoiqhu4sip62ju9ksufqq9sl.jpeg',
        [sp('Сокет', 'AM4'), sp('Тип памяти', 'DDR4')]),
      p('ec472d17-6fa2-4eeb-ad4e-684128af4dd0', 'Материнская плата BIOSTAR A520MHP Ver. 6.0', 205, 'motherboard',
        'https://x-core.by/upload/iblock/ecf/mnhz5grsxlnw0qb73q3acm227oxdoytt.jpeg',
        [sp('Сокет', 'AM4'), sp('Тип памяти', 'DDR4'), sp('Форм-фактор', 'Micro-ATX')]),
      p('f613eafb-0146-4f29-9bfb-65814af23089', 'Оперативная память Kingston FURY Beast 16GB DDR4 3200MHz', 628, 'ram',
        'https://x-core.by/upload/iblock/79f/itarlmt2fmb5ih1y7cen274id44dgk2a.jpeg',
        [sp('Тип памяти', 'DDR4'), sp('Общий объём', '16 GB'), sp('Тактовая частота', '3200 MHz')]),
      p('1200a484-2c96-4a74-982c-940735080c06', 'SSD Kingston A400 480GB', 401, 'storage',
        'https://x-core.by/upload/iblock/87a/6ambx2pgyrfpor8r1vifwqmblq3qz2l9.jpeg'),
      p('da55df07-d12e-476b-8d41-e6e3a54da7ae', 'Блок питания ExeGate ATX-CP500 500W', 48, 'psu',
        'https://x-core.by/upload/iblock/286/72dqon63ymistv07v7pxvnhhnsbur2c1.jpeg'),
      p('f45aaed7-9718-46a0-8fbc-1364b3bbe13e', 'Корпус Ginzzu B400', 65, 'case',
        'https://x-core.by/upload/iblock/5e5/9u0si1aarbf0jbo3mdqqpolc48upcq7v.jpeg'),
      p('139c060e-d554-46be-899a-ad4a01c2f929', 'Система охлаждения DeepCool AK400 Digital SE', 130, 'cooling',
        'https://x-core.by/upload/iblock/d02/8ur6dnekpfct3b9vq6pj7aj3iy00ct3j.jpeg'),
      p('faec7299-9441-4978-8ef3-e797b71fb5f1', 'Вентилятор DeepCool RF120 FS (3шт)', 18, 'fan',
        'https://x-core.by/upload/iblock/40e/6kjc8ky9sjcq77em2t3wttro90sun8al.jpeg'),
    ],
  },
  {
    id: 'gaming-budget', label: 'Игровой ПК',
    description: 'Игры в 1080p на средних-высоких настройках',
    purpose: 'gaming', tags: ['1080p', 'Gaming', 'RTX'], totalPrice: 4672,
    components: [
      p('b616c242-b578-4f45-8ed0-69af1a703b24', 'Процессор AMD Ryzen 5 5600X', 437, 'cpu',
        'https://x-core.by/upload/iblock/989/l8c695suhje998yahgn9a0ead1ajg2wr.jpeg',
        [sp('Сокет', 'AM4'), sp('Тип памяти', 'DDR4')]),
      p('e9c55aa8-6eb7-40e0-b8ca-bf04d011d7da', 'Материнская плата MSI MPG B550 Gaming Plus', 573, 'motherboard',
        'https://x-core.by/upload/iblock/9b7/fmmyh0mdhwzie1cvdy3wp4bhqhcqa252.jpeg',
        [sp('Сокет', 'AM4'), sp('Тип памяти', 'DDR4'), sp('Форм-фактор', 'ATX')]),
      p('1d48b2e1-b48f-4995-b285-020c4e16d43e', 'Видеокарта MSI GeForce RTX 4060 Ventus 2X Black 8G OC', 2131, 'gpu',
        'https://x-core.by/upload/iblock/cc5/73h8szg6j2eqi29t1vv2bafnaw6bfls6.jpeg',
        [sp('Объём памяти', '8 GB'), sp('Тип памяти', 'GDDR6')]),
      p('f613eafb-0146-4f29-9bfb-65814af23089', 'Оперативная память Kingston FURY Beast 16GB DDR4 3200MHz', 628, 'ram',
        'https://x-core.by/upload/iblock/79f/itarlmt2fmb5ih1y7cen274id44dgk2a.jpeg',
        [sp('Тип памяти', 'DDR4'), sp('Общий объём', '16 GB'), sp('Тактовая частота', '3200 MHz')]),
      p('1200a484-2c96-4a74-982c-940735080c06', 'SSD Kingston A400 480GB', 401, 'storage',
        'https://x-core.by/upload/iblock/87a/6ambx2pgyrfpor8r1vifwqmblq3qz2l9.jpeg'),
      p('5137dfa4-a087-4fc8-8603-34a3924e3ef6', 'Блок питания DeepCool PF550 550W', 143, 'psu',
        'https://x-core.by/upload/iblock/3ec/5fk7p9nr8pbuy07avj123vqilk1g8rj0.jpeg'),
      p('068cb49a-7033-4f56-aedc-4817346c4be3', 'Корпус DeepCool Matrexx 30', 115, 'case',
        'https://x-core.by/upload/iblock/6f8/86f9yjy16127cv71gsdvawdcad50ykes.jpeg'),
      p('ac905b93-9aa6-490f-933e-029f57c108fc', 'Система охлаждения DeepCool AK620 Digital SE', 226, 'cooling',
        'https://x-core.by/upload/iblock/ebf/y0uwkpqbzlzmnk1t100zbxlan16qau1h.jpeg'),
      p('faec7299-9441-4978-8ef3-e797b71fb5f1', 'Вентилятор DeepCool RF120 FS (3шт)', 18, 'fan',
        'https://x-core.by/upload/iblock/40e/6kjc8ky9sjcq77em2t3wttro90sun8al.jpeg'),
    ],
  },
  {
    id: 'gaming-optimal', label: 'Игровой ТОП',
    description: 'Максимум в 1440p и 4K играх',
    purpose: 'gaming', tags: ['1440p', '4K', 'Ultra', 'Топ'], totalPrice: 11651,
    components: [
      p('ac5d4de2-14e1-40ac-ba4f-3c78e98cd441', 'Процессор AMD Ryzen 7 7800X3D', 983, 'cpu',
        'https://x-core.by/upload/iblock/79b/7ob81osuwaz72sivi27r8zncb7hn0mt3.jpeg',
        [sp('Сокет', 'AM5'), sp('Тип памяти', 'DDR5')]),
      p('4d9cd6dc-bd25-4c6d-9f58-7f3cae07971b', 'Видеокарта MSI GeForce RTX 4070 Ti Super 16GB Gaming Slim', 7458, 'gpu',
        'https://x-core.by/upload/iblock/285/z2w3hpxwdohrnjplhf9ckjrg30jk4582.jpeg',
        [sp('Объём памяти', '16 GB'), sp('Тип памяти', 'GDDR6X')]),
      p('c6029d6a-8be8-403a-8455-af895dbeda30', 'Материнская плата MSI MAG B650 Tomahawk WiFi', 722, 'motherboard',
        'https://x-core.by/upload/iblock/ecb/0htbc7up104bk4n2i5gx7jauiukjbo6q.jpeg',
        [sp('Сокет', 'AM5'), sp('Тип памяти', 'DDR5'), sp('Форм-фактор', 'ATX')]),
      p('0c41bc80-e0d3-45f6-8735-0c3df9017092', 'Оперативная память Kingston FURY Beast 2x16GB DDR5 5600MHz', 1717, 'ram',
        'https://x-core.by/upload/iblock/fc3/7oibn8ro4anyox9336lvz2ad7t22yp5g.jpeg',
        [sp('Тип памяти', 'DDR5'), sp('Общий объём', '32 GB'), sp('Тактовая частота', '5600 MHz')]),
      p('87607f1b-c71d-4952-a97f-301672be252b', 'SSD Kingston KC3000 2TB NVMe', 1232, 'storage',
        'https://x-core.by/upload/iblock/cb2/g94txrr3aik7tnqt3tix8demp721k3xv.jpeg'),
      p('a88227ab-a982-4eca-a631-f72b0280e353', 'Блок питания DeepCool PF750', 203, 'psu',
        'https://x-core.by/upload/iblock/960/27tn3etoxypyd3nh3kntd14ufn082o9w.jpeg'),
      p('2c61bc1d-29c4-43bf-8d07-c29bb558c72b', 'Корпус DeepCool CH560', 431, 'case',
        'https://x-core.by/upload/iblock/a42/ssiawv0wi8zdkhxwvhi06ds8iyucdi8e.jpeg'),
      p('2a45b8d7-3d83-4c8d-8bb0-66558bbaff06', 'Система охлаждения DeepCool AK620', 221, 'cooling',
        'https://x-core.by/upload/iblock/ebf/y0uwkpqbzlzmnk1t100zbxlan16qau1h.jpeg'),
      p('faec7299-9441-4978-8ef3-e797b71fb5f1', 'Вентилятор DeepCool RF120 FS (3шт)', 18, 'fan',
        'https://x-core.by/upload/iblock/40e/6kjc8ky9sjcq77em2t3wttro90sun8al.jpeg'),
    ],
  },
  {
    id: 'workstation', label: 'Рабочая станция',
    description: 'Для монтажа видео и 3D-рендера',
    purpose: 'workstation', tags: ['4K', 'Рендер', 'NVMe', '32GB'], totalPrice: 12452,
    components: [
      p('620c083c-fa9c-4cef-8209-8d2503d4a8c1', 'Процессор Intel Core i7-13700', 1413, 'cpu',
        'https://x-core.by/upload/iblock/a41/as8h69afnf7n913727gb3y728a54tefk.jpeg',
        [sp('Сокет', 'LGA 1700'), sp('Тип памяти', 'DDR5')]),
      p('4d9cd6dc-bd25-4c6d-9f58-7f3cae07971b', 'Видеокарта MSI GeForce RTX 4070 Ti Super 16GB Gaming Slim', 7458, 'gpu',
        'https://x-core.by/upload/iblock/285/z2w3hpxwdohrnjplhf9ckjrg30jk4582.jpeg',
        [sp('Объём памяти', '16 GB'), sp('Тип памяти', 'GDDR6X')]),
      p('f960aab6-ff11-4d63-b7cf-88572cb9d89f', 'Материнская плата MSI MAG Z790 Tomahawk WiFi', 866, 'motherboard',
        'https://x-core.by/upload/iblock/2cb/7nfg13ulrnw41afg891dpabo10vuufj0.png',
        [sp('Сокет', 'LGA 1700'), sp('Тип памяти', 'DDR5'), sp('Форм-фактор', 'ATX')]),
      p('0c41bc80-e0d3-45f6-8735-0c3df9017092', 'Оперативная память Kingston FURY Beast 2x16GB DDR5 5600MHz', 1717, 'ram',
        'https://x-core.by/upload/iblock/fc3/7oibn8ro4anyox9336lvz2ad7t22yp5g.jpeg',
        [sp('Тип памяти', 'DDR5'), sp('Общий объём', '32 GB'), sp('Тактовая частота', '5600 MHz')]),
      p('9f735cb6-d454-4db1-a315-fad85f3098fa', 'SSD Samsung 990 Pro 2TB NVMe', 1254, 'storage',
        'https://x-core.by/upload/iblock/fd1/whd65s6e22ce9e07u08jbcvmibvdxlik.jpeg'),
      p('a88227ab-a982-4eca-a631-f72b0280e353', 'Блок питания DeepCool PF750', 203, 'psu',
        'https://x-core.by/upload/iblock/960/27tn3etoxypyd3nh3kntd14ufn082o9w.jpeg'),
      p('2c61bc1d-29c4-43bf-8d07-c29bb558c72b', 'Корпус DeepCool CH560', 431, 'case',
        'https://x-core.by/upload/iblock/a42/ssiawv0wi8zdkhxwvhi06ds8iyucdi8e.jpeg'),
      p('2a45b8d7-3d83-4c8d-8bb0-66558bbaff06', 'Система охлаждения DeepCool AK620', 221, 'cooling',
        'https://x-core.by/upload/iblock/ebf/y0uwkpqbzlzmnk1t100zbxlan16qau1h.jpeg'),
      p('faec7299-9441-4978-8ef3-e797b71fb5f1', 'Вентилятор DeepCool RF120 FS (3шт)', 18, 'fan',
        'https://x-core.by/upload/iblock/40e/6kjc8ky9sjcq77em2t3wttro90sun8al.jpeg'),
    ],
  },
  {
    id: 'streaming-setup', label: 'Стриминг',
    description: 'Для стримов в 1080p60',
    purpose: 'streaming', tags: ['OBS', 'NVENC', '1080p60'], totalPrice: 4002,
    components: [
      p('79e24a8e-ad6b-425c-aa68-39cf92f2e6f9', 'Процессор AMD Ryzen 7 7700X', 760, 'cpu',
        'https://x-core.by/upload/iblock/768/lcs241es7zntuxjh24kzlg31yp8mnmzl.jpeg',
        [sp('Сокет', 'AM5'), sp('Тип памяти', 'DDR5')]),
      p('620b0f33-38e4-4302-83c2-979c289a9c76', 'Видеокарта ASUS Dual GeForce RTX 4060 Ti OC 8GB', 2012, 'gpu',
        '/uploads/products/45/455b579d33480641bc9b50c2afddcbe8220b3653b11fed8961031f8340d150fd.jpg',
        [sp('Объём памяти', '8 GB'), sp('Тип памяти', 'GDDR6')]),
      p('c6029d6a-8be8-403a-8455-af895dbeda30', 'Материнская плата MSI MAG B650 Tomahawk WiFi', 722, 'motherboard',
        'https://x-core.by/upload/iblock/ecb/0htbc7up104bk4n2i5gx7jauiukjbo6q.jpeg',
        [sp('Сокет', 'AM5'), sp('Тип памяти', 'DDR5'), sp('Форм-фактор', 'ATX')]),
      p('0c41bc80-e0d3-45f6-8735-0c3df9017092', 'Оперативная память Kingston FURY Beast 2x16GB DDR5 5600MHz', 1717, 'ram',
        'https://x-core.by/upload/iblock/fc3/7oibn8ro4anyox9336lvz2ad7t22yp5g.jpeg',
        [sp('Тип памяти', 'DDR5'), sp('Общий объём', '32 GB'), sp('Тактовая частота', '5600 MHz')]),
      p('87607f1b-c71d-4952-a97f-301672be252b', 'SSD Kingston KC3000 1TB NVMe', 683, 'storage',
        'https://x-core.by/upload/iblock/cb2/g94txrr3aik7tnqt3tix8demp721k3xv.jpeg'),
      p('5137dfa4-a087-4fc8-8603-34a3924e3ef6', 'Блок питания DeepCool PF550 550W', 143, 'psu',
        'https://x-core.by/upload/iblock/3ec/5fk7p9nr8pbuy07avj123vqilk1g8rj0.jpeg'),
      p('068cb49a-7033-4f56-aedc-4817346c4be3', 'Корпус DeepCool Matrexx 30', 115, 'case',
        'https://x-core.by/upload/iblock/6f8/86f9yjy16127cv71gsdvawdcad50ykes.jpeg'),
      p('139c060e-d554-46be-899a-ad4a01c2f929', 'Система охлаждения DeepCool AK400 Digital SE', 130, 'cooling',
        'https://x-core.by/upload/iblock/d02/8ur6dnekpfct3b9vq6pj7aj3iy00ct3j.jpeg'),
      p('faec7299-9441-4978-8ef3-e797b71fb5f1', 'Вентилятор DeepCool RF120 FS (3шт)', 18, 'fan',
        'https://x-core.by/upload/iblock/40e/6kjc8ky9sjcq77em2t3wttro90sun8al.jpeg'),
    ],
  },
  {
    id: 'home-theater', label: 'Домашний кинотеатр',
    description: 'Мультимедиа и 4K контент на ТВ',
    purpose: 'home-theater', tags: ['4K', 'HDMI', 'Тихий'], totalPrice: 652,
    components: [
      p('578dfc3f-0e52-4227-87b9-7957b76408ff', 'Процессор AMD Athlon 300GE', 122, 'cpu',
        'https://x-core.by/upload/iblock/3fa/wdjnw21xrcaoct11ef84i5xzgnc3jyrv.jpeg',
        [sp('Сокет', 'AM4'), sp('Тип памяти', 'DDR4')]),
      p('ec472d17-6fa2-4eeb-ad4e-684128af4dd0', 'Материнская плата BIOSTAR A520MHP Ver. 6.0', 205, 'motherboard',
        'https://x-core.by/upload/iblock/ecf/mnhz5grsxlnw0qb73q3acm227oxdoytt.jpeg',
        [sp('Сокет', 'AM4'), sp('Тип памяти', 'DDR4'), sp('Форм-фактор', 'Micro-ATX')]),
      p('f613eafb-0146-4f29-9bfb-65814af23089', 'Оперативная память Kingston FURY Beast 16GB DDR4 3200MHz', 628, 'ram',
        'https://x-core.by/upload/iblock/79f/itarlmt2fmb5ih1y7cen274id44dgk2a.jpeg',
        [sp('Тип памяти', 'DDR4'), sp('Общий объём', '16 GB'), sp('Тактовая частота', '3200 MHz')]),
      p('1200a484-2c96-4a74-982c-940735080c06', 'SSD Kingston A400 480GB', 401, 'storage',
        'https://x-core.by/upload/iblock/87a/6ambx2pgyrfpor8r1vifwqmblq3qz2l9.jpeg'),
      p('da55df07-d12e-476b-8d41-e6e3a54da7ae', 'Блок питания ExeGate ATX-CP500 500W', 48, 'psu',
        'https://x-core.by/upload/iblock/286/72dqon63ymistv07v7pxvnhhnsbur2c1.jpeg'),
      p('fc89cddc-6645-4fee-8002-dde21c2c528f', 'Корпус SuperPower MX16', 57, 'case',
        'https://x-core.by/upload/iblock/ede/49pg4fnbkli3ekg7hpc2hzdrfz3fafgk.jpeg'),
      p('139c060e-d554-46be-899a-ad4a01c2f929', 'Система охлаждения DeepCool AK400 Digital SE', 130, 'cooling',
        'https://x-core.by/upload/iblock/d02/8ur6dnekpfct3b9vq6pj7aj3iy00ct3j.jpeg'),
      p('faec7299-9441-4978-8ef3-e797b71fb5f1', 'Вентилятор DeepCool RF120 FS (3шт)', 18, 'fan',
        'https://x-core.by/upload/iblock/40e/6kjc8ky9sjcq77em2t3wttro90sun8al.jpeg'),
    ],
  },
];

export function getMockBuildById(id: string): MockBuild | undefined {
  return MOCK_BUILDS.find(b => b.id === id);
}

export function getPurposeMockBuilds(purpose: string): MockBuild[] {
  return MOCK_BUILDS.filter(b => b.purpose === purpose);
}
