/**
 * Экспорт всех хуков для GoldPC
 */

// Cart
export { useCart } from './useCart';

// Products
export { useProducts, productsKeys } from './useProducts';
export type { ProductListResponse, GetProductsParams } from './useProducts';

export { useProduct, productKeys } from './useProduct';
export type { Product } from './useProduct';

// Categories
export { useCategories, categoriesKeys } from './useCategories';
export type { Category } from './useCategories';

// Services
export { useServices, useService, useServiceBySlug, servicesKeys, servicesApi } from './useServices';
export type { ServiceListResponse, GetServicesParams, Service } from './useServices';

// PC Builder
export { usePCBuilder } from './usePCBuilder';
export { PC_BUILDER_SLOTS } from '../features/pc-builder/logic/slotConfig';
export { MAX_RAM_MODULES, MAX_STORAGE_MODULES, MAX_FAN_MODULES } from '../features/pc-builder/logic/constants';
export type {
  PCComponentType,
  ComponentSlotState,
  SelectedComponent,
  PCBuilderSelectedState,
  CompatibilityResult,
  ComponentCompatibility,
  UsePCBuilderReturn,
  SelectComponentOptions,
} from './usePCBuilder';

// Debounce
export { useDebounce } from './useDebounce';

// Modal
export { useModal } from './useModal';
export type { UseModalReturn } from './useModal';
