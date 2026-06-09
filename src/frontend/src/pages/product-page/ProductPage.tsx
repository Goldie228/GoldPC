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
    return <div className="text-muted-foreground whitespace-pre-line">Описание этого товара пока не добавлено.</div>;
  }

  const blocks = splitDescriptionByHeadings(raw);

  if (blocks.length === 0) {
    return <div className="text-muted-foreground whitespace-pre-line">{raw}</div>;
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
          <section key={`${block.title ?? 'block'}-${idx}`} className="p-5 border border-border rounded-xl bg-card">
            {hasTitle && <h3 className="m-0 mb-3 text-base font-semibold text-foreground">{block.title}</h3>}

            {hasItems && (
              <ul className="m-0 p-0 list-none grid gap-2.5">
                {items.map(({ key, value }, i) => (
                  <li key={`${key}-${i}`} className="flex items-baseline gap-2 px-3 py-2.5 rounded-lg bg-surface-elevated border border-border whitespace-normal flex-wrap">
                    <span className="text-muted-foreground text-sm">{key}</span>
                    <span className="text-muted-foreground/50">—</span>
                    <span className="text-foreground text-sm font-medium">{value}</span>
                  </li>
                ))}
              </ul>
            )}

            {hasRest && <div className="text-muted-foreground mt-3 whitespace-pre-line text-sm">{rest}</div>}
          </section>
        );
      })}

      {!anyPairs && <div className="text-muted-foreground whitespace-pre-line">{raw}</div>}
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
    <div className="w-full overflow-hidden rounded-xl border border-border">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-surface-elevated/70">
            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-2/5">
              Характеристика
            </th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Значение
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {keys.map((k) => (
            <tr key={k} className="transition-colors hover:bg-surface-elevated/20">
              <td className="px-5 py-3.5 text-sm text-muted-foreground align-top">
                {specLabel(k)}
              </td>
              <td className="px-5 py-3.5 text-sm text-foreground font-medium">
                {formatSpecValueForKey(k, specs[k])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
    <section className="mt-6">
      <h3 className="m-0 mb-3 text-base font-semibold text-foreground">Юридическая информация</h3>
      <div className="w-full overflow-hidden rounded-xl border border-border">
        <table className="w-full border-collapse">
          <tbody className="divide-y divide-border">
            {items.map(({ key, value }, i) => (
              <tr key={`${key}-${i}`} className="transition-colors hover:bg-surface-elevated/20">
                <td className="px-5 py-3.5 text-sm text-muted-foreground align-top w-2/5">{key}</td>
                <td className="px-5 py-3.5 text-sm text-foreground font-medium">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  const { isAuthenticated, user } = useAuth();

  const tabs = useMemo<Tab[]>(() => {
    if (!product) return [];

    const reviewCount = product.reviewCount ?? 0;

    return [
      {
        id: 'specs',
        label: 'Характеристики',
        content: (
          <>
            {renderSpecsFromCatalog(product)}
            {renderLegalInfoBlock(product)}
          </>
        )
      },
      {
        id: 'reviews',
        label: reviewCount > 0 ? `Отзывы (${reviewCount})` : 'Отзывы',
        content: <ReviewSection productId={product.id} product={product} isAuthenticated={isAuthenticated} showToast={showToast} user={user} />
      }
    ];
  }, [product, isAuthenticated, showToast]);

  if (isLoading) {
    return (
      <div className="w-full max-w-[var(--layout-page-wide)] mx-auto px-[var(--layout-page-pad-x)] min-h-[calc(100vh-200px)] bg-background">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-8"><Skeleton width={200} height={14} /></div>
        <div className="grid grid-cols-1 gap-10 mb-16 lg:grid-cols-[minmax(400px,650px)_1fr] lg:gap-15">
          <Skeleton height={500} borderRadius="lg" />
          <div className="flex flex-col gap-5">
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
      <div className="w-full max-w-[var(--layout-page-wide)] mx-auto px-[var(--layout-page-pad-x)] min-h-[calc(100vh-200px)] bg-background">
        <div className="text-center py-[100px] px-5">
          <h1 className="text-foreground mb-4">Товар не найден</h1>
          <p className="text-muted-foreground mb-8">Возможно, он был удалён или ссылка неверна.</p>
          <Link
            to="/catalog"
            className="inline-flex items-center px-6 py-3 text-sm font-semibold no-underline bg-primary text-primary-foreground rounded-md transition-all duration-200 hover:brightness-110"
          >
            Вернуться в каталог
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full max-w-[var(--layout-page-wide)] mx-auto px-[var(--layout-page-pad-x)] min-h-[calc(100vh-200px)] bg-background pb-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <header className="flex items-center gap-2 text-xs text-muted-foreground pt-8 mb-8">
        <Breadcrumbs
          items={[
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
