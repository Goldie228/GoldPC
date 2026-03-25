import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { hasValidProductImage } from '../../../utils/image';
import type { Product } from '../../../api/types';
import { useModal } from '../../../hooks/useModal';
import { ProductImageViewerModal } from './ProductImageViewerModal';
import viewerStyles from './ProductImageViewerModal.module.css';
import styles from '../ProductPage.module.css';

export interface ProductGalleryProps {
  product: Product;
}

export function ProductGallery({ product }: ProductGalleryProps): ReactElement {
  const images = useMemo(() => {
    if (!product.images || product.images.length === 0) {
      return product.mainImage ? [product.mainImage] : [];
    }
    return product.images;
  }, [product]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const activeImage = images[currentIndex]?.url || '';
  const hasImage = hasValidProductImage(activeImage);
  const { openModal, closeModal } = useModal();
  const thumbsRef = useRef<HTMLDivElement | null>(null);
  const thumbBtnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [thumbsAtStart, setThumbsAtStart] = useState(true);
  const [thumbsAtEnd, setThumbsAtEnd] = useState(true);
  
  const hasDiscount = product.oldPrice !== undefined && product.oldPrice > product.price;
  const discountPercent = hasDiscount && product.oldPrice !== undefined
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  const openViewer = () => {
    if (!hasImage) return;
    openModal({
      title: '',
      size: 'fullWidth',
      content: (
        <ProductImageViewerModal
          images={images.map((img) => ({ id: img.id, url: img.url, alt: img.alt }))}
          startIndex={currentIndex}
          productName={product.name}
          onClose={closeModal}
        />
      ),
      data: {
        className: viewerStyles.viewerModal,
        showCloseButton: false,
        closeOnOverlayClick: true,
      },
    });
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (images.length <= 1) return;
    const el = thumbBtnRefs.current[currentIndex];
    if (!el) return;
    el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [currentIndex, images.length]);

  useEffect(() => {
    const root = thumbsRef.current;
    if (!root) return;

    const update = () => {
      const max = Math.max(0, root.scrollWidth - root.clientWidth);
      const left = root.scrollLeft;
      setThumbsAtStart(left <= 1);
      setThumbsAtEnd(left >= max - 1);
    };

    update();
    root.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      root.removeEventListener('scroll', update as any);
      window.removeEventListener('resize', update);
    };
  }, [images.length]);

  return (
    <div className={styles.gallery}>
      <div
        className={styles.mainImageWrapper}
        aria-label="Фото товара"
      >
        {hasDiscount && (
          <span className={styles.badge}>-{discountPercent}%</span>
        )}

        {images.length > 1 && (
          <>
            <button
              className={`${styles.galleryNav} ${styles.prevBtn}`}
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Предыдущее фото"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className={`${styles.galleryNav} ${styles.nextBtn}`}
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Следующее фото"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {hasImage ? (
              <img
                src={activeImage}
                alt={product.name}
                className={styles.mainImage}
              />
            ) : (
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.placeholder}>
                <rect x="40" y="40" width="120" height="120" rx="8" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="1"/>
                <text x="100" y="110" textAnchor="middle" fill="currentColor" fontSize="12">Нет фото</text>
              </svg>
            )}
          </motion.div>
        </AnimatePresence>

        {hasImage && (
          <button
            type="button"
            className={styles.magnifierBtn}
            aria-label="Увеличить фото"
            onClick={(e) => {
              e.stopPropagation();
              openViewer();
            }}
          >
            <Search size={20} />
          </button>
        )}

        {images.length > 1 && (
          <div className={styles.galleryCounter} aria-hidden="true">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
      
      {images.length > 1 && (
        <div className={styles.thumbsBlock}>
          <div
            ref={thumbsRef}
            className={`${styles.thumbs} ${styles.thumbsSnap} ${thumbsAtStart ? styles.thumbsAtStart : ''} ${thumbsAtEnd ? styles.thumbsAtEnd : ''}`}
          >
            {images.map((img, idx) => (
              <button
                key={img.id}
                ref={(node) => {
                  thumbBtnRefs.current[idx] = node;
                }}
                className={`${styles.thumb} ${currentIndex === idx ? styles.thumbActive : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
              >
                <img src={img.url} alt={img.alt || product.name} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
