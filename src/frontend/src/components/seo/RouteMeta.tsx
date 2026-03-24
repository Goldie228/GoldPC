import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface MetaConfig {
  title: string;
  description: string;
}

const DEFAULT_META: MetaConfig = {
  title: 'GoldPC - магазин компьютерных комплектующих',
  description: 'Интернет-магазин комплектующих, конструктор ПК, сервисный центр и гарантийное обслуживание.',
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

function getMetaByPath(pathname: string): MetaConfig {
  if (pathname === '/') {
    return {
      title: 'GoldPC - комплектующие и сборка ПК',
      description: 'Каталог комплектующих, профессиональная сборка ПК и сервисный центр GoldPC.',
    };
  }
  if (pathname.startsWith('/catalog')) {
    return {
      title: 'Каталог комплектующих - GoldPC',
      description: 'Выбирайте процессоры, видеокарты, память и другие комплектующие с фильтрами и сравнением.',
    };
  }
  if (pathname.startsWith('/product/')) {
    return {
      title: 'Карточка товара - GoldPC',
      description: 'Характеристики, цены, отзывы и наличие товара в каталоге GoldPC.',
    };
  }
  if (pathname === '/delivery') {
    return {
      title: 'Доставка - GoldPC',
      description: 'Условия и стоимость доставки заказов по Минску и Беларуси.',
    };
  }
  if (pathname === '/payment') {
    return {
      title: 'Оплата - GoldPC',
      description: 'Способы оплаты заказов: карта, ЕРИП, наличные при получении.',
    };
  }
  if (pathname === '/warranty') {
    return {
      title: 'Гарантия - GoldPC',
      description: 'Гарантийные условия на товары и сервисные работы GoldPC.',
    };
  }
  if (pathname === '/returns') {
    return {
      title: 'Возврат и обмен - GoldPC',
      description: 'Правила возврата и обмена товаров в интернет-магазине GoldPC.',
    };
  }
  if (pathname === '/faq') {
    return {
      title: 'FAQ - GoldPC',
      description: 'Ответы на популярные вопросы о заказах, доставке, оплате и гарантиях.',
    };
  }
  return DEFAULT_META;
}

export function RouteMeta(): null {
  const location = useLocation();

  useEffect(() => {
    const meta = getMetaByPath(location.pathname);
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
  }, [location.pathname]);

  return null;
}
