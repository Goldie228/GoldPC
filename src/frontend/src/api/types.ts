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
  manufacturer?: Manufacturer;
  price: number;
  oldPrice?: number;
  stock: number;
  mainImage?: ProductImage;
  rating?: number;
  isActive: boolean;
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
  priceMin?: number;
  priceMax?: number;
  search?: string;
  sortBy?: 'name' | 'price' | 'rating' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  inStock?: boolean;
  isFeatured?: boolean;
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