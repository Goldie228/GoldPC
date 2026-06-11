import type { ProductSummary } from '@/api/types';
import { ProductCard } from '../product-card/ProductCard';

interface ProductListProps {
  products: ProductSummary[];
  onAddToCart?: (productId: string) => void;
}

export function ProductList({ products, onAddToCart }: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-card flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-text">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-body-text mb-2">Товары не найдены</h3>
        <p className="text-sm text-muted-text max-w-xs">Попробуйте изменить фильтры или поисковый запрос</p>
      </div>
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