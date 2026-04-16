/**
 * Типы данных для API GoldPC
 * Основано на OpenAPI спецификации
 */

// === Базовые типы ===
export type Uuid = string;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PagedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// === Продукт ===
export type ProductCategory =
  | 'cpu'
  | 'gpu'
  | 'motherboard'
  | 'ram'
  | 'storage'
  | 'psu'
  | 'case'
  | 'cooling'
  | 'fan'
  | 'monitor'
  | 'keyboard'
  | 'mouse'
  | 'headphones';

export interface Manufacturer {
  id: Uuid;
  name: string;
  logo?: string;
  country?: string;
  description?: string;
}

export interface ProductImage {
  id: Uuid;
  url: string;
  alt?: string;
  isMain?: boolean;
  order?: number;
}

export interface ProductSpecifications {
  [key: string]: string | number | boolean | undefined;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export interface ProductSummary {
  id: Uuid;
  name: string;
  sku: string;
  slug?: string;
  category: ProductCategory;
  brand?: string;
  manufacturer?: Manufacturer;
  price: number;
  oldPrice?: number;
  stock: number;
  mainImage?: ProductImage;
  rating?: number | RatingSummary;
  reviewCount?: number;
  isActive: boolean;
  /** Краткое описание для QuickView (первые 300 символов) */
  descriptionShort?: string;
  images?: ProductImage[];
}

export interface Product extends ProductSummary {
  manufacturerId?: Uuid;
  warrantyMonths?: number;
  description?: string;
  manufacturerAddress?: string;
  productionAddress?: string;
  importer?: string;
  serviceSupport?: string;
  specifications?: ProductSpecifications;
  images?: ProductImage[];
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductReview {
  id: Uuid;
  productId: Uuid;
  userId: Uuid;
  userName: string;
  rating: number;
  title?: string;
  comment?: string;
  pros?: string;
  cons?: string;
  isVerified: boolean;
  isApproved?: boolean;
  helpful?: number;
  createdAt: string;
}

export interface CreateReviewRequest {
  rating: number;
  title?: string;
  comment?: string;
  pros?: string;
  cons?: string;
}

export interface ProductReviewsResponse extends PagedResponse<ProductReview> {}

export interface ProductListResponse extends PagedResponse<ProductSummary> {}

// === Параметры запроса продуктов ===
export interface GetProductsParams {
  page?: number;
  pageSize?: number;
  category?: ProductCategory;
  manufacturerId?: Uuid;
  /** Фильтр по нескольким производителям */
  manufacturerIds?: Uuid[];
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  search?: string;
  rating?: number;
  sortBy?: 'name' | 'price' | 'rating' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  inStock?: boolean;
  isFeatured?: boolean;
  /** Фильтр по характеристикам (select). Значение может быть массивом для мультивыбора */
  specifications?: Record<string, string | number | string[]>;
  /** Диапазоны для range-атрибутов: key -> "min,max" */
  specificationRanges?: Record<string, string>;
}

// === Атрибут фильтра по характеристикам ===
export interface FilterAttribute {
  key: string;
  displayName: string;
  filterType: 'select' | 'range';
  sortOrder: number;
  /** Уникальные значения для select-фильтра */
  values?: string[];
  /** Мин. значение для range-фильтра */
  minValue?: number;
  /** Макс. значение для range-фильтра */
  maxValue?: number;
}

export interface FilterFacetOption {
  value: string;
  count: number;
}

export interface FilterFacetAttribute {
  key: string;
  displayName: string;
  filterType: 'select' | 'range';
  sortOrder: number;
  options?: FilterFacetOption[];
  minValue?: number;
  maxValue?: number;
}

// === Категория ===
export interface Category {
  id: Uuid;
  name: string;
  slug: string;
  parentId?: Uuid;
  parent?: Category;
  children?: Category[];
  icon?: string;
  description?: string;
  productCount?: number;
  order?: number;
}

// === Аутентификация ===
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  phone: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface User {
  id: Uuid;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'Client' | 'Manager' | 'Master' | 'Admin' | 'Accountant';
  isActive: boolean;
  createdAt: string;
}

// === Корзина ===
export interface CartItem {
  id: Uuid;
  product: ProductSummary;
  quantity: number;
  price: number;
}

export interface Cart {
  id: Uuid;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  discount?: number;
  promoCode?: string;
}

// === Услуги сервисного центра ===
export type ServiceCategory = 
  | 'repair'
  | 'upgrade'
  | 'diagnostics'
  | 'assembly'
  | 'data-recovery'
  | 'maintenance';

export interface ServicePriceItem {
  id: Uuid;
  name: string;
  description?: string;
  price: number;
  priceMax?: number;
  unit?: string;
}

export interface Service {
  id: Uuid;
  name: string;
  slug: string;
  category: ServiceCategory;
  description: string;
  shortDescription: string;
  icon?: string;
  image?: string;
  basePrice: number;
  priceNote?: string;
  duration: string;
  warrantyMonths: number;
  completedCount?: number;
  isPopular?: boolean;
  isActive: boolean;
  priceList?: ServicePriceItem[];
  features?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceListResponse extends PagedResponse<Service> {}

export interface GetServicesParams {
  page?: number;
  pageSize?: number;
  category?: ServiceCategory;
  search?: string;
  isPopular?: boolean;
}

export interface ServiceRequest {
  serviceId: Uuid;
  customerId?: Uuid;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deviceInfo?: string;
  problemDescription?: string;
  preferredDate?: string;
}
