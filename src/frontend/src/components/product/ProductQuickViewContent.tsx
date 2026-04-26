import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import type { Product, ProductSpecifications } from '../../api/types';
import { CATEGORY_LABELS_RU } from '../../utils/categoryLabels';
import { specLabel, formatSpecValueForKey } from '../../utils/specifications';
import { formatCountRu } from '../../utils/pluralizeRu';
import { useCart } from '../../hooks/useCart';
import { useWishlistStore } from '../../store/wishlistStore';
import { useComparisonStore } from '../../store/comparisonStore';
import { useToastStore } from '../../store/toastStore';
import { hasValidProductImage } from '../../utils/image';
import { useModal } from '../../hooks/useModal';
import { ProductImageViewerModal } from '../../pages/ProductPage/components/ProductImageViewerModal';
import { Icon } from '../ui/Icon/Icon';
import styles from './ProductQuickViewContent.module.css';

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
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const { isInComparison, toggleComparison } = useComparisonStore();
  const showToast = useToastStore((state) => state.showToast);
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
        className: styles.viewerModal,
        showCloseButton: true,  // Enable close button
        closeOnOverlayClick: true,
      },
    });
  };

  return (
    <div className={styles.root}>
      <div className={styles.left}>
        <div
          className={styles.imageBox}
          role={hasImage ? 'button' : undefined}
          aria-label={hasImage ? 'Открыть галерею товара' : undefined}
          onClick={hasImage ? openViewer : undefined}
        >
          {activeImage?.url ? (
            <img
              src={activeImage.url}
              alt={activeImage.alt ?? product.name}
              className={styles.image}
            />
          ) : (
            <div className={styles.placeholder}>
              <Icon name="image" size="2xl" color="secondary" />
            </div>
          )}
        </div>
        {images.length > 1 && (
          <>
            <div className={styles.quickGalleryNav}>
              <button
                type="button"
                className={styles.galleryNav}
                aria-label="Предыдущее фото"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                }}
              >
                <Icon name="chevron-left" size="xs" />
              </button>
              <div className={styles.galleryCounter} aria-hidden="true">
                {currentImageIndex + 1} / {images.length}
              </div>
              <button
                type="button"
                className={styles.galleryNav}
                aria-label="Следующее фото"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                }}
              >
                <Icon name="chevron-right" size="xs" />
              </button>
            </div>
            <div className={styles.thumbs}>
              {images.map((img, index) => (
                <button
                  key={img.id}
                  type="button"
                  className={`${styles.thumb} ${index === currentImageIndex ? styles.thumbActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                >
                  <img src={img.url} alt={img.alt ?? product.name} />
                </button>
              ))}
            </div>
          </>
        )}
        {slug ? (
          <Link to={`/product/${slug}`} className={styles.fullPageBtn} onClick={closeModal}>
            На страницу товара
          </Link>
        ) : null}
      </div>
      <div className={styles.right}>
        <span className={styles.manufacturer}>{product.manufacturer?.name ?? '—'}</span>
        <div className={styles.price}>{formatPriceByn(product.price)}</div>
        <span className={styles.metaLine}>Артикул: {product.sku}</span>
        <div className={styles.stockRow}>
          <span className={product.stock > 0 ? styles.stockIn : styles.stockOut}>
            {product.stock > 0 ? `В наличии: ${product.stock} шт.` : 'Под заказ'}
          </span>
        </div>
        {ratingAvg != null && !Number.isNaN(ratingAvg) && (
          <div className={styles.ratingRow}>
            <span className={styles.stars}>
              {'★'.repeat(Math.round(ratingAvg))}
              {'☆'.repeat(5 - Math.round(ratingAvg))}
            </span>
            <span>{Number(ratingAvg).toFixed(1)}</span>
            {product.reviewCount != null && product.reviewCount > 0 && (
              <span className={styles.reviewCount}>
                {formatCountRu(product.reviewCount, REVIEW_FORMS)}
              </span>
            )}
          </div>
        )}
        <div className={styles.categoryRow}>
          {CATEGORY_LABELS_RU[product.category] ?? product.category}
        </div>
        {product.warrantyMonths != null && product.warrantyMonths > 0 && (
          <div className={styles.warranty}>Гарантия: {product.warrantyMonths} мес.</div>
        )}
        {product.descriptionShort != null && product.descriptionShort.trim() !== '' && (
          <p className={styles.description}>{product.descriptionShort}</p>
        )}
        {specEntries.length > 0 && (
          <div className={styles.specGrid}>
            {specEntries.map(([k, v]) => (
              <div key={k} className={styles.specRow}>
                <span className={styles.specKey}>{specLabel(k)}</span>
                <span className={styles.specVal}>{formatSpecValueForKey(k, v)}</span>
              </div>
            ))}
          </div>
        )}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryAction}
            onClick={handleAddToCart}
            disabled={inCart || product.stock === 0}
          >
            <Icon name="cart" size="xs" />
            <span>{inCart ? 'В корзине' : 'В корзину'}</span>
          </button>
          <button
            type="button"
            className={`${styles.iconAction} ${inWishlist ? styles.iconActionActive : ''}`}
            onClick={handleToggleWishlist}
            aria-label={inWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
          >
            <Icon name="heart" size="xs" color={inWishlist ? 'gold' : 'default'} />
          </button>
          <button
            type="button"
            className={`${styles.iconAction} ${inComparison ? styles.iconActionActive : ''}`}
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
