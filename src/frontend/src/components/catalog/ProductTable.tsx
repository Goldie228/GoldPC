import { type ReactElement, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Bell, Star, Search } from 'lucide-react';
import type { ProductSummary } from '../../api/types';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { useComparison } from '../../hooks/useComparison';
import { useToast } from '../../hooks/useToast';
import { Icon } from '../ui/Icon/Icon';
import { telemetryTrack } from '../../utils/telemetry';
import { getProductImageUrl, hasValidProductImage } from '../../utils/image';
import { getDisplayManufacturerName } from '../../utils/manufacturerNameOverrides';

interface ProductTableProps {
  products: ProductSummary[];
  onAddToCart?: (productId: string) => void;
}

function StockText({ stock }: { stock: number }) {
  if (stock === 0) {
    return <span className="text-[11px] font-semibold text-price-rise">Нет</span>;
  }
  if (stock < 5) {
    return <span className="text-[11px] font-semibold text-gold">Мало</span>;
  }
  return <span className="text-[11px] font-semibold text-price-drop">В наличии</span>;
}

export function ProductTable({ products, onAddToCart }: ProductTableProps): ReactElement {
  const { addToCart, isInCart, getItemQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInComparison, toggleComparison } = useComparison();
  const { showToast } = useToast();
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

  const _handleToggleWishlist = (productId: string) => {
    const inWishlist = isInWishlist(productId);
    toggleWishlist(productId);
    showToast(
      inWishlist ? 'Удалено из избранного' : 'Добавлено в избранное',
      inWishlist ? 'info' : 'success'
    );
  };

  const _handleToggleComparison = (product: ProductSummary) => {
    const inComp = isInComparison(product.id);
    const result = toggleComparison(product.id, product.category);

    if (result.success) {
      showToast(
        inComp ? 'Удалено из сравнения' : 'Добавлено к сравнению',
        inComp ? 'info' : 'success'
      );
    } else if (result.reason === 'limit') {
      showToast('В сравнении уже 4 товара этой категории', 'info');
    }
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-card flex items-center justify-center mb-5">
          <Search size={28} className="text-muted-text" />
        </div>
        <h3 className="text-lg font-bold text-on-dark mb-2">Товары не найдены</h3>
        <p className="text-sm text-muted-text max-w-xs">Попробуйте изменить фильтры или поисковый запрос</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-card rounded-xl overflow-hidden border border-hairline-dark">
      {/* Header row */}
      <div className="hidden md:grid md:grid-cols-[1fr_100px_90px_90px_130px] gap-6 px-6 py-3 bg-surface-elevated text-xs font-semibold text-muted-text uppercase tracking-wider border-b border-hairline-dark">
        <span>Товар</span>
        <span className="text-right">Цена</span>
        <span className="text-center">Рейтинг</span>
        <span className="text-center">Наличие</span>
        <span className="text-center">Действие</span>
      </div>

      {/* Rows */}
      {products.map(product => {
        const inCart = isInCart(product.id);
        const _quantity = getItemQuantity(product.id);
        const isAdding = addingId === product.id;
        const isOutOfStock = product.stock === 0;
        const isDisabled = product.stock === 0 || !product.isActive;
        const _inWishlist = isInWishlist(product.id);
        const _inComparison = isInComparison(product.id);
        const discountPercent = product.oldPrice && product.oldPrice > product.price
          ? Math.round((1 - product.price / product.oldPrice) * 100)
          : 0;

        const ratingValue = typeof product.rating === 'number' ? product.rating : product.rating?.average ?? 0;

        return (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-[1fr_100px_90px_90px_130px] gap-6 px-5 py-4 border-b border-hairline-dark last:border-b-0 hover:bg-surface-elevated/50 transition-colors items-center"
          >
            {/* Product */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg flex-shrink-0 bg-white p-1 relative overflow-hidden">
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-[8px] uppercase pointer-events-none select-none">
                  {product.shortName}
                </span>
                {hasValidProductImage(product.mainImage?.url) && product.mainImage ? (
                  <img
                    src={getProductImageUrl(product.mainImage.url) ?? ''}
                    alt={product.name}
                    className="w-full h-full object-contain relative z-10"
                    loading="lazy"
                  />
                ) : (
                  <Icon name="image" size="sm" color="secondary" />
                )}
              </div>
              <div className="min-w-0">
                <Link
                  to={`/product/${product.slug || product.id}`}
                  className="text-sm font-semibold text-on-dark line-clamp-1 hover:text-gold transition-colors"
                  onClick={() => telemetryTrack('catalog_product_open', { productId: product.id, category: product.category, source: 'table' })}
                >
                  {product.name}
                </Link>
                <span className="text-[11px] text-muted-text">{getDisplayManufacturerName(product.manufacturer?.name) || product.brand || ''}</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-end md:justify-end">
              <span className={`text-sm font-tabular ${discountPercent ? 'text-price-drop' : 'text-on-dark'}`}>
                {product.price.toLocaleString('ru-RU')} <span className="text-xs">BYN</span>
              </span>
            </div>

            {/* Rating */}
            <div className="hidden md:flex items-center justify-center gap-1">
              <Star size={11} className="star-filled fill-gold" />
              <span className="font-tabular text-xs text-body-text font-medium">{ratingValue.toFixed(1)}</span>
            </div>

            {/* Stock */}
            <div className="hidden md:flex justify-center">
              <StockText stock={product.stock} />
            </div>

            {/* Action */}
            <div className="hidden md:flex justify-center">
              {isOutOfStock ? (
                <button className="h-7 px-4 bg-gold text-gold-ink text-[11px] font-semibold rounded-sm hover:bg-gold-active transition-colors flex items-center gap-1">
                  <Bell size={10} /> Уведомить
                </button>
              ) : inCart ? (
                <button
                  onClick={() => handleAddToCart(product)}
                  className="h-8 px-5 bg-price-rise text-on-dark text-[11px] font-semibold rounded-sm flex items-center gap-1 hover:brightness-110 transition-all"
                >
                  В корзине
                </button>
              ) : (
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={isDisabled || isAdding}
                  className="h-8 px-5 bg-price-drop text-on-dark text-[11px] font-semibold rounded-sm flex items-center gap-1 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={11} /> В корзину
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
