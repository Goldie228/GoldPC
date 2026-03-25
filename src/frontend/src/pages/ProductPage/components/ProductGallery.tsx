import { useState, useMemo, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hasValidProductImage } from '../../../utils/image';
import type { Product } from '../../../api/types';
import styles from '../ProductPage.module.css';

export interface ProductGalleryProps {
  product: Product;
}

export function ProductGallery({ product }: ProductGalleryProps): ReactElement {
  const [activeImage, setActiveImage] = useState(product.mainImage?.url || '');
  
  const hasDiscount = product.oldPrice !== undefined && product.oldPrice > product.price;
  const discountPercent = hasDiscount && product.oldPrice !== undefined
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  const images = useMemo(() => {
    if (!product.images || product.images.length === 0) {
      return product.mainImage ? [product.mainImage] : [];
    }
    return product.images;
  }, [product]);

  return (
    <div className={styles.gallery}>
      <div className={styles.mainImageWrapper}>
        {hasDiscount && (
          <span className={styles.badge}>-{discountPercent}%</span>
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
            {hasValidProductImage(activeImage) ? (
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
      </div>
      
      {images.length > 1 && (
        <div className={styles.thumbs}>
          {images.map((img) => (
            <button
              key={img.id}
              className={`${styles.thumb} ${activeImage === img.url ? styles.thumbActive : ''}`}
              onClick={() => setActiveImage(img.url)}
            >
              <img src={img.url} alt={img.alt || product.name} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
