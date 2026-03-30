import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useToastStore } from '../../store/toastStore';
import type { ProductSummary } from '../../api/types';
import { hasValidProductImage } from '../../utils/image';
import styles from './RelatedProducts.module.css';

interface RelatedProductsProps {
  cartItems: Array<{ productId: string; name: string }>;
}

export function RelatedProducts({ cartItems }: RelatedProductsProps) {
  const [recommendations, setRecommendations] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore(state => state.addItem);
  const showToast = useToastStore(state => state.showToast);

  useEffect(() => {
    loadRecommendations();
  }, [cartItems]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // В реальности это был бы API запрос к рекомендательной системе
      // Например: GET /api/v1/catalog/products/recommendations?productIds=...
      
      // Для демо создаём моковые рекомендации
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockRecommendations: ProductSummary[] = [
        {
          id: crypto.randomUUID(),
          sku: 'KB-RGB-001',
          name: 'Игровая клавиатура RGB',
          slug: 'gaming-keyboard-rgb',
          price: 89.99,
          oldPrice: 129.99,
          category: 'keyboard',
          brand: 'Razer',
          stock: 100,
          isActive: true,
          rating: 4.5,
          reviewCount: 156,
          mainImage: {
            id: '1',
            url: '/images/products/keyboard.jpg',
            alt: 'Игровая клавиатура',
          },
          images: [],
        },
        {
          id: crypto.randomUUID(),
          sku: 'MOUSE-PRO-001',
          name: 'Игровая мышь Pro',
          slug: 'gaming-mouse-pro',
          price: 59.99,
          category: 'mouse',
          brand: 'Logitech',
          stock: 100,
          isActive: true,
          rating: 4.8,
          reviewCount: 234,
          mainImage: {
            id: '2',
            url: '/images/products/mouse.jpg',
            alt: 'Игровая мышь',
          },
          images: [],
        },
        {
          id: crypto.randomUUID(),
          sku: 'PAD-XXL-001',
          name: 'Игровой коврик XXL',
          slug: 'gaming-mousepad-xxl',
          price: 29.99,
          category: 'keyboard',
          brand: 'SteelSeries',
          stock: 100,
          isActive: true,
          rating: 4.6,
          reviewCount: 89,
          mainImage: {
            id: '3',
            url: '/images/products/mousepad.jpg',
            alt: 'Игровой коврик',
          },
          images: [],
        },
      ];

      setRecommendations(mockRecommendations);
    } catch (error) {
      console.error('Ошибка загрузки рекомендаций:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: ProductSummary) => {
    addItem(product);
    showToast(`${product.name} добавлен в корзину`, 'success');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Часто покупают вместе</h2>
        <div className={styles.loading}>Загрузка рекомендаций...</div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8M12 8v8" />
        </svg>
        Часто покупают вместе
      </h2>

      <div className={styles.products}>
        {recommendations.map((product) => (
          <div key={product.id} className={styles.productCard}>
            <Link to={`/product/${product.slug}`} className={styles.imageLink}>
              {product.mainImage && hasValidProductImage(product.mainImage.url) ? (
                <img
                  src={product.mainImage.url}
                  alt={product.mainImage.alt || product.name}
                  className={styles.image}
                  loading="lazy"
                />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              )}
            </Link>

            <div className={styles.info}>
              <Link to={`/product/${product.slug}`} className={styles.name}>
                {product.name}
              </Link>

              <div className={styles.meta}>
                {product.rating && typeof product.rating === 'number' && (
                  <div className={styles.rating}>
                    <span className={styles.star}>⭐</span>
                    <span>{product.rating.toFixed(1)}</span>
                    <span className={styles.reviews}>({product.reviewCount})</span>
                  </div>
                )}
              </div>

              <div className={styles.priceRow}>
                <div className={styles.prices}>
                  <span className={styles.price}>{product.price.toFixed(2)} BYN</span>
                  {product.oldPrice && (
                    <span className={styles.oldPrice}>{product.oldPrice.toFixed(2)} BYN</span>
                  )}
                </div>

                <button
                  className={styles.addButton}
                  onClick={() => handleAddToCart(product)}
                  aria-label={`Добавить ${product.name} в корзину`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
