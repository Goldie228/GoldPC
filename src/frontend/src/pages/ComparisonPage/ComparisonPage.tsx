import { useState, useEffect, useMemo, useCallback, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { useComparisonStore } from '../../store/comparisonStore';
import { catalogApi } from '../../api/catalog';
import { getProductImageUrl } from '../../utils/image';
import type { Product, ProductSpecifications, ProductCategory, ProductImage } from '../../api/types';
import { Icon } from '../../components/ui/Icon/Icon';
import styles from './ComparisonPage.module.css';

/** Получить главное изображение товара (mainImage или первое из images) */
function getMainImage(product: Product): ProductImage | undefined {
  if (product.mainImage?.url) return product.mainImage;
  const images = product.images;
  if (!images?.length) return undefined;
  return images.find((i) => i.isMain) ?? images[0];
}

/** Расширенный словарь русских названий характеристик (локализация) */
const SPEC_LABELS: Record<string, string> = {
  vram: 'Объём видеопамяти',
  videopamyat: 'Объём видеопамяти (ГБ)',
  gpu: 'Серия GPU',
  razyemy_pitaniya: 'Разъёмы питания',
  chip: 'Чип',
  memory: 'Память',
  memoryType: 'Тип памяти',
  interface: 'Интерфейс',
  socket: 'Сокет',
  cores: 'Количество ядер',
  threads: 'Потоки',
  integrated_graphics: 'Встроенная графика',
  cooling_included: 'Охлаждение в комплекте',
  multithreading: 'Многопоточность',
  baseFrequency: 'Базовая частота',
  boostFrequency: 'Турбо частота',
  chipset: 'Чипсет',
  form_factor: 'Форм-фактор',
  formFactor: 'Форм-фактор',
  type: 'Тип',
  capacity: 'Объём',
  frequency: 'Частота',
  wattage: 'Мощность',
  power: 'Мощность',
  efficiency: 'Сертификат 80+',
  modular: 'Модульный',
  color: 'Цвет',
  tdp: 'TDP',
  diagonal: 'Диагональ',
  resolution: 'Разрешение',
  refresh_rate: 'Частота обновления',
  refreshRate: 'Частота обновления',
  connection: 'Подключение',
  cache: 'Кэш',
  ports: 'Разъёмы',
  memorySlots: 'Слотов памяти',
  maxMemory: 'Макс. память',
  pcieSlots: 'Слоты PCIe',
  latency: 'Задержка',
  voltage: 'Напряжение',
  modules: 'Модули',
  readSpeed: 'Скорость чтения',
  writeSpeed: 'Скорость записи',
  fanSize: 'Вентилятор',
  fan_size: 'Вентилятор',
  material: 'Материал',
  window: 'Прозрачное окно',
  max_cooler_height: 'Макс. высота кулера',
  max_gpu_length: 'Макс. длина видеокарты',
  gpuLength: 'Длина видеокарты',
  cpuCoolerHeight: 'Высота кулера',
  fans: 'Вентиляторы',
  noise: 'Уровень шума',
  height: 'Высота',
  panelType: 'Тип матрицы',
  matrix: 'Матрица',
  responseTime: 'Время отклика',
  dpi: 'DPI',
  sensor_type: 'Тип сенсора',
  connection_type: 'Тип подключения',
  ecc: 'ECC',
  xmp: 'Профили XMP',
  expo: 'AMD EXPO',
  data_vykhoda_na_rynok: 'Год выхода на рынок',
  driver_size: 'Размер драйвера, мм',
  impedance: 'Импеданс',
};

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cpu: 'Процессоры',
  gpu: 'Видеокарты',
  motherboard: 'Материнские платы',
  ram: 'Оперативная память',
  storage: 'Накопители',
  psu: 'Блоки питания',
  case: 'Корпуса',
  cooling: 'Охлаждение',
  monitor: 'Мониторы',
  keyboard: 'Клавиатуры',
  mouse: 'Мыши',
  headphones: 'Наушники',
};

/** snake_case → человекочитаемое русское */
const SNAKE_TO_RU: Record<string, string> = {
  data_vykhoda_na_rynok: 'Год выхода на рынок',
  driver_size: 'Размер драйвера',
  max_cooler_height: 'Макс. высота кулера',
  max_gpu_length: 'Макс. длина видеокарты',
  connection_type: 'Тип подключения',
  sensor_type: 'Тип сенсора',
  refresh_rate: 'Частота обновления',
  response_time: 'Время отклика',
  form_factor: 'Форм-фактор',
  fan_size: 'Размер вентилятора',
};

function specLabel(key: string): string {
  const lower = key.toLowerCase();
  const normalized = key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  return (
    SPEC_LABELS[key] ??
    SPEC_LABELS[normalized] ??
    SPEC_LABELS[lower] ??
    SNAKE_TO_RU[lower] ??
    SNAKE_TO_RU[normalized] ??
    key
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  );
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'BYN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/** Форматировать значение спецификации для отображения */
function formatSpecValue(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  return String(value);
}

/** Спеки, для которых ниже = лучше (цена, TDP, шум и т.д.) */
const LOWER_IS_BETTER = new Set(['price', 'tdp', 'noise', 'voltage', 'responseTime', 'response_time']);

/** Извлечь числовое значение для сравнения */
function extractNumeric(val: unknown): number | null {
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  if (val == null) return null;
  const s = String(val);
  const num = parseFloat(s.replace(/[^\d.,-]/g, '').replace(',', '.'));
  return Number.isNaN(num) ? null : num;
}

/** Определить лучший индекс для строки (для подсветки) */
function getBestIndices(
  rowKey: string,
  values: (string | number | boolean | undefined)[]
): Set<number> {
  const numerics = values.map(extractNumeric);
  const valid = numerics.map((n, i) => (n != null ? { i, n } : null)).filter(Boolean) as { i: number; n: number }[];
  if (valid.length < 2) return new Set();

  const lowerBetter = LOWER_IS_BETTER.has(rowKey.toLowerCase());
  const best = lowerBetter
    ? valid.reduce((a, b) => (a.n <= b.n ? a : b))
    : valid.reduce((a, b) => (a.n >= b.n ? a : b));
  return new Set(valid.filter((v) => v.n === best.n).map((v) => v.i));
}

/**
 * Страница сравнения товаров
 */
export function ComparisonPage(): ReactElement {
  const items = useComparisonStore((state) => state.items);
  const removeItem = useComparisonStore((state) => state.removeItem);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const itemIds = useMemo(() => items.map((i) => i.id), [items]);

  useEffect(() => {
    if (itemIds.length === 0) {
      setProducts([]);
      setLoading(false);
      setError(null);
      setImageErrors(new Set());
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.allSettled(itemIds.map((id) => catalogApi.getProduct(id)))
      .then((results) => {
        if (cancelled) return;
        const loaded = results
          .filter((r): r is PromiseFulfilledResult<Product> => r.status === 'fulfilled')
          .map((r) => r.value);
        setProducts(loaded);
        if (loaded.length === 0 && itemIds.length > 0) {
          setError('Не удалось загрузить товары для сравнения.');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError('Не удалось загрузить товары для сравнения.');
        console.error('Comparison fetch error:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [itemIds]);

  const handleImageError = useCallback((productId: string) => {
    setImageErrors((prev) => new Set(prev).add(productId));
  }, []);

  const specKeys = useMemo(() => {
    const keys = new Set<string>();
    products.forEach((p) => {
      const specs = p.specifications as ProductSpecifications | undefined;
      if (specs) Object.keys(specs).forEach((k) => keys.add(k));
    });
    return Array.from(keys).sort();
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return Array.from(set);
  }, [products]);

  const categoryLabel =
    categories.length === 1 ? CATEGORY_LABELS[categories[0] as ProductCategory] ?? categories[0] : null;

  if (items.length === 0 && !loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>Сравнение</h1>
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <Icon name="compare" size="2xl" color="secondary" />
            </div>
            <h2 className={styles.emptyTitle}>Сравнение пусто</h2>
            <p className={styles.emptyText}>
              Добавляйте товары из каталога для сравнения характеристик. Можно сравнивать до 4 товаров одной категории.
            </p>
            <Link to="/catalog" className={styles.emptyBtn}>
              Перейти в каталог
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>Сравнение</h1>
          <div className={styles.error}>
            <p>{error}</p>
            <Link to="/catalog" className={styles.emptyBtn}>
              Перейти в каталог
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Сравнение</h1>
          <div className={styles.headerMeta}>
            {categoryLabel && <span className={styles.categoryBadge}>{categoryLabel}</span>}
            <p className={styles.stats}>
              {products.length} {products.length === 1 ? 'товар' : 'товара'}
            </p>
          </div>
        </header>

        {loading ? (
          <div className={styles.loading}>
            <span className={styles.spinner} aria-hidden />
            <span>Загрузка...</span>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.attrCol}>Характеристика</th>
                  {products.map((product) => (
                    <th key={product.id} className={styles.productCol}>
                      <div className={styles.productHeader}>
                        <button
                          className={styles.removeBtn}
                          onClick={() => removeItem(product.id)}
                          aria-label={`Удалить ${product.name} из сравнения`}
                          type="button"
                        >
                          <Icon name="trash" size="sm" />
                        </button>
                        <Link to={`/product/${product.id}`} className={styles.productImageLink}>
                          {(() => {
                            const img = getMainImage(product);
                            const url = getProductImageUrl(img?.url);
                            return url && !imageErrors.has(product.id) ? (
                              <img
                                src={url}
                                alt={img?.alt ?? product.name}
                                className={styles.productImage}
                                onError={() => handleImageError(product.id)}
                              />
                            ) : (
                            <div className={styles.productImagePlaceholder}>
                              <Icon name="image" size="lg" color="secondary" />
                            </div>
                            );
                          })()}
                        </Link>
                        <Link to={`/product/${product.id}`} className={styles.productName}>
                          {product.name}
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.attrCell}>Производитель</td>
                  {products.map((product) => (
                    <td key={product.id} className={styles.valueCell}>
                      {product.manufacturer?.name ?? '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className={styles.attrCell}>Цена</td>
                  {products.map((product, idx) => {
                    const bestIndices = getBestIndices('price', products.map((p) => p.price));
                    return (
                      <td
                        key={product.id}
                        className={`${styles.valueCell} ${bestIndices.has(idx) ? styles.bestValue : ''}`}
                      >
                        <span className={styles.price}>{formatPrice(product.price)}</span>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className={styles.attrCell}>Рейтинг</td>
                  {products.map((product, idx) => {
                    const ratingNum =
                      typeof product.rating === 'number'
                        ? product.rating
                        : (product.rating as { average?: number } | undefined)?.average;
                    const ratings = products.map((p) =>
                      typeof p.rating === 'number' ? p.rating : (p.rating as { average?: number })?.average
                    );
                    const bestIndices = getBestIndices('rating', ratings);
                    return (
                      <td
                        key={product.id}
                        className={`${styles.valueCell} ${bestIndices.has(idx) ? styles.bestValue : ''}`}
                      >
                        {ratingNum != null && !Number.isNaN(ratingNum)
                          ? `${Number(ratingNum).toFixed(1)} ★`
                          : '—'}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className={styles.attrCell}>Наличие</td>
                  {products.map((product) => (
                    <td key={product.id} className={styles.valueCell}>
                      {product.stock === 0 ? 'Под заказ' : 'В наличии'}
                    </td>
                  ))}
                </tr>
                {specKeys.map((key) => {
                  const values = products.map((p) => {
                    const specs = p.specifications as ProductSpecifications | undefined;
                    return specs?.[key];
                  });
                  const bestIndices = getBestIndices(key, values);

                  return (
                    <tr key={key}>
                      <td className={styles.attrCell}>{specLabel(key)}</td>
                      {products.map((product, idx) => {
                        const specs = product.specifications as ProductSpecifications | undefined;
                        const value = specs?.[key];
                        const display = formatSpecValue(value);

                        return (
                          <td
                            key={product.id}
                            className={`${styles.valueCell} ${bestIndices.has(idx) ? styles.bestValue : ''}`}
                          >
                            {display}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
