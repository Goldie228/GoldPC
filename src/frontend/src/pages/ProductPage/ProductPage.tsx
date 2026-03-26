import { useMemo, type ReactElement } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tabs, type Tab } from '../../components/ui/Tabs';
import { Skeleton } from '../../components/ui/Skeleton';
import { useProduct } from '../../hooks/useProduct';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import type { Product } from '../../api/types';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs/Breadcrumbs';
import { CATEGORY_LABELS_RU } from '../../utils/categoryLabels';
import { ProductGallery } from './components/ProductGallery';
import { ProductInfo } from './components/ProductInfo';
import { ReviewSection } from './components/ReviewSection';
import { RelatedProducts } from './components/RelatedProducts';
import styles from './ProductPage.module.css';

const DESCRIPTION_SECTIONS = [
  'Общая информация',
  'Основные',
  'Технические характеристики',
  'Технические характеристики и функциональность',
  'Функциональные особенности',
  'Звук',
  'Микрофон',
  'Интерфейс',
  'Интерфейсы',
  'Питание',
  'Корпус',
  'Аккумулятор и время работы',
  'Габариты',
  'Комплектация',
  'Особенности конструкции',
  'Кабель',
  'Метки',
] as const;

type DescriptionBlock = { title?: string; body: string };

function trimDescriptionBeforeMain(description: string | undefined): string | undefined {
  const raw = normalizeDescriptionPreserveLines(description ?? '');
  if (!raw) return undefined;

  const blocks = splitDescriptionByHeadings(raw);
  if (blocks.length === 0) return raw;

  const mainIdx = blocks.findIndex((b) => (b.title ?? '').trim() === 'Основные');
  if (mainIdx <= 0) return raw;

  // Drop everything before "Основные" (часто это мусор/дубли из характеристик)
  const kept = blocks.slice(mainIdx);
  const rebuilt = kept
    .map((b) => {
      const title = (b.title ?? '').trim();
      const body = (b.body ?? '').trim();
      if (title && body) return `${title}\n${body}`;
      if (title) return title;
      return body;
    })
    .filter(Boolean)
    .join('\n');

  return normalizeDescriptionPreserveLines(rebuilt);
}

function normalizeDescriptionPreserveLines(input: string): string {
  const text = (input ?? '').replace(/\r/g, '');
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitDescriptionByHeadings(description: string): DescriptionBlock[] {
  const text = normalizeDescriptionPreserveLines(description);
  if (!text) return [];

  const known = new Set<string>(DESCRIPTION_SECTIONS);
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const blocks: DescriptionBlock[] = [];
  let current: DescriptionBlock | null = null;

  for (const line of lines) {
    if (known.has(line)) {
      if (current && (current.title || current.body.trim())) blocks.push(current);
      current = { title: line, body: '' };
      continue;
    }
    if (!current) current = { body: '' };
    current.body = current.body ? `${current.body}\n${line}` : line;
  }

  if (current && (current.title || current.body.trim())) blocks.push(current);
  return blocks;
}

function extractKeyValueFromLine(line: string): Array<{ key: string; value: string }> {
  const s = line.trim();
  if (!s) return [];

  const out: Array<{ key: string; value: string }> = [];

  // Multiple pairs in one line: "Bluetooth — SBC Multipoint — Нет"
  const multiRe =
    /([А-ЯЁA-Za-z0-9().,\-+/%\s]{2,60}?)\s*(?:—|:)\s*([^—:]+?)(?=\s+[А-ЯЁA-Za-z0-9().,\-+/%\s]{2,60}?\s*(?:—|:)\s*|$)/g;
  const multiMatches = Array.from(s.matchAll(multiRe));
  if (multiMatches.length >= 2) {
    for (const m of multiMatches) {
      const key = (m[1] ?? '').trim();
      const value = (m[2] ?? '').trim();
      if (key && value) out.push({ key, value });
    }
    return out;
  }

  const colonIdx = s.indexOf(':');
  if (colonIdx > 0) {
    const key = s.slice(0, colonIdx).trim();
    const value = s.slice(colonIdx + 1).trim();
    if (key && value) return [{ key, value }];
  }

  const dashIdx = s.indexOf('—');
  if (dashIdx > 0) {
    const key = s.slice(0, dashIdx).trim();
    const value = s.slice(dashIdx + 1).trim();
    if (key && value) return [{ key, value }];
  }

  return [];
}

function extractKeyValueItemsFromBody(body: string): { items: Array<{ key: string; value: string }>; rest: string } {
  const text = normalizeDescriptionPreserveLines(body);
  if (!text) return { items: [], rest: '' };

  const items: Array<{ key: string; value: string }> = [];
  const restLines: string[] = [];

  const rawLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Pattern: "Ключ" "\u2014" "Значение" as three separate lines
    if ((line === '—' || line === '-' || line === '–') && i > 0 && i + 1 < rawLines.length) {
      const prev = rawLines[i - 1];
      const next = rawLines[i + 1];
      const merged = `${prev} — ${next}`;
      const pairs = extractKeyValueFromLine(merged);
      if (pairs.length > 0) {
        // Remove previously added prev line from restLines if it was added there
        if (restLines.length > 0 && restLines[restLines.length - 1] === prev) {
          restLines.pop();
        }
        items.push(...pairs);
        i++; // skip next
        continue;
      }
    }

    const pairs = extractKeyValueFromLine(line);
    if (pairs.length > 0) items.push(...pairs);
    else restLines.push(line);
  }

  return { items, rest: restLines.join('\n').trim() };
}

function renderDescriptionBlocks(description: string | undefined): ReactElement {
  const raw = trimDescriptionBeforeMain(description);
  if (!raw) {
    return <div className={styles.descriptionText}>Описание этого товара пока не добавлено.</div>;
  }

  const blocks = splitDescriptionByHeadings(raw);

  if (blocks.length === 0) {
    return <div className={styles.descriptionText}>{raw}</div>;
  }

  const anyPairs = blocks.some((b) => extractKeyValueItemsFromBody(b.body).items.length > 0);

  return (
    <div className={styles.descriptionBlocks}>
      {blocks.map((block, idx) => {
        const { items, rest } = extractKeyValueItemsFromBody(block.body);
        const hasTitle = !!block.title?.trim();
        const hasItems = items.length > 0;
        const hasRest = !!rest?.trim();

        return (
          <section key={`${block.title ?? 'block'}-${idx}`} className={styles.descriptionBlock}>
            {hasTitle && <h3 className={styles.descriptionBlockTitle}>{block.title}</h3>}

            {hasItems && (
              <ul className={styles.descriptionBullets}>
                {items.map(({ key, value }, i) => (
                  <li key={`${key}-${i}`} className={styles.descriptionBullet}>
                    <span className={styles.descriptionBulletKey}>{key}</span>
                    <span className={styles.descriptionBulletSep}>—</span>
                    <span className={styles.descriptionBulletValue}>{value}</span>
                  </li>
                ))}
              </ul>
            )}

            {hasRest && <div className={styles.descriptionText}>{rest}</div>}
          </section>
        );
      })}

      {!anyPairs && <div className={styles.descriptionText}>{raw}</div>}
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
    <section className={styles.descriptionBlock}>
      <h3 className={styles.descriptionBlockTitle}>Юридическая информация</h3>
      <ul className={styles.descriptionBullets}>
        {items.map(({ key, value }, i) => (
          <li key={`${key}-${i}`} className={styles.descriptionBullet}>
            <span className={styles.descriptionBulletKey}>{key}</span>
            <span className={styles.descriptionBulletSep}>—</span>
            <span className={styles.descriptionBulletValue}>{value}</span>
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

    const descriptionForUi = trimDescriptionBeforeMain(product.description);

    const reviewCount = product.reviewCount ?? 0;

    return [
      {
        id: 'specs',
        label: 'Характеристики',
        content: (
          <>
            <div className={styles.description}>
              {renderDescriptionBlocks(descriptionForUi)}
              {renderLegalInfoBlock(product)}
            </div>
          </>
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
