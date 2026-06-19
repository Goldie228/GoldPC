import type { ProductSummary } from '@/api/types';
import { ProductCard } from '../product-card/ProductCard';
import { EmptyState } from './EmptyState';

interface ProductListProps {
  products: ProductSummary[];
  onAddToCart?: (productId: string) => void;
}

export function ProductList({ products, onAddToCart }: ProductListProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="Товары не найдены"
        description="Попробуйте изменить фильтры или поисковый запрос"
        showResetButton={false}
      />
    );
  }

  return (
    <div className="space-y-4">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          viewMode="list"
        />
      ))}
    </div>
  );
}