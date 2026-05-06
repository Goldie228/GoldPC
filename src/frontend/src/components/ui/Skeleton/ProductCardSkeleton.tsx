import type { ReactElement } from 'react';
import { Skeleton } from './Skeleton';

/**
 * Скелетон карточки товара
 * Имитирует структуру ProductCard для отображения при загрузке
 */
export function ProductCardSkeleton(): ReactElement {
  return (
    <article className="bg-surface-card rounded-xl overflow-hidden" aria-hidden="true">
      {/* Image Container */}
      <div className="aspect-square bg-white">
        <Skeleton 
          width="100%" 
          height="100%" 
          borderRadius="none"
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2">
        {/* Manufacturer */}
        <Skeleton 
          width={80} 
          height={12} 
          className="rounded"
        />

        {/* Product Name */}
        <Skeleton 
          width="90%" 
          height={20} 
          className="rounded"
        />

        {/* Rating */}
        <div className="flex items-center gap-0.5">
          <Skeleton 
            width={60} 
            height={14} 
            borderRadius="sm"
          />
          <Skeleton 
            width={24} 
            height={14} 
            borderRadius="sm"
          />
        </div>

        {/* Stock Status */}
        <Skeleton 
          width={100} 
          height={12} 
          className="rounded"
        />

        {/* Price Row */}
        <div className="flex items-baseline gap-2 mt-2">
          <div className="flex gap-2">
            <Skeleton 
              width={100} 
              height={20} 
              borderRadius="sm"
            />
          </div>
          
          <Skeleton 
            width={100} 
            height={40} 
            borderRadius="sm"
          />
        </div>
      </div>
    </article>
  );
}

export default ProductCardSkeleton;