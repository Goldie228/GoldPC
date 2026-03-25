import { type ReactElement, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ProductSummary } from '../../../api/types';
import { useCart } from '../../../hooks/useCart';
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

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.colImage}>Фото</th>
            <th className={styles.colName}>Наименование</th>
            <th className={styles.colSku}>Артикул</th>
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
                <td className={styles.colSku}>
                  <span className={styles.skuText}>{product.sku}</span>
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
                  <button
                    className={`${styles.addToCartBtn} ${inCart ? styles.inCart : ''}`}
                    onClick={() => handleAddToCart(product)}
                    disabled={isDisabled || isAdding}
                    title={inCart ? `В корзине: ${quantity} шт` : 'Добавить в корзину'}
                  >
                    {isAdding ? (
                      <Icon name="loader" size="sm" animated />
                    ) : inCart ? (
                      <Icon name="check" size="sm" />
                    ) : (
                      <Icon name="cart" size="sm" />
                    )}
                  </button>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
