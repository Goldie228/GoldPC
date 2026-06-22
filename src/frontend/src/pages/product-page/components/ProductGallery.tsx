import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { hasValidProductImage } from '@/utils/image';
import type { Product } from '@/api/types';
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
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const activeImage = images[currentIndex]?.url || '';
  const hasImage = hasValidProductImage(activeImage);
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
    setIsViewerOpen(true);
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
    <><div className="flex flex-col gap-4">
      {/* Main Image */}
      <div
        className="relative aspect-square bg-[#FFFFFF] border border-border rounded-xl overflow-hidden flex items-center justify-center group"
        aria-label="Фото товара"
      >
        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-4 left-4 z-10 bg-destructive text-on-dark px-2.5 py-1 rounded text-xs font-bold">
            -{discountPercent}%
          </span>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              className="absolute top-1/2 -translate-y-1/2 left-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-card/80 border border-border text-foreground cursor-pointer transition-all duration-200 opacity-0 hover:opacity-100 hover:bg-card hover:border-primary/30"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Предыдущее фото"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              className="absolute top-1/2 -translate-y-1/2 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-card/80 border border-border text-foreground cursor-pointer transition-all duration-200 opacity-0 hover:opacity-100 hover:bg-card hover:border-primary/30"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Следующее фото"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Image — click opens viewer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full flex items-center justify-center cursor-pointer"
            onClick={() => openViewer()}
          >
            {hasImage ? (
              <img
                src={activeImage}
                alt={product.name}
                className="w-[85%] h-[85%] object-contain transition-transform duration-500 ease-out pointer-events-none"
                width={400}
                height={400}
                loading="eager"
                fetchPriority="high"
              />
            ) : (
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground opacity-30" role="img" aria-label={`Фото ${product.name} отсутствует`}>
                <rect x="40" y="40" width="120" height="120" rx="8" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="1"/>
                <text x="100" y="110" textAnchor="middle" fill="currentColor" fontSize="12">Нет фото</text>
              </svg>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Zoom Button — появляется при наведении на контейнер */}
        {hasImage && (
          <button
            type="button"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-border bg-card/90 text-foreground inline-flex items-center justify-center cursor-pointer opacity-0 pointer-events-none transition-all duration-200 z-20 hover:bg-card hover:border-primary/40 hover:text-primary group-hover:opacity-100 group-hover:pointer-events-auto"
            aria-label="Увеличить фото"
            onClick={(e) => {
              e.stopPropagation();
              openViewer();
            }}
          >
            <Search size={20} />
          </button>
        )}

        {/* Counter */}
        {images.length > 1 && (
          <div className="absolute right-3 bottom-3 z-10 font-mono text-xs text-muted-foreground px-2.5 py-1.5 rounded-full bg-card/90 border border-border" aria-hidden>
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center gap-2">
            <button
              className="flex-shrink-0 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(Math.max(0, currentIndex - 1)); }}
              disabled={currentIndex === 0}
              aria-label="Предыдущее фото"
            >
              <ChevronLeft size={14} />
            </button>
            <div
              ref={thumbsRef}
              className="flex gap-2.5 overflow-x-auto items-center overflow-y-hidden scroll-smooth scrollbar-thin scrollbar-color-[var(--border)_transparent] flex-1"
            >
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  ref={(node) => { thumbBtnRefs.current[idx] = node; }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg bg-[#FFFFFF] border-2 p-1 cursor-pointer transition-all duration-150 hover:border-primary/50 ${
                      currentIndex === idx
                        ? 'border-primary shadow-[0_0_0_2px_rgba(252,213,53,0.15)]'
                        : 'border-border'
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  aria-label={`Фото ${idx + 1} из ${images.length}`}
                  aria-current={currentIndex === idx ? 'true' : undefined}
                >
                  <img src={img.url} alt={img.alt || product.name} className="w-full h-full object-contain" width={64} height={64} loading="lazy" />
                </button>
              ))}
            </div>
            <button
              className="flex-shrink-0 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(Math.min(images.length - 1, currentIndex + 1)); }}
              disabled={currentIndex === images.length - 1}
              aria-label="Следующее фото"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>

      {isViewerOpen && (
        <ProductImageViewerModal
          images={images.map((img) => ({ id: img.id, url: img.url, alt: img.alt }))}
          startIndex={currentIndex}
          productName={product.name}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </>
  );
}
