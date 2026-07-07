/**
 * ProductCard — карточка товара для админ-панели
 * Отображает изображение, название, цену, индикатор остатка и кнопки действий
 */

import { memo } from 'react';
import { Package, Edit2, ExternalLink, Trash2, ChevronRight } from 'lucide-react';
import { hasValidProductImage, getProductImageUrl } from '@/utils/image';
import type { Product } from '@/api/types';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-BY', {
    style: 'currency',
    currency: 'BYN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const ProductCard = memo(function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  // Определяем URL изображения: mainImage или первое из массива images
  const imageUrl =
    (hasValidProductImage(product.mainImage?.url) && product.mainImage?.url) ||
    (product.images &&
      product.images.length > 0 &&
      hasValidProductImage(product.images[0].url) &&
      product.images[0].url) ||
    null;

  // Прогресс stock: максимум 50 = 100%
  const stockPercent = Math.min((product.stock / 50) * 100, 100);

  const getStockBarColor = () => {
    if (product.stock === 0) return 'bg-hairline-dark';
    if (product.stock <= 4) return 'bg-price-rise';
    if (product.stock <= 19) return 'bg-warning';
    return 'bg-price-drop';
  };

  return (
    <div className="relative bg-surface-card rounded-lg border border-hairline-dark overflow-hidden flex flex-col flex-1">
      {/* Индикатор кликабельности */}
      <div className="absolute top-3 right-3 z-10 text-muted-foreground/50">
        <ChevronRight className="w-4 h-4" />
      </div>

      {/* Изображение */}
      <div className="aspect-[4/3] bg-white relative overflow-hidden">
        {imageUrl ? (
          <img
            src={getProductImageUrl(imageUrl) ?? imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-3"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Название — 2 строки */}
        <h3 className="text-sm font-medium text-body-text line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* Артикул (SKU) */}
        {product.sku && (
          <span className="text-xs text-muted-foreground font-mono">
            Арт: {product.sku}
          </span>
        )}

        {/* Разделитель */}
        <div className="border-t border-hairline-dark" />

        {/* Цена */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-lg font-bold text-gold">
            {formatPrice(product.price)}
          </span>
          {product.oldPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>

        {/* Индикатор наличия */}
        <div className="space-y-1.5">
          <div className="h-1.5 rounded-full bg-hairline-dark w-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getStockBarColor()}`}
              style={{ width: `${stockPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {product.stock === 0 ? 'Нет в наличии' : `${product.stock} шт.`}
          </span>
        </div>

        {/* Кнопки действий */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <button
            onClick={() => onEdit(product)}
            className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-dark rounded-md text-muted-foreground hover:text-body-text hover:bg-surface-elevated transition-colors cursor-pointer"
            title="Редактировать"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <a
            href={`/product/${product.slug ?? product.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-dark rounded-md text-muted-foreground hover:text-body-text hover:bg-surface-elevated transition-colors"
            title="Открыть на сайте"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={() => onDelete(product)}
            className="w-8 h-8 flex items-center justify-center bg-transparent border border-hairline-dark rounded-md text-muted-foreground hover:text-price-rise hover:border-price-rise/30 transition-colors cursor-pointer"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});
