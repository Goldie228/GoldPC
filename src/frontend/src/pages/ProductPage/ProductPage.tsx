import { useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import './ProductPage.css';

/**
 * ProductPage - Product Detail Page
 * 
 * Features:
 * - Two-column layout: Gallery (left) + Product Info (right)
 * - Image gallery with placeholder
 * - Title (H1), Category (muted text)
 * - Price (Large, Gold, JetBrains Mono font)
 * - Specs Table (Dark rows)
 * - "Add to Cart" button using Button component
 */
export function ProductPage() {
  const { id } = useParams<{ id: string }>();

  // Mock product data
  const product = {
    id: id || '1',
    name: 'AMD Ryzen 7 7800X3D',
    manufacturer: 'AMD',
    category: 'Процессоры',
    price: 1450,
    oldPrice: 1695,
    discount: 15,
    rating: 4.8,
    reviewCount: 42,
    inStock: 24,
    article: 'R7-7800X3D',
    specs: [
      { label: 'Ядра / Потоки', value: '8 / 16' },
      { label: 'Базовая частота', value: '4.2 GHz' },
      { label: 'Кэш L3', value: '96 MB' },
      { label: 'TDP', value: '120W' },
    ],
  };

  const handleAddToCart = () => {
    console.log('Added to cart:', product.id);
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
          <a href="/catalog?category=cpu">Процессоры</a>
          <span className="breadcrumb__separator">/</span>
          <span className="breadcrumb__current">{product.name}</span>
        </nav>

        <div className="product-layout">
          {/* Left Column - Gallery */}
          <div className="gallery">
            <div className="gallery__main">
              {product.discount > 0 && (
                <span className="gallery__badge">-{product.discount}%</span>
              )}
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="gallery__placeholder">
                <rect x="40" y="40" width="120" height="120" rx="8" fill="#1a1a1e" stroke="#d4a574" strokeWidth="2"/>
                <rect x="70" y="70" width="60" height="60" rx="4" fill="#121214"/>
                <text x="100" y="108" textAnchor="middle" fill="#d4a574" fontSize="20" fontWeight="bold">CPU</text>
                <g stroke="#d4a574" strokeWidth="2">
                  <path d="M70 30v10M90 30v10M110 30v10M130 30v10"/>
                  <path d="M70 160v10M90 160v10M110 160v10M130 160v10"/>
                  <path d="M30 70h10M30 90h10M30 110h10M30 130h10"/>
                  <path d="M160 70h10M160 90h10M160 110h10M160 130h10"/>
                </g>
              </svg>
            </div>
            <div className="gallery__thumbs">
              {[1, 2, 3].map((num) => (
                <button 
                  key={num} 
                  className={`gallery__thumb ${num === 1 ? 'gallery__thumb--active' : ''}`}
                >
                  <svg viewBox="0 0 40 40" fill="none">
                    <rect x="8" y="8" width="24" height="24" rx="2" stroke={num === 1 ? '#d4a574' : '#3a3a3e'} strokeWidth="1"/>
                    <rect x="14" y="14" width="12" height="12" fill={num === 1 ? '#d4a574' : '#3a3a3e'}/>
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div className="product-info">
            <div className="product-info__header">
              <span className="product-info__manufacturer">{product.manufacturer}</span>
              <h1 className="product-info__title">{product.name}</h1>
              <div className="product-info__meta">
                <span className="product-info__category">{product.category}</span>
                <span className="product-info__article">Арт: {product.article}</span>
              </div>
              <div className="product-info__stock stock--in">
                <span className="stock-dot"></span>
                В наличии ({product.inStock} шт)
              </div>
            </div>

            {/* Price Block */}
            <div className="product-info__price">
              <div className="price-row">
                <span className="price-current">{product.price.toLocaleString('ru-RU')} BYN</span>
                {product.oldPrice && (
                  <>
                    <span className="price-old">{product.oldPrice.toLocaleString('ru-RU')} BYN</span>
                    <span className="price-discount">-{product.discount}%</span>
                  </>
                )}
              </div>
              <span className="price-note">Цена действительна при заказе через сайт</span>
            </div>

            {/* Actions */}
            <div className="product-info__actions">
              <Button variant="primary" onClick={handleAddToCart}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                </svg>
                В корзину
              </Button>
            </div>

            {/* Specs Table */}
            <div className="specs">
              <h3 className="specs__title">Ключевые характеристики</h3>
              <div className="specs__grid">
                {product.specs.map((spec) => (
                  <div key={spec.label} className="spec-item">
                    <span className="spec-item__label">{spec.label}</span>
                    <span className="spec-item__value">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}