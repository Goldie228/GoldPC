/**
 * Экспорт всех хуков для GoldPC
 */

// Cart
export { useCart } from './useCart';

// Products
export { useProducts, productsKeys } from './useProducts';
export type { ProductListResponse, GetProductsParams } from './useProducts';

export { useProduct, productKeys } from './useProduct';
export type { Product, Uuid } from './useProduct';

// Categories
export { useCategories, categoriesKeys } from './useCategories';
export type { Category } from './useCategories';

// PC Builder
export { usePCBuilder, PC_BUILDER_SLOTS } from './usePCBuilder';
export type {
  PCComponentType,
  ComponentSlotState,
  SelectedComponent,
  CompatibilityResult,
  ComponentCompatibility,
  UsePCBuilderReturn,
} from './usePCBuilder';

// Modal
export { useModal } from './useModal';
export type { UseModalReturn } from './useModal';
