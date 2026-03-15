/**
 * Экспорт всех генераторов тестовых данных
 * Используется MSW handlers для создания mock-ответов
 */

// Генераторы продуктов
export {
  generateProduct,
  generateProducts,
  generateProductDetail,
  generateProductDetails,
  generateProductsByCategory,
  generatePagedProducts,
  generateManufacturer,
  generateProductImage,
  generateRating,
  generateCategory,
  generateCategories,
  generateFeaturedProducts,
  generateDiscountedProducts,
} from './products';

// Типы данных продуктов
export type {
  ProductCategory,
  ProductSummary,
  ProductDetail,
  Rating,
  Manufacturer,
  ProductImage,
  ProductSpecifications,
  Category,
  PaginationMeta,
  PagedResult,
} from './products';