/**
 * Типы данных для ProductEditor
 */

import type { ProductImage } from '@/api/types';

export interface ProductEditForm {
  name: string;
  /** Slug категории (CatalogService возвращает slug-строку) */
  category: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  description: string;
  isActive: boolean;
  images: ProductImage[];
  /** Характеристики товара — значения могут быть строками, числами или булевыми */
  specifications: Record<string, string | number | boolean>;
  /** Категория была определена автоматически */
  isCategoryAutoDetected?: boolean;
}
