import { useMemo, type ReactElement } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tabs, type Tab } from '../../components/ui/Tabs';
import { Skeleton } from '../../components/ui/Skeleton';
import { useProduct } from '../../hooks/useProduct';
import { useToastStore } from '../../store/toastStore';
import { useAuth } from '../../hooks/useAuth';
import type { Product } from '../../api/types';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { CATEGORY_LABELS_RU } from '../../utils/categoryLabels';
import { ProductGallery } from './components/ProductGallery';
import { ProductInfo } from './components/ProductInfo';
import { ReviewSection } from './components/ReviewSection';
import { RelatedProducts } from './components/RelatedProducts';
import {
  trimDescriptionBeforeMain,
  splitDescriptionByHeadings,
  extractKeyValueItemsFromBody,
  mergeDescriptionIntoSpecifications,
} from '../../utils/productDescriptionSpecs';
import { specLabel, formatSpecValueForKey } from '../../utils/specifications';

function renderDescriptionBlocks(description: string | undefined): ReactElement {
  const raw = trimDescriptionBeforeMain(description);
  if (!raw) {
    return <div className="text-[var(--fg-muted)] whitespace-pre-line">Описание этого товара пока не добавлено.</div>;
  }

  const blocks = splitDescriptionByHeadings(raw);

  if (blocks.length === 0) {
    return <div className="text-[var(--fg-muted)] whitespace-pre-line">{raw}</div>;
  }

  const anyPairs = blocks.some((b) => extractKeyValueItemsFromBody(b.body).items.length > 0);

  return (
    <div className="grid gap-4">
      {blocks.map((block, idx) => {
        const { items, rest } = extractKeyValueItemsFromBody(block.body);
        const hasTitle = !!block.title?.trim();
        const hasItems = items.length > 0;
        const hasRest = !!rest?.trim();

        return (
          <section key={`${block.title ?? 'block'}-${idx}`} className="p-4.5 border border-[var(--border)] rounded-xl bg-[var(--border-muted)]">
            {hasTitle && <h3 className="m-0 mb-3 text-[1.05rem] font-semibold text-[var(--fg)] letter-spacing-[0.01em]">{block.title}</h3>}

            {hasItems && (
              <ul className="m-0 p-0 list-none grid gap-2.5">
                {items.map(({ key, value }, i) => (
                  <li key={`${key}-${i}`} className="flex items-baseline gap-2 p-2.5 rounded-lg bg-[var(--border-muted)] border border-[var(--border-muted)] whitespace-normal flex-wrap">
                    <span className="text-[var(--fg-muted)] text-[0.92rem]">{key}</span>
                    <span className="text-[var(--fg-dim)]">—</span>
                    <span className="text-[var(--fg)] text-[0.95rem] font-medium">{value}</span>
                  </li>
                ))}
              </ul>
            )}

            {hasRest && <div className="text-[var(--fg-muted)] mt-3 whitespace-pre-line">{rest}</div>}
          </section>
        );
      })}

      {!anyPairs && <div className="text-[var(--fg-muted)] whitespace-pre-line">{raw}</div>}
    </div>
  );
}

function renderSpecsFromCatalog(product: Product): ReactElement {
  const specs = mergeDescriptionIntoSpecifications(product.specifications, product.description);
  if (!specs || Object.keys(specs).length === 0) {
    return renderDescriptionBlocks(trimDescriptionBeforeMain(product.description));
  }
  const priority = ['socket', 'chipset', 'cores', 'threads', 'vram', 'capacity', 'frequency'];
  const keys = Object.keys(specs).sort((a, b) => {
    const ia = priority.indexOf(a);
    const ib = priority.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
  return (
    <ul className="m-0 p-0 list-none grid gap-2.5">
      {keys.map((k) => (
        <li key={k} className="flex items-baseline gap-2 p-2.5 rounded-lg bg-[var(--border-muted)] border border-[var(--border-muted)] whitespace-normal flex-wrap">
          <span className="text-[var(--fg-muted)] text-[0.92rem]">{specLabel(k)}</span>
          <span className="text-[var(--fg-dim)]">—</span>
          <span className="text-[var(--fg)] text-[0.95rem] font-medium">{formatSpecValueForKey(k, specs[k])}</span>
        </li>
      ))}
    </ul>
  );
}

function renderLegalInfoBlock(product: Product): ReactElement | null {
  const items: Array<{ key: string; value: string }> = [];

  if (product.warrantyMonths != null && product.warrantyMonths > 0) {
    items.push({ key: 'Гарантия', value: `${product.warrantyMonths} мес.` });
  }
  if (product.manufacturerAddress) items.push({ key: 'Адрес производителя', value: product.manufacturerAddress });
  if (product.productionAddress) items.push({ key: 'Адрес производства', value: product.productionAddress });
  if (product.importer) items.push({ key: 'Импортер', value: product.importer });
  if (product.serviceSupport) items.push({ key: 'Сервисная поддержка', value: product.serviceSupport });

  if (items.length === 0) return null;

  return (
    <section className="p-4.5 border border-[var(--border)] rounded-xl bg-[var(--border-muted)]">
      <h3 className="m-0 mb-3 text-[1.05rem] font-semibold text-[var(--fg)] letter-spacing-[0.01em]">Юридическая информация</h3>
      <ul className="m-0 p-0 list-none grid gap-2.5">
        {items.map(({ key, value }, i) => (
          <li key={`${key}-${i}`} className="flex items-baseline gap-2 p-2.5 rounded-lg bg-[var(--border-muted)] border border-[var(--border-muted)] whitespace-normal flex-wrap">
            <span className="text-[var(--fg-muted)] text-[0.92rem]">{key}</span>
            <span className="text-[var(--fg-dim)]">—</span>
            <span className="text-[var(--fg)] text-[0.95rem] font-medium">{value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

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
      ease: [0.33, 1, 0.68, 1] as const
    }
  }
};

/**
 * Главный компонент страницы
 */
export function ProductPage(): ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, error } = useProduct(slug);
  const showToast = useToastStore((state) => state.showToast);
  const { isAuthenticated } = useAuth();

  const tabs = useMemo<Tab[]>(() => {
    if (!product) return [];

    const reviewCount = product.reviewCount ?? 0;

    return [
      {
        id: 'specs',
        label: 'Характеристики',
        content: (
          <>
            <div className={styles.description}>
              {renderSpecsFromCatalog(product)}
              {renderLegalInfoBlock(product)}
            </div>
          </>
        )
      },
      {
        id: 'reviews',
        label: reviewCount > 0 ? `Отзывы (${reviewCount})` : 'Отзывы',
        content: <ReviewSection productId={product.id} product={product} isAuthenticated={isAuthenticated} showToast={showToast} />
      }
    ];
  }, [product, isAuthenticated, showToast]);

  if (isLoading) {
  return (
    <div className="w-full max-w-[var(--layout-page-wide)] mx-auto px-[var(--layout-page-pad-x)] min-h-[calc(100vh-200px)] bg-[var(--bg)]" style={{ backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, var(--border-muted) 0%, transparent 50%)' }}>
      <div className="flex items-center gap-2 text-xs text-[var(--fg-dim)] mb-8"><Skeleton width={200} height={14} /></div>
      <div className="grid grid-cols-1 gap-10 mb-16 lg:grid-cols-[minmax(400px,650px)_1fr] lg:gap-15">
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
      <div className="w-full max-w-[var(--layout-page-wide)] mx-auto px-[var(--layout-page-pad-x)] min-h-[calc(100vh-200px)] bg-[var(--bg)]">
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h1 style={{ marginBottom: '16px' }}>Товар не найден</h1>
          <p style={{ color: '#71717a', marginBottom: '32px' }}>Возможно, он был удалён или ссылка неверна.</p>
          <Link to="/catalog" className="inline-flex items-center p-3.5 text-sm font-semibold text-decoration-none text-[var(--color-black)] bg-gradient-to-br from-[#e8c4a0] to-[var(--color-gold-500)] border border-[var(--border-muted)] rounded-[var(--radius-sm,4px)] transition-all duration-200 hover:from-[#e8c4a0] hover:to-[var(--accent)] hover:scale-101">Вернуться в каталог</Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="w-full max-w-[var(--layout-page-wide)] mx-auto px-[var(--layout-page-pad-x)] min-h-[calc(100vh-200px)] bg-[var(--bg)]"
      style={{ backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, var(--border-muted) 0%, transparent 50%)' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <header className="flex items-center gap-2 text-xs text-[var(--fg-dim)] mb-8">
        <Breadcrumbs
          items={[
            { label: 'Главная', to: '/' },
            { label: 'Каталог', to: '/catalog' },
            ...(CATEGORY_LABELS_RU[product.category]
              ? [{ label: CATEGORY_LABELS_RU[product.category], to: `/catalog/${product.category}` }]
              : []),
            { label: product.name },
          ]}
        />
      </header>

      <div className="grid grid-cols-1 gap-10 mb-16 lg:grid-cols-[minmax(400px,650px)_1fr] lg:gap-15">
        <motion.div variants={itemVariants}>
          <ProductGallery product={product} />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <ProductInfo product={product} />
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="mb-16">
        <Tabs tabs={tabs} defaultTab="specs" />
      </motion.div>

      <RelatedProducts product={product} productId={product.id} />
    </motion.div>
  );
}
