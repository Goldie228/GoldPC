/**
 * Единый источник маппингов категорий для всего frontend.
 * Все маппинги (slug→название, slug→backend slug, backend slug→slug, название→slug)
 * хранятся здесь. Остальные файлы импортируют из этого модуля.
 */

import type { ProductCategory } from '@/api/types';

// === Русские названия категорий (slug → русское название) ===

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cpu: 'Процессоры',
  gpu: 'Видеокарты',
  motherboard: 'Материнские платы',
  ram: 'Оперативная память',
  storage: 'Накопители',
  psu: 'Блоки питания',
  case: 'Корпуса',
  cooling: 'Охлаждение',
  fan: 'Вентиляторы',
  monitor: 'Мониторы',
  keyboard: 'Клавиатуры',
  mouse: 'Мыши',
  headphones: 'Наушники',
};

// === Обратный маппинг (русское название → slug) ===

export const CATEGORY_NAME_TO_SLUG: Record<string, ProductCategory> = {
  'Процессоры': 'cpu',
  'Видеокарты': 'gpu',
  'Материнские платы': 'motherboard',
  'Оперативная память': 'ram',
  'Накопители': 'storage',
  'Блоки питания': 'psu',
  'Корпуса': 'case',
  'Охлаждение': 'cooling',
  'Вентиляторы': 'fan',
  'Мониторы': 'monitor',
  'Клавиатуры': 'keyboard',
  'Мыши': 'mouse',
  'Наушники': 'headphones',
};

// === Frontend slug → Backend slug (для API-запросов) ===

export const FRONTEND_TO_BACKEND: Record<ProductCategory, string> = {
  cpu: 'processors',
  gpu: 'gpu',
  motherboard: 'motherboards',
  ram: 'ram',
  storage: 'storage',
  psu: 'psu',
  case: 'cases',
  cooling: 'coolers',
  fan: 'fans',
  monitor: 'monitors',
  keyboard: 'keyboards',
  mouse: 'mice',
  headphones: 'headphones',
};

// === Backend slug → Frontend slug (для нормализации ответов API) ===

export const BACKEND_TO_FRONTEND: Record<string, ProductCategory> = {
  processors: 'cpu',
  motherboards: 'motherboard',
  ram: 'ram',
  gpu: 'gpu',
  psu: 'psu',
  storage: 'storage',
  cases: 'case',
  coolers: 'cooling',
  fans: 'fan',
  monitors: 'monitor',
  keyboards: 'keyboard',
  mice: 'mouse',
  headphones: 'headphones',
  periphery: 'keyboard',
};

// === Порядок категорий для UI ===

export const CATEGORY_ORDER: ProductCategory[] = [
  'cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu',
  'case', 'cooling', 'fan', 'monitor', 'keyboard', 'mouse', 'headphones',
];
