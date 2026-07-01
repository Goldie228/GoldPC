import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import type { Product, ProductSpecifications } from '@/api/types';
import { CATEGORY_LABELS_RU } from '@/utils/categoryLabels';
import { specLabel, formatSpecValueForKey } from '@/utils/specifications';
import { formatCountRu } from '@/utils/pluralizeRu';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useComparison } from '@/hooks/useComparison';
import { useToast } from '@/hooks/useToast';
import { hasValidProductImage } from '@/utils/image';
import { getDisplayManufacturerName } from '@/utils/manufacturerNameOverrides';
import { useModal } from '@/hooks/useModal';
import { ProductImageViewerModal } from '@/pages/product-page/components/ProductImageViewerModal';
import { Icon } from '../ui/Icon/Icon';

const SPEC_ROWS = 12;

const REVIEW_FORMS = ['отзыв', 'отзыва', 'отзывов'] as const;

function formatPriceByn(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'BYN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function getRatingAverage(product: Product): number | null {
  const r = product.rating;
  if (typeof r === 'number' && !Number.isNaN(r)) return r;
  if (r && typeof r === 'object' && 'average' in r && typeof (r as { average?: number }).average === 'number') {
    return (r as { average: number }).average;
  }
  return null;
}

export function ProductQuickViewContent({
  product,
  onClose: _onClose,
}: {
  product: Product;
  onClose?: () => void;
}): ReactElement {
  const specs = (product.specifications as ProductSpecifications) ?? {};
  const specEntries = Object.entries(specs).slice(0, SPEC_ROWS);
  const ratingAvg = getRatingAverage(product);
  const slug = product.slug;

  const { addToCart, isInCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInComparison, toggleComparison } = useComparison();
  const { showToast } = useToast();
  const { openModal, closeModal } = useModal();

  const images = (product.images && product.images.length > 0
    ? product.images
    : product.mainImage
      ? [product.mainImage]
      : []
  ).filter((img) => img.url && hasValidProductImage(img.url));

  const hasImage = images.length > 0;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const activeImage = hasImage ? images[currentImageIndex] : product.mainImage;

  const inCart = isInCart(product.id);
  const inWishlist = isInWishlist(product.id);
  const inComparison = isInComparison(product.id);

  const handleAddToCart = () => {
    if (inCart || product.stock === 0) return;
    addToCart(product, 1);
    showToast('Товар добавлен в корзину', 'success');
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product.id);
    showToast(
      inWishlist ? 'Удалено из избранного' : 'Добавлено в избранное',
      inWishlist ? 'info' : 'success'
    );
  };

  const handleToggleComparison = () => {
    if (inComparison) {
      toggleComparison(product.id, product.category);
      showToast('Удалено из сравнения', 'info');
      return;
    }
    const result = toggleComparison(product.id, product.category);
    if (result.success) {
      showToast('Добавлено в сравнение', 'success');
    } else {
      showToast('В сравнении уже 4 товара этой категории', 'info');
    }
  };

  const openViewer = () => {
    if (!hasImage) return;

    openModal({
      title: '',
      size: 'fullWidth',
      content: (
        <ProductImageViewerModal
          images={images.map((img) => ({ id: img.id, url: img.url, alt: img.alt }))}
          startIndex={currentImageIndex}
          productName={product.name}
          onClose={closeModal}
        />
      ),
      data: {
        className: 'w-[min(1200px,calc(100vw-32px))]! max-w-none! h-[calc(100vh-32px)]! max-h-none! [&_.modal__header]:hidden! [&_.modal__content]:p-0! [&_.modal__content]:overflow-hidden! max-[760px]:w-[calc(100vw-24px)]! max-[760px]:h-[calc(100vh-24px)]!',
        showCloseButton: true,
        closeOnOverlayClick: true,
      },
    });
  };

  return (
    <div className="grid grid-cols-[1fr_1.15fr] gap-[18px] items-start max-[760px]:grid-cols-1">
      {/* Left column — Image gallery */}
      <div className="flex flex-col gap-[14px] min-w-0">
        <div
          className="group w-full aspect-square rounded-xl border border-hairline-dark bg-surface-card overflow-hidden flex items-center justify-center cursor-zoom-in relative"
          role={hasImage ? 'button' : undefined}
          aria-label={hasImage ? 'Открыть галерею товара' : undefined}
          onClick={hasImage ? openViewer : undefined}
        >
          <span className="absolute top-3 right-3 w-8 h-8 bg-surface-elevated/90 rounded-md flex items-center justify-center opacity-70 pointer-events-none transition-opacity duration-200 group-hover:opacity-100">
            <Icon name="search" size="sm" />
          </span>
          {activeImage?.url ? (
            <img
              src={activeImage.url}
              alt={activeImage.alt ?? product.name}
              className="w-[85%] h-[85%] object-contain block"
              width={400}
              height={400}
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-card">
              <Icon name="image" size="2xl" color="secondary" />
            </div>
          )}
        </div>
        {images.length > 1 && (
          <>
            <div className="relative mt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                className="w-7 h-7 rounded-full border border-hairline-dark bg-surface-elevated inline-flex items-center justify-center cursor-pointer text-muted-text transition-all duration-150 hover:border-gold/40 hover:text-gold"
                aria-label="Предыдущее фото"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                }}
              >
                <Icon name="chevron-left" size="xs" />
              </button>
              <div className="min-w-[52px] px-2 py-1 rounded-full bg-surface-card text-muted-text text-xs text-center">
                {currentImageIndex + 1} / {images.length}
              </div>
              <button
                type="button"
                className="w-7 h-7 rounded-full border border-hairline-dark bg-surface-elevated inline-flex items-center justify-center cursor-pointer text-muted-text transition-all duration-150 hover:border-gold/40 hover:text-gold"
                aria-label="Следующее фото"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                }}
              >
                <Icon name="chevron-right" size="xs" />
              </button>
            </div>
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
              {images.map((img, index) => (
                <button
                  key={img.id}
                  type="button"
                  className={`flex-none w-[54px] h-[54px] rounded-lg border border-hairline-dark overflow-hidden bg-surface-card p-0.5 inline-flex items-center justify-center cursor-pointer opacity-70 transition-all duration-150 hover:opacity-100 hover:border-gold/40 ${index === currentImageIndex ? 'opacity-100 border-gold/40 shadow-[0_0_0_1px_rgba(252,213,53,0.4)]' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                >
                  <img src={img.url} alt={img.alt ?? product.name} className="w-full h-full object-contain" width={54} height={54} loading="lazy" />
                </button>
              ))}
            </div>
          </>
        )}
        {slug ? (
          <Link
            to={`/product/${slug}`}
            className="inline-flex items-center justify-center px-[18px] py-2.5 rounded-lg text-sm font-semibold no-underline text-surface-card bg-gold border border-gold transition-colors duration-200 hover:bg-gold/90 hover:border-gold/90"
            onClick={closeModal}
          >
            На страницу товара
          </Link>
        ) : null}
      </div>

      {/* Right column — Product info */}
      <div className="flex flex-col gap-2.5 min-w-0">
        <span className="text-muted-text text-sm">{getDisplayManufacturerName(product.manufacturer?.name) ?? '—'}</span>
        <div className="text-gold text-2xl font-bold font-tabular mt-0.5 mb-1">{formatPriceByn(product.price)}</div>
        <span className="text-muted-text text-xs">Артикул: {product.sku}</span>
        <div className="text-sm mt-0.5">
          <span className={product.stock > 0 ? 'text-price-drop font-semibold' : 'text-muted-text'}>
            {product.stock > 0 ? `В наличии: ${product.stock} шт.` : 'Под заказ'}
          </span>
        </div>
        {ratingAvg != null && !Number.isNaN(ratingAvg) && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-on-dark">
            <span className="text-gold tracking-[1px]">
              {'★'.repeat(Math.round(ratingAvg))}
              {'☆'.repeat(5 - Math.round(ratingAvg))}
            </span>
            <span>{Number(ratingAvg).toFixed(1)}</span>
            {product.reviewCount != null && product.reviewCount > 0 && (
              <span className="text-muted-text text-xs">
                {formatCountRu(product.reviewCount, REVIEW_FORMS)}
              </span>
            )}
          </div>
        )}
        <div className="text-xs text-muted-text">
          {CATEGORY_LABELS_RU[product.category] ?? product.category}
        </div>
        {product.warrantyMonths != null && product.warrantyMonths > 0 && (
          <div className="text-sm text-muted-text">Гарантия: {product.warrantyMonths} мес.</div>
        )}
        {product.descriptionShort != null && product.descriptionShort.trim() !== '' && (
          <p className="mt-1 mb-0 text-muted-text leading-[1.45] text-sm">{product.descriptionShort}</p>
        )}
        {specEntries.length > 0 && (
          <div className="mt-2.5 flex flex-col gap-2 pt-2.5 border-t border-hairline-dark">
            {specEntries.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2.5 text-sm items-start">
                <span className="text-muted-text">{specLabel(k)}</span>
                <span className="text-on-dark break-words">{formatSpecValueForKey(k, v)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3.5 flex gap-2">
          <button
            type="button"
            className="flex-1 min-h-12 px-5 py-3 rounded-lg border-2 border-price-drop bg-price-drop text-on-dark inline-flex items-center justify-center gap-2 cursor-pointer text-sm font-semibold transition-all duration-200 hover:not(:disabled):bg-price-drop/90 hover:not(:disabled):border-price-drop/90 disabled:opacity-55 disabled:cursor-not-allowed"
            onClick={handleAddToCart}
            disabled={inCart || product.stock === 0}
          >
            <Icon name="cart" size="xs" />
            <span>{inCart ? 'В корзине' : 'В корзину'}</span>
          </button>
          <button
            type="button"
            className={`w-[52px] h-[52px] rounded-lg border-2 border-gold bg-surface-elevated inline-flex items-center justify-center cursor-pointer text-gold transition-colors duration-200 hover:bg-gold/15 hover:border-gold ${inWishlist ? 'bg-gold/20 border-gold text-gold' : ''}`}
            onClick={handleToggleWishlist}
            aria-label={inWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
          >
            <Icon name="heart" size="xs" color={inWishlist ? 'gold' : 'default'} />
          </button>
          <button
            type="button"
            className={`w-[52px] h-[52px] rounded-lg border-2 border-gold bg-surface-elevated inline-flex items-center justify-center cursor-pointer text-gold transition-colors duration-200 hover:bg-gold/15 hover:border-gold ${inComparison ? 'bg-gold/20 border-gold text-gold' : ''}`}
            onClick={handleToggleComparison}
            aria-label={inComparison ? 'Удалить из сравнения' : 'Добавить в сравнение'}
          >
            <Icon name="compare" size="xs" color={inComparison ? 'gold' : 'default'} />
          </button>
        </div>
      </div>
    </div>
  );
}
