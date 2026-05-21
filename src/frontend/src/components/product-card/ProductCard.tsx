import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, GitCompareArrows, ShoppingCart, Bell, Plus, Minus, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getProductImageUrl } from '../../utils/image';
import { getDisplayManufacturerName } from '../../utils/manufacturerNameOverrides';
import type { ProductSummary, Product } from '../../api/types';
import { BynPrice } from '../ui/BynPrice';
import { useWishlist } from '../../hooks/useWishlist';
import { useComparison } from '../../hooks/useComparison';
import { useCart } from '../../hooks/useCart';
import { useToast } from '../../hooks/useToast';
import { catalogApi } from '../../api/catalog';

/**
 * Stock status badge - flat design per design system.
 */
function StockBadge({ stock }: { stock: number }) {
  let config;
  if (stock === 0) {
    config = { dot: 'bg-price-rise', text: 'text-price-rise', label: 'Нет в наличии' };
  } else if (stock <= 3) {
    config = { dot: 'bg-gold', text: 'text-gold', label: 'Мало' };
  } else {
    config = { dot: 'bg-price-drop', text: 'text-price-drop', label: 'В наличии' };
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-elevated/80 backdrop-blur-sm ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

interface ProductCardProps {
  product: ProductSummary;
  onAddToCart?: (productId: string) => void;
  viewMode?: 'grid' | 'list';
  imageFetchPriority?: 'high' | 'low';
}

export function ProductCard({ product, onAddToCart, viewMode = 'grid', imageFetchPriority }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInComparison, toggleComparison } = useComparison();
  const { addToCart, isInCart, getItemQuantity, removeFromCart, updateQuantity } = useCart();
  const inCart = isInCart(product.id);
  const quantityInCart = getItemQuantity(product.id);
  const { showToast } = useToast();

  const isOutOfStock = product.stock === 0;
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.price / product.oldPrice!) * 100) : 0;
  const isHit = (product as Product).isFeatured;

  const ratingValue = typeof product.rating === 'number' ? product.rating : product.rating?.average ?? 0;
  const reviewCount = product.reviewCount ?? 0;

  // Load full product to get all images (cached by React Query)
  const hasImagesInList = !!product.images && product.images.length > 1;
  const { data: fullProduct } = useQuery({
    queryKey: ['product', product.slug],
    queryFn: () => catalogApi.getProductBySlug(product.slug!),
    enabled: !!product.slug && !hasImagesInList,
    staleTime: 5 * 60 * 1000,
  });

  const images = useMemo(() => {
    if (hasImagesInList) return product.images!;
    if (fullProduct?.images && fullProduct.images.length > 1) return fullProduct.images;
    if (product.mainImage) {
      return [{
        url: typeof product.mainImage === 'string' ? product.mainImage : product.mainImage.url,
        alt: typeof product.mainImage === 'string' ? product.name : product.mainImage.alt ?? product.name,
      }];
    }
    return [];
  }, [product.images, product.mainImage, fullProduct, hasImagesInList]);
  const hasMultipleImages = images.length > 1;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleZoneHover = (index: number) => {
    if (hovered && hasMultipleImages) {
      setCurrentImageIndex(index);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    onAddToCart?.(product.id);
    showToast('Товар добавлен в корзину', 'success');
  };

  const handleUpdateQty = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    e.stopPropagation();
    const next = quantityInCart + delta;
    if (next < 1) {
      removeFromCart(product.id);
      return;
    }
    if (next > product.stock) {
      showToast(`Доступно только ${product.stock} шт.`, 'error');
      return;
    }
    updateQuantity(product.id, next);
  };

  if (viewMode === 'list') {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setCurrentImageIndex(0);
        }}
        className={`flex gap-6 p-6 bg-surface-card rounded-xl overflow-hidden ${
          hovered ? 'bg-surface-elevated ring-1 ring-gold/20' : ''
        }`}
      >
        {/* Image - smaller for list view */}
        <div className={`relative w-[100px] h-[100px] flex-shrink-0 bg-white rounded-lg overflow-hidden ${isOutOfStock ? 'opacity-50' : ''}`}>
          {/* Watermark text for list view */}
          {product.shortName && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
              <span
              className="text-surface-elevated/50 font-bold uppercase tracking-tighter leading-none whitespace-nowrap"
                style={{ fontSize: '3.5rem', textShadow: '0 0 40px rgba(0,0,0,0.06)' }}
              >
                {product.shortName}
              </span>
            </div>
          )}

          {images.length > 0 && images[currentImageIndex]?.url ? (
            <img
              src={getProductImageUrl(images[currentImageIndex].url) ?? ''}
              alt={images[currentImageIndex].alt ?? product.name}
              className="w-full h-full object-contain p-2 relative z-10"
              loading={imageFetchPriority === 'high' ? 'eager' : 'lazy'}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-xs">No image</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <span className="text-xs text-muted-strong font-medium uppercase tracking-wider truncate">
              {getDisplayManufacturerName(product.manufacturer?.name) || product.brand || ''}
            </span>
            <h3 className="text-base font-semibold leading-snug text-on-dark hover:text-gold transition-colors">
              <Link to={`/product/${product.slug || product.id}`}>
                {product.name}
              </Link>
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={12} className={s <= Math.round(ratingValue) ? 'star-filled fill-gold' : 'star-empty'} />
                ))}
              </div>
              <span className="font-tabular text-xs text-body-text font-medium">{ratingValue.toFixed(1)}</span>
              <span className="text-xs text-muted-text">({reviewCount.toLocaleString('ru-BY')})</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
          <BynPrice
            amount={product.price}
            size="lg"
            className={`product-card__price font-tabular ${hasDiscount ? 'text-price-drop' : isOutOfStock ? 'text-muted-text' : 'text-on-dark'}`}
          />
          {hasDiscount && (
            <BynPrice
              amount={product.oldPrice!}
              size="sm"
              className="product-card__old-price font-tabular text-muted-text line-through"
            />
          )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 self-center">
          {isOutOfStock ? (
            <button className="h-9 px-5 bg-surface-elevated text-muted-text text-xs font-semibold rounded-sm flex items-center justify-center gap-1.5 cursor-not-allowed">
              <Bell size={14} />
              Уведомить
            </button>
          ) : inCart ? (
            <div className="flex items-center justify-between h-9 bg-surface-card border border-hairline rounded-sm px-1">
              <button
                onClick={(e) => handleUpdateQty(e, -1)}
                className="w-7 h-7 flex items-center justify-center text-muted-text hover:text-on-dark hover:bg-surface-elevated transition-all rounded-sm"
                aria-label="Уменьшить количество"
              >
                <Minus size={14} />
              </button>
              <span className="font-tabular text-sm font-semibold text-on-dark min-w-[24px] text-center">
                {quantityInCart}
              </span>
              <button
                onClick={(e) => handleUpdateQty(e, 1)}
                className="w-7 h-7 flex items-center justify-center text-muted-text hover:text-on-dark hover:bg-surface-elevated transition-all disabled:opacity-30 rounded-sm"
                disabled={quantityInCart >= product.stock}
                aria-label="Увеличить количество"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="h-9 px-5 bg-price-drop text-on-dark text-xs font-semibold rounded-sm flex items-center justify-center gap-1.5 hover:brightness-110 transition-all active:scale-[0.98]"
            >
              <ShoppingCart size={14} />
              В корзину
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setCurrentImageIndex(0);
      }}
      className={`bg-surface-card rounded-xl overflow-hidden flex flex-col gap-4 transition-all duration-300 ease-out ${
        hovered ? 'bg-surface-elevated -translate-y-1 shadow-lg shadow-black/30 ring-1 ring-gold/20' : ''
      }`}
    >
      {/* Image Zone - WHITE BACKGROUND */}
      <div className={`relative aspect-square bg-white overflow-hidden ${isOutOfStock ? 'opacity-50' : ''}`}>
        {/* Watermark text (shortName) — large, behind */}
        {product.shortName && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <span
              className="text-white font-bold uppercase tracking-tighter leading-none whitespace-nowrap"
              style={{ fontSize: '5.5rem', textShadow: '0 0 40px rgba(0,0,0,0.06)' }}
            >
              {product.shortName}
            </span>
          </div>
        )}

        {/* Product Image */}
        {images.length > 0 && images[currentImageIndex]?.url ? (
          <img
            src={getProductImageUrl(images[currentImageIndex].url) ?? ''}
            alt={images[currentImageIndex].alt ?? product.name}
            className="w-full h-full object-contain p-5 transition-transform duration-300 hover:scale-105 relative z-10 [backface-visibility:hidden] [will-change:transform]"
            loading={imageFetchPriority === 'high' ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}

        {/* Image Navigation (arrows) */}
        {hasMultipleImages && hovered && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-surface-elevated/90 text-body-text flex items-center justify-center z-30 hover:bg-surface-elevated transition-all shadow-md backdrop-blur-sm"
              aria-label="Previous image"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-surface-elevated/90 text-body-text flex items-center justify-center z-30 hover:bg-surface-elevated transition-all shadow-md backdrop-blur-sm"
              aria-label="Next image"
            >
              <ChevronRight size={14} />
            </button>
          </>
        )}

        {/* Hover Zones for Image Switching */}
        {hasMultipleImages && (
          <div className="absolute inset-0 flex z-20">
            {images.map((_, i) => (
              <div
                key={i}
                className="flex-1"
                onMouseEnter={() => handleZoneHover(i)}
              />
            ))}
          </div>
        )}

        {/* Image Indicators */}
        {hasMultipleImages && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1 z-20">
            {images.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === currentImageIndex ? 'bg-gold w-4' : 'bg-surface-card/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-30">
          {hasDiscount && (
            <span className="h-6 px-2.5 bg-surface-elevated/90 text-price-drop text-[11px] font-bold rounded-md flex items-center backdrop-blur-sm shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {isHit && (
            <span className="h-6 px-2.5 bg-gold text-gold-ink text-[11px] font-bold rounded-md flex items-center shadow-sm">
              <Star size={10} className="mr-0.5 fill-current" /> HIT
            </span>
          )}
        </div>

        {/* Quick Actions - on hover */}
        <div className={`absolute top-3 right-3 flex flex-col gap-1.5 transition-all duration-200 z-30 ${
          hovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const newState = !isInWishlist(product.id);
              toggleWishlist(product.id);
              showToast(newState ? 'Добавлено в избранное' : 'Удалено из избранного', newState ? 'success' : 'info');
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm backdrop-blur-sm ${
              isInWishlist(product.id)
                ? 'bg-price-rise/20 text-price-rise'
                : 'bg-surface-elevated/80 text-muted-text hover:text-price-rise hover:bg-surface-elevated'
            }`}
            title="В избранное"
          >
            <Heart size={14} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const inComp = isInComparison(product.id);
              if (inComp) {
                toggleComparison(product.id, product.category);
                showToast('Удалено из сравнения', 'info');
              } else {
                const result = toggleComparison(product.id, product.category);
                if (result.success) {
                  showToast('Добавлено в сравнение', 'success');
                } else if (result.reason === 'limit') {
                  showToast('В сравнении уже 4 товара этой категории', 'info');
                }
              }
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm backdrop-blur-sm ${
              isInComparison(product.id)
                ? 'bg-info-blue/20 text-info-blue'
                : 'bg-surface-elevated/80 text-muted-text hover:text-info-blue hover:bg-surface-elevated'
            }`}
            title="Сравнить"
          >
            <GitCompareArrows size={14} />
          </button>
        </div>

        {/* Stock Status */}
        <div className="absolute bottom-3 left-3 z-30">
          <StockBadge stock={product.stock} />
        </div>
      </div>

      {/* Information */}
      <div className="pt-3 px-4 pb-3 flex flex-col gap-2 flex-1">
        <span className="product-card__brand text-[11px] text-muted-text font-medium uppercase tracking-wider truncate">
          {getDisplayManufacturerName(product.manufacturer?.name) || product.brand || ''}
        </span>
        <h3 className={`product-card__name text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem] ${isOutOfStock ? 'opacity-60' : 'text-on-dark'}`}>
          <Link to={`/product/${product.slug || product.id}`} className="hover:text-gold transition-colors">
            {product.name}
          </Link>
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} size={12} className={s <= Math.round(ratingValue) ? 'star-filled fill-gold' : 'star-empty'} />
            ))}
          </div>
          <span className="product-card__rating font-tabular text-xs text-body-text font-medium">{ratingValue.toFixed(1)}</span>
          <span className="product-card__rating text-[11px] text-muted-text">({reviewCount.toLocaleString('ru-BY')})</span>
        </div>
      </div>

      {/* Price + Button */}
      <div className="px-4 pb-4">
        <div className="flex items-baseline gap-2 mb-3">
          <BynPrice
            amount={product.price}
            size="lg"
            className={hasDiscount ? 'text-price-drop' : isOutOfStock ? 'text-muted-text' : 'text-on-dark'}
          />
          {hasDiscount && (
            <BynPrice
              amount={product.oldPrice!}
              size="sm"
              className="text-muted-text line-through"
            />
          )}
        </div>

        {isOutOfStock ? (
          <button className="w-full h-10 bg-gold text-gold-ink text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 hover:bg-gold-active transition-colors">
            <Bell size={14} />
            Уведомить
          </button>
        ) : inCart ? (
          <div className="flex items-center justify-between w-full h-10 bg-surface-elevated border border-hairline-dark rounded-lg">
            <button
              onClick={(e) => handleUpdateQty(e, -1)}
              className="w-9 h-full flex items-center justify-center text-muted-text hover:text-on-dark hover:bg-surface-card transition-all rounded-l-lg"
              aria-label="Уменьшить количество"
            >
              <Minus size={14} />
            </button>
            <span className="font-tabular text-sm font-semibold text-on-dark min-w-[28px] text-center">
              {quantityInCart}
            </span>
            <button
              onClick={(e) => handleUpdateQty(e, 1)}
              className="w-9 h-full flex items-center justify-center text-muted-text hover:text-on-dark hover:bg-surface-elevated transition-all disabled:opacity-30 rounded-r-lg"
              disabled={quantityInCart >= product.stock}
              aria-label="Увеличить количество"
            >
              <Plus size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            className="product-card__btn w-full h-10 bg-price-drop text-on-dark text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-[0.98]"
          >
            <ShoppingCart size={14} />
            В корзину
          </button>
        )}
      </div>
    </div>
  );
}
