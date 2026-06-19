'use client';

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, GitCompareArrows, ShoppingCart, Bell, Plus, Minus, Star, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { getProductImageUrl } from '@/utils/image';
import { getDisplayManufacturerName } from '@/utils/manufacturerNameOverrides';
import type { ProductSummary, Product } from '@/api/types';
import { BynPrice } from '@/components/ui/BynPrice';
import { StockBadge } from '@/components/ui/StockBadge';
import { useWishlist } from '@/hooks/useWishlist';
import { useComparison } from '@/hooks/useComparison';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/useToast';


interface ProductCardProps {
  product: ProductSummary;
  onAddToCart?: (productId: string) => void;
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
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

  // Изображения загружаются в ProductSummary (без N+1 запроса)
  const images = useMemo(() => {
    if (product.images && product.images.length > 0) return product.images;
    if (product.mainImage) {
      return [{
        url: typeof product.mainImage === 'string' ? product.mainImage : product.mainImage.url,
        alt: typeof product.mainImage === 'string' ? product.name : product.mainImage.alt ?? product.name,
      }];
    }
    return [];
  }, [product.images, product.mainImage]);
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

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setCurrentImageIndex(0);
      }}
      className={`bg-surface-card rounded-xl overflow-hidden flex flex-col transition-all duration-300 ease-out text-white ${
        hovered ? 'bg-surface-elevated -translate-y-1 shadow-lg shadow-black/30 ring-1 ring-gold/20' : ''
      }`}
    >
      {/* Image Zone - WHITE BACKGROUND */}
      <div className={`relative aspect-square bg-white overflow-hidden ${isOutOfStock ? 'opacity-50' : ''}`}>
        {/* Watermark text (shortName) — large, behind */}
        {product.shortName && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <span
              className="text-surface-elevated/50 font-bold uppercase tracking-tighter leading-none whitespace-nowrap"
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
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-sm">Нет изображения</span>
          </div>
        )}

        {/* Image Navigation (arrows) */}
        {hasMultipleImages && hovered && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-surface-elevated/90 text-body-text flex items-center justify-center z-30 hover:bg-surface-elevated transition-all shadow-md backdrop-blur-sm"
              aria-label="Предыдущее изображение"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-surface-elevated/90 text-body-text flex items-center justify-center z-30 hover:bg-surface-elevated transition-all shadow-md backdrop-blur-sm"
              aria-label="Следующее изображение"
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
                className="flex-1 cursor-pointer"
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
              <Star size={10} className="mr-0.5 fill-current" /> ХИТ
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
      <div className="p-4 pb-3 flex flex-col gap-2 flex-1 text-white border-t border-hairline-dark/50">
        <span className="text-[10px] text-white/70 font-medium uppercase tracking-wider truncate">
          {getDisplayManufacturerName(product.manufacturer?.name) || product.brand || ''}
        </span>
        <h3 style={{ fontSize: '17px' }} className={`!font-semibold !leading-tight line-clamp-3 min-h-[3.5rem] ${isOutOfStock ? 'opacity-60' : ''}`}>
          <Link to={`/product/${product.slug || product.id}`} className="!text-white hover:!text-gold transition-colors">
            {product.name}
          </Link>
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} size={14} className={s <= Math.round(ratingValue) ? 'text-gold' : 'text-white/40'} fill={s <= Math.round(ratingValue) ? 'currentColor' : 'none'} />
            ))}
          </div>
          <span className="font-mono text-[12px] text-white font-medium">{ratingValue.toFixed(1)}</span>
          <span className="text-[12px] text-white/90">({reviewCount.toLocaleString('ru-BY')})</span>
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
            className="w-full h-10 bg-price-drop text-on-dark text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-[0.98]"
          >
            <ShoppingCart size={14} />
            В корзину
          </button>
        )}
      </div>
    </div>
  );
}

interface ProductGridProps {
  products: ProductSummary[];
  onAddToCart?: (productId: string) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-card flex items-center justify-center mb-5">
          <Search size={28} className="text-muted-text" />
        </div>
        <h3 className="text-lg font-semibold text-on-dark mb-2">Товары не найдены</h3>
        <p className="text-sm text-muted-text max-w-xs">Попробуйте изменить фильтры или поисковый запрос</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}