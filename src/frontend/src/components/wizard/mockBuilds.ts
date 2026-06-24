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

// All image paths from database product_images table
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
        '/uploads/products/f2/f2e8abaa10507a7cf5f0c9614d78469b8c35a3d50a6f2f2c1f5f546a415603a9.jpg',
        [sp('Сокет', 'AM4'), sp('Тип памяти', 'DDR4'), sp('Форм-фактор', 'Micro-ATX')]),
      p('f613eafb-0146-4f29-9bfb-65814af23089', 'Оперативная память Kingston FURY Beast 16GB DDR4 3200MHz', 628, 'ram',
        '/uploads/products/1b/1bc0e3fc95a9f47895da1a5ee2c0593a915be0d9470ee8fbf46a79a546519a24.jpg',
        [sp('Тип памяти', 'DDR4'), sp('Общий объём', '16 GB'), sp('Тактовая частота', '3200 MHz')]),
      p('1200a484-2c96-4a74-982c-940735080c06', 'SSD Kingston A400 480GB', 401, 'storage',
        '/uploads/products/92/928449a964402cccccc3e2727200c14ef1266b70862f7471010fd6080652be3b.jpg'),
      p('da55df07-d12e-476b-8d41-e6e3a54da7ae', 'Блок питания ExeGate ATX-CP500 500W', 48, 'psu',
        '/uploads/products/e7/e7c5eeed7acd557c9152ef09bc0b75e5a97e7e863e72781275d6aa54f8797da1.jpg'),
      p('f45aaed7-9718-46a0-8fbc-1364b3bbe13e', 'Корпус Ginzzu B400', 65, 'case',
        '/uploads/products/e7/e771361fefed2389ba43ef378b26f9c7d315a581048d19b33fc79c2bdf7974ba.jpg'),
      p('139c060e-d554-46be-899a-ad4a01c2f929', 'Система охлаждения DeepCool AK400 Digital SE', 130, 'cooling',
        '/uploads/products/9c/9c37836314c2e56993a0393bc0386fdcfa9f9a8aa5fa2b4ecd0aa303e4f3dbd3.jpg'),
      p('faec7299-9441-4978-8ef3-e797b71fb5f1', 'Вентилятор DeepCool RF120 FS (3шт)', 18, 'fan',
        '/uploads/products/d3/d3433b40386139bf1f16ca9e91fdb232df4eb83a78505c2796f68bfd6d242d70.jpg'),
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
        '/uploads/products/33/33ddbb93427246beba376fd4af21f6b090d314d66cbf55f69af6f68de2573651.jpg',
        [sp('Сокет', 'AM4'), sp('Тип памяти', 'DDR4'), sp('Форм-фактор', 'ATX')]),
      p('1d48b2e1-b48f-4995-b285-020c4e16d43e', 'Видеокарта MSI GeForce RTX 4060 Ventus 2X Black 8G OC', 2131, 'gpu',
        'https://x-core.by/upload/iblock/cc5/73h8szg6j2eqi29t1vv2bafnaw6bfls6.jpeg',
        [sp('Объём памяти', '8 GB'), sp('Тип памяти', 'GDDR6')]),
      p('f613eafb-0146-4f29-9bfb-65814af23089', 'Оперативная память Kingston FURY Beast 16GB DDR4 3200MHz', 628, 'ram',
        '/uploads/products/1b/1bc0e3fc95a9f47895da1a5ee2c0593a915be0d9470ee8fbf46a79a546519a24.jpg',
        [sp('Тип памяти', 'DDR4'), sp('Общий объём', '16 GB'), sp('Тактовая частота', '3200 MHz')]),
      p('1200a484-2c96-4a74-982c-940735080c06', 'SSD Kingston A400 480GB', 401, 'storage',
        '/uploads/products/92/928449a964402cccccc3e2727200c14ef1266b70862f7471010fd6080652be3b.jpg'),
      p('5137dfa4-a087-4fc8-8603-34a3924e3ef6', 'Блок питания DeepCool PF550 550W', 143, 'psu',
        '/uploads/products/1b/1b3482de662833610fd743804f1a75c07cc25e10ecca52bbd5e03ebccbb25115.jpg'),
      p('068cb49a-7033-4f56-aedc-4817346c4be3', 'Корпус DeepCool Matrexx 30', 115, 'case',
        '/uploads/products/c6/c6400915c25cf25f414b5abf1ee01d743de9a7d1f06050d35c80771f141c0b42.jpg'),
      p('ac905b93-9aa6-490f-933e-029f57c108fc', 'Система охлаждения DeepCool AK620 Digital SE', 226, 'cooling',
        '/uploads/products/77/77537eeea08b2d1cf1391e17aadadb3382c5a1f41c14703d413cbfd531fdbf81.jpg'),
      p('faec7299-9441-4978-8ef3-e797b71fb5f1', 'Вентилятор DeepCool RF120 FS (3шт)', 18, 'fan',
        '/uploads/products/d3/d3433b40386139bf1f16ca9e91fdb232df4eb83a78505c2796f68bfd6d242d70.jpg'),
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
        '/uploads/products/7a/7a36b799227323c981374165d1f12337261239fbf1e9912b9811c48ecc0004cc.jpg',
        [sp('Сокет', 'AM5'), sp('Тип памяти', 'DDR5'), sp('Форм-фактор', 'ATX')]),
      p('0c41bc80-e0d3-45f6-8735-0c3df9017092', 'Оперативная память Kingston FURY Beast 2x16GB DDR5 5600MHz', 1717, 'ram',
        '/uploads/products/9c/9c331b2add5dfcb3326fc3355b3f9ecdde670b58ea04b7851f93d83657ba8a6b.jpg',
        [sp('Тип памяти', 'DDR5'), sp('Общий объём', '32 GB'), sp('Тактовая частота', '5600 MHz')]),
      p('87607f1b-c71d-4952-a97f-301672be252b', 'SSD Kingston KC3000 2TB NVMe', 1232, 'storage',
        '/uploads/products/1e/1eff921b5b3ba46ad1674249378c074f30e9cead059d6dc5351cfb6d32bbb297.jpg'),
      p('a88227ab-a982-4eca-a631-f72b0280e353', 'Блок питания DeepCool PF750', 203, 'psu',
        '/uploads/products/87/87b35f7ad823088b83df20837b487c75d4fc65c0a168ae6a531c444bdd67b65d.jpg'),
      p('2c61bc1d-29c4-43bf-8d07-c29bb558c72b', 'Корпус DeepCool CH560', 431, 'case',
        '/uploads/products/61/61a70d888545132e95e05d16d9443772e56aee1887e8cedfcc5004db5557a724.jpg'),
      p('2a45b8d7-3d83-4c8d-8bb0-66558bbaff06', 'Система охлаждения DeepCool AK620', 221, 'cooling',
        '/uploads/products/98/9878d5f8727e6186c456edb595f4cb7718f4877282d712925f780e91f625c2b8.jpg'),
      p('faec7299-9441-4978-8ef3-e797b71fb5f1', 'Вентилятор DeepCool RF120 FS (3шт)', 18, 'fan',
        '/uploads/products/d3/d3433b40386139bf1f16ca9e91fdb232df4eb83a78505c2796f68bfd6d242d70.jpg'),
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
        '/uploads/products/d6/d6b1691191ae743707e0d35c08ca47901a02ee57e2ef28841ae3c2060690abc8.png',
        [sp('Сокет', 'LGA 1700'), sp('Тип памяти', 'DDR5'), sp('Форм-фактор', 'ATX')]),
      p('0c41bc80-e0d3-45f6-8735-0c3df9017092', 'Оперативная память Kingston FURY Beast 2x16GB DDR5 5600MHz', 1717, 'ram',
        '/uploads/products/9c/9c331b2add5dfcb3326fc3355b3f9ecdde670b58ea04b7851f93d83657ba8a6b.jpg',
        [sp('Тип памяти', 'DDR5'), sp('Общий объём', '32 GB'), sp('Тактовая частота', '5600 MHz')]),
      p('9f735cb6-d454-4db1-a315-fad85f3098fa', 'SSD Samsung 990 Pro 2TB NVMe', 1254, 'storage',
        '/uploads/products/89/89627aa2389857bbd698ae1c515fa1a9bdfb636f4e11802897e4be6d62155288.jpg'),
      p('a88227ab-a982-4eca-a631-f72b0280e353', 'Блок питания DeepCool PF750', 203, 'psu',
        '/uploads/products/87/87b35f7ad823088b83df20837b487c75d4fc65c0a168ae6a531c444bdd67b65d.jpg'),
      p('2c61bc1d-29c4-43bf-8d07-c29bb558c72b', 'Корпус DeepCool CH560', 431, 'case',
        '/uploads/products/61/61a70d888545132e95e05d16d9443772e56aee1887e8cedfcc5004db5557a724.jpg'),
      p('2a45b8d7-3d83-4c8d-8bb0-66558bbaff06', 'Система охлаждения DeepCool AK620', 221, 'cooling',
        '/uploads/products/98/9878d5f8727e6186c456edb595f4cb7718f4877282d712925f780e91f625c2b8.jpg'),
      p('faec7299-9441-4978-8ef3-e797b71fb5f1', 'Вентилятор DeepCool RF120 FS (3шт)', 18, 'fan',
        '/uploads/products/d3/d3433b40386139bf1f16ca9e91fdb232df4eb83a78505c2796f68bfd6d242d70.jpg'),
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
        '/uploads/products/7a/7a36b799227323c981374165d1f12337261239fbf1e9912b9811c48ecc0004cc.jpg',
        [sp('Сокет', 'AM5'), sp('Тип памяти', 'DDR5'), sp('Форм-фактор', 'ATX')]),
      p('0c41bc80-e0d3-45f6-8735-0c3df9017092', 'Оперативная память Kingston FURY Beast 2x16GB DDR5 5600MHz', 1717, 'ram',
        '/uploads/products/9c/9c331b2add5dfcb3326fc3355b3f9ecdde670b58ea04b7851f93d83657ba8a6b.jpg',
        [sp('Тип памяти', 'DDR5'), sp('Общий объём', '32 GB'), sp('Тактовая частота', '5600 MHz')]),
      p('87607f1b-c71d-4952-a97f-301672be252b', 'SSD Kingston KC3000 1TB NVMe', 683, 'storage',
        '/uploads/products/1e/1eff921b5b3ba46ad1674249378c074f30e9cead059d6dc5351cfb6d32bbb297.jpg'),
      p('5137dfa4-a087-4fc8-8603-34a3924e3ef6', 'Блок питания DeepCool PF550 550W', 143, 'psu',
        '/uploads/products/1b/1b3482de662833610fd743804f1a75c07cc25e10ecca52bbd5e03ebccbb25115.jpg'),
      p('068cb49a-7033-4f56-aedc-4817346c4be3', 'Корпус DeepCool Matrexx 30', 115, 'case',
        '/uploads/products/c6/c6400915c25cf25f414b5abf1ee01d743de9a7d1f06050d35c80771f141c0b42.jpg'),
      p('139c060e-d554-46be-899a-ad4a01c2f929', 'Система охлаждения DeepCool AK400 Digital SE', 130, 'cooling',
        '/uploads/products/9c/9c37836314c2e56993a0393bc0386fdcfa9f9a8aa5fa2b4ecd0aa303e4f3dbd3.jpg'),
      p('faec7299-9441-4978-8ef3-e797b71fb5f1', 'Вентилятор DeepCool RF120 FS (3шт)', 18, 'fan',
        '/uploads/products/d3/d3433b40386139bf1f16ca9e91fdb232df4eb83a78505c2796f68bfd6d242d70.jpg'),
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
        '/uploads/products/f2/f2e8abaa10507a7cf5f0c9614d78469b8c35a3d50a6f2f2c1f5f546a415603a9.jpg',
        [sp('Сокет', 'AM4'), sp('Тип памяти', 'DDR4'), sp('Форм-фактор', 'Micro-ATX')]),
      p('f613eafb-0146-4f29-9bfb-65814af23089', 'Оперативная память Kingston FURY Beast 16GB DDR4 3200MHz', 628, 'ram',
        '/uploads/products/1b/1bc0e3fc95a9f47895da1a5ee2c0593a915be0d9470ee8fbf46a79a546519a24.jpg',
        [sp('Тип памяти', 'DDR4'), sp('Общий объём', '16 GB'), sp('Тактовая частота', '3200 MHz')]),
      p('1200a484-2c96-4a74-982c-940735080c06', 'SSD Kingston A400 480GB', 401, 'storage',
        '/uploads/products/92/928449a964402cccccc3e2727200c14ef1266b70862f7471010fd6080652be3b.jpg'),
      p('da55df07-d12e-476b-8d41-e6e3a54da7ae', 'Блок питания ExeGate ATX-CP500 500W', 48, 'psu',
        '/uploads/products/e7/e7c5eeed7acd557c9152ef09bc0b75e5a97e7e863e72781275d6aa54f8797da1.jpg'),
      p('fc89cddc-6645-4fee-8002-dde21c2c528f', 'Корпус SuperPower MX16', 57, 'case',
        '/uploads/products/03/035ceb0a8e55c396815f11252af5af8d749123f5f25febc0145214a7d1b26c02.jpg'),
      p('139c060e-d554-46be-899a-ad4a01c2f929', 'Система охлаждения DeepCool AK400 Digital SE', 130, 'cooling',
        '/uploads/products/9c/9c37836314c2e56993a0393bc0386fdcfa9f9a8aa5fa2b4ecd0aa303e4f3dbd3.jpg'),
      p('faec7299-9441-4978-8ef3-e797b71fb5f1', 'Вентилятор DeepCool RF120 FS (3шт)', 18, 'fan',
        '/uploads/products/d3/d3433b40386139bf1f16ca9e91fdb232df4eb83a78505c2796f68bfd6d242d70.jpg'),
    ],
  },
];

export function getMockBuildById(id: string): MockBuild | undefined {
  return MOCK_BUILDS.find(b => b.id === id);
}

export function getPurposeMockBuilds(purpose: string): MockBuild[] {
  return MOCK_BUILDS.filter(b => b.purpose === purpose);
}
