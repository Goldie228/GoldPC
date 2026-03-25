import { type ReactElement, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, GitCompare, ShoppingCart, Check, Loader2 } from 'lucide-react';
import type { ProductSummary } from '../../../api/types';
import { useCart } from '../../../hooks/useCart';
import { useWishlistStore } from '../../../store/wishlistStore';
import { useComparisonStore } from '../../../store/comparisonStore';
import { useToastStore } from '../../../store/toastStore';
import { Icon } from '../../ui/Icon/Icon';
import styles from './ProductTable.module.css';

interface ProductTableProps {
  products: ProductSummary[];
  onAddToCart?: (productId: string) => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'BYN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function getStockStatus(stock: number) {
  if (stock === 0) {
    return { text: 'Нет', className: styles.outOfStock };
  }
  if (stock < 5) {
    return { text: 'Мало', className: styles.lowStock };
  }
  return { text: 'Есть', className: styles.inStock };
}

export function ProductTable({ products, onAddToCart }: ProductTableProps): ReactElement {
  const { addToCart, isInCart, getItemQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const { isInComparison, toggleComparison } = useComparisonStore();
  const showToast = useToastStore((state) => state.showToast);
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleAddToCart = (product: ProductSummary) => {
    if (product.stock === 0 || !product.isActive) return;

    setAddingId(product.id);
    addToCart(product, 1);
    showToast('Товар добавлен в корзину', 'success');

    if (onAddToCart !== undefined) {
      onAddToCart(product.id);
    }

    setTimeout(() => setAddingId(null), 500);
  };

  const handleToggleWishlist = (productId: string) => {
    const inWishlist = isInWishlist(productId);
    toggleWishlist(productId);
    showToast(
      inWishlist ? 'Удалено из избранного' : 'Добавлено в избранное',
      inWishlist ? 'info' : 'success'
    );
  };

  const handleToggleComparison = (product: ProductSummary) => {
    const inComp = isInComparison(product.id);
    const result = toggleComparison(product.id, product.category);

    if (result.success) {
      showToast(
        inComp ? 'Удалено из сравнения' : 'Добавлено к сравнению',
        inComp ? 'info' : 'success'
      );
    } else if (result.reason === 'limit') {
      showToast('Можно сравнивать не более 4 товаров', 'error');
    } else if (result.reason === 'category') {
      showToast('Можно сравнивать товары только одной категории', 'error');
    }
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.colImage}>Фото</th>
            <th className={styles.colName}>Наименование</th>
            <th className={styles.colManufacturer}>Бренд</th>
            <th className={styles.colStock}>Наличие</th>
            <th className={styles.colPrice}>Цена</th>
            <th className={styles.colActions}></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const stock = getStockStatus(product.stock);
            const inCart = isInCart(product.id);
            const quantity = getItemQuantity(product.id);
            const isAdding = addingId === product.id;
            const isDisabled = product.stock === 0 || !product.isActive;
            const inWishlist = isInWishlist(product.id);
            const inComparison = isInComparison(product.id);

            return (
              <motion.tr 
                key={product.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <td className={styles.colImage}>
                  <div className={styles.imageWrapper}>
                    {product.mainImage?.url ? (
                      <img src={product.mainImage.url} alt={product.name} />
                    ) : (
                      <Icon name="image" size="sm" color="secondary" />
                    )}
                  </div>
                </td>
                <td className={styles.colName}>
                  <Link to={`/product/${product.id}`} className={styles.productLink}>
                    {product.name}
                  </Link>
                </td>
                <td className={styles.colManufacturer}>
                  {product.manufacturer?.name || '-'}
                </td>
                <td className={styles.colStock}>
                  <span className={`${styles.stockBadge} ${stock.className}`}>
                    {stock.text}
                  </span>
                </td>
                <td className={styles.colPrice}>
                  <div className={styles.priceWrapper}>
                    <span className={styles.price}>{formatPrice(product.price)}</span>
                    {product.oldPrice && product.oldPrice > product.price && (
                      <span className={styles.oldPrice}>{formatPrice(product.oldPrice)}</span>
                    )}
                  </div>
                </td>
                <td className={styles.colActions}>
                  <div className={styles.actionButtons}>
                    <button
                      className={`${styles.actionBtn} ${inWishlist ? styles.activeWishlist : ''}`}
                      onClick={() => handleToggleWishlist(product.id)}
                      title={inWishlist ? 'Удалить из избранного' : 'В избранное'}
                      type="button"
                    >
                      <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      className={`${styles.actionBtn} ${inComparison ? styles.activeComparison : ''}`}
                      onClick={() => handleToggleComparison(product)}
                      title={inComparison ? 'Удалить из сравнения' : 'Сравнить'}
                      type="button"
                    >
                      <GitCompare size={16} />
                    </button>
                    <button
                      className={`${styles.addToCartBtn} ${inCart ? styles.inCart : ''}`}
                      onClick={() => handleAddToCart(product)}
                      disabled={isDisabled || isAdding}
                      title={inCart ? `В корзине: ${quantity} шт` : 'В корзину'}
                      type="button"
                    >
                      {isAdding ? (
                        <Loader2 size={16} className={styles.spinner} />
                      ) : inCart ? (
                        <Check size={16} />
                      ) : (
                        <ShoppingCart size={16} />
                      )}
                    </button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
