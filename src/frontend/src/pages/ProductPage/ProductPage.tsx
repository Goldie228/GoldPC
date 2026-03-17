import { useParams } from 'react-router-dom';
import './ProductPage.css';

/**
 * ProductPage - Product Detail Page
 * 
 * Features:
 * - Gallery on the left with thumbnails
 * - Specs on the right with "Add to Cart" button (gold shimmer animation)
 * - Product information, rating, stock status
 */
export function ProductPage() {
  const { id } = useParams<{ id: string }>();

  // TODO: Fetch product data from API
  const product = {
    id: id || '1',
    name: 'NVIDIA GeForce RTX 4070 Super',
    manufacturer: 'NVIDIA',
    price: 58990,
    rating: 4.9,
    reviewCount: 128,
    inStock: 15,
    specs: [
      { label: 'GPU Architecture', value: 'Ada Lovelace' },
      { label: 'Video Memory', value: '12 GB GDDR6X' },
      { label: 'Memory Bus', value: '192-bit' },
      { label: 'Base Clock', value: '1980 MHz' },
      { label: 'Boost Clock', value: '2475 MHz' },
      { label: 'CUDA Cores', value: '7168' },
      { label: 'TDP', value: '220 W' },
      { label: 'Power Connector', value: '1× 8-pin' },
      { label: 'Recommended PSU', value: '650 W' },
    ],
  };

  return (
    <div className="product-page">
      <div className="product-page__container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <a href="/">Главная</a>
          <span className="breadcrumb__separator">/</span>
          <a href="/catalog">Каталог</a>
          <span className="breadcrumb__separator">/</span>
          <a href="/catalog?category=gpu">Видеокарты</a>
          <span className="breadcrumb__separator">/</span>
          <span className="breadcrumb__current">{product.name}</span>
        </nav>

        <div className="product-page__content">
          {/* Gallery Panel */}
          <div className="product-gallery">
            <div className="product-gallery__main">
              <div className="product-gallery__image">
                🎮 RTX 4070 Super
              </div>
            </div>
            <div className="product-gallery__thumbnails">
              {[1, 2, 3, 4].map((num) => (
                <button 
                  key={num} 
                  className={`product-gallery__thumb ${num === 1 ? 'product-gallery__thumb--active' : ''}`}
                >
                  Img {num}
                </button>
              ))}
            </div>
          </div>

          {/* Specs Panel */}
          <div className="product-specs">
            <div className="product-specs__header">
              <span className="product-specs__manufacturer">{product.manufacturer}</span>
              <span className="product-specs__badge badge badge--hit">Хит</span>
            </div>
            
            <h1 className="product-specs__name">{product.name}</h1>
            
            <div className="product-specs__rating">
              <span className="product-specs__stars">★★★★★</span>
              <span className="product-specs__rating-value">{product.rating}</span>
              <span className="product-specs__review-count">({product.reviewCount} отзывов)</span>
            </div>

            <div className="product-specs__divider" />

            <div className="product-specs__specs-list">
              <h3 className="product-specs__specs-title">Ключевые характеристики:</h3>
              <dl className="specs-list">
                {product.specs.map((spec) => (
                  <div key={spec.label} className="specs-list__item">
                    <dt className="specs-list__label">{spec.label}</dt>
                    <dd className="specs-list__value">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="product-specs__divider" />

            <div className="product-specs__price">
              {product.price.toLocaleString('ru-RU')} ₽
            </div>

            <div className="product-specs__stock">
              <span className="product-specs__stock-dot" />
              В наличии ({product.inStock} шт)
            </div>

            <button className="btn-gold-shimmer">
              ✨ Добавить в корзину
            </button>

            <div className="product-specs__actions">
              <button className="product-specs__action-btn">♡ В избранное</button>
              <button className="product-specs__action-btn">📈 Сравнить</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}