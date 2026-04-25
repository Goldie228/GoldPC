import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '../../../components/ProductCard/ProductCard';
import { useProducts } from '../../../hooks/useProducts';
import type { Product } from '../../../api/types';
import styles from '../ProductPage.module.css';

export interface RelatedProductsProps {
  product: Product;
  productId: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.33, 1, 0.68, 1] as const
    }
  }
};

export function RelatedProducts({ product, productId }: RelatedProductsProps): ReactElement | null {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const wheelAccumRef = useRef(0);
  const wheelRafRef = useRef<number | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [canScrollX, setCanScrollX] = useState(false);

  const { data: relatedData } = useProducts(
    { category: product.category, pageSize: 5 },
    { enabled: !!product }
  );

  const relatedProducts = useMemo(() => {
    return relatedData?.data.filter(p => p.id !== productId).slice(0, 4) || [];
  }, [relatedData, productId]);

  useEffect(() => {
    if (relatedProducts.length === 0) return;
    const el = trackRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const canScrollX = el.scrollWidth > el.clientWidth + 1;
      if (!canScrollX) return;

      const max = Math.max(0, el.scrollWidth - el.clientWidth);
      const atStartNow = el.scrollLeft <= 1;
      const atEndNow = el.scrollLeft >= max - 1;

      // Convert vertical wheel to horizontal paging to avoid scroll-snap "no-op" feeling.
      // Trackpads with strong horizontal delta scroll pixel-wise; mouse wheels page by step.
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      const dominantX = absX > absY;

      if (dominantX && absX > 2) {
        // If user tries to scroll beyond edges, let the page handle it.
        if ((e.deltaX < 0 && atStartNow) || (e.deltaX > 0 && atEndNow)) return;
        el.scrollLeft += e.deltaX;
      } else {
        // If user tries to scroll beyond edges, let the page handle it.
        if ((e.deltaY < 0 && atStartNow) || (e.deltaY > 0 && atEndNow)) return;

        wheelAccumRef.current += e.deltaY;
        if (wheelRafRef.current == null) {
          wheelRafRef.current = window.requestAnimationFrame(() => {
            wheelRafRef.current = null;
            const acc = wheelAccumRef.current;
            wheelAccumRef.current = 0;
            if (Math.abs(acc) < 6) return;
            const dir = acc > 0 ? 1 : -1;
            const step = Math.max(240, Math.floor(el.clientWidth * 0.9));
            el.scrollBy({ left: dir * step, behavior: 'smooth' });
          });
        }
      }

      e.preventDefault();
      e.stopPropagation();
    };

    const update = () => {
      const max = Math.max(0, el.scrollWidth - el.clientWidth);
      setAtStart(el.scrollLeft <= 1);
      setAtEnd(el.scrollLeft >= max - 1);
      setCanScrollX(max > 1);
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      el.removeEventListener('wheel', onWheel);
      if (wheelRafRef.current != null) {
        window.cancelAnimationFrame(wheelRafRef.current);
        wheelRafRef.current = null;
      }
      window.removeEventListener('resize', update);
    };
  }, [relatedProducts.length]);

  const scrollByStep = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.max(240, Math.floor(el.clientWidth * 0.9));
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  if (relatedProducts.length === 0) return null;

  return (
    <motion.section variants={itemVariants} className={styles.related}>
      <div className={styles.relatedHeader}>
        <h2 className={styles.relatedTitle}>С этим товаром покупают</h2>
        {canScrollX && (
          <div className={styles.relatedNav}>
          <button
            type="button"
            className={styles.relatedNavBtn}
            onClick={() => scrollByStep(-1)}
            disabled={atStart}
            aria-label="Листать влево"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className={styles.relatedNavBtn}
            onClick={() => scrollByStep(1)}
            disabled={atEnd}
            aria-label="Листать вправо"
          >
            <ChevronRight size={20} />
          </button>
          </div>
        )}
      </div>

      <div
        className={`${styles.relatedCarousel} ${atStart ? styles.relatedAtStart : ''} ${atEnd ? styles.relatedAtEnd : ''} ${!canScrollX ? styles.relatedNoScroll : ''}`}
      >
        <div ref={trackRef} className={styles.relatedTrack}>
          {relatedProducts.map((p) => (
            <div key={p.id} className={styles.relatedSlide}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
