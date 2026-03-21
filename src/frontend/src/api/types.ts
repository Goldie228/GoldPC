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
  | 'monitor'
  | 'peripherals';

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

export interface ProductSummary {
  id: Uuid;
  name: string;
  sku: string;
  category: ProductCategory;
  brand?: string;
  manufacturer?: Manufacturer;
  price: number;
  oldPrice?: number;
  stock: number;
  mainImage?: ProductImage;
  rating?: number;
  isActive: boolean;
  /** Краткое описание для QuickView (первые 300 символов) */
  descriptionShort?: string;
}

export interface Product extends ProductSummary {
  manufacturerId?: Uuid;
  warrantyMonths?: number;
  description?: string;
  specifications?: ProductSpecifications;
  images?: ProductImage[];
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductListResponse extends PagedResponse<ProductSummary> {}

// === Параметры запроса продуктов ===
export interface GetProductsParams {
  page?: number;
  pageSize?: number;
  category?: ProductCategory;
  manufacturerId?: Uuid;
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  search?: string;
  rating?: number;
  sortBy?: 'name' | 'price' | 'rating' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  inStock?: boolean;
  isFeatured?: boolean;
  /** Фильтр по характеристикам (vram, socket, chipset и т.д.) */
  specifications?: Record<string, string | number>;
}

// === Атрибут фильтра по характеристикам ===
export interface FilterAttribute {
  key: string;
  displayName: string;
  filterType: 'select' | 'range';
  sortOrder: number;
  /** Уникальные значения для select-фильтра */
  values?: string[];
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
  lastName: string;
  phone?: string;
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
