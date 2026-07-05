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
  hasNextPage: boolean;
  hasPrevPage: boolean;
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

export type PCComponentType = ProductCategory;

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
  /** Сокет процессора (для проверки совместимости CPU/Motherboard) */
  socket?: string;
  /** Тип оперативной памяти (для проверки совместимости Motherboard/RAM) */
  memoryType?: string;
  /** Форм-фактор оперативной памяти (DIMM/SO-DIMM) */
  memoryFormFactor?: string;
  /** Тепловыделение процессора в ваттах (для проверки совместимости с кулером) */
  tdp?: number;
  /** Мощность блока питания в ваттах (для проверки совместимости PSU/system) */
  wattage?: number;
  images?: ProductImage[];
  /** Краткое имя для водяного знака за изображением */
  shortName?: string;
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
  isCategoryAutoDetected?: boolean;
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

export interface UpdateReviewRequest {
  rating: number;
  title?: string;
  comment?: string;
  pros?: string;
  cons?: string;
}

export type ProductReviewsResponse = PagedResponse<ProductReview>;

export type ProductListResponse = PagedResponse<ProductSummary>;

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
  multiSelect?: boolean;
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
  lastName: string;
  phone: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

/** Запрос на восстановление пароля (forgot-password) */
export interface ForgotPasswordRequest {
  email: string;
}

/** Запрос на сброс пароля (reset-password) */
export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface User {
   id: Uuid;
   email: string;
   firstName: string;
   lastName: string;
    phone?: string;
    avatarUrl?: string;
    birthDate?: string;
   company?: string;
    role: 'Client' | 'Manager' | 'Master' | 'Admin' | 'Accountant' | 'Courier';
    roles?: ('Client' | 'Manager' | 'Master' | 'Admin' | 'Accountant' | 'Courier')[];
   isActive: boolean;
   isEmailVerified: boolean;
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
  | 'laptop-repair'
  | 'upgrade'
  | 'diagnostics'
  | 'assembly'
  | 'data-recovery'
  | 'maintenance'
  | 'other';

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

export type ServiceListResponse = PagedResponse<Service>;

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

    
export interface Order {
   id: string;
   customerName: string;
   customerEmail: string;
   status: string;
   total: number;
   date: string;
   items?: Array<{
     productId: string;
     name: string;
     quantity: number;
     price: number;
   }>;
}

// === Безопасность ===
export interface ChangePasswordRequest {
   currentPassword: string;
   newPassword: string;
}

export interface TwoFactorEnableRequest {
   totpCode: string;
}

export interface TwoFactorVerifyRequest {
   totpCode: string;
}

export interface TwoFactorDisableRequest {
   password: string;
}

export interface TwoFactorStatusResponse {
   isEnabled: boolean;
   recoveryCodes: string[] | null;
   qrCodeUrl: string | null;
}

export interface NotificationPreferenceRequest {
   emailNotifications: boolean;
   smsNotifications: boolean;
   telegramNotifications: boolean;
   orderStatusNotifications: boolean;
   marketingNotifications: boolean;
}

/**
 * Per-user notification type preferences (notification types, not channels).
 * Matches backend UserNotificationPrefs record.
 */
export interface UserNotificationPreferences {
  orderStatusChanged: boolean;
  lowStockAlert: boolean;
  loginNotification: boolean;
  systemAnnouncement: boolean;
  newSupportMessage: boolean;
}

export interface NotificationPreferenceResponse {
   emailNotifications: boolean;
   smsNotifications: boolean;
   telegramNotifications: boolean;
   orderStatusNotifications: boolean;
   marketingNotifications: boolean;
   updatedAt: string;
}

export interface LoginHistoryItem {
   id: string;
   ipAddress: string;
   userAgent: string | null;
   timestamp: string;
   success: boolean;
   failureReason: string | null;
}

// === История цен ===
export interface PriceHistoryDto {
  id: string;
  price: number;
  oldPrice?: number;
  changedAt: string;
  changedBy?: string;
}

// === Генерация названия товара ===
export interface GenerateNameRequest {
  manufacturerName?: string;
  categorySlug?: string;
  specifications?: Record<string, string | number | boolean>;
}

export interface GenerateNameResponse {
  name: string;
}

// === Мета-данные спецификаций для админки ===
export interface SpecificationAttributeDto {
  id: string;
  key: string;
  displayName: string;
  valueType: 'select' | 'range';
  isMultiValue: boolean;
  unit?: string;
  groupName?: string;
  sortOrder: number;
  validationMin?: number;
  validationMax?: number;
  validationStep?: number;
  isRequired: boolean;
  options: string[];
}

export interface CategorySpecificationsDto {
  categoryId: string;
  categoryName: string;
  attributes: SpecificationAttributeDto[];
}

// Assembly types ===

export type AssemblyPartStatus = 'Required' | 'Collected' | 'Installed';
export type AssembledUnitStatus = 'Stored' | 'Delivered';

export interface AssemblyPartDto {
  id: string;
  productId: string;
  productName: string;
  componentType: string;
  quantity: number;
  unitPrice: number;
  partStatus: AssemblyPartStatus;
}

export interface AssembledUnitDto {
  id: string;
  serviceRequestId: string;
  pcConfigurationId: string;
  serialNumber: string;
  status: AssembledUnitStatus;
  assembledAt: string;
  deliveredAt?: string;
}

export interface ServiceRequestWithAssembly {
  id: string;
  requestNumber: string;
  clientId: string;
  masterId?: string;
  serviceTypeId: string;
  serviceTypeName: string;
  status: string;
  description: string;
  deviceModel?: string;
  serialNumber?: string;
  estimatedCost: number;
  actualCost: number;
  masterComment?: string;
  createdAt: string;
  completedAt?: string;
  orderId?: string;
  pcConfigurationId?: string;
  clientPhone?: string;
  courierId?: string;
  assembledSerialNumber?: string;
  serviceParts: ServicePartDto[];
  assemblyParts: AssemblyPartDto[];
  assembledUnit?: AssembledUnitDto;
  workReports: WorkReportDto[];
  clientEmail?: string;
  masterName?: string;
}

export interface WorkReportDto {
  id: string;
  serviceRequestId: string;
  previousStatus: string;
  newStatus: string;
  comment?: string;
  changedBy: string;
  changedAt: string;
}
