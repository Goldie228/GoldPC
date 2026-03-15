# React Best Practices в GoldPC

## 📋 Обзор

Документ содержит правила и рекомендации по разработке React-компонентов и hooks в проекте GoldPC. Все правила основаны на React 18+ и TypeScript.

---

## 🏗️ Структура компонентов

### Организация директорий

```
src/
├── components/           # Переиспользуемые компоненты
│   ├── common/          # Общие UI компоненты (Button, Input, Modal)
│   ├── layout/          # Компоненты макета (Header, Sidebar, Footer)
│   └── features/        # Feature-specific компоненты
├── pages/               # Страницы (routing)
├── hooks/               # Кастомные hooks
├── api/                 # API клиенты и типы
├── utils/               # Утилиты и хелперы
├── types/               # Общие TypeScript типы
└── constants/           # Константы
```

### Структура компонента

```typescript
// ProductCard/index.tsx
export { ProductCard } from './ProductCard';
export type { ProductCardProps } from './types';
```

```typescript
// ProductCard/ProductCard.tsx
import type { FC } from 'react';
import type { ProductCardProps } from './types';
import { useProductCard } from './hooks';
import { ProductImage } from './components/ProductImage';
import { ProductInfo } from './components/ProductInfo';
import './ProductCard.css';

export const ProductCard: FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const { isHovered, handlers, formattedPrice } = useProductCard(product);
  
  return (
    <article
      className="product-card"
      {...handlers}
    >
      <ProductImage src={product.imageUrl} alt={product.name} />
      <ProductInfo product={product} price={formattedPrice} />
      <button onClick={() => onAddToCart(product.id)}>
        Добавить в корзину
      </button>
    </article>
  );
};
```

---

## 🎣 React Hooks

### Правила использования hooks

| Правило | Описание |
|---------|----------|
| ✅ Только на верхнем уровне | Никогда не вызывать hooks внутри условий, циклов или вложенных функций |
| ✅ Только в функциональных компонентах | Или внутри других кастомных hooks |
| ✅ Осмысленные имена | `useProductList`, а не `useData` |
| ✅ Возврат объектов | Для множественных значений возвращать объект, для одного — значение |

### Порядок вызова hooks

```typescript
const ProductList: FC = () => {
  // 1. State hooks
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 2. Context hooks
  const { user } = useAuth();
  const theme = useTheme();
  
  // 3. Ref hooks
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 4. Effect hooks
  useEffect(() => {
    fetchProducts();
  }, []);
  
  // 5. Memoized values
  const filteredProducts = useMemo(() => 
    products.filter(p => p.isActive),
    [products]
  );
  
  // 6. Callbacks
  const handleAddToCart = useCallback((productId: string) => {
    // ...
  }, [user]);
  
  // 7. Custom hooks
  const { totalPages, goToPage } = usePagination(products.length, 10);
  
  return (/* JSX */);
};
```

---

## 🪝 Кастомные Hooks

### Шаблон кастомного hook

```typescript
// hooks/useProductList.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product, ProductFilter } from '@/types';
import { productApi } from '@/api/products';

interface UseProductListOptions {
  initialFilter?: ProductFilter;
  autoFetch?: boolean;
}

interface UseProductListReturn {
  products: Product[];
  loading: boolean;
  error: Error | null;
  filter: ProductFilter;
  setFilter: (filter: Partial<ProductFilter>) => void;
  refetch: () => Promise<void>;
  totalCount: number;
}

export function useProductList(options: UseProductListOptions = {}): UseProductListReturn {
  const { initialFilter = {}, autoFetch = true } = options;
  
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilterState] = useState<ProductFilter>(initialFilter);
  const [totalCount, setTotalCount] = useState(0);
  
  // Callbacks
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await productApi.getProducts(filter);
      setProducts(response.items);
      setTotalCount(response.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [filter]);
  
  const setFilter = useCallback((newFilter: Partial<ProductFilter>) => {
    setFilterState(prev => ({ ...prev, ...newFilter }));
  }, []);
  
  // Effects
  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch, fetchProducts]);
  
  return {
    products,
    loading,
    error,
    filter,
    setFilter,
    refetch: fetchProducts,
    totalCount,
  };
}
```

### Типичные кастомные hooks для GoldPC

```typescript
// hooks/useAuth.ts - Авторизация
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// hooks/useCart.ts - Корзина
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  
  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);
  
  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  }, []);
  
  const total = useMemo(() =>
    items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );
  
  return { items, addItem, removeItem, total };
}

// hooks/useDebounce.ts - Debounce для поиска
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

// hooks/usePagination.ts - Пагинация
export function usePagination(totalItems: number, pageSize: number) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(totalItems / pageSize);
  
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);
  
  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);
  
  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);
  
  return {
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}
```

---

## 📦 Компоненты

### Типы пропсов

```typescript
// types.ts
export interface ProductCardProps {
  /** Товар для отображения */
  product: Product;
  /** Callback при добавлении в корзину */
  onAddToCart?: (productId: string) => void;
  /** Режим отображения */
  variant?: 'compact' | 'full';
  /** Дополнительные CSS классы */
  className?: string;
}

// С использованием children
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}
```

### Типизация компонентов

```typescript
// Простой компонент с пропсами
export const ProductImage: FC<ProductImageProps> = ({ src, alt, size = 'medium' }) => {
  return (
    <img
      src={src}
      alt={alt}
      className={`product-image product-image--${size}`}
    />
  );
};

// Компонент с children
export const Card: FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn('card', className)} {...props}>
      {children}
    </div>
  );
};

// Forward ref компонент
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className={cn('input-wrapper', className)}>
        {label && <label className="input-label">{label}</label>}
        <input ref={ref} className={cn('input', { 'input--error': error })} {...props} />
        {error && <span className="input-error">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

---

## ⚡ Оптимизация производительности

### useMemo и useCallback

```typescript
const ProductList: FC<ProductListProps> = ({ products }) => {
  // ✅ Мемоизация вычислений
  const sortedProducts = useMemo(() => 
    [...products].sort((a, b) => a.price - b.price),
    [products]
  );
  
  // ✅ Мемоизация callbacks
  const handleProductClick = useCallback((productId: string) => {
    console.log('Product clicked:', productId);
  }, []);
  
  return (
    <div>
      {sortedProducts.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onClick={handleProductClick}
        />
      ))}
    </div>
  );
};
```

### React.memo

```typescript
// ProductCard.tsx
export const ProductCard: FC<ProductCardProps> = memo(({ product, onAddToCart }) => {
  return (
    <article className="product-card">
      {/* ... */}
    </article>
  );
});

ProductCard.displayName = 'ProductCard';
```

### Ключи в списках

```typescript
// ❌ НЕПРАВИЛЬНО
{products.map((product, index) => (
  <ProductCard key={index} product={product} />
))}

// ✅ ПРАВИЛЬНО
{products.map(product => (
  <ProductCard key={product.id} product={product} />
))}
```

---

## 🚫 Запрещенные практики

### 1. Мутация state

```typescript
// ❌ НЕПРАВИЛЬНО
const [items, setItems] = useState([]);
const addItem = (item) => {
  items.push(item);
  setItems(items);
};

// ✅ ПРАВИЛЬНО
const [items, setItems] = useState([]);
const addItem = (item) => {
  setItems(prev => [...prev, item]);
};
```

### 2. Hooks в условиях

```typescript
// ❌ НЕПРАВИЛЬНО
const Component = ({ user }) => {
  if (user) {
    const [profile, setProfile] = useState(null); // Ошибка!
  }
};

// ✅ ПРАВИЛЬНО
const Component = ({ user }) => {
  const [profile, setProfile] = useState(null);
  
  useEffect(() => {
    if (user) {
      fetchProfile(user.id).then(setProfile);
    }
  }, [user]);
};
```

### 3. Отсутствие зависимостей в useEffect

```typescript
// ❌ НЕПРАВИЛЬНО
useEffect(() => {
  fetchUser(userId);
}, []); // userId не в зависимостях

// ✅ ПРАВИЛЬНО
useEffect(() => {
  fetchUser(userId);
}, [userId]);
```

### 4. Prop drilling

```typescript
// ❌ НЕПРАВИЛЬНО - прокидывание через все уровни
<App>
  <Layout user={user}>
    <Header user={user}>
      <Navigation user={user}>
        <UserMenu user={user} />
      </Navigation>
    </Header>
  </Layout>
</App>

// ✅ ПРАВИЛЬНО - использование Context
const UserMenu: FC = () => {
  const { user } = useAuth();
  return <menu>{user.name}</menu>;
};
```

### 5. Встроенные функции в render

```typescript
// ❌ НЕПРАВИЛЬНО
<button onClick={() => console.log(item.id)}>Click</button>

// ✅ ПРАВИЛЬНО
const handleClick = useCallback(() => {
  console.log(item.id);
}, [item.id]);

<button onClick={handleClick}>Click</button>
```

---

## 📝 Стилизация компонентов

### CSS модули

```typescript
// ProductCard/ProductCard.tsx
import styles from './ProductCard.module.css';

export const ProductCard: FC<ProductCardProps> = ({ product }) => {
  return (
    <article className={styles.card}>
      <img 
        src={product.imageUrl} 
        alt={product.name}
        className={styles.image}
      />
      <h3 className={styles.title}>{product.name}</h3>
      <span className={styles.price}>{formatPrice(product.price)}</span>
    </article>
  );
};
```

### Условные классы

```typescript
import cn from 'classnames';

export const ProductCard: FC<ProductCardProps> = ({ product, variant = 'default' }) => {
  return (
    <article
      className={cn(styles.card, {
        [styles.cardCompact]: variant === 'compact',
        [styles.cardFeatured]: product.isFeatured,
        [styles.cardOutOfStock]: product.stock === 0,
      })}
    >
      {/* ... */}
    </article>
  );
};
```

---

## 🧪 Тестирование компонентов

### Структура теста

```typescript
// ProductCard/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 1000,
    imageUrl: '/test.jpg',
  };

  it('renders product information', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('1 000 ₽')).toBeInTheDocument();
  });

  it('calls onAddToCart when button clicked', () => {
    const onAddToCart = vi.fn();
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />);
    
    fireEvent.click(screen.getByRole('button', { name: /добавить/i }));
    
    expect(onAddToCart).toHaveBeenCalledWith('1');
  });
});
```

---

## 📚 Чек-лист Code Review

```markdown
## React Code Review Checklist

### Компоненты
- [ ] Используется TypeScript с явными типами пропсов
- [ ] Компонент имеет displayName (если используется memo/forwardRef)
- [ ] Нет Prop Drilling — используется Context где нужно
- [ ] Ключи в списках используют уникальные ID, не индексы

### Hooks
- [ ] Hooks вызваны на верхнем уровне
- [ ] Все зависимости указаны в useEffect/useCallback/useMemo
- [ ] Кастомные hooks начинаются с `use`
- [ ] Возвращается стабильный объект/значение

### Производительность
- [ ] Тяжёлые вычисления обёрнуты в useMemo
- [ ] Callbacks переданные в дочерние компоненты обёрнуты в useCallback
- [ ] Чистые компоненты обёрнуты в React.memo

### Безопасность
- [ ] Нет XSS уязвимостей (не использовать dangerouslySetInnerHTML)
- [ ] Пользовательский ввод валидируется
- [ ] JWT токены хранятся безопасно (httpOnly cookies)

### Код-стайл
- [ ] Именование понятное и консистентное
- [ ] Нет закомментированного кода
- [ ] Нет console.log в production коде
```

---

## 🔗 Связанные документы

- [Repository Pattern](./repository-pattern.md) — паттерн доступа к данным
- [CQRS](./cqrs.md) — разделение операций чтения и записи

---

*Документ базы знаний GoldPC.*