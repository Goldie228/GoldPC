import { type ReactElement } from 'react';
import { useParams, Link } from 'react-router-dom';
import { hasValidProductImage } from '../../utils/image';
import { Button } from '../../components/ui/Button';
import { Tabs, type Tab } from '../../components/ui/Tabs';
import { Skeleton } from '../../components/ui/Skeleton';
import { ProductCard } from '../../components/ProductCard/ProductCard';
import { useProduct } from '../../hooks/useProduct';
import { useProducts } from '../../hooks/useProducts';
import { useCart } from '../../hooks/useCart';
import { useToastStore } from '../../store/toastStore';
import type { Product, ProductSpecifications } from '../../api/types';
import './ProductPage.css';

/**
 * Форматирование цены в BYN
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'BYN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Статус наличия
 */
function getStockStatus(stock: number): { text: string; className: string } {
  if (stock === 0) {
    return { text: 'Нет в наличии', className: 'stock--out' };
  }
  if (stock <= 5) {
    return { text: `Мало (${stock} шт)`, className: 'stock--low' };
  }
  return { text: `В наличии (${stock} шт)`, className: 'stock--in' };
}

/**
 * Скелетон загрузки страницы товара
 */
function ProductPageSkeleton(): ReactElement {
  return (
    <div className="product-page">
      <div className="product-page__container">
        <div className="breadcrumb">
          <Skeleton width={60} height={14} />
          <Skeleton width={12} height={14} />
          <Skeleton width={80} height={14} />
          <Skeleton width={12} height={14} />
          <Skeleton width={150} height={14} />
        </div>
        <div className="product-layout">
          <div className="gallery">
            <Skeleton width="100%" height={400} borderRadius="md" />
            <div className="gallery__thumbs">
              <Skeleton width={64} height={64} borderRadius="md" />
              <Skeleton width={64} height={64} borderRadius="md" />
              <Skeleton width={64} height={64} borderRadius="md" />
            </div>
          </div>
          <div className="product-info">
            <Skeleton width={80} height={12} />
            <Skeleton width="100%" height={32} />
            <Skeleton width={200} height={14} />
            <Skeleton width="100%" height={100} borderRadius="md" />
            <Skeleton width="100%" height={48} borderRadius="md" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Галерея изображений товара
 */
function ProductGallery({ product }: { product: Product }): ReactElement {
  const hasDiscount = product.oldPrice !== undefined && product.oldPrice > product.price;
  const discountPercent = hasDiscount && product.oldPrice !== undefined
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  return (
    <div className="gallery">
      <div className="gallery__main">
        {hasDiscount && (
          <span className="gallery__badge">-{discountPercent}%</span>
        )}
        {hasValidProductImage(product.mainImage?.url) ? (
          <img
            src={product.mainImage.url}
            alt={product.mainImage.alt ?? product.name}
            className="gallery__image"
          />
        ) : (
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="gallery__placeholder">
            <rect x="40" y="40" width="120" height="120" rx="8" fill="#1a1a1e" stroke="#d4a574" strokeWidth="2"/>
            <rect x="70" y="70" width="60" height="60" rx="4" fill="#121214"/>
            <text x="100" y="108" textAnchor="middle" fill="#d4a574" fontSize="20" fontWeight="bold">Нет фото</text>
          </svg>
        )}
      </div>
      {product.images !== undefined && product.images.length > 1 && (
        <div className="gallery__thumbs">
          {product.images.map((img, index) => (
            <button
              key={img.id}
              className={`gallery__thumb ${img.isMain ? 'gallery__thumb--active' : ''}`}
            >
              <img src={img.url} alt={img.alt ?? `Фото ${index + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Информация о товаре (правая колонка)
 */
function ProductInfo({ product }: { product: Product }): ReactElement {
  const { addToCart, isInCart, getItemQuantity } = useCart();
  const showToast = useToastStore((state) => state.showToast);

  const stockStatus = getStockStatus(product.stock);
  const hasDiscount = product.oldPrice !== undefined && product.oldPrice > product.price;
  const discountPercent = hasDiscount && product.oldPrice !== undefined
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;
  const inCart = isInCart(product.id);
  const quantityInCart = getItemQuantity(product.id);
  const isOutOfStock = product.stock !== undefined && product.stock === 0;
  const isInactive = product.isActive !== undefined && product.isActive === false;
  const isDisabled = !!(isOutOfStock || isInactive);

  const handleAddToCart = (): void => {
    if (isDisabled) return;
    addToCart(product, 1);
    showToast('Товар добавлен в корзину', 'success');
  };

  const specs = product.specifications as ProductSpecifications | undefined;
  const hasSpecs = specs !== undefined && Object.keys(specs).length > 0;

  return (
    <div className="product-info">
      <div className="product-info__header">
        {product.manufacturer !== undefined && (
          <span className="product-info__manufacturer">{product.manufacturer.name}</span>
        )}
        <h1 className="product-info__title">{product.name}</h1>
        <div className="product-info__meta">
          <span className="product-info__category">{product.category}</span>
          <span className="product-info__article">Арт: {product.sku}</span>
        </div>
        <div className={`product-info__stock ${stockStatus.className}`}>
          <span className="stock-dot"></span>
          {stockStatus.text}
        </div>
      </div>

      <div className="product-info__price">
        <div className="price-row">
          <span className="price-current">{formatPrice(product.price)}</span>
          {hasDiscount && product.oldPrice !== undefined && (
            <>
              <span className="price-old">{formatPrice(product.oldPrice)}</span>
              <span className="price-discount">-{discountPercent}%</span>
            </>
          )}
        </div>
        <span className="price-note">Цена действительна при заказе через сайт</span>
      </div>

      <div className="product-info__actions">
        <Button variant="primary" onClick={handleAddToCart} disabled={isDisabled}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
          </svg>
          {inCart ? `В корзине (${quantityInCart})` : 'В корзину'}
        </Button>
      </div>

      {hasSpecs && (
        <div className="specs">
          <h3 className="specs__title">Ключевые характеристики</h3>
          <div className="specs__grid">
            {Object.entries(specs).slice(0, 4).map(([key, value]) => (
              <div key={key} className="spec-item">
                <span className="spec-item__label">{key}</span>
                <span className="spec-item__value">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Содержимое табов
 */
function useProductTabs(product: Product): Tab[] {
  const specs = product.specifications as ProductSpecifications | undefined;
  const hasSpecs = specs !== undefined && Object.keys(specs).length > 0;

  const SPEC_LABELS: Record<string, string> = {
    vram: 'Объём видеопамяти', gpu: 'Графический процессор', interface: 'Интерфейс',
    socket: 'Сокет', cores: 'Ядра', threads: 'Потоки', chipset: 'Чипсет', form_factor: 'Форм-фактор',
    type: 'Тип', capacity: 'Объём', frequency: 'Частота', wattage: 'Мощность', efficiency: 'Сертификат',
    color: 'Цвет', tdp: 'TDP', diagonal: 'Диагональ', resolution: 'Разрешение', refresh_rate: 'Частота обновления',
    connection: 'Подключение',
  };
  const specLabel = (key: string): string => SPEC_LABELS[key.toLowerCase()] ?? key;

  const specsContent = (
    <div className="specs-table">
      {hasSpecs ? (
        Object.entries(specs).map(([key, value]) => (
          <div key={key} className="specs-table__row">
            <span className="specs-table__label">{specLabel(key)}</span>
            <span className="specs-table__value">{String(value)}</span>
          </div>
        ))
      ) : (
        <p className="specs-table__empty">Характеристики не указаны</p>
      )}
    </div>
  );

  const descriptionContent = (
    <div className="tab-description">
      {product.description !== undefined && product.description.trim() !== '' ? (
        <div className="tab-description__content" style={{ whiteSpace: 'pre-line' }}>
          {product.description}
        </div>
      ) : (
        <p className="tab-description__empty">Описание товара отсутствует.</p>
      )}
    </div>
  );

  const reviewsContent = (
    <div className="tab-reviews">
      <div className="tab-reviews__header">
        <div className="tab-reviews__rating">
          {product.rating !== undefined && (
            <>
              <span className="tab-reviews__stars">
                {'★'.repeat(Math.round(product.rating))}
                {'☆'.repeat(5 - Math.round(product.rating))}
              </span>
              <span className="tab-reviews__value">{product.rating.toFixed(1)}</span>
            </>
          )}
        </div>
        <span className="tab-reviews__count">42 отзыва</span>
      </div>
      <div className="tab-reviews__placeholder">
        <p>Отзывы скоро будут доступны.</p>
      </div>
    </div>
  );

  return [
    { id: 'specs', label: 'Характеристики', content: specsContent },
    { id: 'description', label: 'Описание', content: descriptionContent },
    { id: 'reviews', label: 'Отзывы', content: reviewsContent },
  ];
}

/**
 * Похожие товары
 */
function RelatedProducts({ category, currentProductId }: { category: string; currentProductId: string }): ReactElement | null {
  const { data: relatedData } = useProducts(
    { category: category as 'cpu' | 'gpu' | 'motherboard' | 'ram' | 'storage' | 'psu' | 'case' | 'cooling' | 'monitor' | 'peripherals', pageSize: 9 },
    { enabled: true }
  );

  const relatedProducts = relatedData?.data.filter((p) => p.id !== currentProductId).slice(0, 6) ?? [];

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="related-products">
      <h2 className="related-products__title">Похожие товары</h2>
      <div className="related-products__scroll">
        {relatedProducts.map((relatedProduct) => (
          <div key={relatedProduct.id} className="related-products__item">
            <ProductCard product={relatedProduct} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Страница товара (Product Detail Page)
 */
export function ProductPage(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, error } = useProduct(id);
  const tabs = useProductTabs(product ?? ({} as Product));

  if (isLoading) {
    return <ProductPageSkeleton />;
  }

  if (error !== null || product === undefined) {
    return (
      <div className="product-page">
        <div className="product-page__container">
          <div className="product-page__error">
            <h1>Товар не найден</h1>
            <p>Запрашиваемый товар не существует или был удалён.</p>
            <Link to="/catalog" className="product-page__error-link">
              Вернуться в каталог
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-page">
      <div className="product-page__container">
        <nav className="breadcrumb">
          <Link to="/">Главная</Link>
          <span className="breadcrumb__separator">/</span>
          <Link to="/catalog">Каталог</Link>
          <span className="breadcrumb__separator">/</span>
          <Link to={`/catalog/${product.category}`}>{product.category}</Link>
          <span className="breadcrumb__separator">/</span>
          <span className="breadcrumb__current">{product.name}</span>
        </nav>

        <div className="product-layout">
          <ProductGallery product={product} />
          <ProductInfo product={product} />
        </div>

        <div className="product-tabs">
          <Tabs tabs={tabs} defaultTab="specs" />
        </div>

        <RelatedProducts category={product.category} currentProductId={product.id} />
      </div>
    </div>
  );
}