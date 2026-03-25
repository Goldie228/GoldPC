import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';

interface MetaConfig {
  title: string;
  description: string;
}

const TITLE = (page: string) => `GoldPC — ${page}`;

const DEFAULT_META: MetaConfig = {
  title: TITLE('Магазин комплектующих'),
  description:
    'Интернет-магазин комплектующих, конструктор ПК, сервисный центр и гарантийное обслуживание.',
};

const CATEGORY_META: Record<string, MetaConfig> = {
  cpu: {
    title: TITLE('Каталог: процессоры'),
    description:
      'Широкий выбор процессоров Intel и AMD. Подбор по сокету, ядрам и частоте. Гарантия и доставка.',
  },
  gpu: {
    title: TITLE('Каталог: видеокарты'),
    description:
      'Видеокарты NVIDIA GeForce и AMD Radeon. В наличии RTX 40-й серии. Лучшие цены и рассрочка.',
  },
  motherboard: {
    title: TITLE('Каталог: материнские платы'),
    description:
      'Материнские платы всех сокетов и форм-факторов. ASUS, MSI, Gigabyte. Подбор совместимости.',
  },
  ram: {
    title: TITLE('Каталог: оперативная память'),
    description:
      'Модули памяти для ПК и ноутбуков. Высокая частота, низкие тайминги. Kingston, G.Skill, Corsair.',
  },
  storage: {
    title: TITLE('Каталог: накопители SSD и HDD'),
    description: 'Быстрые NVMe SSD и надёжные HDD. Большой выбор объёмов. Samsung, WD, Kingston.',
  },
};

function setMetaTag(name: string, content: string): void {
  let tag = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setPropertyMetaTag(property: string, content: string): void {
  let tag = document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonical(url: string): void {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

/** Маршруты приложения: для неизвестного пути — заголовок 404 */
function isKnownAppRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  const patterns = [
    /^\/catalog(\/.*)?$/,
    /^\/product\//,
    /^\/pc-builder$/,
    /^\/cart$/,
    /^\/wishlist$/,
    /^\/comparison$/,
    /^\/checkout$/,
    /^\/services(\/.*)?$/,
    /^\/service-request$/,
    /^\/about$/,
    /^\/delivery$/,
    /^\/payment$/,
    /^\/warranty$/,
    /^\/returns$/,
    /^\/faq$/,
    /^\/account(\/.*)?$/,
    /^\/login$/,
    /^\/register$/,
    /^\/admin(\/.*)?$/,
    /^\/manager(\/.*)?$/,
    /^\/master(\/.*)?$/,
    /^\/accountant(\/.*)?$/,
  ];
  return patterns.some((re) => re.test(pathname));
}

function getMetaByPath(pathname: string, category?: string): MetaConfig {
  if (pathname === '/') {
    return {
      title: TITLE('Главная'),
      description: 'Каталог комплектующих, профессиональная сборка ПК и сервисный центр GoldPC.',
    };
  }
  if (pathname === '/cart') {
    return {
      title: TITLE('Корзина'),
      description: 'Ваша корзина покупок в GoldPC: оформление и доставка.',
    };
  }
  if (pathname === '/checkout') {
    return {
      title: TITLE('Оформление заказа'),
      description: 'Оформление заказа в интернет-магазине GoldPC.',
    };
  }
  if (pathname === '/login') {
    return {
      title: TITLE('Вход'),
      description: 'Вход в личный кабинет GoldPC.',
    };
  }
  if (pathname === '/register') {
    return {
      title: TITLE('Регистрация'),
      description: 'Регистрация в интернет-магазине GoldPC.',
    };
  }
  if (pathname === '/pc-builder') {
    return {
      title: TITLE('Конструктор ПК'),
      description: 'Соберите ПК с проверкой совместимости комплектующих.',
    };
  }
  if (pathname === '/wishlist') {
    return {
      title: TITLE('Избранное'),
      description: 'Список избранных товаров GoldPC.',
    };
  }
  if (pathname === '/comparison') {
    return {
      title: TITLE('Сравнение товаров'),
      description: 'Сравнение характеристик комплектующих в GoldPC.',
    };
  }
  if (pathname === '/services') {
    return {
      title: TITLE('Услуги'),
      description: 'Сервисный центр GoldPC: ремонт, диагностика, настройка.',
    };
  }
  if (pathname.startsWith('/services/')) {
    return {
      title: TITLE('Услуга'),
      description: 'Услуги сервисного центра GoldPC.',
    };
  }
  if (pathname === '/service-request') {
    return {
      title: TITLE('Заявка в сервис'),
      description: 'Оставить заявку на обслуживание в GoldPC.',
    };
  }
  if (pathname === '/about') {
    return {
      title: TITLE('О нас'),
      description: 'Интернет-магазин GoldPC: о компании и сервисе.',
    };
  }
  if (pathname.startsWith('/catalog')) {
    if (category && CATEGORY_META[category]) {
      return CATEGORY_META[category];
    }
    return {
      title: TITLE('Каталог'),
      description:
        'Выбирайте процессоры, видеокарты, память и другие комплектующие с фильтрами и сравнением.',
    };
  }
  if (pathname.startsWith('/product/')) {
    return {
      title: TITLE('Товар'),
      description: 'Характеристики, цены, отзывы и наличие товара в каталоге GoldPC.',
    };
  }
  if (pathname === '/delivery') {
    return {
      title: TITLE('Доставка'),
      description: 'Условия и стоимость доставки заказов по Минску и Беларуси.',
    };
  }
  if (pathname === '/payment') {
    return {
      title: TITLE('Оплата'),
      description: 'Способы оплаты заказов: карта, ЕРИП, наличные при получении.',
    };
  }
  if (pathname === '/warranty') {
    return {
      title: TITLE('Гарантия'),
      description: 'Гарантийные условия на товары и сервисные работы GoldPC.',
    };
  }
  if (pathname === '/returns') {
    return {
      title: TITLE('Возврат и обмен'),
      description: 'Правила возврата и обмена товаров в интернет-магазине GoldPC.',
    };
  }
  if (pathname === '/faq') {
    return {
      title: TITLE('Вопросы и ответы'),
      description: 'Ответы на популярные вопросы о заказах, доставке, оплате и гарантиях.',
    };
  }

  if (!isKnownAppRoute(pathname)) {
    return {
      title: TITLE('Страница не найдена'),
      description: 'Запрашиваемая страница не существует. Вернитесь в каталог или на главную.',
    };
  }

  return DEFAULT_META;
}

export function RouteMeta(): null {
  const location = useLocation();
  const { category } = useParams<{ category?: string }>();

  useEffect(() => {
    const meta = getMetaByPath(location.pathname, category);
    const canonicalUrl = `${window.location.origin}${location.pathname}`;

    document.title = meta.title;
    setMetaTag('description', meta.description);
    setPropertyMetaTag('og:title', meta.title);
    setPropertyMetaTag('og:description', meta.description);
    setPropertyMetaTag('og:type', 'website');
    setPropertyMetaTag('og:url', canonicalUrl);
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', meta.title);
    setMetaTag('twitter:description', meta.description);
    setCanonical(canonicalUrl);
  }, [location.pathname, category]);

  return null;
}
