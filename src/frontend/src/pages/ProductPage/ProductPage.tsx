import { useMemo, type ReactElement } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tabs, type Tab } from '../../components/ui/Tabs';
import { Skeleton } from '../../components/ui/Skeleton';
import { useProduct } from '../../hooks/useProduct';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import type { ProductSpecifications } from '../../api/types';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs/Breadcrumbs';
import { CATEGORY_LABELS_RU } from '../../utils/categoryLabels';
import { ProductGallery } from './components/ProductGallery';
import { ProductInfo } from './components/ProductInfo';
import { ReviewSection } from './components/ReviewSection';
import { RelatedProducts } from './components/RelatedProducts';
import styles from './ProductPage.module.css';

/**
 * Анимационные варианты для контейнера
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.4
    }
  }
};

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

/**
 * Главный компонент страницы
 */
export function ProductPage(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, error } = useProduct(id);
  const showToast = useToastStore((state) => state.showToast);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const tabs = useMemo<Tab[]>(() => {
    if (!product) return [];

    const specs = product.specifications as ProductSpecifications;
    const SPEC_LABELS: Record<string, string> = {
      vram: 'Объём видеопамяти', gpu: 'Графический процессор', socket: 'Сокет', 
      cores: 'Ядра', threads: 'Потоки', chipset: 'Чипсет'
    };

    const reviewCount = product.reviewCount ?? 0;

    return [
      {
        id: 'specs',
        label: 'Характеристики',
        content: (
          <div className={styles.specsTable}>
            {specs && Object.keys(specs).length > 0 ? (
              Object.entries(specs).map(([key, value]) => (
                <div key={key} className={styles.specsRow}>
                  <span className={styles.specsLabel}>{SPEC_LABELS[key.toLowerCase()] || key}</span>
                  <span className={styles.specsValue}>{String(value)}</span>
                </div>
              ))
            ) : (
              <p className={styles.empty}>Характеристики не указаны</p>
            )}
          </div>
        )
      },
      {
        id: 'description',
        label: 'Описание',
        content: (
          <div className={styles.description}>
            {product.description || 'Описание этого товара пока не добавлено.'}
          </div>
        )
      },
      {
        id: 'reviews',
        label: reviewCount > 0 ? `Отзывы (${reviewCount})` : 'Отзывы',
        content: <ReviewSection productId={id!} product={product} isAuthenticated={isAuthenticated} showToast={showToast} />
      }
    ];
  }, [product, id, isAuthenticated, showToast]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.breadcrumb}><Skeleton width={200} height={14} /></div>
        <div className={styles.layout}>
          <Skeleton height={500} borderRadius="lg" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Skeleton width="40%" height={16} />
            <Skeleton width="80%" height={40} />
            <Skeleton width="100%" height={120} borderRadius="md" />
            <Skeleton width="100%" height={56} borderRadius="md" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h1 style={{ marginBottom: '16px' }}>Товар не найден</h1>
          <p style={{ color: '#71717a', marginBottom: '32px' }}>Возможно, он был удалён или ссылка неверна.</p>
          <Link to="/catalog" className={styles.backButton}>Вернуться в каталог</Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <header className={styles.breadcrumb}>
        <Breadcrumbs
          items={[
            { label: 'Главная', to: '/' },
            { label: 'Каталог', to: '/catalog' },
            { label: CATEGORY_LABELS_RU[product.category], to: `/catalog/${product.category}` },
            { label: product.name },
          ]}
        />
      </header>

      <div className={styles.layout}>
        <motion.div variants={itemVariants}>
          <ProductGallery product={product} />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <ProductInfo product={product} />
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className={styles.tabsWrapper}>
        <Tabs tabs={tabs} defaultTab="specs" />
      </motion.div>

      <RelatedProducts product={product} productId={id!} />
    </motion.div>
  );
}
