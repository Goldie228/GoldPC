/**
 * ProductCardGrid — сетка карточек товаров для админ-панели
 */

import { Package } from 'lucide-react';
import { ProductCard } from './ProductCard';
import type { Product } from '@/api/types';

interface ProductCardGridProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductCardGrid({ products, onEdit, onDelete }: ProductCardGridProps) {
  if (products.length === 0) {
    return (
      <div className="bg-surface-card rounded-xl p-6">
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mb-4" />
          <p>Товары не найдены</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
