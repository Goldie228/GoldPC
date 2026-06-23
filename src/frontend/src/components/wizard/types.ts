import type { PCComponentType } from '@/features/pc-builder/logic/types';
import type { Product } from '@/api/types';

export type Purpose = 'gaming' | 'office' | 'workstation' | 'streaming' | 'home-theater' | 'server';
export type Budget = 'economy' | 'optimal' | 'gaming' | 'max' | 'custom';
export type CpuPreference = 'amd' | 'intel' | 'any';
export type GpuPreference = 'amd' | 'nvidia' | 'any';
export type FormFactor = 'atx' | 'micro-atx' | 'mini-itx' | 'any';
export type NoiseLevel = 'silent' | 'balanced' | 'performance';
export type RgbPreference = 'none' | 'minimal' | 'full';
export type CoolingPreference = 'air' | 'aio' | 'any';

export interface WizardState {
  purpose: Purpose | null;
  budget: Budget | null;
  customBudget: number;
  cpuPreference: CpuPreference;
  gpuPreference: GpuPreference;
  minRam: number;
  formFactor: FormFactor;
  noiseLevel: NoiseLevel;
  rgbPreference: RgbPreference;
  coolingPreference: CoolingPreference;
  presetId: string | null;
}

export interface BuildTemplate {
  cpu: { minPrice: number; maxPrice: number; brands: string[] };
  gpu: { minPrice: number; maxPrice: number; brands: string[] };
  motherboard: { minPrice: number; maxPrice: number };
  ram: { minPrice: number; maxPrice: number; minCapacity: number };
  storage: { minPrice: number; maxPrice: number };
  psu: { minPrice: number; maxPrice: number };
  case: { minPrice: number; maxPrice: number };
  cooling: { minPrice: number; maxPrice: number };
}

export const PURPOSE_OPTIONS = [
  { id: 'gaming' as Purpose, label: 'Игры', description: 'Максимальная производительность в играх', icon: 'Monitor' },
  { id: 'office' as Purpose, label: 'Офис', description: 'Работа с документами и интернетом', icon: 'Briefcase' },
  { id: 'workstation' as Purpose, label: 'Работа / Студия', description: 'Монтаж видео, 3D-графика, разработка', icon: 'Film' },
  { id: 'streaming' as Purpose, label: 'Стриминг', description: 'Трансляции, запись контента', icon: 'Radio' },
  { id: 'home-theater' as Purpose, label: 'Домашний кинотеатр', description: 'Мультимедиа, 4K видео, Smart TV', icon: 'Tv' },
  { id: 'server' as Purpose, label: 'Сервер / NAS', description: 'Хранилище данных, виртуализация', icon: 'Server' },
];

export const BUDGET_OPTIONS = [
  { id: 'economy' as Budget, label: 'Эконом', range: '~2 000 BYN', description: 'Базовая сборка' },
  { id: 'optimal' as Budget, label: 'Оптимальная', range: '~3 500 BYN', description: 'Лучшее соотношение цена/качество' },
  { id: 'gaming' as Budget, label: 'Игровая', range: '~5 500 BYN', description: 'Высокая производительность' },
  { id: 'max' as Budget, label: 'Максимальная', range: 'Без ограничений', description: 'Топовые компоненты' },
  { id: 'custom' as Budget, label: 'Свой бюджет', range: 'Введите сумму', description: 'Укажите точный бюджет' },
];

export const STEP_LABELS = ['Пресеты', 'Назначение', 'Бюджет', 'Предпочтения'];

export const COMPONENT_LABELS: Record<PCComponentType, string> = {
  cpu: 'Процессор',
  gpu: 'Видеокарта',
  motherboard: 'Материнская плата',
  ram: 'Оперативная память',
  storage: 'Накопитель',
  psu: 'Блок питания',
  case: 'Корпус',
  cooling: 'Система охлаждения',
  fan: 'Вентиляторы',
  monitor: 'Монитор',
  keyboard: 'Клавиатура',
  mouse: 'Мышь',
  headphones: 'Наушники',
};

export const BUDGET_RANGES: Record<Budget, { min: number; max: number }> = {
  economy: { min: 1000, max: 2500 },
  optimal: { min: 2500, max: 4500 },
  gaming: { min: 4500, max: 7000 },
  max: { min: 7000, max: 100000 },
  custom: { min: 1000, max: 100000 },
};

export const PURPOSE_BUDGET_ALLOC: Record<Purpose, Partial<Record<PCComponentType, number>>> = {
  gaming: { gpu: 0.35, cpu: 0.22, motherboard: 0.12, ram: 0.08, storage: 0.06, psu: 0.06, case: 0.06, cooling: 0.05 },
  office: { cpu: 0.25, motherboard: 0.15, ram: 0.12, storage: 0.15, psu: 0.08, case: 0.12, cooling: 0.08, gpu: 0.05 },
  workstation: { cpu: 0.28, gpu: 0.25, ram: 0.15, motherboard: 0.12, storage: 0.08, psu: 0.05, case: 0.04, cooling: 0.03 },
  streaming: { cpu: 0.25, gpu: 0.28, ram: 0.12, motherboard: 0.1, storage: 0.08, psu: 0.07, case: 0.05, cooling: 0.05 },
  'home-theater': { cpu: 0.15, gpu: 0.2, motherboard: 0.15, ram: 0.1, storage: 0.15, psu: 0.08, case: 0.1, cooling: 0.07 },
  server: { cpu: 0.25, motherboard: 0.2, ram: 0.2, storage: 0.15, psu: 0.1, case: 0.05, cooling: 0.05, gpu: 0 },
};

export interface PresetBuild {
  id: string;
  label: string;
  description: string;
  purpose: Purpose;
  budget: Budget;
  icon: string;
  tags: string[];
  cpuPreference: CpuPreference;
  gpuPreference: GpuPreference;
  minRam: number;
  formFactor: FormFactor;
  noiseLevel: NoiseLevel;
  rgbPreference: RgbPreference;
  coolingPreference: CoolingPreference;
}

export const PRESET_BUILDS: PresetBuild[] = [
  {
    id: 'cs2-1080p',
    label: 'CS2 1080p',
    description: 'Играй в CS2 на高 FPS без компромиссов',
    purpose: 'gaming', budget: 'economy', icon: 'Crosshair',
    tags: [' eSports', '1080p', '200+ FPS'],
    cpuPreference: 'any', gpuPreference: 'any', minRam: 16,
    formFactor: 'atx', noiseLevel: 'balanced', rgbPreference: 'minimal', coolingPreference: 'air',
  },
  {
    id: 'triple-a-1440p',
    label: 'AAA 1440p',
    description: 'Топовые AAA-игры в максимальных настройках',
    purpose: 'gaming', budget: 'optimal', icon: 'Gamepad2',
    tags: ['1440p', 'Ultra', 'AAA'],
    cpuPreference: 'any', gpuPreference: 'any', minRam: 32,
    formFactor: 'atx', noiseLevel: 'balanced', rgbPreference: 'minimal', coolingPreference: 'any',
  },
  {
    id: 'workstation-video',
    label: 'Видео монтаж',
    description: 'Быстрая обработка видео в Premiere/DaVinci',
    purpose: 'workstation', budget: 'optimal', icon: 'Film',
    tags: ['4K', 'Рендер', 'NVMe'],
    cpuPreference: 'any', gpuPreference: 'nvidia', minRam: 32,
    formFactor: 'atx', noiseLevel: 'balanced', rgbPreference: 'none', coolingPreference: 'any',
  },
  {
    id: 'office-basic',
    label: 'Офисный ПК',
    description: 'Для документов, почты и браузера',
    purpose: 'office', budget: 'economy', icon: 'Briefcase',
    tags: ['Тихий', 'Бюджетный', 'Надёжный'],
    cpuPreference: 'any', gpuPreference: 'any', minRam: 8,
    formFactor: 'micro-atx', noiseLevel: 'silent', rgbPreference: 'none', coolingPreference: 'air',
  },
  {
    id: 'streaming-setup',
    label: 'Стриминг',
    description: 'Трансляции с высоким качеством',
    purpose: 'streaming', budget: 'gaming', icon: 'Radio',
    tags: ['OBS', 'x264/NVENC', '1080p60'],
    cpuPreference: 'any', gpuPreference: 'nvidia', minRam: 32,
    formFactor: 'atx', noiseLevel: 'balanced', rgbPreference: 'minimal', coolingPreference: 'any',
  },
  {
    id: 'htpc-4k',
    label: 'Домашний ПК',
    description: 'Мультимедиа и 4K контент на TV',
    purpose: 'home-theater', budget: 'economy', icon: 'Tv',
    tags: ['4K', 'HDMI', 'Тихий'],
    cpuPreference: 'any', gpuPreference: 'any', minRam: 16,
    formFactor: 'mini-itx', noiseLevel: 'silent', rgbPreference: 'none', coolingPreference: 'air',
  },
];

export function getPurposeLabel(p: Purpose): string {
  return PURPOSE_OPTIONS.find(o => o.id === p)?.label ?? p;
}

export function getBudgetLabel(b: Budget): string {
  return BUDGET_OPTIONS.find(o => o.id === b)?.label ?? b;
}
