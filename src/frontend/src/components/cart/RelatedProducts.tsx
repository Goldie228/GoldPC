import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '../ProductCard/ProductCard';
import { useProducts } from '../../hooks/useProducts';
import styles from './RelatedProducts.module.css';

interface RelatedProductsProps {
  cartItems: Array<{ productId: string; name: string }>;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.33, 1, 0.68, 1]
    }
  }
};

export function RelatedProducts({ cartItems }: RelatedProductsProps): ReactElement | null {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const wheelAccumRef = useRef(0);
  const wheelRafRef = useRef<number | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [canScrollX, setCanScrollX] = useState(false);

  // Получаем все товары для рекомендаций (без категорий корзины для разнообразия)
  const { data, isLoading } = useProducts(
    { pageSize: 8 },
    { enabled: cartItems.length > 0 }
  );

  // Фильтруем товары - убираем те, что уже в корзине
  const recommendations = useMemo(() => {
    if (!data?.data) return [];
    const cartIds = new Set(cartItems.map(item => item.productId));
    return data.data
      .filter(p => !cartIds.has(p.id))
      .slice(0, 6);
  }, [data, cartItems]);

  useEffect(() => {
    if (recommendations.length === 0) return;
    const el = trackRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const canScroll = el.scrollWidth > el.clientWidth + 1;
      if (!canScroll) return;

      const max = Math.max(0, el.scrollWidth - el.clientWidth);
      const atStartNow = el.scrollLeft <= 1;
      const atEndNow = el.scrollLeft >= max - 1;

      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      const dominantX = absX > absY;

      if (dominantX && absX > 2) {
        if ((e.deltaX < 0 && atStartNow) || (e.deltaX > 0 && atEndNow)) return;
        el.scrollLeft += e.deltaX;
      } else {
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
      el.removeEventListener('scroll', update as any);
      el.removeEventListener('wheel', onWheel as any);
      if (wheelRafRef.current != null) {
        window.cancelAnimationFrame(wheelRafRef.current);
        wheelRafRef.current = null;
      }
      window.removeEventListener('resize', update);
    };
  }, [recommendations.length]);

  const scrollByStep = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.max(240, Math.floor(el.clientWidth * 0.9));
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Часто покупают вместе</h2>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <span>Загрузка рекомендаций...</span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

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
          {recommendations.map((product) => (
            <div key={product.id} className={styles.relatedSlide}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
