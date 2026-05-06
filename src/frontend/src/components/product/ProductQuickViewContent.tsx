import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import type { Product, ProductSpecifications } from '../../api/types';
import { CATEGORY_LABELS_RU } from '../../utils/categoryLabels';
import { specLabel, formatSpecValueForKey } from '../../utils/specifications';
import { formatCountRu } from '../../utils/pluralizeRu';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { useComparison } from '../../hooks/useComparison';
import { useToast } from '../../hooks/useToast';
import { hasValidProductImage } from '../../utils/image';
import { useModal } from '../../hooks/useModal';
import { ProductImageViewerModal } from '../../pages/product-page/components/ProductImageViewerModal';
import { Icon } from '../ui/Icon/Icon';

const SPEC_ROWS = 12;

const REVIEW_FORMS = ['отзыв', 'отзыва', 'отзывов'] as const;

function formatPriceByn(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'BYN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
      <div className="flex flex-col gap-[14px] min-w-0">
        <div
          className="group w-full aspect-square rounded-xl border border-[color-mix(in_srgb,var(--border-muted)_6%,transparent)] bg-white overflow-hidden flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.1)] cursor-zoom-in relative"
          role={hasImage ? 'button' : undefined}
          aria-label={hasImage ? 'Открыть галерею товара' : undefined}
          onClick={hasImage ? openViewer : undefined}
        >
          <span className="absolute top-3 right-3 w-8 h-8 bg-[color-mix(in_srgb,var(--bg-elevated)_90%,transparent)] rounded-md bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23F59E0B%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Ccircle cx=%2711%27 cy=%2711%27 r=%278%27/%3E%3Cline x1=%2721%27 y1=%2721%27 x2=%2716.65%27 y2=%2716.65%27/%3E%3C/svg%3E')] bg-no-repeat bg-center bg-[length:18px] opacity-70 pointer-events-none transition-opacity duration-200 group-hover:opacity-100" />
          {activeImage?.url ? (
            <img
              src={activeImage.url}
              alt={activeImage.alt ?? product.name}
              className="w-[85%] h-[85%] object-contain block"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[color-mix(in_srgb,var(--shadow-lg)_4%,transparent)]">
              <Icon name="image" size="2xl" color="secondary" />
            </div>
          )}
        </div>
        {images.length > 1 && (
          <>
            <div className="relative mt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                className="w-7 h-7 rounded-full border border-[color-mix(in_srgb,var(--color-black-soft)_85%,transparent)] bg-[color-mix(in_srgb,var(--color-black-soft)_82%,transparent)] inline-flex items-center justify-center cursor-pointer text-[color-mix(in_srgb,var(--fg-muted)_88%,transparent)] transition-all duration-150 hover:bg-[color-mix(in_srgb,var(--bg-elevated)_95%,transparent)] hover:border-[color-mix(in_srgb,var(--color-gold-500)_40%,transparent)] hover:text-[var(--color-gold-400)]"
                aria-label="Предыдущее фото"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                }}
              >
                <Icon name="chevron-left" size="xs" />
              </button>
              <div className="min-w-[52px] px-2 py-1 rounded-full bg-[color-mix(in_srgb,var(--bg)_9%,transparent)] text-[var(--fg-secondary)] text-xs text-center">
                {currentImageIndex + 1} / {images.length}
              </div>
              <button
                type="button"
                className="w-7 h-7 rounded-full border border-[color-mix(in_srgb,var(--color-black-soft)_85%,transparent)] bg-[color-mix(in_srgb,var(--color-black-soft)_82%,transparent)] inline-flex items-center justify-center cursor-pointer text-[color-mix(in_srgb,var(--fg-muted)_88%,transparent)] transition-all duration-150 hover:bg-[color-mix(in_srgb,var(--bg-elevated)_95%,transparent)] hover:border-[color-mix(in_srgb,var(--color-gold-500)_40%,transparent)] hover:text-[var(--color-gold-400)]"
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
                  className={`flex-none w-[54px] h-[54px] rounded-lg border border-[color-mix(in_srgb,var(--bg-elevated)_9%,transparent)] overflow-hidden bg-white p-0.5 inline-flex items-center justify-center cursor-pointer opacity-70 transition-all duration-150 hover:opacity-100 hover:border-[color-mix(in_srgb,var(--color-gold-500)_40%,transparent)] ${index === currentImageIndex ? 'opacity-100 border-[color-mix(in_srgb,var(--color-gold-500)_40%,transparent)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-gold-500)_40%,transparent)]' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                >
                  <img src={img.url} alt={img.alt ?? product.name} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          </>
        )}
        {slug ? (
          <Link to={`/product/${slug}`} className="inline-flex items-center justify-center px-[18px] py-2.5 rounded-lg text-sm font-semibold no-underline text-[var(--bg-primary)] bg-[var(--color-gold-500)] border-2 border-[var(--color-gold-500)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-gold-500)_40%,transparent)] tracking-[0.02em] transition-colors duration-200 hover:bg-[var(--color-gold-400)] hover:border-[var(--color-gold-400)] hover:text-[var(--bg-primary)]" onClick={closeModal}>
            На страницу товара
          </Link>
        ) : null}
      </div>
      <div className="flex flex-col gap-2.5 min-w-0">
        <span className="text-[var(--fg-secondary)] text-[0.85rem]">{product.manufacturer?.name ?? '—'}</span>
        <div className="text-[var(--color-gold-400)] text-[1.35rem] font-bold mt-0.5 mb-1">{formatPriceByn(product.price)}</div>
        <span className="text-[var(--fg-secondary)] text-[0.82rem]">Артикул: {product.sku}</span>
        <div className="text-[0.86rem] mt-0.5">
          <span className={product.stock > 0 ? 'text-[var(--color-gold-400)] font-semibold' : 'text-[var(--fg-secondary)]'}>
            {product.stock > 0 ? `В наличии: ${product.stock} шт.` : 'Под заказ'}
          </span>
        </div>
        {ratingAvg != null && !Number.isNaN(ratingAvg) && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--fg-primary)]">
            <span className="text-[var(--color-gold-400)] tracking-[1px]">
              {'★'.repeat(Math.round(ratingAvg))}
              {'☆'.repeat(5 - Math.round(ratingAvg))}
            </span>
            <span>{Number(ratingAvg).toFixed(1)}</span>
            {product.reviewCount != null && product.reviewCount > 0 && (
              <span className="text-[var(--fg-secondary)] text-[0.82rem]">
                {formatCountRu(product.reviewCount, REVIEW_FORMS)}
              </span>
            )}
          </div>
        )}
        <div className="text-[0.82rem] text-[var(--fg-secondary)]">
          {CATEGORY_LABELS_RU[product.category] ?? product.category}
        </div>
        {product.warrantyMonths != null && product.warrantyMonths > 0 && (
          <div className="text-[0.84rem] text-[var(--fg-secondary)]">Гарантия: {product.warrantyMonths} мес.</div>
        )}
        {product.descriptionShort != null && product.descriptionShort.trim() !== '' && (
          <p className="mt-1 mb-0 text-[var(--fg-secondary)] leading-[1.45] text-[0.88rem]">{product.descriptionShort}</p>
        )}
        {specEntries.length > 0 && (
          <div className="mt-2.5 flex flex-col gap-2 pt-2.5 border-t border-[color-mix(in_srgb,var(--border-muted)_6%,transparent)]">
            {specEntries.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2.5 text-[0.84rem] items-start">
                <span className="text-[var(--fg-secondary)]">{specLabel(k)}</span>
                <span className="text-[var(--fg-primary)] break-words">{formatSpecValueForKey(k, v)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3.5 flex gap-2">
          <button
            type="button"
            className="flex-1 min-h-12 px-5 py-3 rounded-lg border-2 border-[var(--color-gold-500)] bg-[var(--color-gold-500)] text-black inline-flex items-center justify-center gap-2 cursor-pointer text-[0.95rem] font-semibold transition-all duration-200 shadow-[0_4px_12px_color-mix(in_srgb,var(--color-gold-500)_40%,transparent)] hover:not(:disabled):bg-[var(--color-gold-400)] hover:not(:disabled):border-[var(--color-gold-400)] hover:not(:disabled):text-black disabled:opacity-55 disabled:cursor-not-allowed"
            onClick={handleAddToCart}
            disabled={inCart || product.stock === 0}
          >
            <Icon name="cart" size="xs" />
            <span>{inCart ? 'В корзине' : 'В корзину'}</span>
          </button>
          <button
            type="button"
            className={`w-13 h-13 rounded-lg border-2 border-[var(--color-gold-500)] bg-[var(--bg-elevated)] inline-flex items-center justify-center cursor-pointer text-[var(--color-gold-500)] transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--color-gold-500)_15%,transparent)] hover:border-[var(--color-gold-400)] hover:text-[var(--color-gold-400)] ${inWishlist ? 'border-[color-mix(in_srgb,var(--color-gold-500)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-gold-500)_40%,transparent)] text-[var(--color-gold-400)]' : ''}`}
            onClick={handleToggleWishlist}
            aria-label={inWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
          >
            <Icon name="heart" size="xs" color={inWishlist ? 'gold' : 'default'} />
          </button>
          <button
            type="button"
            className={`w-13 h-13 rounded-lg border-2 border-[var(--color-gold-500)] bg-[var(--bg-elevated)] inline-flex items-center justify-center cursor-pointer text-[var(--color-gold-500)] transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--color-gold-500)_15%,transparent)] hover:border-[var(--color-gold-400)] hover:text-[var(--color-gold-400)] ${inComparison ? 'border-[color-mix(in_srgb,var(--color-gold-500)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-gold-500)_40%,transparent)] text-[var(--color-gold-400)]' : ''}`}
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
