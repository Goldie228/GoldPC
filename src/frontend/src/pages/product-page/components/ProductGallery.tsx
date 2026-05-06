import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { hasValidProductImage } from '../../../utils/image';
import type { Product } from '../../../api/types';
import { useModal } from '../../../hooks/useModal';
import { ProductImageViewerModal } from './ProductImageViewerModal';

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
        className: 'w-[min(1200px,calc(100vw-32px))]!important h-[calc(100vh-32px)]!important max-w-none!important max-h-none!important [&_.modal__header]:!hidden [&_.modal__content]:!p-0 [&_.modal__content]:!overflow-hidden',
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
      root.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [images.length]);

  return (
    <div className="flex flex-col gap-5">
      <div
        className="relative aspect-square bg-[var(--color-white)] border border-[var(--border)] rounded-xl overflow-hidden flex items-center justify-center shadow-[0_10px_30px_var(--border-muted)] [&::after]:content-[''] [&::after]:absolute [&::after]:inset-0 [&::after]:bg-[radial-gradient(circle_at_center,transparent_50%,var(--border-muted)_100%)] [&::after]:pointer-events-none"
        aria-label="Фото товара"
      >
        {hasDiscount && (
          <span className="absolute top-4 left-4 bg-[var(--error)] text-[var(--color-white)] px-2.5 py-1 rounded text-xs font-bold z-6">-{discountPercent}%</span>
        )}

        {images.length > 1 && (
          <>
            <button
              className={`absolute top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-[var(--border-muted)] border border-[var(--border-muted)] text-[var(--bg-card)] cursor-pointer z-7 transition-all duration-200 opacity-0 hover:opacity-100 hover:scale-110 hover:bg-[var(--color-white)] hover:shadow-[0_4px_12px_var(--border-muted)] left-4`}
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Предыдущее фото"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className={`absolute top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-[var(--border-muted)] border border-[var(--border-muted)] text-[var(--bg-card)] cursor-pointer z-7 transition-all duration-200 opacity-0 hover:opacity-100 hover:scale-110 hover:bg-[var(--color-white)] hover:shadow-[0_4px_12px_var(--border-muted)] right-4`}
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
                className="w-[85%] h-[85%] object-contain transition-transform duration-[0.6s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              />
            ) : (
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--accent)] opacity-30">
                <rect x="40" y="40" width="120" height="120" rx="8" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="1"/>
                <text x="100" y="110" textAnchor="middle" fill="currentColor" fontSize="12">Нет фото</text>
              </svg>
            )}
          </motion.div>
        </AnimatePresence>

        {hasImage && (
          <button
            type="button"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-13 h-13 rounded-full border border-[var(--border-muted)] bg-[var(--border-muted)] text-[#0f172a] inline-flex items-center justify-center cursor-pointer opacity-0 pointer-events-none transition-[opacity,transform,box-shadow,background,border-color] duration-160 z-8 hover:bg-[var(--color-white)] hover:border-[color-mix(in_srgb,var(--accent)_55%,var(--border-muted))] hover:shadow-[0_14px_34px_var(--border-muted)),0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
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
          <div className="absolute right-3.5 bottom-3.5 z-6 font-[var(--font-mono)] text-xs text-[var(--border-muted)] px-2.5 py-1.75 rounded-full bg-[var(--border-muted)] border border-[var(--border-muted)] backdrop-blur-[6px]" aria-hidden>
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
      
      {images.length > 1 && (
        <div className="grid gap-2.5 p-2.5 rounded-xl border border-[var(--border-muted)] bg-[var(--border-muted)]">
          <div
            ref={thumbsRef}
            className={`flex gap-2.5 overflow-x-auto p-1.5 items-center overflow-y-hidden scroll-snap-x-mandatory scroll-padding-inline-2.5 relative ${thumbsAtStart ? 'before:opacity-0' : ''} ${thumbsAtEnd ? 'after:opacity-0' : ''} before:content-[''] before:absolute before:top-0 before:bottom-0 before:w-11 before:pointer-events-none before:z-2 before:opacity-100 before:transition-opacity before:duration-160 before:left-0 before:bg-[linear-gradient(90deg,var(--bg),transparent)] after:content-[''] after:absolute after:top-0 after:bottom-0 after:w-11 after:pointer-events-none after:z-2 after:opacity-100 after:transition-opacity after:duration-160 after:right-0 after:bg-[linear-gradient(270deg,var(--bg),transparent)] scrollbar-thin scrollbar-color-[var(--border)_transparent]`}
          >
            {images.map((img, idx) => (
              <button
                key={img.id}
                ref={(node) => {
                  thumbBtnRefs.current[idx] = node;
                }}
                className={`scroll-snap-align-start flex-shrink-0 w-18 h-18 rounded-lg bg-[var(--color-white)] border border-[var(--border-muted)] p-1 cursor-pointer transition-[transform,box-shadow,border-color] duration-140 hover:-translate-y-px hover:shadow-[0_10px_20px_var(--border-muted)] ${currentIndex === idx ? 'border-[var(--accent)] shadow-[0_10px_24px_var(--border-muted)),0_0_0_3px_var(--border-muted)]' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
              >
                <img src={img.url} alt={img.alt || product.name} className="w-full h-full object-contain bg-transparent" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
