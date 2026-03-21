/**
 * Конфигурация парсера X-Core.by
 * Маппинг категорий X-Core -> GoldPC slug
 */

const BASE_URL = 'https://x-core.by';
const DELAY_MS = 1200; // Задержка между товарами
const MAX_PRODUCTS_PER_CATEGORY = 5000; // Лимит на категорию (для видеокарт ~500)
const PAGE_LOAD_TIMEOUT_MS = 30000; // Таймаут каталога (30 сек)
const PRODUCT_PAGE_TIMEOUT_MS = 20000; // Таймаут страницы товара (20 сек)
const SHOW_MORE_WAIT_MS = 15000; // Сколько ждать после "Показать еще" до полной догрузки

/** X-Core URL path (без ведущего слэша) -> GoldPC category slug */
export const CATEGORY_MAP = {
  // Комплектующие для компьютеров
  'catalog/komplektuyushchie_dlya_kompyuterov/videokarty': 'gpu',
  'catalog/komplektuyushchie_dlya_kompyuterov/protsessory': 'processors',
  'catalog/komplektuyushchie_dlya_kompyuterov/materinskie_platy': 'motherboards',
  'catalog/komplektuyushchie_dlya_kompyuterov/operativnaya_pamyat': 'ram',
  'catalog/komplektuyushchie_dlya_kompyuterov/nakopiteli_ssd': 'storage',
  'catalog/komplektuyushchie_dlya_kompyuterov/zhestkie_diski_hdd': 'storage',
  'catalog/komplektuyushchie_dlya_kompyuterov/bloki_pitaniya_1_1': 'psu',
  'catalog/komplektuyushchie_dlya_kompyuterov/korpusa': 'cases',
  'catalog/komplektuyushchie_dlya_kompyuterov/sistemy_okhlazhdeniya': 'coolers',
  // Периферия и аксессуары
  'catalog/periferiya_i_aksessuary/monitory': 'monitors',
  'catalog/periferiya_i_aksessuary/myshi': 'periphery',
  'catalog/periferiya_i_aksessuary/klaviatury': 'periphery',
  'catalog/periferiya_i_aksessuary/naushniki_i_garnitury': 'periphery',
};

/** Категории для базового парсинга (видеокарты, процессоры, мат. платы) */
export const INITIAL_CATEGORIES = [
  { path: 'catalog/komplektuyushchie_dlya_kompyuterov/videokarty', slug: 'gpu' },
  { path: 'catalog/komplektuyushchie_dlya_kompyuterov/protsessory', slug: 'processors' },
  { path: 'catalog/komplektuyushchie_dlya_kompyuterov/materinskie_platy', slug: 'motherboards' },
];

/** Все категории для полного парсинга (--all) */
export const FULL_CATEGORIES = [
  { path: 'catalog/komplektuyushchie_dlya_kompyuterov/videokarty', slug: 'gpu' },
  { path: 'catalog/komplektuyushchie_dlya_kompyuterov/protsessory', slug: 'processors' },
  { path: 'catalog/komplektuyushchie_dlya_kompyuterov/materinskie_platy', slug: 'motherboards' },
  { path: 'catalog/komplektuyushchie_dlya_kompyuterov/operativnaya_pamyat', slug: 'ram' },
  { path: 'catalog/komplektuyushchie_dlya_kompyuterov/nakopiteli_ssd', slug: 'storage' },
  { path: 'catalog/komplektuyushchie_dlya_kompyuterov/zhestkie_diski_hdd', slug: 'storage' },
  { path: 'catalog/komplektuyushchie_dlya_kompyuterov/bloki_pitaniya_1_1', slug: 'psu' },
  { path: 'catalog/komplektuyushchie_dlya_kompyuterov/korpusa', slug: 'cases' },
  { path: 'catalog/komplektuyushchie_dlya_kompyuterov/sistemy_okhlazhdeniya', slug: 'coolers' },
  { path: 'catalog/periferiya_i_aksessuary/monitory', slug: 'monitors' },
  { path: 'catalog/periferiya_i_aksessuary/myshi', slug: 'periphery' },
  { path: 'catalog/periferiya_i_aksessuary/klaviatury', slug: 'periphery' },
  { path: 'catalog/periferiya_i_aksessuary/naushniki_i_garnitury', slug: 'periphery' },
];

export { BASE_URL, DELAY_MS, MAX_PRODUCTS_PER_CATEGORY, PAGE_LOAD_TIMEOUT_MS, PRODUCT_PAGE_TIMEOUT_MS, SHOW_MORE_WAIT_MS };
