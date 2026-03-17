# Спецификация UI-компонентов GoldPC

> Версия: 2.0.0  
> Последнее обновление: 2026-03-16  
> Статус: Утверждено  
> Основано на: `docs/design-system.md`

---

## Содержание

1. [Общие принципы](#1-общие-принципы)
2. [Product Card](#2-product-card---карточка-товара)
3. [Catalog Sidebar](#3-catalog-sidebar---боковая-панель-каталога)
4. [PC Builder Interface](#4-pc-builder-interface---интерфейс-конструктора-пк)
5. [Анимации и переходы](#5-анимации-и-переходы)
6. [Доступность (Accessibility)](#6-доступность-accessibility)

---

## 1. Общие принципы

### 1.1. Соответствие дизайн-системе

Все компоненты основаны на токенах из `docs/design-system.md`. Используйте CSS-переменные вместо хардкодинга значений.

#### Основные токены

```css
/* Цвета */
--color-primary-500: #4CAF50;    /* Основной brand color */
--color-primary-600: #43A047;    /* Hover state */
--color-accent-500: #FFC107;     /* Акцентный цвет */
--color-accent-600: #FFB300;     /* Акцент hover */
--color-error: #C62828;          /* Ошибки, скидки */
--color-success: #2E7D32;        /* Успех, совместимость */

/* Glassmorphism */
--glass-surface-light: rgba(255, 255, 255, 0.55);
--glass-surface-medium: rgba(255, 255, 255, 0.60);
--shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.4);

/* Типографика */
--font-heading: 'Playfair Display', Georgia, serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Анимации */
--transition-fast: 150ms ease-out;
--transition-base: 250ms ease-out;
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 1.2. Mobile-First подход

Все стили пишутся сначала для мобильных устройств с прогрессивным улучшением через `min-width` media queries.

```css
/* Базовые стили (mobile) */
.component { /* ... */ }

/* Tablet+ */
@media (min-width: 768px) { /* ... */ }

/* Desktop+ */
@media (min-width: 1024px) { /* ... */ }
```

---

## 2. Product Card — Карточка товара

### 2.1. Общее описание

Карточка товара — ключевой компонент каталога интернет-магазина компьютерных компонентов. Отображает информацию о товаре с интерактивными элементами: hover-zoom изображения, анимированная кнопка добавления в корзину, кнопка избранного с heartbeat-эффектом.

#### Структура компонента

```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │      Image Area               │  │
│  │   (with hover zoom effect)    │  │
│  │                               │  │
│  │ [Badge]              [♡ Fav] │  │
│  │ [New/Sale]                    │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Manufacturer                  │  │
│  │ Product Name (Heading style)  │  │
│  │ ★★★★☆ 4.8  (12 отзывов)       │  │
│  │ ● В наличии (5 шт)            │  │
│  │                               │  │
│  │ ┌───────────────────────────┐ │  │
│  │ │ 15 990 ₽   19 990 ₽ -20% │ │  │
│  │ │      [🛒 В корзину]       │ │  │
│  │ └───────────────────────────┘ │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 2.2. Image Area — Область изображения с Hover Zoom

#### Спецификация

| Параметр | Значение | Описание |
|----------|----------|----------|
| Aspect Ratio | `1:1` (квадрат) | Соотношение сторон |
| Min Height | `200px` | Минимальная высота (mobile) |
| Max Height | `320px` | Максимальная высота |
| Background | `var(--color-bg-base)` | Цвет фона (placeholder) |
| Object Fit | `cover` | Масштабирование изображения |
| Border Radius | `var(--radius-md)` | 12px скругление |
| Overflow | `hidden` | Обрезка при zoom |

#### CSS реализация

```css
.imageContainer {
  position: relative;
  width: 100%;
  padding-top: 100%; /* 1:1 aspect ratio */
  background: var(--color-bg-base);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow) var(--ease-out);
  will-change: transform;
}

/* Hover Zoom Effect */
.card:hover .image {
  transform: scale(1.08);
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .card:hover .image {
    transform: none;
  }
}
```

#### Плейсхолдер для отсутствующих изображений

```tsx
function ImagePlaceholder() {
  return (
    <div className={styles.placeholder}>
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
      </svg>
    </div>
  );
}
```

```css
.placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-bg-base) 0%, #e9ecef 100%);
}

.placeholder svg {
  width: 48px;
  height: 48px;
  color: var(--color-text-muted);
}
```

### 2.3. Add to Cart Button — Кнопка «В корзину» (Morphing Animation)

#### Состояния кнопки

| Состояние | Внешний вид | Анимация |
|-----------|-------------|----------|
| **Default** | Зелёный фон `var(--color-primary-500)` | - |
| **Hover** | Темнее `var(--color-primary-600)` | `translateY(-1px)`, shadow |
| **Active** | `var(--color-primary-700)` | `scale(0.98)` |
| **Disabled** | Серый `var(--color-bg-base)` | - |
| **Loading** | Зелёный + spinner | Пульсация, вращение |
| **Success** | Зелёный `var(--color-success)` | ✓ иконка, pulse |
| **Error** | Красный `var(--color-error)` | ✕ иконка, shake |

#### CSS спецификация с Morphing-анимацией

```css
.addToCartBtn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  
  padding: 10px 20px;
  min-width: 140px;
  min-height: 44px; /* Touch target */
  
  background: var(--color-primary-500);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-md);
  
  font-family: var(--font-body);
  font-size: var(--font-button);
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  
  cursor: pointer;
  overflow: hidden;
  transition: all var(--transition-fast) var(--ease-out);
}

.addToCartBtn:hover:not(:disabled) {
  background: var(--color-primary-600);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.addToCartBtn:active:not(:disabled) {
  background: var(--color-primary-700);
  transform: translateY(0) scale(0.98);
}

/* Disabled State */
.addToCartBtn:disabled {
  background: var(--color-bg-base);
  color: var(--color-text-muted);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Loading State - Morphing */
.addToCartBtn.loading {
  background: var(--color-primary-600);
  pointer-events: none;
  min-width: 120px;
}

.addToCartBtn.loading::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  border: 2px solid transparent;
  border-top-color: var(--color-text-inverse);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Success State - Morphing to checkmark */
.addToCartBtn.success {
  background: var(--color-success);
  animation: successPulse 0.4s var(--ease-bounce);
}

@keyframes successPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.addToCartBtn.success .btnIcon {
  animation: checkmarkIn 0.3s var(--ease-bounce);
}

@keyframes checkmarkIn {
  0% { 
    transform: scale(0) rotate(-45deg); 
    opacity: 0; 
  }
  100% { 
    transform: scale(1) rotate(0deg); 
    opacity: 1; 
  }
}

/* Error State - Shake animation */
.addToCartBtn.error {
  background: var(--color-error);
  animation: errorShake 0.4s ease-out;
}

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
```

#### React Implementation

```tsx
type ButtonState = 'default' | 'loading' | 'success' | 'error';

interface AddToCartButtonProps {
  productId: string;
  stock: number;
  isActive: boolean;
  onAddToCart: (productId: string) => Promise<void>;
}

export function AddToCartButton({ 
  productId, 
  stock, 
  isActive, 
  onAddToCart 
}: AddToCartButtonProps) {
  const [state, setState] = useState<ButtonState>('default');
  const isDisabled = stock === 0 || !isActive;

  const handleClick = async () => {
    if (isDisabled) return;
    
    setState('loading');
    try {
      await onAddToCart(productId);
      setState('success');
      setTimeout(() => setState('default'), 2000);
    } catch {
      setState('error');
      setTimeout(() => setState('default'), 2000);
    }
  };

  return (
    <button
      className={`${styles.addToCartBtn} ${styles[state]}`}
      onClick={handleClick}
      disabled={isDisabled || state === 'loading'}
      aria-label="Добавить в корзину"
      aria-busy={state === 'loading'}
    >
      {state === 'default' && (
        <>
          <CartIcon className={styles.btnIcon} aria-hidden="true" />
          <span>В корзину</span>
        </>
      )}
      {state === 'loading' && <span className="sr-only">Добавление...</span>}
      {state === 'success' && (
        <>
          <CheckIcon className={styles.btnIcon} aria-hidden="true" />
          <span>Добавлено</span>
        </>
      )}
      {state === 'error' && (
        <>
          <CrossIcon className={styles.btnIcon} aria-hidden="true" />
          <span>Ошибка</span>
        </>
      )}
    </button>
  );
}
```

### 2.4. Favorite Button — Кнопка «В избранное» (Heartbeat Animation)

#### Спецификация

| Параметр | Значение |
|----------|----------|
| Размер | `40×40px` (touch-friendly) |
| Форма | Круглая (`border-radius: 50%`) |
| Позиция | Правый верхний угол изображения |
| Цвет фона (default) | `var(--glass-surface-light)` |
| Цвет фона (hover) | `var(--color-bg-elevated)` |
| Цвет иконки (default) | `var(--color-text-secondary)` |
| Цвет иконки (active) | `var(--color-error)` (#C62828) |
| Backdrop Filter | `blur(8px)` |

#### CSS с Heartbeat Animation

```css
.favoriteBtn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  background: var(--glass-surface-light);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease-out);
}

.favoriteBtn:hover {
  background: var(--color-bg-elevated);
  transform: scale(1.1);
  box-shadow: var(--shadow-sm);
}

.favoriteBtn:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

.heartIcon {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: var(--color-text-secondary);
  stroke-width: 2;
  transition: all var(--transition-base) var(--ease-out);
}

/* Active State - Filled Heart */
.favoriteBtn.active .heartIcon {
  fill: var(--color-error);
  stroke: var(--color-error);
  animation: heartBeat 0.6s ease-in-out;
}

@keyframes heartBeat {
  0% { transform: scale(1); }
  15% { transform: scale(1.3); }
  30% { transform: scale(1); }
  45% { transform: scale(1.2); }
  60% { transform: scale(1); }
  75% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Ripple Effect on Click */
.favoriteBtn::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(198, 40, 40, 0.3);
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
}

.favoriteBtn.active::after {
  animation: ripple 0.6s ease-out;
}

@keyframes ripple {
  0% { 
    transform: scale(0); 
    opacity: 1; 
  }
  100% { 
    transform: scale(2); 
    opacity: 0; 
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .favoriteBtn.active .heartIcon {
    animation: none;
  }
  
  .favoriteBtn.active::after {
    animation: none;
  }
}
```

#### React Implementation

```tsx
interface FavoriteButtonProps {
  productId: string;
  isFavorite: boolean;
  onToggle: (productId: string) => void;
}

export function FavoriteButton({ 
  productId, 
  isFavorite, 
  onToggle 
}: FavoriteButtonProps) {
  return (
    <button
      className={`${styles.favoriteBtn} ${isFavorite ? styles.active : ''}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(productId);
      }}
      aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
      aria-pressed={isFavorite}
    >
      <svg 
        viewBox="0 0 24 24" 
        className={styles.heartIcon}
        aria-hidden="true"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    </button>
  );
}
```

### 2.5. Price Display — Отображение цены

#### Спецификация

| Элемент | Стиль |
|---------|-------|
| Текущая цена | `16px / 700`, `var(--color-text-primary)` |
| Старая цена | `12px / 400`, `var(--color-text-muted)`, зачёркнута |
| Процент скидки | `12px / 600`, `var(--color-error)` |

#### Варианты отображения

```
┌─────────────────────────┐
│ 15 990 ₽               │  ← Обычная цена
└─────────────────────────┘

┌─────────────────────────┐
│ 15 990 ₽               │  ← Цена со скидкой
│ 19 990 ₽  -20%         │
└─────────────────────────┘

┌─────────────────────────┐
│ от 1 332 ₽/мес         │  ← Рассрочка (опционально)
└─────────────────────────┘
```

#### CSS и React Implementation

```tsx
interface PriceDisplayProps {
  price: number;
  oldPrice?: number;
  showInstallment?: boolean;
}

export function PriceDisplay({ 
  price, 
  oldPrice, 
  showInstallment = false 
}: PriceDisplayProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const hasDiscount = oldPrice && oldPrice > price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - price / oldPrice!) * 100) 
    : 0;

  const installmentPrice = Math.round(price / 12);

  return (
    <div className={styles.priceContainer}>
      <div className={styles.prices}>
        <span className={styles.currentPrice}>
          {formatPrice(price)}
        </span>
        {hasDiscount && (
          <div className={styles.discountInfo}>
            <span className={styles.oldPrice}>
              {formatPrice(oldPrice!)}
            </span>
            <span className={styles.discountPercent}>
              -{discountPercent}%
            </span>
          </div>
        )}
      </div>
      {showInstallment && (
        <span className={styles.installment}>
          от {formatPrice(installmentPrice)}/мес
        </span>
      )}
    </div>
  );
}
```

```css
.priceContainer {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.prices {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.currentPrice {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.discountInfo {
  display: flex;
  align-items: center;
  gap: 6px;
}

.oldPrice {
  font-size: 12px;
  color: var(--color-text-muted);
  text-decoration: line-through;
}

.discountPercent {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-error);
  padding: 2px 6px;
  background: rgba(198, 40, 40, 0.1);
  border-radius: var(--radius-sm);
}

.installment {
  font-size: 11px;
  color: var(--color-text-secondary);
}
```

### 2.6. Badges — Бейджи (New, Sale, Hit)

#### Типы бейджей

| Тип | Цвет фона | Цвет текста | Условие отображения |
|-----|-----------|-------------|---------------------|
| **New** | `var(--color-info)` (#1565C0) | `#fff` | Товар добавлен < 30 дней |
| **Sale** | `var(--color-error)` (#C62828) | `#fff` | Есть скидка |
| **Hit** | `var(--color-accent-500)` (#FFC107) | `var(--color-text-primary)` | Рейтинг ≥ 4.8 |
| **Out of Stock** | `var(--color-text-secondary)` | `#fff` | Остаток = 0 |
| **Low Stock** | `var(--color-warning)` (#F57C00) | `#fff` | Остаток 1-3 шт |

#### Позиционирование

```
┌───────────────────────────────┐
│ [New] [Sale]          [♡]    │  ← Верх: левый край + правый край
│                               │
│         IMAGE                 │
│                               │
│                        [Hit]  │  ← Низ: правый угол (опционально)
└───────────────────────────────┘
```

#### CSS

```css
.badgeContainer {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 5;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.badge.new {
  background: var(--color-info);
  color: var(--color-text-inverse);
}

.badge.sale {
  background: var(--color-error);
  color: var(--color-text-inverse);
}

.badge.hit {
  background: var(--color-accent-500);
  color: var(--color-text-primary);
}

.badge.outOfStock {
  background: var(--color-text-secondary);
  color: var(--color-text-inverse);
}

.badge.lowStock {
  background: var(--color-warning);
  color: var(--color-text-inverse);
}

/* Hit badge - bottom right position */
.hitBadge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  top: auto;
  left: auto;
}

/* Приоритет отображения: Sale > New > Hit */
```

### 2.7. Stock Status — Статус наличия

```tsx
interface StockStatusProps {
  stock: number;
}

export function StockStatus({ stock }: StockStatusProps) {
  if (stock === 0) {
    return (
      <span className={styles.outOfStock}>
        <span className={styles.dot} aria-hidden="true" />
        Нет в наличии
      </span>
    );
  }
  if (stock <= 3) {
    return (
      <span className={styles.lowStock}>
        <span className={styles.dot} aria-hidden="true" />
        Мало ({stock} шт)
      </span>
    );
  }
  return (
    <span className={styles.inStock}>
      <span className={styles.dot} aria-hidden="true" />
      В наличии ({stock} шт)
    </span>
  );
}
```

```css
.inStock,
.lowStock,
.outOfStock {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  margin: 4px 0;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.inStock {
  color: var(--color-success);
}

.inStock .dot {
  background: var(--color-success);
}

.lowStock {
  color: var(--color-warning);
}

.lowStock .dot {
  background: var(--color-warning);
}

.outOfStock {
  color: var(--color-error);
}

.outOfStock .dot {
  background: var(--color-error);
}
```

### 2.8. Полная структура ProductCard

```tsx
interface Product {
  id: string;
  name: string;
  slug: string;
  manufacturer?: { name: string };
  price: number;
  oldPrice?: number;
  stock: number;
  isActive: boolean;
  rating?: number;
  reviewCount?: number;
  mainImage?: { url: string; alt?: string };
  createdAt: string;
  isFavorite?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => Promise<void>;
  onToggleFavorite: (productId: string) => void;
}

export function ProductCard({ 
  product, 
  onAddToCart, 
  onToggleFavorite 
}: ProductCardProps) {
  const isNew = isProductNew(product.createdAt);
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const isHit = product.rating && product.rating >= 4.8;

  return (
    <article 
      className={styles.card}
      aria-label={`Товар: ${product.name}`}
    >
      {/* Image Area */}
      <div className={styles.imageContainer}>
        <a href={`/products/${product.slug}`}>
          {product.mainImage ? (
            <img
              src={product.mainImage.url}
              alt={product.mainImage.alt || product.name}
              className={styles.image}
              loading="lazy"
              width="300"
              height="300"
            />
          ) : (
            <ImagePlaceholder />
          )}
        </a>
        
        {/* Badges */}
        <div className={styles.badgeContainer}>
          {isNew && <Badge type="new">New</Badge>}
          {hasDiscount && (
            <Badge type="sale">
              -{calculateDiscount(product.price, product.oldPrice!)}%
            </Badge>
          )}
        </div>
        
        {/* Favorite Button */}
        <FavoriteButton
          productId={product.id}
          isFavorite={product.isFavorite || false}
          onToggle={onToggleFavorite}
        />
        
        {/* Hit Badge */}
        {isHit && (
          <Badge type="hit" className={styles.hitBadge}>
            Хит
          </Badge>
        )}
      </div>
      
      {/* Content */}
      <div className={styles.content}>
        {product.manufacturer && (
          <span className={styles.manufacturer}>
            {product.manufacturer.name}
          </span>
        )}
        
        <h3 className={styles.name}>
          <a href={`/products/${product.slug}`} className={styles.link}>
            {product.name}
          </a>
        </h3>
        
        {product.rating && (
          <Rating 
            value={product.rating} 
            count={product.reviewCount}
          />
        )}
        
        <StockStatus stock={product.stock} />
        
        <div className={styles.priceRow}>
          <PriceDisplay 
            price={product.price} 
            oldPrice={product.oldPrice} 
          />
          <AddToCartButton
            productId={product.id}
            stock={product.stock}
            isActive={product.isActive}
            onAddToCart={onAddToCart}
          />
        </div>
      </div>
    </article>
  );
}
```

```css
.card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: transform var(--transition-fast) var(--ease-out),
              box-shadow var(--transition-fast) var(--ease-out);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.content {
  padding: var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.manufacturer {
  font-size: var(--font-body-xs);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.name {
  font-family: var(--font-heading);
  font-size: var(--font-h5);
  font-weight: 500;
  line-height: 1.3;
}

.link {
  color: var(--color-text-primary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.link:hover {
  color: var(--color-primary-600);
}

.priceRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-top: auto;
  padding-top: var(--space-xs);
}

/* Responsive */
@media (min-width: 768px) {
  .card {
    flex-direction: column;
  }
  
  .priceRow {
    flex-direction: row;
  }
}

@media (min-width: 1024px) {
  .content {
    padding: var(--space-md);
  }
}
```

---

## 3. Catalog Sidebar — Боковая панель каталога

### 3.1. Общее описание

Боковая панель каталога содержит фильтры для навигации по товарам. Выполнена в стиле Glassmorphism с размытым фоном согласно дизайн-системе GoldPC.

#### Структура

```
┌─────────────────────────────────────┐
│  ☰ Фильтры                    [✕]  │  ← Заголовок (мобильный)
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │ ▼ КАТЕГОРИИ                 │    │  ← Раскрывающаяся группа
│  │   • Процессоры         (42)│    │
│  │   • Видеокарты         (38)│    │
│  │   • Материнские платы  (56)│    │
│  │   • ОЗУ                (89)│    │
│  │   ▸ Показать ещё...        │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ▼ ЦЕНА                      │    │
│  │   От: [_______] До: [_______]│   │
│  │   ──────●──────────────●───  │   │  ← Dual Range Slider
│  │   0 ₽           150 000 ₽   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ▼ ПРОИЗВОДИТЕЛИ             │    │
│  │   ☑ AMD                (24)│    │
│  │   ☐ Intel              (32)│    │
│  │   ☐ NVIDIA             (18)│    │
│  │   [Показать ещё 12...]      │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ▼ НАЛИЧИЕ                   │    │
│  │   ☑ В наличии               │    │
│  │   ☐ Под заказ               │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  [⟲ Сбросить все фильтры]   │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### 3.2. Glassmorphism Background

#### Спецификация

| Параметр | Значение |
|----------|----------|
| Background | `var(--glass-surface-medium)` |
| Backdrop Filter | `blur(20px) saturate(180%)` |
| Border | `1px solid rgba(255, 255, 255, 0.3)` |
| Border Radius | `var(--radius-xl)` (24px) |
| Box Shadow | `var(--shadow-glass)` |

#### CSS реализация

```css
.sidebar {
  position: sticky;
  top: 80px;
  width: 100%;
  max-width: 320px;
  height: fit-content;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  
  /* Glassmorphism */
  background: var(--glass-surface-medium);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-glass);
  
  padding: var(--space-md);
}

/* Fallback для браузеров без поддержки backdrop-filter */
@supports not (backdrop-filter: blur(20px)) {
  .sidebar {
    background: var(--color-bg-surface);
  }
}

/* Dark mode (опционально) */
@media (prefers-color-scheme: dark) {
  .sidebar {
    background: var(--glass-surface-dark);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

/* Custom scrollbar */
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}
```

### 3.3. Filter Groups — Группы фильтров

#### Структура компонента

```tsx
interface FilterGroupProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}

export function FilterGroup({ 
  title, 
  icon, 
  defaultOpen = true, 
  count,
  children 
}: FilterGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  return (
    <div className={styles.filterGroup}>
      <button
        className={styles.filterHeader}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        type="button"
      >
        {icon && <span className={styles.headerIcon}>{icon}</span>}
        <span className={styles.headerTitle}>{title}</span>
        {count !== undefined && (
          <span className={styles.headerCount}>{count}</span>
        )}
        <ChevronIcon 
          className={`${styles.chevron} ${isOpen ? styles.rotated : ''}`}
          aria-hidden="true"
        />
      </button>
      
      <div 
        ref={contentRef}
        className={`${styles.filterContent} ${isOpen ? styles.open : ''}`}
        style={{ '--content-height': `${contentHeight}px` } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
```

#### CSS

```css
.filterGroup {
  margin-bottom: var(--space-sm);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding-bottom: var(--space-sm);
}

.filterGroup:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.filterHeader {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: color var(--transition-fast);
}

.filterHeader:hover {
  color: var(--color-text-primary);
}

.filterHeader:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.headerIcon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  color: var(--color-text-muted);
}

.headerTitle {
  flex: 1;
}

.headerCount {
  font-size: 10px;
  color: var(--color-text-muted);
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  margin-right: 8px;
}

.chevron {
  width: 16px;
  height: 16px;
  color: var(--color-text-muted);
  transition: transform var(--transition-base) var(--ease-out);
}

.chevron.rotated {
  transform: rotate(180deg);
}

.filterContent {
  max-height: 0;
  overflow: hidden;
  transition: max-height var(--transition-slow) var(--ease-out);
}

.filterContent.open {
  max-height: var(--content-height, 500px);
  padding-top: var(--space-xs);
}
```

### 3.4. Category Filter — Фильтр по категориям

```tsx
interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  icon?: string;
  children?: Category[];
}

interface CategoryFilterProps {
  categories: Category[];
  selected: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function CategoryFilter({ 
  categories, 
  selected, 
  onSelect 
}: CategoryFilterProps) {
  const totalProducts = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <FilterGroup 
      title="Категории" 
      icon={<CategoryIcon />}
    >
      <ul className={styles.categoryList} role="listbox">
        <li>
          <button
            className={`${styles.categoryItem} ${!selected ? styles.active : ''}`}
            onClick={() => onSelect(null)}
            role="option"
            aria-selected={!selected}
          >
            <span className={styles.categoryName}>Все товары</span>
            <span className={styles.count}>{totalProducts}</span>
          </button>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <button
              className={`${styles.categoryItem} ${selected === category.id ? styles.active : ''}`}
              onClick={() => onSelect(category.id)}
              role="option"
              aria-selected={selected === category.id}
            >
              {category.icon && (
                <img 
                  src={category.icon} 
                  alt="" 
                  className={styles.categoryIcon}
                  aria-hidden="true"
                />
              )}
              <span className={styles.categoryName}>{category.name}</span>
              <span className={styles.count}>{category.count}</span>
            </button>
          </li>
        ))}
      </ul>
    </FilterGroup>
  );
}
```

```css
.categoryList {
  list-style: none;
  padding: 0;
  margin: 0;
}

.categoryItem {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease-out);
  font-family: var(--font-body);
  font-size: var(--font-body-sm);
  color: var(--color-text-secondary);
  text-align: left;
}

.categoryItem:hover {
  background: rgba(76, 175, 80, 0.08);
  color: var(--color-primary-600);
}

.categoryItem:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: -2px;
}

.categoryItem.active {
  background: rgba(76, 175, 80, 0.12);
  color: var(--color-primary-700);
  font-weight: 500;
}

.categoryIcon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  object-fit: contain;
  opacity: 0.7;
}

.categoryName {
  flex: 1;
}

.count {
  font-size: var(--font-body-xs);
  color: var(--color-text-muted);
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.categoryItem.active .count {
  background: rgba(76, 175, 80, 0.15);
  color: var(--color-primary-600);
}
```

### 3.5. Price Range Filter — Фильтр по цене

```tsx
interface PriceRangeFilterProps {
  min: number;
  max: number;
  currentMin: number;
  currentMax: number;
  onChange: (min: number, max: number) => void;
  currency?: string;
}

export function PriceRangeFilter({
  min,
  max,
  currentMin,
  currentMax,
  onChange,
  currency = '₽'
}: PriceRangeFilterProps) {
  const [localMin, setLocalMin] = useState(currentMin.toString());
  const [localMax, setLocalMax] = useState(currentMax.toString());

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('ru-RU').format(value);
  };

  const handleMinBlur = () => {
    const num = parseInt(localMin) || min;
    const clamped = Math.max(min, Math.min(num, currentMax));
    setLocalMin(clamped.toString());
    onChange(clamped, currentMax);
  };

  const handleMaxBlur = () => {
    const num = parseInt(localMax) || max;
    const clamped = Math.min(max, Math.max(num, currentMin));
    setLocalMax(clamped.toString());
    onChange(currentMin, clamped);
  };

  return (
    <FilterGroup title="Цена" icon={<PriceIcon />}>
      <div className={styles.priceInputs}>
        <div className={styles.inputGroup}>
          <label htmlFor="price-min" className={styles.inputLabel}>
            От
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="price-min"
              type="number"
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              onBlur={handleMinBlur}
              min={min}
              max={max}
              className={styles.priceInput}
            />
            <span className={styles.currency}>{currency}</span>
          </div>
        </div>
        
        <span className={styles.separator}>—</span>
        
        <div className={styles.inputGroup}>
          <label htmlFor="price-max" className={styles.inputLabel}>
            До
          </label>
          <div className={styles.inputWrapper}>
            <input
              id="price-max"
              type="number"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              onBlur={handleMaxBlur}
              min={min}
              max={max}
              className={styles.priceInput}
            />
            <span className={styles.currency}>{currency}</span>
          </div>
        </div>
      </div>
      
      <DualRangeSlider
        min={min}
        max={max}
        currentMin={currentMin}
        currentMax={currentMax}
        onChange={onChange}
      />
      
      <div className={styles.priceLabels}>
        <span>{formatPrice(min)} {currency}</span>
        <span>{formatPrice(max)} {currency}</span>
      </div>
    </FilterGroup>
  );
}
```

```css
.priceInputs {
  display: flex;
  align-items: flex-end;
  gap: var(--space-xs);
  margin-bottom: var(--space-sm);
}

.inputGroup {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inputLabel {
  font-size: var(--font-label);
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.inputWrapper {
  position: relative;
}

.priceInput {
  width: 100%;
  padding: 8px 30px 8px 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--font-body-sm);
  background: rgba(255, 255, 255, 0.8);
  transition: border-color var(--transition-fast), 
              box-shadow var(--transition-fast);
}

.priceInput:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
}

.currency {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--font-body-xs);
  color: var(--color-text-muted);
  pointer-events: none;
}

.separator {
  color: var(--color-text-muted);
  font-size: var(--font-body-sm);
  margin-bottom: 8px;
}

.priceLabels {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-xs);
  font-size: var(--font-body-xs);
  color: var(--color-text-muted);
}

/* Dual Range Slider */
.dualRangeSlider {
  position: relative;
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  margin: var(--space-sm) 0;
}

.dualRangeSliderTrack {
  position: absolute;
  height: 100%;
  background: var(--color-primary-500);
  border-radius: 2px;
}

.dualRangeSliderThumb {
  position: absolute;
  width: 18px;
  height: 18px;
  background: var(--color-bg-elevated);
  border: 2px solid var(--color-primary-500);
  border-radius: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
  transition: box-shadow var(--transition-fast);
}

.dualRangeSliderThumb:hover {
  box-shadow: 0 0 0 6px rgba(76, 175, 80, 0.15);
}

.dualRangeSliderThumb:active {
  cursor: grabbing;
  box-shadow: 0 0 0 8px rgba(76, 175, 80, 0.2);
}

.dualRangeSliderThumb:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

### 3.6. Manufacturer Filter — Фильтр по производителю

```tsx
interface Manufacturer {
  id: string;
  name: string;
  logo?: string;
  count: number;
}

interface ManufacturerFilterProps {
  manufacturers: Manufacturer[];
  selected: string[];
  onChange: (selected: string[]) => void;
  maxVisible?: number;
}

export function ManufacturerFilter({
  manufacturers,
  selected,
  onChange,
  maxVisible = 5
}: ManufacturerFilterProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleManufacturers = showAll 
    ? manufacturers 
    : manufacturers.slice(0, maxVisible);
  const hasMore = manufacturers.length > maxVisible;

  const handleToggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((i) => i !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <FilterGroup 
      title="Производители" 
      icon={<FactoryIcon />}
      count={selected.length || undefined}
    >
      <div className={styles.manufacturerList}>
        {visibleManufacturers.map((manufacturer) => (
          <label 
            key={manufacturer.id} 
            className={styles.manufacturerItem}
          >
            <input
              type="checkbox"
              checked={selected.includes(manufacturer.id)}
              onChange={() => handleToggle(manufacturer.id)}
              className="sr-only"
            />
            <span 
              className={`${styles.checkbox} ${selected.includes(manufacturer.id) ? styles.checked : ''}`}
              aria-hidden="true"
            >
              {selected.includes(manufacturer.id) && <CheckIcon />}
            </span>
            
            {manufacturer.logo ? (
              <img 
                src={manufacturer.logo} 
                alt={manufacturer.name} 
                className={styles.manufacturerLogo}
              />
            ) : null}
            
            <span className={styles.manufacturerName}>
              {manufacturer.name}
            </span>
            
            <span className={styles.count}>
              {manufacturer.count}
            </span>
          </label>
        ))}
      </div>
      
      {hasMore && (
        <button
          className={styles.showMoreBtn}
          onClick={() => setShowAll(!showAll)}
          type="button"
        >
          {showAll 
            ? 'Свернуть' 
            : `Показать ещё (${manufacturers.length - maxVisible})`
          }
        </button>
      )}
    </FilterGroup>
  );
}
```

```css
.manufacturerList {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.manufacturerItem {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.manufacturerItem:hover {
  background: rgba(0, 0, 0, 0.03);
}

.manufacturerItem:focus-within {
  outline: 2px solid var(--color-primary-500);
  outline-offset: -2px;
}

.checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-text-muted);
  border-radius: 4px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.checkbox.checked {
  background: var(--color-primary-500);
  border-color: var(--color-primary-500);
}

.checkbox svg {
  width: 12px;
  height: 12px;
  color: var(--color-text-inverse);
}

.manufacturerLogo {
  width: 24px;
  height: 24px;
  object-fit: contain;
  margin-right: 10px;
}

.manufacturerName {
  flex: 1;
  font-size: var(--font-body-sm);
  color: var(--color-text-primary);
}

.showMoreBtn {
  display: block;
  width: 100%;
  padding: 10px;
  margin-top: var(--space-xs);
  background: transparent;
  border: 1px dashed rgba(0, 0, 0, 0.15);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--font-body-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.showMoreBtn:hover {
  border-color: var(--color-primary-500);
  color: var(--color-primary-600);
}
```

### 3.7. Reset Filters Button

```tsx
interface ResetFiltersButtonProps {
  hasActiveFilters: boolean;
  onReset: () => void;
}

export function ResetFiltersButton({ 
  hasActiveFilters, 
  onReset 
}: ResetFiltersButtonProps) {
  if (!hasActiveFilters) return null;

  return (
    <button 
      className={styles.resetBtn} 
      onClick={onReset}
      type="button"
    >
      <ResetIcon aria-hidden="true" />
      <span>Сбросить все фильтры</span>
    </button>
  );
}
```

```css
.resetBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  width: 100%;
  padding: 12px;
  margin-top: var(--space-sm);
  background: rgba(198, 40, 40, 0.08);
  border: 1px solid rgba(198, 40, 40, 0.2);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-family: var(--font-body);
  font-size: var(--font-body-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.resetBtn:hover {
  background: rgba(198, 40, 40, 0.12);
  border-color: var(--color-error);
}

.resetBtn:focus-visible {
  outline: 2px solid var(--color-error);
  outline-offset: 2px;
}

.resetBtn svg {
  width: 16px;
  height: 16px;
}
```

### 3.8. Mobile Sidebar

```tsx
export function MobileSidebar({
  isOpen,
  onClose,
  children
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className={styles.backdrop}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
        aria-label="Фильтры каталога"
      >
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Фильтры</h2>
          <button 
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Закрыть фильтры"
          >
            <CloseIcon aria-hidden="true" />
          </button>
        </div>
        
        <div className={styles.sidebarContent}>
          {children}
        </div>
      </aside>
    </>
  );
}
```

```css
/* Mobile Styles */
@media (max-width: 767px) {
  .backdrop {
    position: fixed;
    inset: 0;
    background: var(--color-bg-overlay);
    backdrop-filter: blur(4px);
    z-index: 999;
    animation: fadeIn var(--transition-fast) var(--ease-out);
  }
  
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    max-width: 320px;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform var(--transition-base) var(--ease-out);
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .sidebarHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-sm) var(--space-md);
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
  
  .sidebarTitle {
    font-family: var(--font-heading);
    font-size: var(--font-h5);
    font-weight: 600;
    color: var(--color-text-primary);
  }
  
  .closeBtn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    color: var(--color-text-secondary);
  }
  
  .closeBtn:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  .sidebarContent {
    padding: var(--space-sm) var(--space-md);
    overflow-y: auto;
    max-height: calc(100vh - 70px);
  }
}

/* Desktop: show sidebar inline */
@media (min-width: 768px) {
  .backdrop {
    display: none;
  }
  
  .sidebarHeader {
    display: none;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

---

## 4. PC Builder Interface — Интерфейс конструктора ПК

### 4.1. Общее описание

Конструктор ПК — интерактивный инструмент для сборки совместимых конфигураций компьютера с автоматической проверкой совместимости компонентов. Позволяет пользователям подобрать комплектующие с учётом технических ограничений.

#### Структура интерфейса

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          КОНСТРУКТОР ПК                                     │
├────────────────────────────────────────────────────────────────────────────┤
│  [🎮 Игровой]  [💼 Офисный]  [🖥️ Рабочая станция]  ← Выбор назначения      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────┐│
│  │   COMPONENT SLOTS                  │  │   SUMMARY PANEL                ││
│  │                                    │  │                                ││
│  │   ┌──────────────────────────────┐ │  │  ┌──────────────────────────┐  ││
│  │   │ 🔧 Процессор (CPU)           │ │  │  │ 📊 ИТОГО                 │  ││
│  │   │    ✓ AMD Ryzen 7 7800X3D     │ │  │  │    125 990 ₽            │  ││
│  │   │    32 990 ₽      [Изменить]  │ │  │  └──────────────────────────┘  ││
│  │   └──────────────────────────────┘ │  │                                ││
│  │                                    │  │  ┌──────────────────────────┐  ││
│  │   ┌──────────────────────────────┐ │  │  │ ✅ СОВМЕСТИМОСТЬ         │  ││
│  │   │ 🎮 Видеокарта (GPU)          │ │  │  │    Все компоненты        │  ││
│  │   │    ✓ NVIDIA RTX 4070 Super   │ │  │  │    совместимы            │  ││
│  │   │    58 990 ₽      [Изменить]  │ │  │  └──────────────────────────┘  ││
│  │   └──────────────────────────────┘ │  │                                ││
│  │                                    │  │  ┌──────────────────────────┐  ││
│  │   ┌──────────────────────────────┐ │  │  │ ⚡ ПИТАНИЕ               │  ││
│  │   │ ⚠️ Материнская плата         │ │  │  │    Потребление: ~520W    │  ││
│  │   │    ⚠ Сокет не совпадает!     │ │  │  │    Выбрано: 750W ✓      │  ││
│  │   │    [Выбрать совместимый →]   │ │  │  └──────────────────────────┘  ││
│  │   └──────────────────────────────┘ │  │                                ││
│  │                                    │  │  ─────────────────────────────  ││
│  │   ┌──────────────────────────────┐ │  │                                ││
│  │   │ + Оперативная память (RAM)   │ │  │  [💾 Сохранить сборку]        ││
│  │   │    [Выбрать компонент]       │ │  │  [🛒 Добавить в корзину]      ││
│  │   └──────────────────────────────┘ │  │  [📋 Экспорт в PDF]           ││
│  │   ...                              │  │                                ││
│  │                                    │  │                                ││
│  └────────────────────────────────────┘  └────────────────────────────────┘│
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.2. Component Slots — Слоты компонентов

#### Типы слотов и зависимости

| Слот | Иконка | Обязательный | Зависимости |
|------|--------|--------------|-------------|
| **Процессор (CPU)** | 🔧 | Да | — |
| **Материнская плата (MB)** | 🖥️ | Да | CPU socket |
| **Видеокарта (GPU)** | 🎮 | Нет* | PSU wattage, MB length |
| **Оперативная память (RAM)** | 💾 | Да | MB DDR type, max capacity |
| **Блок питания (PSU)** | ⚡ | Да | GPU + CPU wattage |
| **Накопитель (Storage)** | 📦 | Да | MB connectors |
| **Корпус (Case)** | 📦 | Да | MB form-factor, GPU length, cooler height |
| **Охлаждение CPU** | ❄️ | Нет | CPU socket, case clearance |

*\*Для игровых сборок видеокарта обязательна*

#### Структура слота

```tsx
type CompatibilityStatus = 'ok' | 'warning' | 'error' | 'empty';

interface ComponentSlotProps {
  type: ComponentType;
  label: string;
  icon: React.ReactNode;
  required: boolean;
  selectedComponent?: {
    id: string;
    name: string;
    image?: string;
    price: number;
    specs?: Record<string, string>;
  };
  compatibilityStatus: CompatibilityStatus;
  compatibilityMessage?: string;
  suggestedReplacement?: string;
  onSelect: () => void;
  onRemove?: () => void;
}

export function ComponentSlot({
  type,
  label,
  icon,
  required,
  selectedComponent,
  compatibilityStatus,
  compatibilityMessage,
  suggestedReplacement,
  onSelect,
  onRemove,
}: ComponentSlotProps) {
  const statusColors = {
    ok: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',
    empty: 'var(--color-text-muted)',
  };

  return (
    <div 
      className={`${styles.slot} ${styles[compatibilityStatus]}`}
      style={{ '--status-color': statusColors[compatibilityStatus] } as React.CSSProperties}
    >
      <div className={styles.slotHeader}>
        <span className={styles.slotIcon} aria-hidden="true">{icon}</span>
        <span className={styles.slotLabel}>{label}</span>
        {required && (
          <span className={styles.required} aria-label="Обязательно">*</span>
        )}
      </div>
      
      {selectedComponent ? (
        <div className={styles.selectedComponent}>
          <div className={styles.componentMain}>
            {selectedComponent.image ? (
              <img 
                src={selectedComponent.image} 
                alt={selectedComponent.name}
                className={styles.componentImage}
                loading="lazy"
              />
            ) : (
              <div className={styles.imagePlaceholder}>
                <ComponentIcon type={type} />
              </div>
            )}
            
            <div className={styles.componentInfo}>
              <span className={styles.componentName}>
                {selectedComponent.name}
              </span>
              <span className={styles.componentPrice}>
                {formatPrice(selectedComponent.price)}
              </span>
            </div>
            
            <div className={styles.slotActions}>
              <button 
                className={styles.changeBtn}
                onClick={onSelect}
                type="button"
              >
                Изменить
              </button>
              {!required && onRemove && (
                <button 
                  className={styles.removeBtn}
                  onClick={onRemove}
                  type="button"
                  aria-label="Удалить компонент"
                >
                  <CloseIcon aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          
          {/* Compatibility Error */}
          {compatibilityStatus === 'error' && compatibilityMessage && (
            <div className={styles.compatibilityError} role="alert">
              <WarningIcon className={styles.errorIcon} aria-hidden="true" />
              <span>{compatibilityMessage}</span>
            </div>
          )}
          
          {/* Suggested Replacement */}
          {compatibilityStatus === 'error' && suggestedReplacement && (
            <button 
              className={styles.suggestBtn}
              onClick={onSelect}
              type="button"
            >
              Выбрать совместимый →
            </button>
          )}
        </div>
      ) : (
        <button 
          className={styles.selectBtn}
          onClick={onSelect}
          type="button"
        >
          <span className={styles.selectIcon} aria-hidden="true">+</span>
          <span>Выбрать {label.toLowerCase()}</span>
        </button>
      )}
    </div>
  );
}
```

#### CSS стили слота

```css
.slot {
  background: var(--color-bg-surface);
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
  transition: all var(--transition-base) var(--ease-out);
}

.slot:hover {
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: var(--shadow-sm);
}

/* Status States */
.slot.ok {
  border-color: var(--color-success);
  background: rgba(46, 125, 50, 0.02);
}

.slot.warning {
  border-color: var(--color-warning);
  background: rgba(245, 124, 0, 0.02);
}

.slot.error {
  border-color: var(--color-error);
  background: rgba(198, 40, 40, 0.03);
}

.slotHeader {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-sm);
  font-size: var(--font-body-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.slotIcon {
  font-size: 18px;
  margin-right: var(--space-xs);
}

.slotLabel {
  flex: 1;
}

.required {
  color: var(--color-error);
  font-size: var(--font-body-md);
}

/* Selected Component */
.selectedComponent {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.componentMain {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
}

.componentImage {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: var(--radius-md);
  background: var(--color-bg-base);
  padding: 4px;
}

.imagePlaceholder {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-base);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
}

.componentInfo {
  flex: 1;
  min-width: 150px;
}

.componentName {
  display: block;
  font-size: var(--font-body-sm);
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 2px;
  line-height: 1.3;
}

.componentPrice {
  font-size: var(--font-body-sm);
  font-weight: 600;
  color: var(--color-primary-600);
}

/* Slot Actions */
.slotActions {
  display: flex;
  gap: var(--space-xs);
  margin-left: auto;
}

.changeBtn {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--font-body-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.changeBtn:hover {
  border-color: var(--color-primary-500);
  color: var(--color-primary-600);
}

.removeBtn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.removeBtn:hover {
  background: rgba(198, 40, 40, 0.1);
  color: var(--color-error);
}

/* Compatibility Error */
.compatibilityError {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xs);
  width: 100%;
  padding: var(--space-xs) var(--space-sm);
  background: rgba(198, 40, 40, 0.08);
  border-radius: var(--radius-md);
  font-size: var(--font-body-xs);
  color: var(--color-error);
  line-height: 1.4;
}

.errorIcon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

/* Suggest Button */
.suggestBtn {
  display: block;
  width: 100%;
  padding: var(--space-sm);
  margin-top: var(--space-xs);
  background: var(--color-primary-500);
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-inverse);
  font-family: var(--font-body);
  font-size: var(--font-body-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.suggestBtn:hover {
  background: var(--color-primary-600);
}

/* Select Button (empty slot) */
.selectBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  width: 100%;
  padding: var(--space-md);
  background: rgba(76, 175, 80, 0.05);
  border: 2px dashed var(--color-primary-400);
  border-radius: var(--radius-md);
  color: var(--color-primary-600);
  font-family: var(--font-body);
  font-size: var(--font-body-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.selectBtn:hover {
  background: rgba(76, 175, 80, 0.1);
  border-color: var(--color-primary-500);
}

.selectIcon {
  font-size: 18px;
  font-weight: bold;
}
```

### 4.3. Compatibility Status Indicator — Индикатор совместимости

#### Визуальное представление

```
┌────────────────────────────────────┐
│ ✅ СОВМЕСТИМОСТЬ                   │  ← Все компоненты совместимы
│    Все компоненты совместимы       │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ ⚠️ ВНИМАНИЕ                       │  ← Есть предупреждения
│    Рекомендуется БП мощнее         │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ ❌ ОШИБКА СОВМЕСТИМОСТИ            │  ← Критическая ошибка
│    Сокет MB не совпадает с CPU     │
│    [Исправить автоматически →]     │
└────────────────────────────────────┘
```

#### Компонент индикатора

```tsx
interface CompatibilityIndicatorProps {
  status: 'ok' | 'warning' | 'error';
  issues: Array<{
    type: 'error' | 'warning';
    message: string;
    componentType?: ComponentType;
    suggestion?: string;
  }>;
  onAutoFix?: () => void;
}

export function CompatibilityIndicator({
  status,
  issues,
  onAutoFix,
}: CompatibilityIndicatorProps) {
  const hasErrors = issues.some(i => i.type === 'error');
  
  return (
    <div className={`${styles.indicator} ${styles[status]}`}>
      <div className={styles.indicatorHeader}>
        <StatusIcon status={status} className={styles.statusIcon} />
        <span className={styles.indicatorTitle}>
          {status === 'ok' && 'Совместимость'}
          {status === 'warning' && 'Внимание'}
          {status === 'error' && 'Ошибка совместимости'}
        </span>
      </div>
      
      {status === 'ok' && (
        <p className={styles.successMessage}>
          Все компоненты совместимы
        </p>
      )}
      
      {(status === 'warning' || status === 'error') && (
        <ul className={styles.issuesList}>
          {issues.map((issue, index) => (
            <li 
              key={index}
              className={styles[issue.type]}
            >
              <IssueIcon type={issue.type} />
              <span>{issue.message}</span>
              {issue.suggestion && (
                <span className={styles.suggestion}>
                  {issue.suggestion}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      
      {hasErrors && onAutoFix && (
        <button 
          className={styles.autoFixBtn}
          onClick={onAutoFix}
          type="button"
        >
          <WandIcon />
          Исправить автоматически
        </button>
      )}
    </div>
  );
}
```

#### CSS

```css
.indicator {
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  transition: all var(--transition-base);
}

.indicator.ok {
  background: rgba(46, 125, 50, 0.08);
  border: 1px solid rgba(46, 125, 50, 0.2);
}

.indicator.warning {
  background: rgba(245, 124, 0, 0.08);
  border: 1px solid rgba(245, 124, 0, 0.2);
}

.indicator.error {
  background: rgba(198, 40, 40, 0.08);
  border: 1px solid rgba(198, 40, 40, 0.2);
}

.indicatorHeader {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-xs);
}

.statusIcon {
  width: 20px;
  height: 20px;
}

.indicator.ok .statusIcon {
  color: var(--color-success);
}

.indicator.warning .statusIcon {
  color: var(--color-warning);
}

.indicator.error .statusIcon {
  color: var(--color-error);
}

.indicatorTitle {
  font-size: var(--font-body-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.successMessage {
  font-size: var(--font-body-sm);
  color: var(--color-success);
  margin: 0;
}

.issuesList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.issuesList li {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 6px;
  font-size: var(--font-body-xs);
  line-height: 1.4;
}

.issuesList li.error {
  color: var(--color-error);
}

.issuesList li.warning {
  color: #B45309;
}

.issuesList li svg {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin-top: 2px;
}

.suggestion {
  width: 100%;
  margin-left: 20px;
  font-size: var(--font-body-xs);
  color: var(--color-text-secondary);
  font-style: italic;
}

.autoFixBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  width: 100%;
  padding: var(--space-sm);
  margin-top: var(--space-sm);
  background: var(--color-primary-500);
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-inverse);
  font-family: var(--font-body);
  font-size: var(--font-body-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.autoFixBtn:hover {
  background: var(--color-primary-600);
}

.autoFixBtn svg {
  width: 16px;
  height: 16px;
}
```

### 4.4. Summary Panel — Панель итогов

```tsx
interface SummaryPanelProps {
  components: SelectedComponent[];
  totalPrice: number;
  powerConsumption: number;
  psuWattage?: number;
  compatibilityStatus: 'ok' | 'warning' | 'error';
  issues: CompatibilityIssue[];
  onSave: () => void;
  onAddToCart: () => void;
  onExport: () => void;
}

export function SummaryPanel({
  components,
  totalPrice,
  powerConsumption,
  psuWattage,
  compatibilityStatus,
  issues,
  onSave,
  onAddToCart,
  onExport,
}: SummaryPanelProps) {
  const hasPsu = psuWattage !== undefined;
  const powerOk = hasPsu && psuWattage >= powerConsumption * 1.2;
  const powerWarning = hasPsu && !powerOk;

  return (
    <aside className={styles.summaryPanel}>
      {/* Total Price */}
      <div className={styles.totalSection}>
        <span className={styles.totalLabel}>Итого:</span>
        <span className={styles.totalPrice}>
          {formatPrice(totalPrice)}
        </span>
      </div>
      
      {/* Compatibility Status */}
      <CompatibilityIndicator
        status={compatibilityStatus}
        issues={issues}
      />
      
      {/* Power Info */}
      <div className={styles.powerSection}>
        <h4 className={styles.sectionTitle}>⚡ Питание</h4>
        <div className={styles.powerInfo}>
          <div className={styles.powerRow}>
            <span>Потребление:</span>
            <span>~{powerConsumption}W</span>
          </div>
          {hasPsu && (
            <div className={`${styles.powerRow} ${powerWarning ? styles.warning : ''}`}>
              <span>Блок питания:</span>
              <span>
                {psuWattage}W 
                {powerOk && <CheckIcon className={styles.powerOk} />}
                {powerWarning && <WarningIcon className={styles.powerWarning} />}
              </span>
            </div>
          )}
          {!hasPsu && (
            <div className={styles.powerSuggestion}>
              Рекомендуется БП от {Math.ceil(powerConsumption * 1.3)}W
            </div>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={styles.primaryBtn}
          onClick={onAddToCart}
          disabled={compatibilityStatus === 'error'}
          type="button"
        >
          <CartIcon />
          Добавить в корзину
        </button>
        
        <button
          className={styles.secondaryBtn}
          onClick={onSave}
          type="button"
        >
          <SaveIcon />
          Сохранить сборку
        </button>
        
        <button
          className={styles.tertiaryBtn}
          onClick={onExport}
          type="button"
        >
          <ExportIcon />
          Экспорт в PDF
        </button>
      </div>
    </aside>
  );
}
```

```css
.summaryPanel {
  position: sticky;
  top: 80px;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--glass-surface-medium);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-glass);
}

.totalSection {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.totalLabel {
  font-size: var(--font-body-xs);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.totalPrice {
  font-family: var(--font-heading);
  font-size: var(--font-h3);
  font-weight: 700;
  color: var(--color-text-primary);
}

.powerSection {
  padding: var(--space-sm);
  background: rgba(0, 0, 0, 0.03);
  border-radius: var(--radius-md);
}

.sectionTitle {
  font-size: var(--font-body-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
}

.powerInfo {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.powerRow {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-body-sm);
  color: var(--color-text-primary);
}

.powerRow.warning {
  color: var(--color-warning);
}

.powerOk,
.powerWarning {
  width: 14px;
  height: 14px;
  margin-left: 4px;
  vertical-align: middle;
}

.powerOk {
  color: var(--color-success);
}

.powerWarning {
  color: var(--color-warning);
}

.powerSuggestion {
  font-size: var(--font-body-xs);
  color: var(--color-text-secondary);
  font-style: italic;
  margin-top: 4px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding-top: var(--space-sm);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.primaryBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-primary-500);
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-inverse);
  font-family: var(--font-body);
  font-size: var(--font-button);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.primaryBtn:hover:not(:disabled) {
  background: var(--color-primary-600);
  transform: translateY(-1px);
}

.primaryBtn:disabled {
  background: var(--color-text-muted);
  cursor: not-allowed;
}

.secondaryBtn,
.tertiaryBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-sm);
  background: transparent;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--font-body-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.secondaryBtn {
  border: 1px solid rgba(0, 0, 0, 0.12);
  color: var(--color-text-primary);
}

.secondaryBtn:hover {
  border-color: var(--color-primary-500);
  color: var(--color-primary-600);
}

.tertiaryBtn {
  border: none;
  color: var(--color-text-secondary);
}

.tertiaryBtn:hover {
  background: rgba(0, 0, 0, 0.03);
  color: var(--color-text-primary);
}

.primaryBtn svg,
.secondaryBtn svg,
.tertiaryBtn svg {
  width: 16px;
  height: 16px;
}

/* Responsive */
@media (max-width: 1023px) {
  .summaryPanel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    z-index: 100;
    max-height: 60vh;
    overflow-y: auto;
    transform: translateY(100%);
    transition: transform var(--transition-base) var(--ease-out);
  }
  
  .summaryPanel.visible {
    transform: translateY(0);
  }
}
```

### 4.5. Build Type Selector

```tsx
interface BuildType {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  recommendedComponents: Partial<Record<ComponentType, string[]>>;
}

interface BuildTypeSelectorProps {
  types: BuildType[];
  selected: string | null;
  onSelect: (typeId: string) => void;
}

export function BuildTypeSelector({
  types,
  selected,
  onSelect,
}: BuildTypeSelectorProps) {
  return (
    <div className={styles.typeSelector} role="radiogroup" aria-label="Тип сборки">
      {types.map((type) => (
        <button
          key={type.id}
          className={`${styles.typeBtn} ${selected === type.id ? styles.active : ''}`}
          onClick={() => onSelect(type.id)}
          role="radio"
          aria-checked={selected === type.id}
          type="button"
        >
          <span className={styles.typeIcon}>{type.icon}</span>
          <span className={styles.typeName}>{type.name}</span>
        </button>
      ))}
    </div>
  );
}
```

```css
.typeSelector {
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-xs);
  background: rgba(0, 0, 0, 0.03);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-md);
  overflow-x: auto;
}

.typeBtn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--font-body-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.typeBtn:hover {
  background: rgba(255, 255, 255, 0.6);
  color: var(--color-text-primary);
}

.typeBtn.active {
  background: var(--color-bg-elevated);
  color: var(--color-primary-600);
  box-shadow: var(--shadow-sm);
}

.typeIcon {
  font-size: 18px;
}

/* Responsive */
@media (max-width: 767px) {
  .typeSelector {
    justify-content: flex-start;
    padding: var(--space-xs);
  }
  
  .typeBtn {
    flex: 1;
    justify-content: center;
    padding: var(--space-xs) var(--space-sm);
  }
  
  .typeName {
    display: none;
  }
  
  @media (min-width: 480px) {
    .typeName {
      display: inline;
    }
  }
}
```

### 4.6. Component Selection Modal

```tsx
interface ComponentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentType: ComponentType;
  title: string;
  components: Component[];
  selectedId?: string;
  compatibilityFilter?: (component: Component) => boolean;
  onSelect: (component: Component) => void;
}

export function ComponentSelectionModal({
  isOpen,
  onClose,
  componentType,
  title,
  components,
  selectedId,
  compatibilityFilter,
  onSelect,
}: ComponentSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name'>('name');

  const filteredComponents = useMemo(() => {
    return components
      .filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.manufacturer?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter(c => compatibilityFilter ? compatibilityFilter(c) : true)
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-asc': return a.price - b.price;
          case 'price-desc': return b.price - a.price;
          default: return a.name.localeCompare(b.name);
        }
      });
  }, [components, searchQuery, sortBy, compatibilityFilter]);

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} size="lg">
      <Modal.Header onClose={onClose}>
        <h2>{title}</h2>
      </Modal.Header>
      
      <Modal.Body>
        {/* Search & Sort */}
        <div className={styles.modalControls}>
          <input
            type="search"
            placeholder="Поиск по названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className={styles.sortSelect}
          >
            <option value="name">По названию</option>
            <option value="price-asc">Сначала дешевле</option>
            <option value="price-desc">Сначала дороже</option>
          </select>
        </div>
        
        {/* Component List */}
        <div className={styles.componentList}>
          {filteredComponents.map((component) => (
            <button
              key={component.id}
              className={`${styles.componentItem} ${selectedId === component.id ? styles.selected : ''}`}
              onClick={() => onSelect(component)}
              type="button"
            >
              <img 
                src={component.image} 
                alt={component.name}
                className={styles.itemImage}
              />
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{component.name}</span>
                <span className={styles.itemSpecs}>
                  {component.specsSummary}
                </span>
              </div>
              <span className={styles.itemPrice}>
                {formatPrice(component.price)}
              </span>
            </button>
          ))}
          
          {filteredComponents.length === 0 && (
            <div className={styles.emptyState}>
              <p>Компоненты не найдены</p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  type="button"
                >
                  Сбросить поиск
                </button>
              )}
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
}
```

```css
.modalControls {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.searchInput {
  flex: 1;
  padding: var(--space-sm);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--font-body-sm);
  transition: border-color var(--transition-fast);
}

.searchInput:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
}

.sortSelect {
  padding: var(--space-sm);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--font-body-sm);
  background: var(--color-bg-surface);
  cursor: pointer;
}

.componentList {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  max-height: 50vh;
  overflow-y: auto;
}

.componentItem {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: var(--color-bg-surface);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.componentItem:hover {
  background: rgba(76, 175, 80, 0.05);
  border-color: rgba(76, 175, 80, 0.2);
}

.componentItem.selected {
  background: rgba(76, 175, 80, 0.08);
  border-color: var(--color-primary-500);
}

.itemImage {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: var(--radius-sm);
  background: var(--color-bg-base);
}

.itemInfo {
  flex: 1;
  min-width: 0;
}

.itemName {
  display: block;
  font-size: var(--font-body-sm);
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.itemSpecs {
  display: block;
  font-size: var(--font-body-xs);
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.itemPrice {
  font-size: var(--font-body-sm);
  font-weight: 600;
  color: var(--color-primary-600);
  white-space: nowrap;
}

.emptyState {
  text-align: center;
  padding: var(--space-xl);
  color: var(--color-text-secondary);
}

.emptyState button {
  margin-top: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  background: var(--color-primary-500);
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-inverse);
  cursor: pointer;
}
```

---

## 5. Анимации и переходы

### 5.1. Предустановленные анимации

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Fade In Up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale In */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Slide In from Left */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Heartbeat (для избранного) */
@keyframes heartBeat {
  0% { transform: scale(1); }
  15% { transform: scale(1.3); }
  30% { transform: scale(1); }
  45% { transform: scale(1.2); }
  60% { transform: scale(1); }
  75% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Shake (для ошибок) */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

/* Spin (для loading) */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Success Pulse (для кнопки добавления) */
@keyframes successPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
```

### 5.2. Утилитарные классы анимаций

```css
/* Animation utilities */
.animate-fadeIn {
  animation: fadeIn var(--transition-base) var(--ease-out);
}

.animate-fadeInUp {
  animation: fadeInUp var(--transition-slow) var(--ease-out);
}

.animate-scaleIn {
  animation: scaleIn var(--transition-base) var(--ease-bounce);
}

.animate-slideInLeft {
  animation: slideInLeft var(--transition-slow) var(--ease-out);
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

/* Staggered animations for lists */
.stagger-animation > * {
  animation: fadeInUp var(--transition-slow) var(--ease-out) both;
}

.stagger-animation > *:nth-child(1) { animation-delay: 0ms; }
.stagger-animation > *:nth-child(2) { animation-delay: 50ms; }
.stagger-animation > *:nth-child(3) { animation-delay: 100ms; }
.stagger-animation > *:nth-child(4) { animation-delay: 150ms; }
.stagger-animation > *:nth-child(5) { animation-delay: 200ms; }
.stagger-animation > *:nth-child(6) { animation-delay: 250ms; }
.stagger-animation > *:nth-child(7) { animation-delay: 300ms; }
.stagger-animation > *:nth-child(8) { animation-delay: 350ms; }
```

### 5.3. Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .animate-fadeIn,
  .animate-fadeInUp,
  .animate-scaleIn,
  .animate-slideInLeft,
  .animate-pulse {
    animation: none;
  }
}
```

---

## 6. Доступность (Accessibility)

### 6.1. Общие требования

| Требование | Реализация |
|------------|------------|
| **Контрастность** | Минимум 4.5:1 для текста, 3:1 для UI элементов |
| **Фокус** | Видимый outline (`2px solid var(--color-primary-500)`) |
| **Touch targets** | Минимум 44×44px для интерактивных элементов |
| **ARIA** | Семантическая разметка с ARIA атрибутами |
| **Клавиатура** | Все действия доступны с клавиатуры |

### 6.2. Skip Links

```tsx
export function SkipLinks() {
  return (
    <div className="skip-links">
      <a href="#main-content" className="skip-link">
        Перейти к основному содержимому
      </a>
      <a href="#filters" className="skip-link">
        Перейти к фильтрам
      </a>
    </div>
  );
}
```

```css
.skip-link {
  position: absolute;
  top: -100%;
  left: 50%;
  transform: translateX(-50%);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-primary-500);
  color: var(--color-text-inverse);
  border-radius: var(--radius-md);
  z-index: 9999;
  transition: top var(--transition-fast);
}

.skip-link:focus {
  top: var(--space-sm);
}
```

### 6.3. Focus Management

```css
/* Focus visible для клавиатурной навигации */
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Убираем outline для mouse-пользователей */
:focus:not(:focus-visible) {
  outline: none;
}

/* Focus trap для модальных окон */
.modal[open] {
  /* JavaScript устанавливает focus на первый интерактивный элемент */
}

/* Focus внутри карточки */
.card:focus-within {
  box-shadow: 0 0 0 2px var(--color-primary-500);
}
```

### 6.4. ARIA Patterns

#### Product Card

```tsx
<article
  aria-label={`Товар: ${product.name}`}
  aria-describedby={`product-${product.id}-desc`}
>
  <img alt={product.mainImage?.alt || product.name} />
  
  <button
    aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
    aria-pressed={isFavorite}
  >
    <svg aria-hidden="true">...</svg>
  </button>
  
  <button
    aria-label="Добавить в корзину"
    aria-busy={isLoading}
    aria-disabled={stock === 0}
  >
    В корзину
  </button>
</article>
```

#### Filter Group

```tsx
<div role="group" aria-labelledby={`filter-${id}-label`}>
  <button
    aria-expanded={isOpen}
    aria-controls={`filter-${id}-content`}
  >
    <span id={`filter-${id}-label`}>{title}</span>
  </button>
  
  <div
    id={`filter-${id}-content`}
    role="listbox"
    aria-multiselectable="true"
  >
    {/* Filter options */}
  </div>
</div>
```

#### Component Slot

```tsx
<div
  role="listitem"
  aria-label={`Слот: ${label}`}
>
  {selectedComponent ? (
    <span aria-label={`Выбран: ${selectedComponent.name}`}>
      {selectedComponent.name}
    </span>
  ) : (
    <span aria-label="Компонент не выбран">
      Выбрать {label}
    </span>
  )}
  
  {compatibilityStatus === 'error' && (
    <span role="alert" aria-live="polite">
      {compatibilityMessage}
    </span>
  )}
</div>
```

### 6.5. Live Regions

```tsx
// Для динамических обновлений
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>

// Для критических ошибок
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

```css
/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## Приложение: Иконки компонентов

### SVG иконки (inline)

```tsx
// Category Icon
<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z"/>
</svg>

// Heart Icon
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
</svg>

// Cart Icon
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <circle cx="9" cy="21" r="1"/>
  <circle cx="20" cy="21" r="1"/>
  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
</svg>

// Check Icon
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <polyline points="20 6 9 17 4 12"/>
</svg>

// Warning Icon
<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
</svg>

// Close Icon
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <line x1="18" y1="6" x2="6" y2="18"/>
  <line x1="6" y1="6" x2="18" y2="18"/>
</svg>
```

---

*Документ создан: Март 2026*  
*Версия: 2.0.0*  
*Проект: GoldPC*