/**
 * PC Builder Slot Configuration
 * Static labels and descriptions for all component types
 * Extracted from usePCBuilder.ts for better organization
 */

import type { PCComponentType } from './types';

export const PC_BUILDER_SLOTS: { key: PCComponentType; label: string; description: string }[] = [
  { key: 'cpu', label: 'Процессор', description: 'Мозг компьютера. Отвечает за все вычисления. Важные параметры: количество ядер, частота, TDP (тепловыделение).' },
  { key: 'motherboard', label: 'Материнская плата', description: 'Соединяет все компоненты вместе. Определяет сокет процессора, чипсет и доступные слоты расширения.' },
  { key: 'ram', label: 'Оперативная память', description: 'Быстрая память для временных данных. Объём и тайминги (задержки) влияют на отзывчивость системы.' },
  { key: 'storage', label: 'Накопитель', description: 'Хранит операционную систему, программы и файлы. SSD быстрее HDD.' },
  { key: 'psu', label: 'Блок питания', description: 'Поставляет электричество всем компонентам. Мощность (Вт) должна покрывать потребление сборки.' },
  { key: 'case', label: 'Корпус', description: 'Определяет форм-фактор (размер) сборки: ATX, Micro-ATX или Mini-ITX. Влияет на охлаждение и расширяемость.' },
  { key: 'fan', label: 'Вентилятор', description: 'Корпусной вентилятор для охлаждения. Можно установить несколько.' },
  { key: 'cooling', label: 'Охлаждение', description: 'Отводит тепло от процессора. Бывает воздушным или жидкостным.' },
  { key: 'gpu', label: 'Видеокарта', description: 'Отвечает за вывод изображения и 3D-графику. Ключевая для игр и работы с графикой.' },
  { key: 'monitor', label: 'Монитор', description: 'Устройство вывода изображения. Диагональ, разрешение и частота обновления влияют на комфорт.' },
  { key: 'keyboard', label: 'Клавиатура', description: 'Основное устройство ввода. Механические клавиатуры обеспечивают лучшую тактильность.' },
  { key: 'mouse', label: 'Мышь', description: 'Основное устройство навигации. DPI и частота опроса влияют на точность.' },
  { key: 'headphones', label: 'Наушники', description: 'Устройство воспроизведения звука. Качество драйверов и шумоподавление важны.' },
];