import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '../../../components/product-card/ProductCard';
import { useProducts } from '../../../hooks/useProducts';
import type { Product } from '../../../api/types';

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
    { category: product.category, pageSize: 12 },
    { enabled: !!product }
  );

  const relatedProducts = useMemo(() => {
    return relatedData?.data.filter(p => p.id !== productId).slice(0, 8) || [];
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
    <motion.section variants={itemVariants} className="mt-20">
      {/* Section Header */}
      <div className="flex items-end justify-between gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-foreground m-0 pb-3 border-b-2 border-primary/50 inline-block">
          С этим товаром покупают
        </h2>
        {canScrollX && (
          <div className="hidden md:inline-flex gap-2">
            <button
              type="button"
              className="w-10 h-10 rounded-full inline-flex items-center justify-center bg-card border border-border text-muted-foreground cursor-pointer transition-all duration-150 hover:border-primary/40 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => scrollByStep(-1)}
              disabled={atStart}
              aria-label="Листать влево"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="w-10 h-10 rounded-full inline-flex items-center justify-center bg-card border border-border text-muted-foreground cursor-pointer transition-all duration-150 hover:border-primary/40 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => scrollByStep(1)}
              disabled={atEnd}
              aria-label="Листать вправо"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Product Track */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto overflow-y-hidden p-1 pb-2.5 scroll-smooth scrollbar-thin scrollbar-color-[var(--border)_transparent]"
      >
          {relatedProducts.map((p) => (
            <div key={p.id} className="flex-shrink-0 w-[min(260px,78vw)] sm:w-[260px] lg:w-[280px]">
              <ProductCard product={p} />
            </div>
          ))}
      </div>
    </motion.section>
  );
}
