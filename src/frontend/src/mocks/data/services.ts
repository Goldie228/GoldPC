/**
 * Mock данные для сервисных услуг GoldPC
 * Основано на прототипах services.html и service-detail.html
 */

import type { Service, ServicePriceItem } from '../../api/types';

// === Прейскуранты для услуг ===

const repairPriceList: ServicePriceItem[] = [
  {
    id: 'price-repair-1',
    name: 'Диагностика ПК',
    description: 'Полная проверка всех компонентов, стресс-тесты',
    price: 25,
  },
  {
    id: 'price-repair-2',
    name: 'Замена комплектующих',
    description: 'Установка процессора, видеокарты, памяти, SSD',
    price: 30,
    priceMax: 50,
  },
  {
    id: 'price-repair-3',
    name: 'Чистка и обслуживание',
    description: 'Удаление пыли, замена термопасты, смазка вентиляторов',
    price: 40,
  },
  {
    id: 'price-repair-4',
    name: 'Ремонт материнской платы',
    description: 'Пайка, замена конденсаторов, ремонт цепей питания',
    price: 80,
  },
  {
    id: 'price-repair-5',
    name: 'Ремонт блока питания',
    description: 'Диагностика, замена компонентов, перепайка разъёмов',
    price: 60,
  },
  {
    id: 'price-repair-6',
    name: 'Ремонт видеокарты',
    description: 'Прогрев, реболл, замена чипов памяти',
    price: 100,
  },
  {
    id: 'price-repair-7',
    name: 'Восстановление данных',
    description: 'Работа с HDD, SSD, флешками, картами памяти',
    price: 100,
  },
  {
    id: 'price-repair-8',
    name: 'Переустановка ОС',
    description: 'Установка Windows, драйверов, базового ПО',
    price: 40,
  },
];

const upgradePriceList: ServicePriceItem[] = [
  {
    id: 'price-upgrade-1',
    name: 'Подбор комплектующих',
    description: 'Анализ совместимости, рекомендации по апгрейду',
    price: 15,
  },
  {
    id: 'price-upgrade-2',
    name: 'Установка процессора',
    description: 'Замена CPU с проверкой совместимости',
    price: 25,
  },
  {
    id: 'price-upgrade-3',
    name: 'Установка оперативной памяти',
    description: 'Добавление или замена модулей RAM',
    price: 15,
  },
  {
    id: 'price-upgrade-4',
    name: 'Установка SSD/HDD',
    description: 'Монтаж накопителя, перенос данных',
    price: 20,
  },
  {
    id: 'price-upgrade-5',
    name: 'Замена видеокарты',
    description: 'Установка GPU, проверка БП',
    price: 30,
  },
  {
    id: 'price-upgrade-6',
    name: 'Полный апгрейд системы',
    description: 'Комплексная модернизация с тестированием',
    price: 50,
    priceMax: 80,
  },
];

const diagnosticsPriceList: ServicePriceItem[] = [
  {
    id: 'price-diag-1',
    name: 'Экспресс-диагностика',
    description: 'Базовая проверка основных компонентов',
    price: 15,
  },
  {
    id: 'price-diag-2',
    name: 'Полная диагностика ПК',
    description: 'Комплексная проверка всех компонентов, стресс-тесты',
    price: 25,
  },
  {
    id: 'price-diag-3',
    name: 'Диагностика перегрева',
    description: 'Проверка температур, термоинтерфейсов, вентиляторов',
    price: 20,
  },
  {
    id: 'price-diag-4',
    name: 'Диагностика БП',
    description: 'Проверка напряжений, мощности, стабильности',
    price: 20,
  },
  {
    id: 'price-diag-5',
    name: 'Диагностика накопителя',
    description: 'Проверка SMART, поверхности, скорости',
    price: 15,
  },
  {
    id: 'price-diag-6',
    name: 'Поиск неисправностей',
    description: 'Диагностика при неочевидных проблемах',
    price: 35,
  },
];

const assemblyPriceList: ServicePriceItem[] = [
  {
    id: 'price-assembly-1',
    name: 'Сборка базового ПК',
    description: 'Сборка системы без кабель-менеджмента',
    price: 60,
  },
  {
    id: 'price-assembly-2',
    name: 'Сборка игрового ПК',
    description: 'Профессиональная сборка с кабель-менеджментом',
    price: 80,
  },
  {
    id: 'price-assembly-3',
    name: 'Сборка премиум ПК',
    description: 'Сборка с кастомным водяным охлаждением',
    price: 150,
    priceMax: 250,
  },
  {
    id: 'price-assembly-4',
    name: 'Установка ОС и ПО',
    description: 'Windows, драйверы, базовый софт',
    price: 30,
  },
  {
    id: 'price-assembly-5',
    name: 'Тестирование системы',
    description: 'Стресс-тесты, проверка стабильности',
    price: 25,
  },
  {
    id: 'price-assembly-6',
    name: 'Сборка рабочего места',
    description: 'Сборка ПК, подключение периферии, настройка',
    price: 100,
  },
];

const dataRecoveryPriceList: ServicePriceItem[] = [
  {
    id: 'price-data-1',
    name: 'Программное восстановление',
    description: 'Восстановление случайно удалённых файлов',
    price: 50,
  },
  {
    id: 'price-data-2',
    name: 'Восстановление с HDD',
    description: 'Работа с повреждёнными жёсткими дисками',
    price: 100,
    priceMax: 200,
  },
  {
    id: 'price-data-3',
    name: 'Восстановление с SSD',
    description: 'Восстановление данных с твердотельных накопителей',
    price: 150,
    priceMax: 300,
  },
  {
    id: 'price-data-4',
    name: 'Восстановление с флешки',
    description: 'Работа с USB-накопителями и SD-картами',
    price: 60,
    priceMax: 120,
  },
  {
    id: 'price-data-5',
    name: 'Восстановление RAID',
    description: 'Восстановление данных с RAID-массивов',
    price: 300,
    priceMax: 500,
  },
];

const maintenancePriceList: ServicePriceItem[] = [
  {
    id: 'price-maint-1',
    name: 'Чистка от пыли',
    description: 'Удаление пыли из корпуса и компонентов',
    price: 30,
  },
  {
    id: 'price-maint-2',
    name: 'Замена термопасты',
    description: 'Замена термоинтерфейса на CPU/GPU',
    price: 25,
  },
  {
    id: 'price-maint-3',
    name: 'Обслуживание СЖО',
    description: 'Замена жидкости, чистка водоблоков',
    price: 80,
    priceMax: 120,
  },
  {
    id: 'price-maint-4',
    name: 'Смазка вентиляторов',
    description: 'Чистка и смазка корпусных и CPU вентиляторов',
    price: 15,
    priceMax: 25,
  },
  {
    id: 'price-maint-5',
    name: 'Кабель-менеджмент',
    description: 'Укладка кабелей, установка стяжек',
    price: 20,
  },
  {
    id: 'price-maint-6',
    name: 'Комплексное ТО',
    description: 'Полный комплекс профилактических работ',
    price: 60,
  },
];

// === Услуги ===

export const SERVICES: Service[] = [
  {
    id: 'service-repair',
    name: 'Ремонт ПК',
    slug: 'repair',
    category: 'repair',
    description: 'Профессиональный ремонт компьютеров любой сложности. Диагностика, замена комплектующих, пайка компонентов, восстановление данных. Гарантия на все виды работ до 12 месяцев.',
    shortDescription: 'Диагностика и ремонт компьютеров любой сложности. Замена комплектующих, пайка, восстановление данных. Гарантия на все работы.',
    icon: 'wrench',
    basePrice: 50,
    priceNote: 'Точная стоимость зависит от сложности ремонта и заменяемых комплектующих',
    duration: '1-3 дня',
    warrantyMonths: 12,
    completedCount: 2500,
    isPopular: true,
    isActive: true,
    priceList: repairPriceList,
    features: [
      'Гарантия качества — все работы выполняются сертифицированными специалистами с гарантией до 12 месяцев',
      'Быстрое выполнение — большинство ремонтов выполняется за 1-2 дня. Срочный ремонт в день обращения',
      'Честные цены — фиксированные цены без скрытых платежей. Бесплатная диагностика при ремонте',
    ],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-12-01T12:00:00Z',
  },
  {
    id: 'service-upgrade',
    name: 'Апгрейд',
    slug: 'upgrade',
    category: 'upgrade',
    description: 'Модернизация вашего ПК для повышения производительности. Профессиональный подбор оптимальных комплектующих с полной проверкой совместимости.',
    shortDescription: 'Модернизация вашего ПК для повышения производительности. Подбор оптимальных комплектующих с проверкой совместимости.',
    icon: 'trending-up',
    basePrice: 30,
    priceNote: 'Стоимость зависит от типа и количества устанавливаемых компонентов',
    duration: '1-2 дня',
    warrantyMonths: 6,
    completedCount: 1800,
    isPopular: false,
    isActive: true,
    priceList: upgradePriceList,
    features: [
      'Проверка совместимости — подбираем только совместимые компоненты',
      'Перенос данных — сохраним все ваши файлы при замене накопителя',
      'Тестирование — проверим систему после апгрейда',
    ],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-12-01T12:00:00Z',
  },
  {
    id: 'service-diagnostics',
    name: 'Диагностика',
    slug: 'diagnostics',
    category: 'diagnostics',
    description: 'Полная диагностика всех компонентов ПК. Стресс-тесты, проверка температур, анализ производительности и поиск неисправностей.',
    shortDescription: 'Полная диагностика всех компонентов ПК. Стресс-тесты, проверка температур, анализ производительности и поиск неисправностей.',
    icon: 'info',
    basePrice: 25,
    priceNote: 'Стоимость диагностики засчитывается при последующем ремонте',
    duration: '1 день',
    warrantyMonths: 0,
    completedCount: 3200,
    isPopular: false,
    isActive: true,
    priceList: diagnosticsPriceList,
    features: [
      'Полный отчёт — получите детальный отчёт о состоянии всех компонентов',
      'Рекомендации — подскажем, что стоит заменить или обновить',
      'Бесплатно при ремонте — диагностика бесплатно при заказе ремонта',
    ],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-12-01T12:00:00Z',
  },
  {
    id: 'service-assembly',
    name: 'Сборка ПК',
    slug: 'assembly',
    category: 'assembly',
    description: 'Профессиональная сборка игрового или рабочего ПК. Кабель-менеджмент, тестирование, установка ОС и драйверов.',
    shortDescription: 'Профессиональная сборка игрового или рабочего ПК. Кабель-менеджмент, тестирование, установка ОС и драйверов.',
    icon: 'box',
    basePrice: 80,
    priceNote: 'Стоимость зависит от сложности сборки и типа системы охлаждения',
    duration: '1-2 дня',
    warrantyMonths: 12,
    completedCount: 1500,
    isPopular: true,
    isActive: true,
    priceList: assemblyPriceList,
    features: [
      'Кабель-менеджмент — аккуратная укладка кабелей для лучшей эстетики и охлаждения',
      'Стресс-тесты — проверим стабильность системы под нагрузкой',
      'Гарантия — гарантия на сборку и совместимость компонентов',
    ],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-12-01T12:00:00Z',
  },
  {
    id: 'service-data-recovery',
    name: 'Восстановление данных',
    slug: 'data-recovery',
    category: 'data-recovery',
    description: 'Восстановление данных с HDD, SSD, флешек и карт памяти. Работа с повреждёнными носителями любой сложности.',
    shortDescription: 'Восстановление данных с HDD, SSD, флешек и карт памяти. Работа с повреждёнными носителями любой сложности.',
    icon: 'database',
    basePrice: 100,
    priceNote: 'Оплата только за успешно восстановленные данные',
    duration: '1-5 дней',
    warrantyMonths: 0,
    completedCount: 800,
    isPopular: false,
    isActive: true,
    priceList: dataRecoveryPriceList,
    features: [
      'Конфиденциальность — гарантируем сохранность и конфиденциальность ваших данных',
      'Оплата за результат — платите только за успешно восстановленные файлы',
      'Лаборатория — работаем в специализированной лаборатории',
    ],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-12-01T12:00:00Z',
  },
  {
    id: 'service-maintenance',
    name: 'Чистка и обслуживание',
    slug: 'maintenance',
    category: 'maintenance',
    description: 'Чистка от пыли, замена термопасты, смазка вентиляторов. Профилактика перегрева и продление срока службы компонентов.',
    shortDescription: 'Чистка от пыли, замена термопасты, смазка вентиляторов. Профилактика перегрева и продление срока службы компонентов.',
    icon: 'sun',
    basePrice: 40,
    priceNote: 'Рекомендуется проводить ТО каждые 6-12 месяцев',
    duration: '1 день',
    warrantyMonths: 3,
    completedCount: 2100,
    isPopular: false,
    isActive: true,
    priceList: maintenancePriceList,
    features: [
      'Продление срока службы — регулярное ТО продлевает жизнь компонентов',
      'Снижение температур — чистка и замена термопасты снижают температуру на 10-20°C',
      'Снижение шума — смазка вентиляторов делает работу ПК тише',
    ],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-12-01T12:00:00Z',
  },
];

// === Преимущества сервисного центра ===

export interface ServiceBenefit {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const SERVICE_BENEFITS: ServiceBenefit[] = [
  {
    id: 'benefit-1',
    title: 'Гарантия качества',
    description: 'Гарантия на все виды работ до 12 месяцев',
    icon: 'shield-check',
  },
  {
    id: 'benefit-2',
    title: 'Быстрое выполнение',
    description: 'Большинство работ выполняется за 1-2 дня',
    icon: 'clock',
  },
  {
    id: 'benefit-3',
    title: 'Опытные специалисты',
    description: 'Сертифицированные инженеры с опытом 10+ лет',
    icon: 'users',
  },
  {
    id: 'benefit-4',
    title: 'Честные цены',
    description: 'Фиксированные цены без скрытых платежей',
    icon: 'credit-card',
  },
];