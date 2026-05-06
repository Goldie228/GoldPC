import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, GitCompareArrows, ShoppingCart, Bell, Check, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProductImageUrl } from '../../utils/image';
import type { ProductSummary } from '../../api/types';
import { BynPrice } from '../ui/BynPrice';

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
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-card ${config.text}`}>
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
  const [inCart, setInCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [compared, setCompared] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isOutOfStock = product.stock === 0;
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.price / product.oldPrice!) * 100) : 0;
  const isHit = (product as any).isFeatured;

  const ratingValue = typeof product.rating === 'number' ? product.rating : product.rating?.average ?? 0;
  const reviewCount = product.reviewCount ?? 0;

  const images = product.images && product.images.length > 0
    ? product.images
    : (product.mainImage
        ? [{ url: typeof product.mainImage === 'string' ? product.mainImage : product.mainImage.url, alt: typeof product.mainImage === 'string' ? product.name : product.mainImage.alt ?? product.name }]
        : []);
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
    setInCart(!inCart);
    onAddToCart?.(product.id);
  };

  if (viewMode === 'list') {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setCurrentImageIndex(0);
        }}
        className={`flex gap-4 p-4 bg-surface-card rounded-xl overflow-hidden ${
          hovered ? 'bg-surface-elevated ring-1 ring-hairline-dark' : ''
        }`}
      >
        {/* Image - smaller for list view */}
        <div className={`relative w-[100px] h-[100px] flex-shrink-0 bg-white rounded-lg overflow-hidden ${isOutOfStock ? 'opacity-50' : ''}`}>
          {/* Watermark text for list view */}
          {product.shortName && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
              <span
                className="text-white font-bold uppercase tracking-tighter leading-none whitespace-nowrap"
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
            <span className="text-[11px] text-muted-text font-medium uppercase tracking-wider truncate">
              {product.manufacturer?.name || product.brand || ''}
            </span>
            <h3 className="text-sm font-semibold leading-snug text-on-dark hover:text-gold transition-colors">
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
              <span className="text-[11px] text-muted-text">({reviewCount.toLocaleString('ru-BY')})</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
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
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 w-full">
          {isOutOfStock ? (
            <button className="w-full h-10 px-4 bg-surface-elevated text-muted-text text-xs font-semibold rounded-sm flex items-center justify-center gap-1.5 cursor-not-allowed">
              <Bell size={14} />
              Уведомить
            </button>
          ) : inCart ? (
            <button
              onClick={handleAddToCart}
              className="w-full h-10 px-4 bg-price-rise text-on-dark text-sm font-semibold rounded-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all"
            >
              <Check size={14} />
              В корзине
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-full h-10 px-4 bg-price-drop text-on-dark text-sm font-semibold rounded-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-[0.98]"
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
      className={`bg-surface-card rounded-xl overflow-hidden flex flex-col gap-4 ${
        hovered ? 'bg-surface-elevated ring-1 ring-hairline-dark' : ''
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
            className="w-full h-full object-contain p-5 transition-transform duration-300 hover:scale-105 relative z-10"
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
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-surface-card/90 text-body-text flex items-center justify-center z-30 hover:bg-surface-elevated transition-all shadow-sm"
              aria-label="Previous image"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-surface-card/90 text-body-text flex items-center justify-center z-30 hover:bg-surface-elevated transition-all shadow-sm"
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
            <span className="h-6 px-2.5 bg-surface-card/90 text-price-drop text-[11px] font-bold rounded-md flex items-center backdrop-blur-sm">
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
              setWishlisted(!wishlisted);
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm ${
              wishlisted
                ? 'bg-price-rise/20 text-price-rise'
                : 'bg-surface-card text-muted-text hover:text-price-rise'
            }`}
            title="Add to wishlist"
          >
            <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCompared(!compared);
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm ${
              compared
                ? 'bg-info-blue/20 text-info-blue'
                : 'bg-surface-card text-muted-text hover:text-info-blue'
            }`}
            title="Compare"
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
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="text-[11px] text-muted-text font-medium uppercase tracking-wider truncate">
          {product.manufacturer?.name || product.brand || ''}
        </span>
        <h3 className={`text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem] ${isOutOfStock ? 'opacity-60' : 'text-on-dark'}`}>
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
          <span className="font-tabular text-xs text-body-text font-medium">{ratingValue.toFixed(1)}</span>
          <span className="text-[11px] text-muted-text">({reviewCount.toLocaleString('ru-BY')})</span>
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
          <button className="w-full h-7 bg-gold text-gold-ink text-xs font-semibold rounded-sm flex items-center justify-center gap-1.5 hover:bg-gold-active transition-colors">
            <Bell size={12} />
            Уведомить
          </button>
        ) : inCart ? (
          <button
            onClick={handleAddToCart}
            className="w-full h-10 bg-price-rise text-on-dark text-sm font-semibold rounded-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all"
          >
            <Check size={14} />
            В корзине
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            className="w-full h-10 bg-price-drop text-on-dark text-sm font-semibold rounded-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-[0.98]"
          >
            <ShoppingCart size={14} />
            В корзину
          </button>
        )}
      </div>
    </div>
  );
}
