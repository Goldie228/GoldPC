import { useMemo, type ReactElement } from 'react';
import { motion } from 'framer-motion';
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
      ease: [0.33, 1, 0.68, 1]
    }
  }
};

export function RelatedProducts({ product, productId }: RelatedProductsProps): ReactElement | null {
  const { data: relatedData } = useProducts(
    { category: product.category, pageSize: 5 },
    { enabled: !!product }
  );

  const relatedProducts = useMemo(() => {
    return relatedData?.data.filter(p => p.id !== productId).slice(0, 4) || [];
  }, [relatedData, productId]);

  if (relatedProducts.length === 0) return null;

  return (
    <motion.section variants={itemVariants} className={styles.related}>
      <h2 className={styles.relatedTitle}>С этим товаром покупают</h2>
      <div className={styles.relatedGrid}>
        {relatedProducts.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </motion.section>
  );
}
