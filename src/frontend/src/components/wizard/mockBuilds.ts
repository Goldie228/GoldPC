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

function p(id: string, name: string, price: number, category: ProductCategory, image?: string): Product {
  return {
    id, name, sku: id, category, price,
    stock: 10, isActive: true, isFeatured: false,
    rating: 4.5, reviewCount: 10, warrantyMonths: 12,
    images: image ? [{ id: '1', url: image, alt: name, sortOrder: 0, isPrimary: true }] : [],
    specifications: {},
  };
}

export const MOCK_BUILDS: MockBuild[] = [
  {
    id: 'office-budget', label: 'Офисный ПК',
    description: 'Для документов, почты и браузера',
    purpose: 'office', tags: ['Тихий', 'Бюджетный', 'Надёжный'], totalPrice: 680,
    components: [
      p('a3fa1f9b-083e-42a4-97f8-3e1b0b93f305', 'Процессор AMD Athlon 3000G', 118, 'cpu', 'https://x-core.by/upload/iblock/db6/3as5ubzhvoiqhu4sip62ju9ksufqq9sl.jpeg'),
      p('f45aaed7-9718-46a0-8fbc-1364b3bbe13e', 'Корпус Ginzzu B400', 65, 'case', 'https://x-core.by/upload/iblock/f69/tby3jd71yo469oj4muui33uhv2cy7h5g.jpeg'),
      p('da55df07-d12e-476b-8d41-e6e3a54da7ae', 'Блок питания ExeGate ATX-CP500 500W', 48, 'psu', 'https://x-core.by/upload/iblock/1bc/o52iirejobmdjahuw9g6m1uju1p3cyrq.jpeg'),
      p('139c060e-d554-46be-899a-ad4a01c2f929', 'Система охлаждения DeepCool AK400 Digital SE', 130, 'cooling', 'https://x-core.by/upload/iblock/17c/aorbi18lbyptc744sw2xkcjkjffvoc3h.jpeg'),
    ],
  },
  {
    id: 'gaming-budget', label: 'Игровой ПК',
    description: 'Игры в 1080p на средних-высоких настройках',
    purpose: 'gaming', tags: ['1080p', 'Gaming', 'RTX'], totalPrice: 1600,
    components: [
      p('b616c242-b578-4f45-8ed0-69af1a703b24', 'Процессор AMD Ryzen 5 5600X', 437, 'cpu', 'https://x-core.by/upload/iblock/989/l8c695suhje998yahgn9a0ead1ajg2wr.jpeg'),
      p('c6029d6a-8be8-403a-8455-af895dbeda30', 'Материнская плата MSI MAG B650 Tomahawk WiFi', 722, 'motherboard', 'https://x-core.by/upload/iblock/f8b/l4o1efoajg5ywb3bjntga0uc0xkybi1s.jpeg'),
      p('5137dfa4-a087-4fc8-8603-34a3924e3ef6', 'Блок питания DeepCool PF550 550W', 143, 'psu', 'https://x-core.by/upload/iblock/26d/o95tjoxqkv07xcbg4yw24vonsrq288yl.jpeg'),
      p('068cb49a-7033-4f56-aedc-4817346c4be3', 'Корпус DeepCool Matrexx 30', 115, 'case', 'https://x-core.by/upload/iblock/e09/ezuoclq42ebz3rpmhda7isrlp0km2d8h.jpeg'),
      p('ac905b93-9aa6-490f-933e-029f57c108fc', 'Система охлаждения DeepCool AK620 Digital SE', 226, 'cooling', 'https://x-core.by/upload/iblock/f59/ex4kcmedfippj47uydfw24omgk57anfd.jpeg'),
    ],
  },
  {
    id: 'gaming-optimal', label: 'Игровой ТОП',
    description: 'Максимум в 1440p и 4K играх',
    purpose: 'gaming', tags: ['1440p', '4K', 'Ultra', 'Топ'], totalPrice: 4000,
    components: [
      p('ac5d4de2-14e1-40ac-ba4f-3c78e98cd441', 'Процессор AMD Ryzen 7 7800X3D', 983, 'cpu', 'https://x-core.by/upload/iblock/79b/7ob81osuwaz72sivi27r8zncb7hn0mt3.jpeg'),
      p('4d9cd6dc-bd25-4c6d-9f58-7f3cae07971b', 'Видеокарта MSI GeForce RTX 4070 Ti Super 16GB', 7458, 'gpu', 'https://x-core.by/upload/iblock/285/z2w3hpxwdohrnjplhf9ckjrg30jk4582.jpeg'),
      p('c6029d6a-8be8-403a-8455-af895dbeda30', 'Материнская плата MSI MAG B650 Tomahawk WiFi', 722, 'motherboard', 'https://x-core.by/upload/iblock/f8b/l4o1efoajg5ywb3bjntga0uc0xkybi1s.jpeg'),
      p('87607f1b-c71d-4952-a97f-301672be252b', 'SSD Kingston KC3000 2TB NVMe', 1232, 'storage', 'https://x-core.by/upload/iblock/27b/faw1jeyh5ndfkoypla58yitsttqvobys.jpeg'),
      p('20000000-0000-0000-0000-000000000010', 'Блок питания Corsair RM750e 750W', 289, 'psu'),
      p('2c61bc1d-29c4-43bf-8d07-c29bb558c72b', 'Корпус DeepCool CH560', 431, 'case', 'https://x-core.by/upload/iblock/114/b5m7oeryx1vmxg3b078y4vefylmr1pre.jpeg'),
      p('2a45b8d7-3d83-4c8d-8bb0-66558bbaff06', 'Система охлаждения DeepCool AK620', 221, 'cooling', 'https://x-core.by/upload/iblock/459/xp8ginbm5vyopki71r1sqveno7behv48.jpeg'),
    ],
  },
  {
    id: 'workstation', label: 'Рабочая станция',
    description: 'Для монтажа видео и 3D-рендера',
    purpose: 'workstation', tags: ['4K', 'Рендер', 'NVMe', '32GB'], totalPrice: 4200,
    components: [
      p('620c083c-fa9c-4cef-8209-8d2503d4a8c1', 'Процессор Intel Core i7-13700', 1413, 'cpu', 'https://x-core.by/upload/iblock/a41/as8h69afnf7n913727gb3y728a54tefk.jpeg'),
      p('4d9cd6dc-bd25-4c6d-9f58-7f3cae07971b', 'Видеокарта MSI GeForce RTX 4070 Ti Super 16GB', 7458, 'gpu', 'https://x-core.by/upload/iblock/285/z2w3hpxwdohrnjplhf9ckjrg30jk4582.jpeg'),
      p('f960aab6-ff11-4d63-b7cf-88572cb9d89f', 'Материнская плата MSI MAG Z790 Tomahawk WiFi', 866, 'motherboard', 'https://x-core.by/upload/iblock/635/l0nvarx1fulqxox5j9wm03oj6lg57tgy.png'),
      p('9f735cb6-d454-4db1-a315-fad85f3098fa', 'SSD Samsung 990 Pro 2TB NVMe', 1254, 'storage', 'https://x-core.by/upload/iblock/1bc/g0dela3xsqikp0v7uf21sjfh6hvk23cq.jpeg'),
      p('20000000-0000-0000-0000-000000000010', 'Блок питания Corsair RM750e 750W', 289, 'psu'),
      p('2c61bc1d-29c4-43bf-8d07-c29bb558c72b', 'Корпус DeepCool CH560', 431, 'case', 'https://x-core.by/upload/iblock/114/b5m7oeryx1vmxg3b078y4vefylmr1pre.jpeg'),
      p('2a45b8d7-3d83-4c8d-8bb0-66558bbaff06', 'Система охлаждения DeepCool AK620', 221, 'cooling', 'https://x-core.by/upload/iblock/459/xp8ginbm5vyopki71r1sqveno7behv48.jpeg'),
    ],
  },
  {
    id: 'streaming-setup', label: 'Стриминг',
    description: 'Для стримов в 1080p60',
    purpose: 'streaming', tags: ['OBS', 'NVENC', '1080p60', 'Тихий'], totalPrice: 2800,
    components: [
      p('79e24a8e-ad6b-425c-aa68-39cf92f2e6f9', 'Процессор AMD Ryzen 7 7700X', 760, 'cpu', 'https://x-core.by/upload/iblock/768/lcs241es7zntuxjh24kzlg31yp8mnmzl.jpeg'),
      p('620b0f33-38e4-4302-83c2-979c289a9c76', 'Видеокарта ASUS Dual GeForce RTX 4060 Ti OC 8GB', 2012, 'gpu', 'https://x-core.by/upload/iblock/77a/iel7y06s81oh5qcmp7ypge81x9gyrxkf.jpeg'),
      p('c6029d6a-8be8-403a-8455-af895dbeda30', 'Материнская плата MSI MAG B650 Tomahawk WiFi', 722, 'motherboard', 'https://x-core.by/upload/iblock/f8b/l4o1efoajg5ywb3bjntga0uc0xkybi1s.jpeg'),
      p('5137dfa4-a087-4fc8-8603-34a3924e3ef6', 'Блок питания DeepCool PF550 550W', 143, 'psu', 'https://x-core.by/upload/iblock/26d/o95tjoxqkv07xcbg4yw24vonsrq288yl.jpeg'),
      p('068cb49a-7033-4f56-aedc-4817346c4be3', 'Корпус DeepCool Matrexx 30', 115, 'case', 'https://x-core.by/upload/iblock/e09/ezuoclq42ebz3rpmhda7isrlp0km2d8h.jpeg'),
      p('139c060e-d554-46be-899a-ad4a01c2f929', 'Система охлаждения DeepCool AK400 Digital SE', 130, 'cooling', 'https://x-core.by/upload/iblock/17c/aorbi18lbyptc744sw2xkcjkjffvoc3h.jpeg'),
    ],
  },
  {
    id: 'home-theater', label: 'Домашний кинотеатр',
    description: 'Мультимедиа и 4K контент на ТВ',
    purpose: 'home-theater', tags: ['4K', 'HDMI', 'Тихий', 'Mini-ITX'], totalPrice: 550,
    components: [
      p('578dfc3f-0e52-4227-87b9-7957b76408ff', 'Процессор AMD Athlon 300GE', 122, 'cpu', 'https://x-core.by/upload/iblock/3fa/wdjnw21xrcaoct11ef84i5xzgnc3jyrv.jpeg'),
      p('1200a484-2c96-4a74-982c-940735080c06', 'SSD Kingston A400 480GB', 401, 'storage', 'https://x-core.by/upload/iblock/9c1/ytf7uh11uiy5u1n19k7cy57oikkdg7u5.jpeg'),
      p('da55df07-d12e-476b-8d41-e6e3a54da7ae', 'Блок питания ExeGate ATX-CP500 500W', 48, 'psu', 'https://x-core.by/upload/iblock/1bc/o52iirejobmdjahuw9g6m1uju1p3cyrq.jpeg'),
      p('fc89cddc-6645-4fee-8002-dde21c2c528f', 'Корпус SuperPower MX16', 57, 'case', 'https://x-core.by/upload/iblock/ceb/s2vs54o94xr4d0iuckh6pvyulmf8w25i.jpeg'),
    ],
  },
];

export function getMockBuildById(id: string): MockBuild | undefined {
  return MOCK_BUILDS.find(b => b.id === id);
}

export function getPurposeMockBuilds(purpose: string): MockBuild[] {
  return MOCK_BUILDS.filter(b => b.purpose === purpose);
}
